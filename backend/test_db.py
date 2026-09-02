import asyncio
import asyncpg
import sys

async def test():
    try:
        conn = await asyncpg.connect('postgresql://postgres:yourpassword@localhost:5432/smarthiredb')
        print("DB_SUCCESS")
        await conn.close()
    except Exception as e:
        print(f"DB_FAIL: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test())
