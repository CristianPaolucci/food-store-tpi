from sqlmodel import Session, select, delete
from app.core.database import engine, create_all_tables
from app.core.security import get_password_hash

# Importar TODOS los modelos para que SQLAlchemy registre las relaciones correctamente
from app.modules.usuarios.models import Usuario
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.pedidos.models import Pedido, DetallePedido

def seed_database():
    print("Creando tablas si no existen...")
    create_all_tables()

    with Session(engine) as session:
        # 1. Crear Usuario Admin por defecto si no existe
        admin_user = session.exec(select(Usuario).where(Usuario.username == "admin")).first()
        if not admin_user:
            admin_user = Usuario(
                username="admin",
                full_name="Administrador",
                email="admin@foodstore.com",
                hashed_password=get_password_hash("Admin1234!"),
                role="admin",
                disabled=False
            )
            session.add(admin_user)
            session.commit()
            print("-> Usuario admin creado con éxito.")
        else:
            print("-> El usuario admin ya existe.")

        # 2. Limpiar datos anteriores respetando claves foráneas
        print("Limpiando datos anteriores de pedidos, productos y categorías...")
        session.exec(delete(DetallePedido))
        session.exec(delete(Pedido))
        session.exec(delete(Producto))
        session.exec(delete(Categoria))
        session.commit()

        # 3. Crear Categorías
        categorias_data = [
            {"nombre": "Burguers", "descripcion": "Hamburguesas artesanales completas"},
            {"nombre": "Pizzas", "descripcion": "Pizzas a la piedra con muzarella"},
            {"nombre": "Bebidas", "descripcion": "Bebidas frías, gaseosas y cervezas"},
            {"nombre": "Postres", "descripcion": "Deliciosos postres artesanales para terminar"}
        ]
        
        cats = {}
        for cat_info in categorias_data:
            cat = Categoria(nombre=cat_info["nombre"], descripcion=cat_info["descripcion"], activo=True)
            session.add(cat)
            session.commit()
            session.refresh(cat)
            print(f"-> Categoría creada: {cat.nombre}")
            cats[cat_info["nombre"]] = cat

        # 4. Crear Productos equilibrados (Comidas, Bebidas y Postres ampliados)
        productos_data = [
            # Comidas (Burguers y Pizzas)
            {"nombre": "Cheeseburger Classic", "descripcion": "Medallón de carne, cheddar y aderezo", "precio_base": 6500.0, "stock": 20, "categoria": "Burguers", "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"},
            {"nombre": "Bacon Double Burguer", "descripcion": "Doble carne, mucho bacon y cheddar", "precio_base": 8200.0, "stock": 15, "categoria": "Burguers", "imagen_url": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80"},
            {"nombre": "Burguer Veggie", "descripcion": "Medallón de lentejas y vegetales", "precio_base": 6000.0, "stock": 10, "categoria": "Burguers", "imagen_url": "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=600&q=80"},
            {"nombre": "Pizza Muzzarella", "descripcion": "Salsa de tomate, muzzarella y aceitunas", "precio_base": 9000.0, "stock": 12, "categoria": "Pizzas", "imagen_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"},
            {"nombre": "Pizza Especial", "descripcion": "Muzzarella, jamón, morrones y aceitunas", "precio_base": 11000.0, "stock": 8, "categoria": "Pizzas", "imagen_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80"},
            {"nombre": "Pizza Napolitana", "descripcion": "Muzzarella, rodajas de tomate y ajo", "precio_base": 10500.0, "stock": 10, "categoria": "Pizzas", "imagen_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80"},
            
            # Bebidas
            {"nombre": "Lata de Coca Cola 354ml", "descripcion": "Bebida sabor cola en lata bien fría", "precio_base": 2000.0, "stock": 30, "categoria": "Bebidas", "imagen_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80"},
            {"nombre": "Cerveza Artesanal 500ml", "descripcion": "Rubia tirada en botella", "precio_base": 3000.0, "stock": 25, "categoria": "Bebidas", "imagen_url": "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80"},
            {"nombre": "Limonada con Menta y Jengibre", "descripcion": "Refrescante limonada natural casera 500ml", "precio_base": 2400.0, "stock": 20, "categoria": "Bebidas", "imagen_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"},
            {"nombre": "Agua Mineral sin Gas 500ml", "descripcion": "Agua mineral fresca en botella", "precio_base": 1500.0, "stock": 40, "categoria": "Bebidas", "imagen_url": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=80"},

            # Postres
            {"nombre": "Cheesecake de Frutos Rojos", "descripcion": "Clásico pastel de queso con coulis de frutos rojos", "precio_base": 3800.0, "stock": 15, "categoria": "Postres", "imagen_url": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80"},
            {"nombre": "Volcán de Chocolate", "descripcion": "Bizcochuelo caliente de chocolate con centro líquido", "precio_base": 4800.0, "stock": 10, "categoria": "Postres", "imagen_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80"},
            {"nombre": "Tiramisú Tradicional", "descripcion": "Postre italiano con capas de bizcocho, café y mascarpone", "precio_base": 4200.0, "stock": 12, "categoria": "Postres", "imagen_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80"},
            {"nombre": "Brownie con Helado", "descripcion": "Brownie tibio de chocolate con bocha de helado de americana", "precio_base": 4000.0, "stock": 14, "categoria": "Postres", "imagen_url": "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=600&q=80"}
        ]

        for p_info in productos_data:
            cat_obj = cats.get(p_info["categoria"])
            producto = Producto(
                nombre=p_info["nombre"],
                descripcion=p_info["descripcion"],
                precio_base=p_info["precio_base"],
                stock=p_info["stock"],
                imagen_url=p_info["imagen_url"],
                categoria_id=cat_obj.id if cat_obj else 1,
                disponible=True,
                activo=True
            )
            session.add(producto)
            print(f"-> Producto creado: {producto.nombre}")

        session.commit()
        print("¡Base de datos poblada exitosamente con productos equilibrados!")

if __name__ == "__main__":
    seed_database()