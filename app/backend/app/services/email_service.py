import smtplib
from email.message import EmailMessage
from typing import Protocol

from app.core.config import settings


class EmailProvider(Protocol):
    def send_email(self, to_email: str, subject: str, text_body: str) -> None: ...


class LoggingEmailProvider:
    def send_email(self, to_email: str, subject: str, text_body: str) -> None:
        print(
            f"[email] Password reset email not sent because SMTP is not configured. "
            f"to={to_email} subject={subject} body={text_body}"
        )


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
        if (
            not self.host
            or not self.from_email
            or not self.username
            or not self.password
        ):
            raise RuntimeError("SMTP is not fully configured")

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = f"{self.from_name} <{self.from_email}>"
        message["To"] = to_email
        message.set_content(text_body)

        smtp_client = smtplib.SMTP_SSL if self.use_ssl else smtplib.SMTP
        with smtp_client(self.host, self.port, timeout=self.timeout) as server:
            if not self.use_ssl and self.use_tls:
                _ = server.starttls()
            _ = server.login(self.username, self.password)
            _ = server.send_message(message)


def get_email_provider() -> EmailProvider:
    if settings.smtp_host and settings.smtp_from_email:
        return SmtpEmailProvider()
    return LoggingEmailProvider()


def send_password_reset_code(to_email: str, code: str) -> None:
    provider = get_email_provider()
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
