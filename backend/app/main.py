from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.productos.router import router as productos_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router, admin_pedidos_router
from app.modules.usuarios.router import router as usuarios_router

app = FastAPI(
    title="Food Store API",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    create_all_tables()

allowed_origins = list(dict.fromkeys([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    settings.FRONTEND_ORIGIN,
]))

# Configuración de CORS para permitir cookies HttpOnly y credenciales
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión de los routers principales bajo /api/v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(productos_router, prefix="/api/v1")
app.include_router(categorias_router, prefix="/api/v1")
app.include_router(pedidos_router, prefix="/api/v1")
app.include_router(admin_pedidos_router, prefix="/api/v1")
app.include_router(usuarios_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "¡Servidor de Food Store corriendo exitosamente!"}