from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    city: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("PASSWORD_TOO_SHORT")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str
