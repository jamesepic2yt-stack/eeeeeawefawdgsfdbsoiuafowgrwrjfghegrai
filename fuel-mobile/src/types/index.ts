export interface User {
  id: number;
  email: string;
  name: string;
  target_calories: number;
  target_protein_g: number;
  target_fat_g: number;
  target_carbs_g: number;
  created_at: string;
  updated_at: string;
}

export interface DailyTargets {
  target_calories: number;
  target_protein_g: number;
  target_fat_g: number;
  target_carbs_g: number;
}

export interface FoodLog {
  id: number;
  user_id: number;
  food_name: string;
  brand: string | null;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  serving_size: number | null;
  serving_unit: string | null;
  servings: number;
  barcode: string | null;
  source: 'manual' | 'scan' | 'barcode';
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_at: string;
}

export interface MacroProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface DailySummary {
  date: string;
  calories: MacroProgress;
  protein: MacroProgress;
  fat: MacroProgress;
  carbs: MacroProgress;
  total_logs: number;
  logs: FoodLog[];
}

export interface FoodSearchResult {
  id: number | null;
  name: string;
  brand: string | null;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  serving_size: number | null;
  serving_unit: string | null;
  barcode: string | null;
  source: string;
  external_id: string | null;
  category: string | null;
}

export interface BarcodeResult {
  found: boolean;
  product: FoodSearchResult | null;
  barcode: string;
}

export interface FoodComponent {
  name: string;
  estimated_portion: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  confidence: number;
}

export interface VisionAnalysisResult {
  success: boolean;
  description: string;
  components: FoodComponent[];
  total_calories: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  meal_type_suggestion: string | null;
}

export type QuickLogMode = 'scan' | 'barcode' | 'search';
