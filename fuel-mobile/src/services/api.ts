/**
 * Fuel API Client
 *
 * Thin wrapper around fetch for communicating with the FastAPI backend.
 * All methods return typed responses matching the backend schemas.
 */

import type {
  User,
  DailyTargets,
  FoodLog,
  DailySummary,
  FoodSearchResult,
  BarcodeResult,
  VisionAnalysisResult,
} from '../types';

// In development, point to local backend. In production, this
// should be overridden to the deployed backend URL.
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Users ──────────────────────────────────────────────────

export async function createUser(data: {
  email: string;
  name: string;
  targets?: DailyTargets;
}): Promise<User> {
  return request<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getUser(userId: number): Promise<User> {
  return request<User>(`/api/users/${userId}`);
}

export async function updateTargets(
  userId: number,
  targets: DailyTargets,
): Promise<User> {
  return request<User>(`/api/users/${userId}/targets`, {
    method: 'PUT',
    body: JSON.stringify(targets),
  });
}

export async function updateUser(
  userId: number,
  data: { name: string },
): Promise<User> {
  return request<User>(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── Food Logs ──────────────────────────────────────────────

export async function createLog(data: {
  user_id: number;
  food_name: string;
  brand?: string | null;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  serving_size?: number | null;
  serving_unit?: string | null;
  servings?: number;
  barcode?: string | null;
  source?: string;
  meal_type?: string;
}): Promise<FoodLog> {
  return request<FoodLog>('/api/logs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getLogs(
  userId: number,
  date?: string,
): Promise<FoodLog[]> {
  const params = new URLSearchParams({ user_id: String(userId) });
  if (date) params.append('date', date);
  return request<FoodLog[]>(`/api/logs?${params}`);
}

export async function deleteLog(logId: number): Promise<void> {
  return request<void>(`/api/logs/${logId}`, { method: 'DELETE' });
}

export async function getDailySummary(
  userId: number,
  date?: string,
): Promise<DailySummary> {
  const params = new URLSearchParams({ user_id: String(userId) });
  if (date) params.append('date', date);
  return request<DailySummary>(`/api/logs/summary?${params}`);
}

// ── Food Search ────────────────────────────────────────────

export async function searchFood(
  query: string,
  limit = 50,
): Promise<FoodSearchResult[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return request<FoodSearchResult[]>(`/api/search?${params}`);
}

// ── Barcode ────────────────────────────────────────────────

export async function lookupBarcode(
  upc: string,
): Promise<BarcodeResult> {
  return request<BarcodeResult>(`/api/barcode/${upc}`);
}

// ── Vision ─────────────────────────────────────────────────

export async function analyzeImage(
  imageUri: string,
): Promise<VisionAnalysisResult> {
  const formData = new FormData();

  // React Native image URI → multipart form
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob);

  const url = `${API_BASE}/api/vision/analyze`;
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type — fetch sets the multipart boundary automatically
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || 'Vision analysis failed');
  }

  return res.json();
}
