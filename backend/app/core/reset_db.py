# reset_db.py
from app.core.database import engine, Base
from app.models import AudioFile, Segment  # Import new models so they’re registered

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)

    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)

    print("Database schema reset successfully.")

if __name__ == "__main__":
    reset_database()
