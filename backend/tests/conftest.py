import sys
import asyncio
import pytest
from app.db.database import engine

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop to prevent asyncpg connection detachment on Windows."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(autouse=True)
async def dispose_engine():
    """Ensure engine connections are disposed cleanly after tests."""
    yield
    await engine.dispose()
