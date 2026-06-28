# Backend Environment Setup

## Required

Add these variables in Render for the backend service:

- `DATABASE_URL`
- `BREVO_API_KEY`
- `GEMINI_API_KEY` (if your deployment uses Gemini features)

## Password reset email via Brevo Transactional Email API

The password reset flow is already implemented. Email delivery now uses the official Brevo Transactional Email REST API over HTTPS.

### Required Brevo variable

- `BREVO_API_KEY`

### Optional Brevo variables

- `BREVO_FROM_EMAIL` — default: `noreply@qaitajanaru.kz`
- `BREVO_FROM_NAME` — default: `QaitaJanaru`
- `BREVO_TIMEOUT` — default: `20`

## Recommended Render configuration

Set the following in Render:

- `BREVO_API_KEY=<your-brevo-api-key>`
- `BREVO_FROM_EMAIL=<verified-sender@your-domain.com>`
- `BREVO_FROM_NAME=QaitaJanaru`
- `BREVO_TIMEOUT=20`

## Notes

- Do not hardcode credentials in the codebase.
- `BREVO_FROM_EMAIL` must be a sender email verified in Brevo.
- After changing environment variables in Render, redeploy the backend service.

## Deployment verification checklist

After redeploying:

1. Open the backend service logs in Render.
2. Confirm the service starts successfully.
3. Trigger `Forgot Password` from the app.
4. Confirm the backend logs show the Brevo API request being sent.
5. Confirm Brevo returns a successful response status.
6. Confirm the verification email arrives in the target inbox.
7. Confirm the code can be used to complete password reset.
