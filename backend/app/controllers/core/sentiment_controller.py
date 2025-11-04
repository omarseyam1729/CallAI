from sqlalchemy.orm import Session
from app.models import Call
from app.services.emotion_analysis import analyze_emotions
from app.services.sentiment_analysis import analyze_sentiment

from collections import Counter
from sqlalchemy.orm import selectinload
from app.models import Call, Segment

from collections import Counter
from sqlalchemy.orm import Session, selectinload
from app.models import Call, AudioChunk

def get_most_occuring_emotion(call_id: str, db: Session) -> str | None:
    call = (
        db.query(Call)
        .options(selectinload(Call.chunks).selectinload(AudioChunk.segments))
        .filter(Call.id == call_id)
        .first()
    )
    if not call:
        return None

    counter = Counter()
    for chunk in call.chunks:
        for segment in chunk.segments:
            if segment.emotion_label:
                counter[segment.emotion_label.strip().lower()] += 1

    return counter.most_common(1)[0][0] if counter else None

def get_most_occuring_sentiment(call_id: str, db: Session) -> str | None:
    call = (
        db.query(Call)
        .options(selectinload(Call.chunks).selectinload(AudioChunk.segments))
        .filter(Call.id == call_id)
        .first()
    )
    if not call:
        return None

    counter = Counter()
    for chunk in call.chunks:
        for segment in chunk.segments:
            if segment.sentiment_label:
                counter[segment.sentiment_label.strip().lower()] += 1

    return counter.most_common(1)[0][0] if counter else None


def get_dominant_emotion(text: str) -> tuple[str, float] | None:
    if not text or not text.strip():
        return None
    try:
        results = analyze_emotions(text)
        if not results or not isinstance(results[0], list):
            return None
        top = max(results[0], key=lambda x: x["score"])
        return top["label"], round(top["score"], 4)
    except Exception as e:
        print(f"[emotion error] {e}")
        return None


def get_sentiment(text: str) -> tuple[str, float] | None:
    if not text or not text.strip():
        return None
    try:
        result = analyze_sentiment(text)
        return result["sentiment"], result["confidence"]
    except Exception as e:
        print(f"[sentiment error] {e}")
        return None


def populate_segment_emotions_and_sentiments(call_id: str, db: Session):
    """
    Populate emotion and sentiment for each segment of the call.
    """
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        print(f"[analysis] Call ID {call_id} not found")
        return

    updated = 0

    for chunk in call.chunks:
        for segment in chunk.segments:
            if not segment.text:
                continue

            emotion = get_dominant_emotion(segment.text)
            sentiment = get_sentiment(segment.text)

            if emotion:
                segment.emotion_label = emotion[0]
                segment.emotion_confidence = emotion[1]

            if sentiment:
                segment.sentiment_label = sentiment[0]
                segment.sentiment_confidence = sentiment[1]

            updated += 1

    try:
        db.commit()
        print(f"[analysis] Updated {updated} segments with emotion and sentiment.")
    except Exception as e:
        db.rollback()
        print(f"[analysis] Failed to commit to DB: {e}")


if __name__=="__main__":
    from app.core.database import SessionLocal
    call_id="73e791aa-6878-4ab9-b0e6-09a18b85c788"
    db=SessionLocal()
    print(f"Most occurring emotion: {get_most_occuring_sentiment(call_id, db)}")

    