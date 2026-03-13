import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Default to Docker-Compose service name 'db' if running inside container
POSTGRES_USER = os.getenv("POSTGRES_USER", "cleo_admin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "cleo_secret")
POSTGRES_DB = os.getenv("POSTGRES_DB", "cleo_db")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")  # Change to 'db' in docker
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

SQLALCHEMY_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
