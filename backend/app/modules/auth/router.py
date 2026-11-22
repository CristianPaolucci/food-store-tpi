from fastapi import APIRouter, Depends, Response, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from sqlalchemy import text
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.core.database import session_factory
from app.core.security import create_access_token, decode_access_token, get_password_hash
from app.modules.usuarios.models import Usuario
from app.modules.auth.service import AuthService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["Autenticación"])

def get_auth_service():
    return AuthService(UsuarioUnitOfWork())

# Schema para el registro desde el frontend
class UsuarioRegister(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_in: UsuarioRegister):
    with session_factory() as db:
        # Validar si el usuario o email ya existen
        existing_user = db.exec(select(Usuario).where((Usuario.username == user_in.username) | (Usuario.email == user_in.email))).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario o correo electrónico ya se encuentran registrados."
            )
        
        hashed_pwd = get_password_hash(user_in.password)
        now_str = datetime.utcnow().isoformat()
        
        # Inserción directa incluyendo created_at para satisfacer la restricción NOT NULL
        stmt = text("""
            INSERT INTO usuarios (username, full_name, email, hashed_password, role, disabled, created_at)
            VALUES (:username, :full_name, :email, :hashed_password, :role, :disabled, :created_at)
        """)
        db.execute(stmt, {
            "username": user_in.username,
            "full_name": user_in.full_name,
            "email": user_in.email,
            "hashed_password": hashed_pwd,
            "role": "user",
            "disabled": 0,
            "created_at": now_str
        })
        db.commit()
        
        return {
            "message": "Usuario registrado exitosamente",
            "usuario": {
                "username": user_in.username,
                "email": user_in.email,
                "role": "user"
            }
        }

@router.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), auth_service: AuthService = Depends(get_auth_service)):
    user = auth_service.autenticar_usuario(form_data.username, form_data.password)

    access_token = create_access_token(subject=user.username)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=1800
    )

    return {
        "message": "Inicio de sesión exitoso",
        "usuario": {
            "id": user.id,
            "username": user.username,
            "full_name": getattr(user, "full_name", getattr(user, "nombre_completo", "")),
            "email": user.email,
            "role": user.role,
            "disabled": user.disabled,
            "created_at": getattr(user, "created_at", "")
        }
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Sesión cerrada exitosamente"}

@router.get("/me")
def get_current_user_me(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    
    payload = decode_access_token(token)
    if not payload or not isinstance(payload, dict) or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    username = payload["sub"]
    with session_factory() as db:
        stmt = select(Usuario).where(Usuario.username == username)
        user = db.exec(stmt).first()
        if not user or user.disabled:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado o deshabilitado"
            )
        return {
            "id": user.id,
            "username": user.username,
            "full_name": getattr(user, "full_name", getattr(user, "nombre_completo", "")),
            "email": user.email,
            "role": user.role,
            "disabled": user.disabled,
            "created_at": getattr(user, "created_at", "")
        }