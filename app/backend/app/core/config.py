import os

from pydantic import BaseModel


class Settings(BaseModel):
    project_name: str = "QaitaJanaru API"
    smtp_host: str | None = os.getenv("SMTP_HOST")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str | None = os.getenv("SMTP_USERNAME")
    smtp_password: str | None = os.getenv("SMTP_PASSWORD")
    smtp_from_email: str | None = os.getenv("SMTP_FROM_EMAIL")
    smtp_from_name: str = os.getenv("SMTP_FROM_NAME", "QaitaJanaru")
    smtp_use_tls: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    smtp_use_ssl: bool = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
    smtp_timeout: int = int(os.getenv("SMTP_TIMEOUT", "20"))


settings = Settings()
