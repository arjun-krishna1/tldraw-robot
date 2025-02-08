# Tldraw Robot Backend

This is the FastAPI backend for the Tldraw Robot project. It handles the Gemini API calls in a secure way.

## Setup

1. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file in the backend directory with:
```
GEMINI_API_KEY=your_api_key_here
```

## Running the Server

Start the FastAPI server:
```bash
cd backend
uvicorn app.main:app --reload
```

The server will run at `http://localhost:8000`

## API Endpoints

### POST /api/generate
Generates a response using the Gemini API.

Request body:
```json
{
  "prompt": "Your prompt text here"
}
```

Response:
```json
{
  "response": "Generated response from Gemini"
}
```

## Development

- API documentation is available at `http://localhost:8000/docs`
- ReDoc documentation is available at `http://localhost:8000/redoc` 