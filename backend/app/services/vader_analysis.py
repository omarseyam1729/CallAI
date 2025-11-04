# vader_analysis.py
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import Dict

analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(text: str) -> Dict[str, float]:
    """
    Analyzes sentiment using VADER and returns a dictionary of scores.
    """
    return analyzer.polarity_scores(text)

def classify_sentiment(text: str) -> str:
    """
    Returns a label: Positive, Negative, or Neutral based on compound score.
    """
    score = analyzer.polarity_scores(text)['compound']
    if score >= 0.05:
        return "Positive"
    elif score <= -0.05:
        return "Negative"
    else:
        return "Neutral"

if __name__ == "__main__":
    sample = "I'm feeling really great about this!"
    scores = analyze_sentiment(sample)

    print("VADER Scores:")
    for k, v in scores.items():
        print(f"{k}: {v:.4f}")

    sentiment = classify_sentiment(sample)
    print(f"\nOverall Sentiment: {sentiment}")
