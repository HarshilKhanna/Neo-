import uvicorn
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from api.main import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 