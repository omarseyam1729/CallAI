# app/api/routes/test.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def test():
    return {"message": "Welcome to CALL AI"}
