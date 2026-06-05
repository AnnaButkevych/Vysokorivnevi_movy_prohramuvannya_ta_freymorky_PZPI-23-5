from datetime import date
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    ForeignKey,
    Table,
    create_engine,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, sessionmaker, declarative_base

Base = declarative_base()

booking_service_table = Table(
    'booking_service',
    Base.metadata,
    Column('booking_id', ForeignKey('bookings.id'), primary_key=True),
    Column('service_id', ForeignKey('services.id'), primary_key=True),
)


class Hotel(Base):
    __tablename__ = 'hotels'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    address = Column(String)
    rooms = relationship('Room', back_populates='hotel', cascade='all, delete-orphan')


class Room(Base):
    __tablename__ = 'rooms'
    id = Column(Integer, primary_key=True)
    hotel_id = Column(Integer, ForeignKey('hotels.id'), nullable=False)
    number = Column(String, nullable=False)
    room_type = Column(String, default='standard')
    capacity = Column(Integer, default=1)
    price = Column(Integer, default=0)

    hotel = relationship('Hotel', back_populates='rooms')
    bookings = relationship('Booking', back_populates='room', cascade='all, delete-orphan')

    __table_args__ = (
        UniqueConstraint('hotel_id', 'number', name='uix_hotel_roomnumber'),
    )


class Client(Base):
    __tablename__ = 'clients'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String)
    bookings = relationship('Booking', back_populates='client', cascade='all, delete-orphan')


class Service(Base):
    __tablename__ = 'services'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    price = Column(Integer, default=0)
    bookings = relationship('Booking', secondary=booking_service_table, back_populates='services')


class Booking(Base):
    __tablename__ = 'bookings'
    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)

    client = relationship('Client', back_populates='bookings')
    room = relationship('Room', back_populates='bookings')
    services = relationship('Service', secondary=booking_service_table, back_populates='bookings')


def create_sqlite_engine(path='sqlite:///lab4_hotel.db'):
    return create_engine(path, echo=False, future=True)


def init_db(engine):
    Base.metadata.create_all(engine)


def get_session(engine):
    return sessionmaker(bind=engine)()


def is_room_available(session, room_id, check_in: date, check_out: date) -> bool:
    from sqlalchemy import select

    stmt = (
        select(Booking)
        .where(Booking.room_id == room_id)
        .where(Booking.check_in < check_out)
        .where(Booking.check_out > check_in)
    )
    res = session.execute(stmt).scalars().first()
    return res is None


def get_available_rooms(session, hotel_id, check_in: date, check_out: date, room_type: str | None = None):
    from sqlalchemy import select, and_, not_, exists

    subq = (
        select(Booking.room_id)
        .where(Booking.check_in < check_out)
        .where(Booking.check_out > check_in)
        .subquery()
    )

    q = select(Room).where(Room.hotel_id == hotel_id)
    if room_type:
        q = q.where(Room.room_type == room_type)
    q = q.where(~Room.id.in_(select(subq.c.room_id)))

    return session.execute(q).scalars().all()


def add_booking(session, client_data: dict, hotel_id: int, room_id: int, check_in: date, check_out: date, service_ids: list[int] | None = None):
    client = None
    if client_data.get('email'):
        client = session.query(Client).filter_by(email=client_data['email']).first()
    if not client:
        client = Client(name=client_data.get('name', 'Unknown'), email=client_data.get('email'), phone=client_data.get('phone'))
        session.add(client)
        session.flush()

    # Verify room belongs to hotel
    room = session.query(Room).filter_by(id=room_id, hotel_id=hotel_id).first()
    if not room:
        raise ValueError('Room not found for given hotel')

    if not is_room_available(session, room_id, check_in, check_out):
        raise ValueError('Room is not available for requested dates')

    booking = Booking(client_id=client.id, room_id=room_id, check_in=check_in, check_out=check_out)
    if service_ids:
        services = session.query(Service).filter(Service.id.in_(service_ids)).all()
        booking.services.extend(services)

    session.add(booking)
    session.commit()
    return booking


def delete_booking(session, booking_id: int):
    b = session.query(Booking).filter_by(id=booking_id).first()
    if not b:
        raise ValueError('Booking not found')
    session.delete(b)
    session.commit()
