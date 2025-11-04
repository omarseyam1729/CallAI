from sqlalchemy import create_engine, inspect
import os
from sqlalchemy.orm import sessionmaker, declarative_base


DEFAULT_DATABASE_URL = "sqlite:///./ams_db.sqlite3"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()



if __name__ == "__main__":
    # 4) Create tables if they don’t exist
    Base.metadata.create_all(bind=engine)

    # 5) Inspect and print schema
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print("Tables and their schema:")
    for table in tables:
        print(f"Table: {table}")
        columns = inspector.get_columns(table)
        for col in columns:
            name     = col['name']
            col_type = col['type']
            nullable = col['nullable']
            default  = col.get('default')
            nullable_flag = " NULLABLE" if nullable else " NOT NULL"
            default_str   = f" DEFAULT {default}" if default is not None else ""
            print(f"  - {name} ({col_type}){nullable_flag}{default_str}")
