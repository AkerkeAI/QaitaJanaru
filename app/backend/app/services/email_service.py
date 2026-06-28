import logging
import smtplib
import traceback
from email.message import EmailMessage
from typing import Protocol

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailProvider(Protocol):
    def send_email(self, to_email: str, subject: str, text_body: str) -> None: ...


class LoggingEmailProvider:
    def send_email(self, to_email: str, subject: str, text_body: str) -> None:
        missing = get_missing_smtp_settings()
        logger.warning(
            "[forgot-password] SMTP not configured; using logging provider. "
            "missing=%s to=%s subject=%s body=%s",
            missing,
            to_email,
            subject,
            text_body,
        )


def get_missing_smtp_settings() -> list[str]:
    missing: list[str] = []
    if not settings.smtp_host:
        missing.append("SMTP_HOST")
    if not settings.smtp_username:
        missing.append("SMTP_USERNAME")
    if not settings.smtp_password:
        missing.append("SMTP_PASSWORD")
    if not settings.smtp_from_email:
        missing.append("SMTP_FROM_EMAIL")
    return missing


class SmtpEmailProvider:
    host: str | None
    port: int
    username: str | None
    password: str | None
    from_email: str | None
    from_name: str
    use_tls: bool
    use_ssl: bool
    timeout: int

    def __init__(self) -> None:
        self.host = settings.smtp_host
        self.port = settings.smtp_port
        self.username = settings.smtp_username
        self.password = settings.smtp_password
        self.from_email = settings.smtp_from_email
        self.from_name = settings.smtp_from_name
        self.use_tls = settings.smtp_use_tls
        self.use_ssl = settings.smtp_use_ssl
        self.timeout = settings.smtp_timeout

    def send_email(self, to_email: str, subject: str, text_body: str) -> None:
        missing = get_missing_smtp_settings()
        if missing:
            logger.error(
                "[forgot-password] SMTP considered not configured. missing=%s",
                missing,
            )
            raise RuntimeError(
                f"SMTP is not fully configured. Missing: {', '.join(missing)}"
            )

        logger.info(
            "[forgot-password] SMTP configuration detected. host=%s port=%s tls=%s ssl=%s from_email=%s username_present=%s password_present=%s",
            self.host,
            self.port,
            self.use_tls,
            self.use_ssl,
            self.from_email,
            bool(self.username),
            bool(self.password),
        )

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = f"{self.from_name} <{self.from_email}>"
        message["To"] = to_email
        message.set_content(text_body)

        smtp_client = smtplib.SMTP_SSL if self.use_ssl else smtplib.SMTP
        try:
            logger.info(
                "[forgot-password] SMTP connection started. host=%s port=%s",
                self.host,
                self.port,
            )
            with smtp_client(self.host, self.port, timeout=self.timeout) as server:
                if not self.use_ssl and self.use_tls:
                    logger.info("[forgot-password] Starting SMTP TLS handshake")
                    _ = server.starttls()
                logger.info(
                    "[forgot-password] Attempting SMTP authentication. username=%s",
                    self.username,
                )
                _ = server.login(self.username, self.password)
                logger.info("[forgot-password] SMTP authentication succeeded")
                _ = server.send_message(message)
                logger.info(
                    "[forgot-password] Email successfully sent. to=%s subject=%s",
                    to_email,
                    subject,
                )
        except Exception as exc:
            logger.exception(
                "[forgot-password] SMTP send failed. to=%s subject=%s error=%s\n%s",
                to_email,
                subject,
                str(exc),
                traceback.format_exc(),
            )
            raise


def get_email_provider() -> EmailProvider:
    missing = get_missing_smtp_settings()
    if missing:
        logger.warning(
            "[forgot-password] Email provider fallback selected because SMTP config is incomplete. missing=%s",
            missing,
        )
        return LoggingEmailProvider()

    logger.info("[forgot-password] SMTP email provider selected")
    return SmtpEmailProvider()


def send_password_reset_code(to_email: str, code: str) -> None:
    logger.info(
        "[forgot-password] email_service.send_password_reset_code called. to=%s",
        to_email,
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
