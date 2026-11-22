from typing import Generic, TypeVar, Type, Optional, List
from sqlmodel import Session, select

T = TypeVar("T")

class BaseRepository(Generic[T]):
    def __init__(self, model_cls: Type[T], session: Session):
        self.model_cls = model_cls
        self.session = session

    def get_by_id(self, id_val: int) -> Optional[T]:
        return self.session.get(self.model_cls, id_val)

    def get_all(self) -> List[T]:
        statement = select(self.model_cls)
        return list(self.session.exec(statement).all())

    def add(self, entity: T) -> T:
        self.session.add(entity)
        return entity

    def delete(self, entity: T) -> None:
        self.session.delete(entity)