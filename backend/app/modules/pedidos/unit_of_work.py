from typing import Callable
from sqlmodel import Session
from app.core.database import session_factory


class PedidoUnitOfWork:
    def __init__(self, session_factory_func: Callable[[], Session] = session_factory):
        self.session_factory = session_factory_func
        self.session: Session | None = None

    def __enter__(self):
        self.session = self.session_factory()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            if exc_type:
                self.session.rollback()
            else:
                self.session.commit()
            self.session.close()