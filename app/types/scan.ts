// Types for Scan Waste functionality

export interface RecyclingCenter {
  name: string;
  address: string;
  acceptedWasteTypes: string[];
  latitude: number;
  longitude: number;
}

export interface WasteDetectionResult {
  waste_type: string;
  category: string;
  recycling_category: string;
  confidence: number;
  eco_tip: string;
  recycling_advice: string;
  preparation_steps: string[];
  recyclable: boolean;
}

export interface ScanResponse {
  waste_type: string;
  category: string;
  recycling_category: string;
  confidence: number;
  eco_tip: string;
  recycling_advice: string;
  preparation_steps: string[];
  recyclable: boolean;
  earned_points: number;
  scan_reward: number;
  task_rewards: number;
  daily_task_rewards: number;
  weekly_task_rewards: number;
  auto_claimed_task_ids: string[];
  total_reward: number;
  new_total_points: number;
}

export interface ScanState {
  selectedImage: string | null;
  isScanning: boolean;
  scanResult: WasteDetectionResult | null;
  scanResponse: ScanResponse | null;
  loadingMessage: string;
  error: string | null;
  recyclingCenter: RecyclingCenter | null;
}

export type LoadingState =
  "idle" | "uploading" | "analyzing" | "generating" | "complete" | "error";
