from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str | None = Field(default=None, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserPublic(BaseModel):
    id: int
    username: str
    full_name: str | None = None
    email: str
    role: str
    disabled: bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True