from sqlalchemy.orm import Session
from app.models import Call, CallData
from app.controllers.core.transcription_controller import get_full_transcription
from app.controllers.core.ollama_controller import summarise_with_callAI
from app.services.sentiment_analysis import analyze_sentiment
from app.services.emotion_analysis import analyze_emotions


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


def populate_call_data(call_id: str, db: Session):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        print(f"[calldata] Call ID {call_id} not found.")
        return

    try:
        # --- Step 1: Get full transcript ---
        full_transcript = get_full_transcription(call_id)

        # --- Step 2: Get LLM summary ---
        llm_summary = summarise_with_callAI(call_id)

        # --- Step 3: Analyze overall sentiment ---
        sentiment = get_sentiment(llm_summary)

        # --- Step 4: Analyze overall emotion ---
        emotion = get_dominant_emotion(llm_summary)

        # --- Step 5: Upsert CallData ---
        call_data = db.query(CallData).filter(CallData.call_id == call_id).first()

        if not call_data:
            call_data = CallData(call_id=call_id)

        call_data.full_transcript = full_transcript
        call_data.llm_summary = llm_summary

        if sentiment:
            call_data.sentiment_label = sentiment[0]
            call_data.sentiment_confidence = sentiment[1]

        if emotion:
            call_data.emotion_label = emotion[0]
            call_data.emotion_confidence = emotion[1]

        db.add(call_data)
        db.commit()
        print(f"[calldata] Populated CallData for call ID {call_id}.")

    except Exception as e:
        db.rollback()
        print(f"[calldata] Failed to populate CallData: {e}")

if __name__=="__main__":
    from app.core.database import SessionLocal
    db=SessionLocal()
    populate_call_data("18951850-a720-4e21-a31a-f17acc86ec29",db)
    db.close()