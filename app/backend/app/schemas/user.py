from pydantic import BaseModel


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    age: int
    city: str


class UserLogin(BaseModel):
    email: str
    password: str