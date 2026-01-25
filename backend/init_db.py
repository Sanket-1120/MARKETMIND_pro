import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        print("Please ensure your .env file has the correct DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD.")
        return None

def init_db():
    conn = get_db_connection()
    if conn is None:
        return

    try:
        cur = conn.cursor()
        
        # Create credit_scores table
        create_table_query = """
        CREATE TABLE IF NOT EXISTS credit_scores (
            id SERIAL PRIMARY KEY,
            ticker VARCHAR(10) NOT NULL,
            score FLOAT NOT NULL,
            features JSONB,
            explanation JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        cur.execute(create_table_query)
        
        # Create index on ticker and created_at for faster queries
        cur.execute("CREATE INDEX IF NOT EXISTS idx_ticker_created_at ON credit_scores (ticker, created_at DESC);")
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Database initialized successfully! Table 'credit_scores' is ready.")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
