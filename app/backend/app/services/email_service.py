import logging
from typing import Protocol

import requests
from app.core.config import settings

logger = logging.getLogger(__name__)
BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email"


class EmailProvider(Protocol):
    def send_email(self, to_email: str, subject: str, text_body: str) -> None: ...


class BrevoEmailProvider:
    api_key: str
    from_email: str
    from_name: str
    timeout: int

    def __init__(self) -> None:
        if not settings.brevo_api_key:
            raise RuntimeError("BREVO_API_KEY is not configured")

        self.api_key = settings.brevo_api_key
        self.from_email = settings.brevo_from_email
        self.from_name = settings.brevo_from_name
        self.timeout = settings.brevo_timeout

    def send_email(self, to_email: str, subject: str, text_body: str) -> None:
        payload = {
            "sender": {
                "name": self.from_name,
                "email": self.from_email,
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "textContent": text_body,
        }
        headers = {
            "accept": "application/json",
            "api-key": self.api_key,
            "content-type": "application/json",
        }

        logger.info(
            "[forgot-password] Brevo API request sent. url=%s to=%s from_email=%s from_name=%s timeout=%s",
            BREVO_SEND_EMAIL_URL,
            to_email,
            self.from_email,
            self.from_name,
            self.timeout,
        )

        try:
            response = requests.post(
                BREVO_SEND_EMAIL_URL,
                json=payload,
                headers=headers,
                timeout=self.timeout,
            )
        except Exception:
            logger.exception(
                "[forgot-password] Brevo API request failed before response. url=%s to=%s",
                BREVO_SEND_EMAIL_URL,
                to_email,
            )
            raise

        logger.info(
            "[forgot-password] Brevo response status=%s",
            response.status_code,
        )

        if not response.ok:
            logger.error(
                "[forgot-password] Brevo API error response. status=%s body=%s",
                response.status_code,
                response.text,
            )
            response.raise_for_status()

        logger.info("[forgot-password] Email successfully sent via Brevo API")


def get_email_provider() -> EmailProvider:
    logger.info(
        "[forgot-password] Email mode decision. provider=brevo_api brevo_api_key_present=%s from_email=%s from_name=%s timeout=%s",
        bool(settings.brevo_api_key),
        settings.brevo_from_email,
        settings.brevo_from_name,
        settings.brevo_timeout,
    )

    if not settings.brevo_api_key:
        raise RuntimeError("BREVO_API_KEY is not configured")

    logger.info("[forgot-password] BREVO API MODE selected")
    return BrevoEmailProvider()


def send_password_reset_code(to_email: str, code: str) -> None:
    logger.info(
        "[forgot-password] email_service.send_password_reset_code called. to=%s code_length=%s",
        to_email,
        len(code),
    )
    provider = get_email_provider()
    logger.info(
        "[forgot-password] Email provider instantiated. provider=%s",
        provider.__class__.__name__,
    )
    provider.send_email(
        to_email=to_email,
        subject="QaitaJanaru password reset code",
        text_body=(
            "Your QaitaJanaru verification code is: "
            f"{code}\n\n"
            "This code expires in 10 minutes. If you did not request a password reset, "
            "you can ignore this email."
        ),
    )
