from datetime import date
from .models import create_sqlite_engine, init_db, get_session, Hotel, Room, Service, add_booking, get_available_rooms, delete_booking


def seed_data(session):
    # Create a hotel, rooms and services
    h = Hotel(name='Demo Hotel', address='123 Example St')
    r1 = Room(number='101', room_type='single', capacity=1, price=50)
    r2 = Room(number='102', room_type='double', capacity=2, price=80)
    h.rooms.extend([r1, r2])

    s1 = Service(name='Breakfast', price=10)
    s2 = Service(name='Airport pickup', price=30)

    session.add_all([h, s1, s2])
    session.commit()
    return h, [r1, r2], [s1, s2]


def main():
    engine = create_sqlite_engine('sqlite:///lab4_hotel.db')
    init_db(engine)
    session = get_session(engine)

    hotel, rooms, services = seed_data(session)
    check_in = date(2026, 6, 10)
    check_out = date(2026, 6, 12)

    print('Available rooms before booking:')
    av = get_available_rooms(session, hotel.id, check_in, check_out)
    for r in av:
        print(f'- Room {r.number} ({r.room_type})')

    booking = add_booking(session, {'name': 'Ivan Petrov', 'email': 'ivan@example.com'}, hotel.id, rooms[0].id, check_in, check_out, service_ids=[services[0].id])
    print('Created booking id:', booking.id)

    print('Available rooms after booking:')
    av2 = get_available_rooms(session, hotel.id, check_in, check_out)
    for r in av2:
        print(f'- Room {r.number} ({r.room_type})')

    # Clean up
    delete_booking(session, booking.id)
    print('Booking deleted')


if __name__ == '__main__':
    main()
