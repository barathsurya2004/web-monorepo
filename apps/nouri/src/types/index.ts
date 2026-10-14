export interface User {
  uuid: string;
  name: string;
  email: string;
  calorie_goal?: number;
  avatar_url?: string;
  token?: string;
  created_at?: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface NutritionGoals {
  user_uuid?: string;
  calories_target: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  fiber_grams: number;
  sodium_mg: number;
}

export interface MealItem {
  id: string;
  meal_log_id?: string;
  name: string;
  estimated_weight_grams: number;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  fiber_grams: number;
  sodium_mg?: number;
  confidence_score?: number;
  ingredients?: string[];
}

export interface MealLog {
  id: string;
  user_uuid?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | string;
  logged_at: string;
  notes?: string;
  items: MealItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

export interface DailyNutritionSummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sodium: number;
  goals: NutritionGoals;
  meals: MealLog[];
}

export interface JobStatus {
  job_id: string;
  user_uuid?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_message?: string;
  meal_log_id?: string;
  created_at?: string;
  updated_at?: string;
  detected_items?: MealItem[];
}

export interface PendingMealJob {
  job_id: string;
  meal_type: string;
  notes?: string;
  preview_url?: string;
  created_at: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stage?: string;
  error_message?: string;
}

