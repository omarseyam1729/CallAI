from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api  


app = api.app  

origins = [
    "http://localhost:5173",  # Vite/React frontend
    # add more origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            
    allow_credentials=True,
    allow_methods=["*"],              
    allow_headers=["*"],            
)






