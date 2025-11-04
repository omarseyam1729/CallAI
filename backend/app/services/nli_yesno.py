# nli_yesno.py
import torch
from transformers import pipeline
from typing import Literal

# Lazy-load pipeline
_nli = None

def _device():
    if torch.cuda.is_available():
        return 0
    try:
        if torch.backends.mps.is_available():
            return "mps"
    except Exception:
        pass
    return -1  # CPU

def _get_nli():
    global _nli
    if _nli is None:
        _nli = pipeline(
            "text-classification",
            model="facebook/bart-large-mnli",  # swap to "roberta-large-mnli" if preferred
            device=_device(),
            return_all_scores=True,
            truncation=True,
        )
    return _nli

def nli_yes_no(text: str, threshold: float = 0.6) -> Literal["yes", "no", "undecidable"]:
    """
    Decide if text implies YES, NO, or is undecidable.
    Uses Natural Language Inference against:
      - "The answer is yes."
      - "The answer is no."
    """
    prem = (text or "").strip()
    if not prem:
        return "undecidable"

    nli = _get_nli()

    def ent_score(hypo: str) -> float:
        out = nli({"text": prem, "text_pair": hypo})
        scores = {d["label"].lower(): float(d["score"]) for d in out}
        return scores.get("entailment", 0.0)

    s_yes = ent_score("The answer is yes.")
    s_no  = ent_score("The answer is no.")

    if s_yes < threshold and s_no < threshold:
        return "undecidable"
    return "yes" if s_yes >= s_no else "no"


if __name__ == "__main__":
    print("🔍 NLI Yes/No quick test")
    examples = [
        "Yes, the agent clearly confirmed a refund.",
        "No, the transcript does not mention compliance.",
        "Maybe, but it's not very clear.",
        "The customer agreed yesterday to the terms.",  # edge case: 'yesterday'
    ]

    for t in examples:
        label = nli_yes_no(t)
        print(f"Text: {t}\n → Prediction: {label}\n")
