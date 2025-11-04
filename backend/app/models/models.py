import uuid
from sqlalchemy import (
    Column, Integer, Float, String, Text, TIMESTAMP, ForeignKey, func,DateTime,
    UniqueConstraint, CheckConstraint,DateTime,Boolean
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy import JSON, Boolean
import uuid
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
Base = declarative_base()

#### User Model #####
class User(Base):
    __tablename__ = "user"
    id       = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email    = Column(String, unique=True, nullable=True)
    created  = Column(DateTime(timezone=True), server_default=func.now())
    triggers = relationship("Trigger", back_populates="user", cascade="all, delete")

############## Call & Agent ######################

class Agent(Base):
    __tablename__ = "agent"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    age = Column(Integer, nullable=True)
    sex = Column(String(50), nullable=True)

    calls = relationship("CallData", back_populates="agent")


class Call(Base):
    __tablename__ = "call"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(Text, nullable=False)
    folder_path = Column(Text, nullable=False)
    upload_time = Column(TIMESTAMP, server_default=func.current_timestamp())
    chunks = relationship("AudioChunk", back_populates="call", cascade="all, delete-orphan")
    call_data = relationship("CallData", back_populates="call", uselist=False)

class CallData(Base):
    __tablename__ = "call_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(String, ForeignKey("call.id", ondelete="CASCADE"), unique=True)

    # new metadata fields
    call_name = Column(String(255), nullable=True)
    call_description = Column(Text, nullable=True)
    agent_id = Column(Integer, ForeignKey("agent.id", ondelete="SET NULL"), nullable=True)

    # analysis outputs
    full_transcript = Column(Text, nullable=True)
    llm_summary = Column(Text, nullable=True)
    sentiment_label = Column(String(50), nullable=True)
    sentiment_confidence = Column(Float, nullable=True)
    emotion_label = Column(String(50), nullable=True)
    emotion_confidence = Column(Float, nullable=True)

    call = relationship("Call", back_populates="call_data")
    agent = relationship("Agent", back_populates="calls")




class AudioChunk(Base):
    __tablename__ = "audio_chunk"

    id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(String, ForeignKey("call.id", ondelete="CASCADE"))  # match Call.id's type!
    chunk_path = Column(Text, nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    call = relationship("Call", back_populates="chunks")
    segments = relationship("Segment", back_populates="chunk", cascade="all, delete-orphan")


class Segment(Base):
    __tablename__ = "segment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    chunk_id = Column(Integer, ForeignKey("audio_chunk.id", ondelete="CASCADE"))
    speaker = Column(String(20), nullable=False)
    start = Column(Float, nullable=False)
    end = Column(Float, nullable=False)
    text = Column(Text, nullable=True)

    sentiment_label = Column(String(50), nullable=True)
    sentiment_confidence = Column(Float, nullable=True)

    emotion_label = Column(String(50), nullable=True)
    emotion_confidence = Column(Float, nullable=True)

    chunk = relationship("AudioChunk", back_populates="segments")
    words = relationship("Word", back_populates="segment", cascade="all, delete-orphan")



class Word(Base):
    __tablename__ = "word"

    id = Column(Integer, primary_key=True, autoincrement=True)
    segment_id = Column(Integer, ForeignKey("segment.id", ondelete="CASCADE"))
    word = Column(Text, nullable=False)
    start = Column(Float, nullable=False)
    end = Column(Float, nullable=False)
    confidence = Column(Float, nullable=True)

    segment = relationship("Segment", back_populates="words")





############################# Adjustable Criteria ##################################


class Trigger(Base):
    __tablename__ = "trigger"

    id          = Column(Integer, primary_key=True)
    name        = Column(String(120), nullable=False, unique=True)  # e.g., "Greeting Regex"
    description = Column(Text, nullable=True)
    type        = Column(String(50), nullable=False)  # regex, semantic, sentiment, etc.
    config      = Column(JSON, nullable=False)        # trigger-specific DSL/options

    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    user_id     = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    user        = relationship("User", back_populates="triggers")

    evals       = relationship(
        "TriggerEval",
        back_populates="trigger",
        cascade="all, delete-orphan"
    )


############################# Trigger Evaluation Results ##################################
class TriggerEval(Base):
    __tablename__ = "trigger_eval"
    id           = Column(Integer, primary_key=True)
    # relationships
    trigger_id   = Column(Integer, ForeignKey("trigger.id", ondelete="CASCADE"), nullable=False)
    call_id      = Column(String, ForeignKey("call.id", ondelete="CASCADE"), nullable=False)
    # evaluation result
    matched      = Column(Boolean, nullable=False)     
    score        = Column(String, nullable=True)       
    evidence     = Column(JSON, nullable=True)          
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    trigger = relationship("Trigger", back_populates="evals")




 ##################################### Batch Models ##################################
# --------------------------
# Enum Types
# --------------------------

class RunBatchStatus(str, PyEnum):
    draft = "draft"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"
    stopped = "stopped"

class RunBatchCallStatus(str, PyEnum):
    pending = "pending"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"
    skipped = "skipped"

# --------------------------
# RunBatch
# --------------------------

class RunBatch(Base):
    __tablename__ = "run_batch"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)

    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    steps_json = Column(Text, nullable=True)  # JSON blob as string
    fail_fast = Column(Boolean, default=False, nullable=False)

    status = Column(String(20), default=RunBatchStatus.draft.value, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft','running','succeeded','failed','stopped')",
            name="ck_run_batch_status"
        ),
    )

    # Relationships
    calls = relationship("RunBatchCall", back_populates="batch", cascade="all, delete-orphan")
    triggers = relationship("RunBatchTrigger", back_populates="batch", cascade="all, delete-orphan")

# --------------------------
# RunBatchCall
# --------------------------

class RunBatchCall(Base):
    __tablename__ = "run_batch_call"

    id = Column(Integer, primary_key=True)
    batch_id = Column(Integer, ForeignKey("run_batch.id", ondelete="CASCADE"), nullable=False, index=True)
    call_id = Column(String(36), nullable=False, index=True)  # UUID stored as string

    status = Column(String(20), default=RunBatchCallStatus.pending.value, nullable=False)
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))

    result_summary = Column(Text)  # JSON blob as string
    error = Column(Text)

    # Optional: progress counters
    chunk_total = Column(Integer, default=0, nullable=False)
    chunk_done = Column(Integer, default=0, nullable=False)
    chunk_error = Column(Integer, default=0, nullable=False)
    last_progress_at = Column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("batch_id", "call_id", name="ux_run_batch_call_unique"),
        CheckConstraint(
            "status IN ('pending','running','succeeded','failed','skipped')",
            name="ck_run_batch_call_status"
        ),
    )

    # Relationships
    batch = relationship("RunBatch", back_populates="calls")

# --------------------------
# RunBatchTrigger
# --------------------------

class RunBatchTrigger(Base):
    __tablename__ = "run_batch_trigger"

    id = Column(Integer, primary_key=True)
    batch_id = Column(Integer, ForeignKey("run_batch.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger_id = Column(Integer, nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("batch_id", "trigger_id", name="ux_run_batch_trigger_unique"),
    )

    # Relationships
    batch = relationship("RunBatch", back_populates="triggers")
    # Optional: link to Trigger model if needed
    # trigger = relationship("Trigger")
