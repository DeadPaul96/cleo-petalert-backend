import psycopg2
from datetime import datetime

# Database connection parameters (from docker-compose env)
DB_HOST = "localhost" # Assuming the script runs on host machine targeting exposed port 5433
DB_PORT = "5433" 
DB_NAME = "cleo_db"
DB_USER = "daniel"
DB_PASS = "cleo123"

def seed_db():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()
        
        # 1. Create a dummy user to chat with (if it doesn't exist)
        cur.execute("SELECT id FROM users WHERE email='test_rescue@example.com'")
        test_user = cur.fetchone()
        
        if not test_user:
            cur.execute("""
                INSERT INTO users (firebase_uid, email, full_name, avatar_url, created_at, is_active)
                VALUES ('dummy_uid_123', 'test_rescue@example.com', 'Refugio Animal (Test)', 'https://i.pravatar.cc/150?u=a042581f4e29026704d', %s, true)
                RETURNING id;
            """, (datetime.now(),))
            test_user_id = cur.fetchone()[0]
            print(f"Created test user with ID: {test_user_id}")
        else:
            test_user_id = test_user[0]
            print(f"Test user already exists with ID: {test_user_id}")
            
        # 2. Find the current real logged in user (usually ID 1 if they just tested login)
        cur.execute("SELECT id FROM users WHERE email != 'test_rescue@example.com' ORDER BY id ASC LIMIT 1")
        real_user = cur.fetchone()
        
        if not real_user:
            print("No real user found. Please login to the app first so we have someone to create a conversation with.")
            return

        real_user_id = real_user[0]
        print(f"Creating conversation for real user ID: {real_user_id} and test user ID: {test_user_id}")

        # 3. Create a conversation between them
        cur.execute("SELECT id FROM conversations WHERE user1_id=%s AND user2_id=%s", (real_user_id, test_user_id))
        conv = cur.fetchone()
        
        if not conv:
            cur.execute("""
                INSERT INTO conversations (user1_id, user2_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
            """, (real_user_id, test_user_id, datetime.now(), datetime.now()))
            conv_id = cur.fetchone()[0]
            print(f"Created new conversation with ID: {conv_id}")
        else:
            conv_id = conv[0]
            print(f"Conversation already exists with ID: {conv_id}")

        # 4. Insert some initial messages
        cur.execute("SELECT COUNT(*) FROM messages WHERE conversation_id=%s", (conv_id,))
        msg_count = cur.fetchone()[0]
        
        if msg_count == 0:
            messages = [
                (conv_id, test_user_id, "¡Hola! Vi el perfil de adopción que te interesó.", datetime.now()),
                (conv_id, real_user_id, "Sí, me encantaría saber más sobre él/ella.", datetime.now()),
                (conv_id, test_user_id, "¿Estarías disponible para una visita mañana a las 10 am?", datetime.now())
            ]
            cur.executemany("""
                INSERT INTO messages (conversation_id, sender_id, content, created_at, is_read)
                VALUES (%s, %s, %s, %s, false)
            """, messages)
            print("Inserted 3 test messages.")
            
        conn.commit()
        print("Database seeding completed successfully.")
        
    except Exception as e:
        print(f"Database error: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    seed_db()
