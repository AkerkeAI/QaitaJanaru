# Environment Variables for Deployment

This document lists all environment variables required for production deployment.

## Frontend (Vercel)

### Required for Google Authentication
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth Client ID (obtained from Google Cloud Console)

### Required for API Communication
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `https://your-backend.onrender.com`)

## Backend (Render)

### Required for Google Authentication
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID (same as frontend)
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret (obtained from Google Cloud Console)

### Required for Email Services
- `BREVO_API_KEY` - Brevo (formerly Sendinblue) API key for password reset emails
- `BREVO_FROM_EMAIL` - Sender email for password reset emails (default: `noreply@qaitajanaru.kz`)
- `BREVO_FROM_NAME` - Sender name for password reset emails (default: `QaitaJanaru`)
- `BREVO_TIMEOUT` - Email service timeout in seconds (default: `20`)

## Google Cloud Console Configuration

### OAuth 2.0 Client ID Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to: APIs & Services > Credentials
4. Create credentials > OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized JavaScript origins (add all):
   - `http://localhost:3000` (local development)
   - `https://your-frontend-domain.vercel.app` (production frontend)
   - Any staging domains

7. Authorized redirect URIs (add all):
   - `http://localhost:3000` (local development)
   - `https://your-frontend-domain.vercel.app` (production frontend)
   - Any staging domains

8. Copy the Client ID and Client Secret

### Important Notes

- The same `GOOGLE_CLIENT_ID` is used on both frontend and backend
- `GOOGLE_CLIENT_SECRET` is only needed on the backend (never expose to frontend)
- Frontend uses `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Next.js convention for client-side access)
- Backend uses `GOOGLE_CLIENT_ID` (server-side environment variable)
