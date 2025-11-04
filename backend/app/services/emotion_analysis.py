# emotion_analysis.py

from transformers import pipeline
from typing import List, Dict

# Initialize the pipeline (model is downloaded and cached locally after first use)
emotion_classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=None  # Returns all emotion scores
)

def analyze_emotions(text: str) -> List[Dict[str, float]]:
    """
    Analyzes emotions in the input text and returns a list of dictionaries
    containing emotion labels and their confidence scores.
    
    Args:
        text (str): Input text for emotion analysis.

    Returns:
        List[Dict[str, float]]: List of emotion label/score dictionaries.
    """
    return emotion_classifier(text)

if __name__ == "__main__":
    # Example usage
    sample_text = "Don't force me to pity you. I am yet to come across an exalted person like you."
    
    print("Emotion Scores:")
    emotions = analyze_emotions(sample_text)
    print(emotions)

    
