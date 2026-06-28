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
        logger.error(
            "[forgot-password] LOGGING FALLBACK MODE selected. SMTP email will NOT be sent. missing=%s to=%s subject=%s",
            missing,
            to_email,
            subject,
        )
        raise RuntimeError(
            f"Logging fallback mode reached instead of SMTP mode. Missing SMTP settings: {', '.join(missing)}"
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

        smtp_host = str(self.host or "")
        smtp_username = str(self.username or "")
        smtp_password = str(self.password or "")
        smtp_from_email = str(self.from_email or "")

        logger.info(
            "[forgot-password] SMTP configuration detected. host=%s port=%s username=%s tls=%s ssl=%s from_email=%s username_present=%s password_present=%s",
            smtp_host,
            self.port,
            smtp_username,
            self.use_tls,
            self.use_ssl,
            smtp_from_email,
            bool(self.username),
            bool(self.password),
        )

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = f"{self.from_name} <{smtp_from_email}>"
        message["To"] = to_email
        message.set_content(text_body)

        smtp_client = smtplib.SMTP_SSL if self.use_ssl else smtplib.SMTP
        try:
            logger.info(
                "[forgot-password] Connecting to SMTP... host=%s port=%s username=%s tls=%s ssl=%s",
                smtp_host,
                self.port,
                smtp_username,
                self.use_tls,
                self.use_ssl,
            )
            with smtp_client(smtp_host, self.port, timeout=self.timeout) as server:
                if not self.use_ssl and self.use_tls:
                    logger.info("[forgot-password] Starting SMTP TLS handshake")
                    _ = server.starttls()

                logger.info(
                    "[forgot-password] Attempting SMTP authentication. username=%s",
                    smtp_username,
                )
                _ = server.login(smtp_username, smtp_password)
                logger.info("[forgot-password] SMTP authentication successful")

                logger.info(
                    "[forgot-password] Sending email message. to=%s subject=%s",
                    to_email,
                    subject,
                )
                _ = server.send_message(message)
                logger.info("[forgot-password] Email successfully sent")
        except smtplib.SMTPAuthenticationError as exc:
            logger.error(
                "[forgot-password] SMTP authentication failed. host=%s port=%s username=%s tls=%s ssl=%s smtp_code=%s smtp_error=%s exception=%s\n%s",
                self.host,
                self.port,
                self.username,
                self.use_tls,
                self.use_ssl,
                getattr(exc, "smtp_code", None),
                getattr(exc, "smtp_error", b"").decode(errors="ignore")
                if getattr(exc, "smtp_error", None)
                else None,
                str(exc),
                traceback.format_exc(),
            )
            raise
        except smtplib.SMTPResponseException as exc:
            logger.error(
                "[forgot-password] SMTP response error. host=%s port=%s username=%s tls=%s ssl=%s smtp_code=%s smtp_error=%s exception=%s\n%s",
                self.host,
                self.port,
                self.username,
                self.use_tls,
                self.use_ssl,
                getattr(exc, "smtp_code", None),
                getattr(exc, "smtp_error", b"").decode(errors="ignore")
                if getattr(exc, "smtp_error", None)
                else None,
                str(exc),
                traceback.format_exc(),
            )
            raise
        except smtplib.SMTPException as exc:
            logger.error(
                "[forgot-password] General SMTP exception. host=%s port=%s username=%s tls=%s ssl=%s exception=%s\n%s",
                self.host,
                self.port,
                self.username,
                self.use_tls,
                self.use_ssl,
                str(exc),
                traceback.format_exc(),
            )
            raise
        except Exception as exc:
            logger.error(
                "[forgot-password] Non-SMTP email send failure. host=%s port=%s username=%s tls=%s ssl=%s exception=%s\n%s",
                self.host,
                self.port,
                self.username,
                self.use_tls,
                self.use_ssl,
                str(exc),
                traceback.format_exc(),
            )
            raise


def get_email_provider() -> EmailProvider:
    missing = get_missing_smtp_settings()
    logger.info(
        "[forgot-password] Email mode decision. smtp_host=%s smtp_port=%s smtp_username=%s smtp_from_email=%s smtp_use_tls=%s smtp_use_ssl=%s missing=%s",
        settings.smtp_host,
        settings.smtp_port,
        settings.smtp_username,
        settings.smtp_from_email,
        settings.smtp_use_tls,
        settings.smtp_use_ssl,
        missing,
    )
    if missing:
        logger.error(
            "[forgot-password] LOGGING FALLBACK MODE would be used because SMTP config is incomplete. missing=%s",
            missing,
        )
        return LoggingEmailProvider()

    logger.info("[forgot-password] SMTP MODE selected")
    return SmtpEmailProvider()


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
