from pydantic import BaseModel, Field

class TokenResponse(BaseModel):
    message: str = "Login exitoso"