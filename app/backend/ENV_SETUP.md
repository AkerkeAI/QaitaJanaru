# Backend Environment Variables

This document describes the environment variables required to run the Qaita Janaru backend services.

## Required Environment Variables

### GEMINI_API_KEY
- **Description**: API key for Google Gemini Vision API used for waste detection
- **Purpose**: Enables AI-powered waste recognition in the Scan Waste feature
- **How to obtain**: 
  1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Create a new API key
  3. Copy the API key
- **Configuration**: Add to `.env` file in the backend directory:
  ```
  GEMINI_API_KEY=your_gemini_api_key_here
  ```

## Environment File Setup

1. Create a `.env` file in the `backend/` directory
2. Add your GEMINI_API_KEY:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Service Configuration

### AI Waste Detector Service
- **Location**: `backend/app/services/ai_waste_detector.py`
- **Timeout**: 20 seconds (configurable via `AI_TIMEOUT_SECONDS`)
- **Confidence Threshold**: 0.65 (configurable via `CONFIDENCE_THRESHOLD`)
- **Supported Waste Types**:
  - Plastic Bottle
  - Plastic Packaging
  - Glass Bottle
  - Paper
  - Cardboard
  - Metal Can
  - Organic Waste
  - Electronics
  - Battery
  - Mixed Waste
  - Unknown Waste (low confidence)

### Points System
- **Location**: `backend/app/services/reward_service.py`
- **Configurable**: Points per waste type in `WASTE_POINTS` dictionary
- **Default Points**:
  - Plastic Bottle: 5 points
  - Plastic Packaging: 5 points
  - Glass Bottle: 5 points
  - Paper: 3 points
  - Cardboard: 3 points
  - Metal Can: 5 points
  - Organic Waste: 3 points
  - Electronics: 15 points
  - Battery: 20 points
  - Mixed Waste: 2 points
  - Unknown Waste: 1 point

## Database

The backend uses SQLAlchemy for database operations. Ensure your database is configured in `backend/app/db/session.py`.

## API Endpoints

### Scan Waste
- **Endpoint**: `POST /scan/{user_id}`
- **Request**: Multipart form data with `file` field (image)
- **Response**: JSON with waste detection results and points earned

## Error Handling

The backend includes comprehensive error handling for:
- AI timeout (504 Gateway Timeout)
- AI service failure (502 Bad Gateway)
- Invalid image file (400 Bad Request)
- Unsupported file type (400 Bad Request)
- User not found (404 Not Found)

## Security Notes

- Never commit `.env` files to version control
- Rotate API keys regularly
- Use environment-specific API keys for development and production
