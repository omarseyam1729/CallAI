# app/api.py

from fastapi import FastAPI
from app.api import upload 
from app.api import progress
from app.api import test
from app.api import call
from app.api import trigger
from app.api import batch
from app.api import pipeline
from app.api import calls
from app.api import metrics
from app.api import agent
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.database import Base, engine
from app import models  # ensure models are registered
from app.api import search
from app.api import chat
logging.basicConfig(level=logging.INFO)


app = FastAPI()
app.include_router(upload.router, prefix="/upload", tags=["Audio"])
app.include_router(test.router,prefix="/test",tags=["Test"])
app.include_router(progress.router, prefix="/call", tags=["Progress"])
app.include_router(call.router, prefix="/call", tags=["Transcription"])
app.include_router(trigger.router, prefix="/triggers", tags=["Triggers"])
app.include_router(batch.router, prefix="/batch", tags=["Batch Processing"])
app.include_router(search.router, prefix="/search", tags=["Search"])
app.include_router(pipeline.router, prefix="/pipeline", tags=["Pipeline"])
app.include_router(calls.router, prefix="/calls", tags=["Calls"])
app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
app.include_router(agent.router, prefix="/agents", tags=["Agents"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])