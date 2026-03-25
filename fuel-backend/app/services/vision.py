"""AI Vision service for food image analysis.

Uses OpenAI's GPT-4 Vision API to analyze food images and estimate
macronutrient content through visual density analysis.
"""

import os
import base64
import json
import httpx
from app.schemas.food import VisionAnalysisResult, FoodComponent

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

VISION_SYSTEM_PROMPT = """You are a professional nutritionist and food analyst AI. 
Analyze the food image and identify each distinct food component visible.

For each component, estimate:
1. The food item name (be specific, e.g., "grilled chicken breast" not just "chicken")
2. The estimated portion size (e.g., "6 oz", "1 cup", "2 slices")
3. Calories, protein (g), fat (g), and carbohydrates (g) based on the estimated portion
4. Your confidence level (0.0 to 1.0)

Consider visual density, plate size for scale, and typical serving proportions.
Be specific about meal context (e.g., "Chipotle burrito bowl" vs "homemade rice bowl").

Respond ONLY with valid JSON in this exact format:
{
    "description": "Brief description of the full meal",
    "components": [
        {
            "name": "food item name",
            "estimated_portion": "portion description",
            "calories": 250,
            "protein_g": 30,
            "fat_g": 8,
            "carbs_g": 12,
            "confidence": 0.85
        }
    ],
    "meal_type_suggestion": "lunch"
}"""


async def analyze_food_image(image_data: bytes, mime_type: str = "image/jpeg") -> VisionAnalysisResult:
    """Analyze a food image using GPT-4 Vision and return macro estimates.

    Args:
        image_data: Raw image bytes
        mime_type: Image MIME type (image/jpeg, image/png, etc.)

    Returns:
        VisionAnalysisResult with identified components and totals
    """
    if not OPENAI_API_KEY:
        return VisionAnalysisResult(
            success=False,
            description="OpenAI API key not configured. Set OPENAI_API_KEY environment variable.",
            components=[],
            total_calories=0,
            total_protein_g=0,
            total_fat_g=0,
            total_carbs_g=0,
        )

    base64_image = base64.b64encode(image_data).decode("utf-8")

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                OPENAI_API_URL,
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": VISION_SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Analyze this food image and estimate the macronutrient content of each component."},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{mime_type};base64,{base64_image}",
                                        "detail": "high",
                                    },
                                },
                            ],
                        },
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.3,
                },
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]

            # Parse JSON from the response (handle markdown code blocks)
            content = content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[1]
                content = content.rsplit("```", 1)[0]

            parsed = json.loads(content)

            components = [
                FoodComponent(
                    name=c["name"],
                    estimated_portion=c["estimated_portion"],
                    calories=float(c["calories"]),
                    protein_g=float(c["protein_g"]),
                    fat_g=float(c["fat_g"]),
                    carbs_g=float(c["carbs_g"]),
                    confidence=float(c.get("confidence", 0.7)),
                )
                for c in parsed.get("components", [])
            ]

            total_cal = sum(c.calories for c in components)
            total_pro = sum(c.protein_g for c in components)
            total_fat = sum(c.fat_g for c in components)
            total_carb = sum(c.carbs_g for c in components)

            return VisionAnalysisResult(
                success=True,
                description=parsed.get("description", "Food analysis complete"),
                components=components,
                total_calories=total_cal,
                total_protein_g=total_pro,
                total_fat_g=total_fat,
                total_carbs_g=total_carb,
                meal_type_suggestion=parsed.get("meal_type_suggestion"),
            )

        except json.JSONDecodeError:
            return VisionAnalysisResult(
                success=False,
                description="Failed to parse AI response",
                components=[],
                total_calories=0,
                total_protein_g=0,
                total_fat_g=0,
                total_carbs_g=0,
            )
        except httpx.HTTPError as e:
            return VisionAnalysisResult(
                success=False,
                description=f"Vision API error: {str(e)}",
                components=[],
                total_calories=0,
                total_protein_g=0,
                total_fat_g=0,
                total_carbs_g=0,
            )
