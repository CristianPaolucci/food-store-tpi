# Food Store — Trabajo Práctico Integrador (Programación IV)

Aplicación web full-stack de e-commerce gastronómico y gestión de pedidos desarrollada para **Programación IV** (**Tecnicatura Universitaria en Programación — UTN**). El proyecto implementa una arquitectura modular por dominios en el backend con **FastAPI** y **SQLModel**, y una interfaz web reactiva en el frontend con **React**, **TypeScript**, **Vite**, **TanStack Query / Table / Form**, **Zustand** y **CSS**.

---

## Enlaces del proyecto

- **Repositorio público en GitHub:** `https://github.com/CristianPaolucci/food-store-tpi`
- **Video de demostración (10–15 minutos):** `[PENDIENTE — PEGAR AQUÍ EL ENLACE PÚBLICO DEL VIDEO]`

---

## Características principales

- **Autenticación y roles:** Registro de clientes, inicio/cierre de sesión y control de acceso basado en roles (`CLIENTE` / `ADMINISTRADOR` o equivalente en el dominio).
- **Catálogo y categorías:** Consulta pública de categorías y productos, filtrado/visualización y gestión administrativa (alta, edición, baja/estado y control de stock).
- **Carrito, checkout y pedidos:** Armado de carrito en el frontend, confirmación de pedido en el backend con validación de disponibilidad y descuento de stock, historial de pedidos del cliente y administración de estados.
- **Cancelación con restitución de stock:** Al cancelar un pedido según las reglas de negocio, el sistema restaura automáticamente las unidades correspondientes al stock de los productos involucrados.
- **Seed inicial de datos:** Script reproducible (`python -m app.db.seed`) que limpia/prepara los datos de prueba de forma segura respecto a claves foráneas y carga el usuario administrador, categorías iniciales y productos.

---

## Estructura del proyecto

```text
TRABAJO INTEGRADOR - PROGRAMACIÓN IV/
├── README.md                          # Documentación principal del TPI (único README considerado)
├── .gitignore                         # Exclusión de entornos, .env, bases locales, cachés y entregables
├── backend/
│   ├── .env.example                   # Plantilla de variables de entorno del backend
│   ├── requirements.txt               # Dependencias Python del backend
│   ├── requests.http                  # Colección de peticiones HTTP de prueba
│   └── app/
│       ├── main.py                    # Punto de entrada de FastAPI, middlewares (CORS, etc.) y routers
│       ├── core/
│       │   ├── config.py              # Configuración cargada desde variables de entorno
│       │   ├── database.py            # Motor y sesión de base de datos (SQLModel / SQLAlchemy)
│       │   ├── security.py            # Hashing de contraseñas, tokens/cookies y seguridad
│       │   ├── deps.py                # Dependencias inyectadas (sesión, usuario actual, permisos)
│       │   ├── base_repository.py     # Repositorio base genérico
│       │   └── unit_of_work.py        # Patrón Unit of Work base
│       ├── db/
│       │   └── seed.py                # Carga inicial de admin, categorías y productos
│       └── modules/
│           ├── auth/                  # Autenticación (router, schemas, service)
│           ├── usuarios/              # Gestión de usuarios (models, repository, router, schemas, service, unit_of_work)
│           ├── categorias/            # Categorías de productos (models, repository, router, schemas, service, unit_of_work)
│           ├── productos/             # Catálogo y stock de productos (models, repository, router, schemas, service, unit_of_work)
│           └── pedidos/               # Carrito/órdenes, items y restitución de stock (models, repository, router, schemas, service, unit_of_work)
└── frontend/
    ├── .env.example                   # Plantilla de variables de entorno del frontend
    ├── package.json                   # Scripts y dependencias del frontend
    ├── pnpm-lock.yaml                 # Lockfile de pnpm
    ├── index.html                     # Documento HTML raíz
    ├── vite.config.ts                 # Configuración de Vite
    ├── tsconfig.json                  # Configuración base de TypeScript
    ├── tsconfig.app.json              # Configuración TS para código de aplicación
    ├── tsconfig.node.json             # Configuración TS para herramientas/build
    ├── eslint.config.js               # Reglas de linting
    ├── public/                        # Recursos estáticos públicos (favicon, iconos)
    └── src/
        ├── main.tsx                   # Montaje de la aplicación React y proveedores globales
        ├── App.tsx                    # Componente raíz de la aplicación
        ├── index.css                  # Estilos globales en CSS
        ├── App.css                    # Estilos complementarios en CSS
        ├── assets/                    # Imágenes y recursos gráficos (hero, etc.)
        ├── routes/
        │   └── AppRoutes.tsx          # Definición de rutas públicas, de cliente y de administración
        ├── store/
        │   ├── authStore.ts           # Estado global de sesión/autenticación (Zustand)
        │   └── cartStore.ts           # Estado global del carrito de compras (Zustand)
        ├── shared/
        │   ├── api/
        │   │   ├── axiosInstance.ts   # Cliente HTTP configurado con baseURL y credenciales/cookies
        │   │   ├── handleApiError.ts  # Normalización y manejo de errores de API
        │   │   └── queryClient.ts     # Configuración de TanStack Query
        │   ├── layout/
        │   │   ├── MainLayout.tsx     # Estructura general de páginas
        │   │   └── Navbar.tsx         # Barra de navegación según estado y rol
        │   └── ui/                    # Componentes reutilizables de interfaz (Button, Card, Input)
        └── features/
            ├── auth/                  # LoginForm, RegisterForm, authService y tipos
            ├── productos/             # CatalogoPage, AdminProductosPage, ProductoCard, hooks, servicios y tipos
            ├── categorias/            # AdminCategoriasPage, categoriasService
            ├── pedidos/               # CarritoPage, CheckoutPage, MisPedidosPage, useCrearPedido, servicios y tipos
            ├── usuarios/              # AdminUsuariosPage, usuariosService
            └── admin/                 # AdminPedidosPage, AdminResumenPage, adminService
```

