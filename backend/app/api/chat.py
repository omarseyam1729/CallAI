# app/api/chat.py
from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.schemas.chat import ChatRequest, ChatMessageResponse
from app.controllers.core.chat_controller import process_chat_message

router = APIRouter()


@router.post("/message", response_model=ChatMessageResponse)
def chat_message(request: ChatRequest):
    """
    Process a chat message: convert to SQL, execute, and format answer.
    """
    try:
        # Convert conversation history to dict format
        history = [
            {
                "role": msg.role,
                "content": msg.content
            }
            for msg in request.conversation_history
        ]
        
        # Process the message
        answer, sql_query = process_chat_message(request.message, history)
        
        return ChatMessageResponse(
            answer=answer,
            query_used=sql_query,
            timestamp=datetime.now()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")

