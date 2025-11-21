# CallAI - Intelligent Call Analysis Platform

CallAI is a comprehensive AI-powered platform for analyzing audio call recordings. It provides automated transcription, speaker diarization, sentiment analysis, emotion detection, semantic search, and customizable trigger evaluation for call center analytics and quality assurance.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development](#development)
- [Project Structure](#project-structure)

## Features

### Core Capabilities

- **Audio Processing**
  - Upload audio files (MP3, WAV) via drag-and-drop interface
  - Automatic audio chunking for efficient processing
  - Support for long-duration calls

- **Transcription & Diarization**
  - High-accuracy speech-to-text using WhisperX
  - Automatic speaker diarization (identifies different speakers)
  - Word-level timestamps and confidence scores
  - Segment-level transcription with speaker attribution

- **AI-Powered Analysis**
  - **Sentiment Analysis**: Per-segment and overall call sentiment detection
  - **Emotion Analysis**: Emotion classification (joy, sadness, anger, fear, etc.)
  - **LLM Summarization**: AI-generated call summaries using Ollama
  - **Semantic Search**: Vector-based semantic search across all calls

- **Agent Management**
  - Create and manage call agents
  - Associate calls with specific agents
  - Track agent performance metrics

- **Trigger System**
  - Create custom triggers (regex, semantic, sentiment-based)
  - Evaluate triggers against calls
  - Batch trigger evaluation
  - Evidence tracking for trigger matches

- **Batch Processing**
  - Run analysis pipelines on multiple calls simultaneously
  - Configurable processing steps
  - Progress tracking and error handling
  - Fail-fast and resume capabilities

- **Search & Discovery**
  - Keyword search across transcripts
  - Semantic search using embeddings
  - Filter by call, speaker, date, sentiment
  - Search result highlighting

- **Metrics & Analytics**
  - Dashboard with overview metrics
  - Call statistics (total words, segments, duration)
  - Sentiment distribution charts
  - Processing status tracking

- **Interactive Chat Interface**
  - Natural language queries about call data
  - SQL query generation from natural language
  - Conversational interface for data exploration

## Tech Stack

### Backend

- **Framework**: FastAPI (Python 3.8+)
- **Database**: SQLite (with SQLAlchemy ORM)
- **Migrations**: Alembic
- **Audio Processing**:
  - WhisperX for transcription and diarization
  - Pyannote.audio for speaker diarization
  - FFmpeg for audio manipulation
- **ML/AI**:
  - Transformers (Hugging Face) for sentiment/emotion analysis
  - Ollama for LLM-based summarization
  - FAISS for semantic search vector storage
- **Other Libraries**:
  - Pydantic for data validation
  - SQLAlchemy for database ORM

### Frontend

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v7
- **Charts**: Recharts
- **HTTP Client**: Axios

## Architecture

### System Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ◄─────► │   Backend   │ ◄─────► │  Database   │
│  (React)    │  HTTP   │  (FastAPI)  │  ORM    │  (SQLite)   │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              │
                    ┌─────────┴─────────┐
                    │                   │
              ┌─────▼─────┐      ┌──────▼──────┐
              │ WhisperX  │      │   FAISS     │
              │  Models   │      │   Vector    │
              │           │      │   Store     │
              └───────────┘      └─────────────┘
```

### Processing Pipeline

1. **Upload**: Audio file uploaded and stored in `media/` directory
2. **Chunking**: Audio split into 30-second chunks for processing
3. **Transcription**: Each chunk transcribed with WhisperX
4. **Diarization**: Speakers identified and segments created
5. **Analysis**: Sentiment and emotion analysis per segment
6. **Summarization**: LLM generates call summary
7. **Indexing**: Transcripts indexed in FAISS for semantic search
8. **Storage**: All data persisted in SQLite database

## Installation

### Prerequisites

- **Python 3.8+**
- **Node.js 18+** and npm
- **FFmpeg** (for audio processing)
- **Hugging Face Token** (for pyannote.audio models)
- **Ollama** (for LLM summarization)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install fastapi uvicorn sqlalchemy alembic pydantic
   pip install whisperx transformers torch
   pip install ollama faiss-cpu  # or faiss-gpu for GPU support
   pip install python-multipart  # for file uploads
   ```

   > **Note**: For a complete list of dependencies, check the imports in the codebase or create a `requirements.txt` file.

4. **Set up Hugging Face token**:
   ```bash
   export HF_TOKEN="your_huggingface_token_here"
   ```
   
   Or create a `.env` file in the backend directory:
   ```
   HF_TOKEN=your_huggingface_token_here
   ```

5. **Initialize database**:
   ```bash
   # Run Alembic migrations
   alembic upgrade head
   
   # Or create tables directly
   python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```

6. **Start the backend server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   The API will be available at `http://localhost:8000`
   API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

4. **Build for production**:
   ```bash
   npm run build
   ```

## Configuration

### Backend Configuration

- **Database**: Configured in `backend/app/core/database.py`
  - Default: SQLite at `./ams_db.sqlite3`
  - Override with `DATABASE_URL` environment variable

- **CORS**: Configured in `backend/main.py`
  - Default origins: `http://localhost:5173`, `http://localhost:5174`
  - Modify `origins` list to add more allowed origins

- **Media Storage**: Audio files stored in `backend/media/` directory
  - Each call gets a unique folder: `media/call_{call_id}/`

- **WhisperX Configuration**: In `backend/app/services/whisperx_transcribe.py`
  - Model size: `base`, `small`, `medium`, `large` (default: `base`)
  - Device: `cpu` or `cuda`
  - Compute type: `float32` or `float16`

### Frontend Configuration

- **API URL**: Configured in `frontend/src/lib/api.ts`
  - Default: `http://localhost:8000`
  - Override with `VITE_API_URL` environment variable

## Usage

### Uploading a Call

1. Navigate to the **Upload** page in the frontend
2. Drag and drop an audio file (MP3 or WAV) or click to browse
3. The file will be uploaded and automatically chunked
4. Processing status can be tracked in the **Progress** section

### Running Analysis Pipeline

1. Go to a call's detail page
2. Click **Run Pipeline** to start analysis
3. Select which steps to run:
   - **Transcription**: Generate transcript from audio
   - **Summary**: Generate AI summary
   - **Sentiment**: Analyze sentiment per segment
   - **Semantic**: Index for semantic search

### Creating Triggers

1. Navigate to **Triggers** page
2. Click **Create Trigger**
3. Configure trigger:
   - **Name**: Descriptive name
   - **Type**: `regex`, `semantic`, or `sentiment`
   - **Config**: Trigger-specific configuration (JSON)
4. Save and evaluate against calls

### Batch Processing

1. Navigate to **Batch Mode** page
2. Create a new batch:
   - Select calls to process
   - Choose triggers to evaluate
   - Configure processing steps
3. Start the batch and monitor progress

### Semantic Search

1. Navigate to **Search** page
2. Enter a natural language query
3. Select search type:
   - **Keyword**: Text matching
   - **Semantic**: Meaning-based search
4. View results with context and timestamps

### Chat Interface

1. Navigate to **CallAI** page
2. Ask questions about your call data in natural language
3. The system will generate SQL queries and return answers
4. Example queries:
   - "How many calls have positive sentiment?"
   - "Show me calls where the agent mentioned pricing"
   - "What's the average call duration?"

## API Documentation

### Endpoints Overview

#### Audio & Upload
- `POST /upload/` - Upload audio file and create call record

#### Call Management
- `GET /calls/` - List all calls
- `GET /call/{call_id}/data` - Get call metadata and analysis
- `GET /call/transcription/{call_id}` - Get full transcript
- `GET /call/transcription/{call_id}/speakers` - Get transcript by speaker
- `GET /call/transcription/{call_id}/segments` - Get all segments
- `GET /call/transcription/{call_id}/segments/{segment_id}/audio` - Get segment audio

#### Pipeline
- `POST /pipeline/{call_id}/run` - Run analysis pipeline
- `POST /pipeline/{call_id}/reset` - Reset call analysis data

#### Agents
- `GET /agents/` - List all agents
- `POST /agents/` - Create agent
- `GET /agents/{agent_id}` - Get agent details
- `PUT /agents/{agent_id}` - Update agent
- `DELETE /agents/{agent_id}` - Delete agent

#### Triggers
- `GET /triggers/` - List all triggers
- `POST /triggers/` - Create trigger
- `GET /triggers/{trigger_id}` - Get trigger details
- `PUT /triggers/{trigger_id}` - Update trigger
- `DELETE /triggers/{trigger_id}` - Delete trigger
- `POST /triggers/evaluate` - Evaluate triggers against calls

#### Batch Processing
- `GET /batch/` - List all batches
- `POST /batch/` - Create batch
- `POST /batch/{batch_id}/start` - Start batch processing
- `GET /batch/{batch_id}/progress` - Get batch progress
- `GET /batch/{batch_id}/report` - Get batch report

#### Search
- `POST /search/keyword` - Keyword search
- `POST /search/semantic` - Semantic search

#### Metrics
- `GET /metrics/` - Get overview metrics

#### Chat
- `POST /chat/message` - Send chat message and get response

### Interactive API Docs

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Database Schema

### Core Tables

#### `call`
- `id` (String, PK): Unique call identifier (UUID)
- `filename` (Text): Original audio filename
- `folder_path` (Text): Path to call folder
- `upload_time` (TIMESTAMP): Upload timestamp

#### `call_data`
- `id` (Integer, PK)
- `call_id` (String, FK): Links to `call.id`
- `call_name` (String): User-assigned name
- `call_description` (Text): User description
- `agent_id` (Integer, FK): Associated agent
- `full_transcript` (Text): Complete transcript
- `llm_summary` (Text): AI-generated summary
- `sentiment_label` (String): Overall sentiment
- `sentiment_confidence` (Float): Confidence score
- `emotion_label` (String): Overall emotion
- `emotion_confidence` (Float): Confidence score

#### `audio_chunk`
- `id` (Integer, PK)
- `call_id` (String, FK): Parent call
- `chunk_path` (Text): Path to audio file
- `start_time` (Float): Chunk start time
- `end_time` (Float): Chunk end time
- `status` (String): Processing status

#### `segment`
- `id` (Integer, PK)
- `chunk_id` (Integer, FK): Parent chunk
- `speaker` (String): Speaker identifier
- `start` (Float): Start time
- `end` (Float): End time
- `text` (Text): Transcribed text
- `sentiment_label` (String): Segment sentiment
- `sentiment_confidence` (Float)
- `emotion_label` (String): Segment emotion
- `emotion_confidence` (Float)

#### `word`
- `id` (Integer, PK)
- `segment_id` (Integer, FK): Parent segment
- `word` (Text): Word text
- `start` (Float): Word start time
- `end` (Float): Word end time
- `confidence` (Float): Recognition confidence

#### `agent`
- `id` (Integer, PK)
- `name` (String): Agent name
- `description` (Text): Agent description
- `age` (Integer): Agent age
- `sex` (String): Agent sex

#### `trigger`
- `id` (Integer, PK)
- `name` (String): Trigger name
- `description` (Text): Trigger description
- `type` (String): Trigger type (regex, semantic, sentiment)
- `config` (JSON): Trigger configuration
- `user_id` (Integer, FK): Owner user
- `created_at` (DateTime): Creation timestamp
- `updated_at` (DateTime): Update timestamp

#### `trigger_eval`
- `id` (Integer, PK)
- `trigger_id` (Integer, FK): Evaluated trigger
- `call_id` (String, FK): Evaluated call
- `matched` (Boolean): Whether trigger matched
- `score` (String): Match score
- `evidence` (JSON): Match evidence
- `evaluated_at` (DateTime): Evaluation timestamp

#### `run_batch`
- `id` (Integer, PK)
- `user_id` (Integer): Batch owner
- `name` (String): Batch name
- `description` (Text): Batch description
- `steps_json` (Text): Processing steps (JSON)
- `fail_fast` (Boolean): Fail fast flag
- `status` (String): Batch status
- `created_at` (DateTime): Creation timestamp
- `started_at` (DateTime): Start timestamp
- `finished_at` (DateTime): Completion timestamp

#### `run_batch_call`
- `id` (Integer, PK)
- `batch_id` (Integer, FK): Parent batch
- `call_id` (String): Call to process
- `status` (String): Processing status
- `started_at` (DateTime): Start timestamp
- `finished_at` (DateTime): Completion timestamp
- `result_summary` (Text): Result summary (JSON)
- `error` (Text): Error message if failed
- `chunk_total` (Integer): Total chunks
- `chunk_done` (Integer): Completed chunks
- `chunk_error` (Integer): Failed chunks

#### `run_batch_trigger`
- `id` (Integer, PK)
- `batch_id` (Integer, FK): Parent batch
- `trigger_id` (Integer): Trigger to evaluate

#### `user`
- `id` (Integer, PK)
- `username` (String, unique): Username
- `email` (String, unique): Email address
- `created` (DateTime): Creation timestamp

## Development

### Running Tests

```bash
# Backend tests (if available)
cd backend
pytest

# Frontend tests (if available)
cd frontend
npm test
```

### Database Migrations

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Code Structure

#### Backend Structure

```
backend/
├── app/
│   ├── api/              # API route handlers
│   ├── controllers/      # Business logic
│   ├── core/             # Core utilities (database, etc.)
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # External service integrations
│   └── utils/            # Utility functions
├── alembic/              # Database migrations
├── media/                # Uploaded audio files
├── main.py               # Application entry point
└── alembic.ini           # Alembic configuration
```

#### Frontend Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   └── layout/      # Layout components
│   ├── pages/           # Page components
│   ├── lib/             # Utilities and API client
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
└── package.json         # Dependencies
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=sqlite:///./ams_db.sqlite3
HF_TOKEN=your_huggingface_token
OLLAMA_BASE_URL=http://localhost:11434
```

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **Database Reset**: Use `python app/core/reset_db.py` to reset the database (if available)
3. **Model Downloads**: First run will download WhisperX and other models (can be large)
4. **GPU Support**: For faster processing, use CUDA-enabled PyTorch and set device to `cuda`

## Project Structure

```
callAI/
├── backend/              # FastAPI backend
│   ├── app/             # Application code
│   ├── alembic/         # Database migrations
│   ├── media/           # Audio file storage
│   └── main.py          # Entry point
├── frontend/            # React frontend
│   ├── src/             # Source code
│   ├── public/          # Static assets
│   └── package.json     # Dependencies
└── README.md            # This file
```

## Troubleshooting

### Common Issues

1. **WhisperX model download fails**
   - Ensure you have internet connection
   - Check Hugging Face token is set correctly
   - Models are downloaded on first use

2. **Audio processing fails**
   - Verify FFmpeg is installed: `ffmpeg -version`
   - Check audio file format is supported (MP3, WAV)
   - Ensure sufficient disk space

3. **Database errors**
   - Run migrations: `alembic upgrade head`
   - Check database file permissions
   - Verify SQLite version compatibility

4. **CORS errors**
   - Ensure frontend URL is in backend CORS origins
   - Check backend is running on correct port

5. **Ollama connection errors**
   - Ensure Ollama is running: `ollama serve`
   - Check OLLAMA_BASE_URL environment variable
   - Verify model is available: `ollama list`

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here]

## Support

[Add support information here]