---

## Requisitos previos

- **Python:** 3.11 o superior (`python3 --version`) con `pip` y soporte para entornos virtuales (`venv`).
- **Node.js:** 20 o superior (`node -v`) y **pnpm** instalado globalmente (`npm install -g pnpm`).
- **Base de datos:** Configurada según `backend/.env.example` (por ejemplo, SQLite o PostgreSQL).

---

## Variables de entorno

Antes de ejecutar la aplicación por primera vez, creá los archivos `.env` a partir de los `.env.example` correspondientes:

### 1. Backend (`backend/.env.example` → `backend/.env`)

```bash
cd backend
cp .env.example .env
```

Revisá y completá los valores indicados en `backend/.env.example` (cadena de conexión a la base de datos, clave secreta/parámetros de autenticación o cookies, y orígenes habilitados para CORS).

### 2. Frontend (`frontend/.env.example` → `frontend/.env`)

```bash
cd frontend
cp .env.example .env
```

Revisá y completá los valores indicados en `frontend/.env.example` (por ejemplo, la URL base del backend en `VITE_API_URL`).

---

## Instalación y ejecución del Backend

Desde la carpeta `backend/`:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Carga de datos iniciales (`seed`)

Con el entorno virtual activo y `backend/.env` configurado:

```bash
python -m app.db.seed
```

Este comando inicializa las tablas si corresponde y carga el **usuario administrador**, las **categorías** y los **productos** iniciales.

### Levantamiento del servidor API

```bash
uvicorn app.main:app --reload
```

- **API:** `http://localhost:8000`
- **Documentación interactiva (Swagger UI):** `http://localhost:8000/docs`

---

## Instalación y ejecución del Frontend

En una nueva terminal, desde la carpeta `frontend/`:

```bash
cd frontend
pnpm install
pnpm build
pnpm dev
```

- `pnpm install` instala las dependencias del proyecto.
- `pnpm build` compila el proyecto TypeScript + Vite sin errores.
- `pnpm dev` inicia el servidor de desarrollo local (habitualmente en `http://localhost:5173`).

---

## Usuario Administrador del Seed

Al ejecutar `python -m app.db.seed`, se crea/asegura el usuario administrador inicial (verificá el correo y la contraseña exactos en `backend/app/db/seed.py`):

- **Rol:** Administrador
- **Email:** *(completar con el email definido en `backend/app/db/seed.py`)*
- **Contraseña:** *(completar con la contraseña definida en `backend/app/db/seed.py`)*

---

## Video de demostración (10 a 15 minutos)

El enlace público al video quedará consignado en la sección **Enlaces del proyecto** de este `README.md` y cubrirá:

1. **Presentación inicial:** cámara encendida al inicio, presentación personal y recorrido general del proyecto.
2. **Registro e inicio de sesión:** creación de cuenta de cliente y autenticación.
3. **Compra como cliente:** exploración del catálogo, agregado al carrito, checkout y generación de pedido con descuento de stock.
4. **Gestión como administrador:** acceso con cuenta administradora y administración de entidades/pedidos.
5. **Cancelación con restitución de stock:** cancelación de un pedido y comprobación de que el stock vuelve a su estado correspondiente.

---

## Checklist de empaquetado para entrega (hasta el 24/11/2026 — 23:59)

- Archivo `.zip` único en la raíz con `backend/`, `frontend/` y `README.md`, **sin** `node_modules/`, `venv/`, `.env`, `__pycache__/` ni archivos de base de datos locales.
- Repositorio público en GitHub sincronizado y con su URL incluida en este `README.md`.
- Link público del video de 10–15 minutos incluido en este `README.md`.