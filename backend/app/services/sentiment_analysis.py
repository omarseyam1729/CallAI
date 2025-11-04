from transformers import pipeline

# Load model only once (global scope)
sentiment_pipeline = pipeline(
    "sentiment-analysis", 
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

def analyze_sentiment(text: str) -> dict:
    """
    Analyze sentiment of the input text using BERT.

    Args:
        text (str): Input text

    Returns:
        dict: A dictionary with label and confidence score
    """
    result = sentiment_pipeline(text)[0]
    return {
        "text": text,
        "sentiment": result["label"],
        "confidence": round(result["score"], 4)
    }
if __name__ == "__main__":
    # Example usage
    text = "I love programming!"
    sentiment_result = analyze_sentiment(text)
    print(f"Sentiment Analysis Result: {sentiment_result}")