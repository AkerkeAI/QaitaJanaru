import { WasteDetectionResult, RecyclingCenter } from "../types/scan";

// Mock waste detection data for AI simulation
export const MOCK_WASTE_TYPES: WasteDetectionResult[] = [
  {
    waste_type: "Plastic Bottle",
    category: "Plastic",
    recycling_category: "Plastic",
    confidence: 0.95,
    eco_tip: "Remove cap before recycling. Rinse thoroughly.",
    recycling_advice: "Take to a plastic collection center.",
    preparation_steps: ["Empty bottle", "Remove liquid", "Compress bottle"],
    recyclable: true,
  },
  {
    waste_type: "Glass Bottle",
    category: "Glass",
    recycling_category: "Glass",
    confidence: 0.95,
    eco_tip: "Remove labels if possible. Separate by color.",
    recycling_advice: "Take to a glass collection point.",
    preparation_steps: [
      "Empty bottle",
      "Rinse lightly",
      "Remove cap if required",
    ],
    recyclable: true,
  },
  {
    waste_type: "Paper",
    category: "Paper",
    recycling_category: "Paper",
    confidence: 0.9,
    eco_tip: "Keep dry and clean. Remove plastic windows.",
    recycling_advice: "Take to a paper recycling facility.",
    preparation_steps: [
      "Keep paper dry",
      "Remove plastic windows",
      "Flatten sheets",
    ],
    recyclable: true,
  },
  {
    waste_type: "Cardboard",
    category: "Cardboard",
    recycling_category: "Cardboard",
    confidence: 0.9,
    eco_tip: "Flatten boxes to save space. Remove tape.",
    recycling_advice: "Take to a paper recycling facility.",
    preparation_steps: ["Flatten boxes", "Remove tape", "Keep dry"],
    recyclable: true,
  },
  {
    waste_type: "Aluminum Can",
    category: "Metal",
    recycling_category: "Metal",
    confidence: 0.95,
    eco_tip: "Rinse thoroughly. Crush to save space.",
    recycling_advice: "Take to a metal recycling center.",
    preparation_steps: ["Empty can", "Rinse lightly", "Crush can"],
    recyclable: true,
  },
  {
    waste_type: "Electronics",
    category: "E-Waste",
    recycling_category: "E-Waste",
    confidence: 0.85,
    eco_tip: "Take to specialized e-waste collection point.",
    recycling_advice: "Take to a hazardous disposal facility.",
    preparation_steps: [
      "Remove batteries if detachable",
      "Keep device intact",
      "Use authorized e-waste point",
    ],
    recyclable: true,
  },
  {
    waste_type: "Organic Waste",
    category: "Organic",
    recycling_category: "Organic",
    confidence: 0.8,
    eco_tip: "Compost if possible. Avoid plastic bags.",
    recycling_advice: "Compost at home or take to organic waste collection.",
    preparation_steps: [
      "Remove packaging",
      "Compost food scraps only",
      "No plastic bags",
    ],
    recyclable: false,
  },
];

// Loading messages for scan workflow
export const LOADING_MESSAGES = [
  "Analyzing waste...",
  "Identifying material...",
  "Checking recycling options...",
  "Processing image...",
];

// Backend API configuration
// For mobile devices on the same LAN, use your computer's local IP address instead of 127.0.0.1
export const SCAN_API_BASE_URL =
  process.env.NEXT_PUBLIC_SCAN_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";
