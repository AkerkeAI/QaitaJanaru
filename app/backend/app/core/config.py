import os

from pydantic import BaseModel


class Settings(BaseModel):
    project_name: str = "QaitaJanaru API"
    brevo_api_key: str | None = os.getenv("BREVO_API_KEY")
    brevo_from_email: str = os.getenv("BREVO_FROM_EMAIL", "noreply@qaitajanaru.kz")
    brevo_from_name: str = os.getenv("BREVO_FROM_NAME", "QaitaJanaru")
    brevo_timeout: int = int(os.getenv("BREVO_TIMEOUT", "20"))


settings = Settings()
