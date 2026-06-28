# Backend Environment Setup

## Required

Add these variables in Render for the backend service:

- `DATABASE_URL`
- `GEMINI_API_KEY` (if your deployment uses Gemini features)

## Password reset email via SMTP

The password reset flow is already implemented. To send real emails, configure SMTP using environment variables only.

### Required SMTP variables

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`

### Optional SMTP variables

- `SMTP_FROM_NAME` — default: `QaitaJanaru`
- `SMTP_USE_TLS` — default: `true`
- `SMTP_USE_SSL` — default: `false`
- `SMTP_TIMEOUT` — default: `20`

## Recommended Brevo SMTP configuration

For Brevo SMTP, set the following in Render:

- `SMTP_HOST=smtp-relay.brevo.com`
- `SMTP_PORT=587`
- `SMTP_USERNAME=<your-brevo-smtp-login>`
- `SMTP_PASSWORD=<your-brevo-smtp-key>`
- `SMTP_FROM_EMAIL=<verified-sender@your-domain.com>`
- `SMTP_FROM_NAME=QaitaJanaru`
- `SMTP_USE_TLS=true`
- `SMTP_USE_SSL=false`
- `SMTP_TIMEOUT=20`

## Notes

- Do not hardcode credentials in the codebase.
- `SMTP_FROM_EMAIL` must be a sender verified in your SMTP provider.
- If SMTP is not configured, the app falls back to a logging provider for local/dev use.
- After changing environment variables in Render, redeploy the backend service.

## Deployment verification checklist

After redeploying:

1. Open the backend service logs in Render.
2. Confirm the service starts without `ImportError: email-validator is not installed`.
3. Trigger `Forgot Password` from the app.
4. Confirm a verification email arrives in the target inbox.
5. Confirm the code can be used to complete password reset.
