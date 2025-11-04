import requests
import logging
import json
import re
from typing import Tuple, Optional
from app.controllers.core.transcription_controller import get_full_transcription,get_speaker_transcript_by_call
from app.services.nli_yesno import nli_yes_no
logger = logging.getLogger(__name__)

OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "gemma3:4b"





REQUEST_TIMEOUT = 60  # seconds
MAX_PROMPT_TRANSCRIPT_CHARS = 12_000
MAX_PROMPT_CRITERIA_CHARS   = 2_000

# ---- Prompt (short, forceful) ----
def _truncate(s: str, limit: int) -> str:
    s = s or ""
    return s if len(s) <= limit else (s[:limit] + " …[truncated]")

def _build_prompt(transcript: str, criterion: str) -> str:
    t = _truncate(transcript, MAX_PROMPT_TRANSCRIPT_CHARS)
    c = _truncate(criterion,   MAX_PROMPT_CRITERIA_CHARS)
    return (
        "Answer with ONE line only.\n"
        "The FIRST WORD must be Yes or No, followed by a very short reason.\n\n"
        f"Transcript:\n{t}\n\n"
        f"Criterion:\n{c}\n"
    )

# ---- Parsers ----
_CODE_FENCE_RE = re.compile(r"```(?:\w+)?\s*\n(.*?)\n```", re.DOTALL)
_FIRST_TOKEN_RE = re.compile(r"^\s*(yes|no)\b[:\-\s]*", re.IGNORECASE)
_JSON_BLOCK_RE  = re.compile(r"\{.*?\}", re.DOTALL)
_EVIDENCE_LABEL_RE = re.compile(r"(?:^|\n)\s*Evidence\s*[:\-]\s*(.*)$", re.IGNORECASE | re.DOTALL)

def _strip_code_fences(text: str) -> str:
    text = (text or "").strip()
    m = _CODE_FENCE_RE.search(text)
    return m.group(1).strip() if m else text

def _json_rescue(text: str) -> Optional[Tuple[bool, str]]:
    m = _JSON_BLOCK_RE.search(text)
    if not m:
        return None
    try:
        parsed = json.loads(m.group(0))
        if isinstance(parsed.get("matched"), bool):
            reasoning = (parsed.get("reasoning") or parsed.get("evidence") or text).strip()
            return parsed["matched"], reasoning
    except json.JSONDecodeError:
        pass
    return None

def _evidence_from(text_after_first_line: str) -> str:
    if not text_after_first_line:
        return "Model indicated Yes/No but provided no evidence."
    m = _EVIDENCE_LABEL_RE.search(text_after_first_line)
    return (m.group(1).strip() if m else text_after_first_line).strip() or \
           "Model indicated Yes/No but provided no evidence."

def _parse_yes_no_and_evidence(raw: str) -> Tuple[Optional[bool], str]:
    """
    Returns (True/False/None, evidence_text).
    None means undecidable from format; evidence carries raw text.
    """
    text = _strip_code_fences(raw)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    first_line = lines[0] if lines else text
    m = _FIRST_TOKEN_RE.match(first_line)
    if m:
        is_yes = (m.group(1).lower() == "yes")
        after_first = first_line[m.end():].strip()
        rest = "\n".join(lines[1:]).strip()
        evidence_source = (after_first + ("\n" + rest if rest else "")).strip()
        return is_yes, _evidence_from(evidence_source)

    # Optional: accept accidental JSON if present
    rescued = _json_rescue(text)
    if rescued:
        return rescued[0], rescued[1]

    return None, text.strip() or "Empty model response."

# ---- Main evaluator using NLI as fallback & constructing JSON ----
def evaluate_semantic_trigger(transcript: str, criteria_text: str) -> Tuple[bool, Optional[float], Optional[str]]:
    """
    Returns:
        matched (bool)
        score   (None)
        reasoning (str)
    Also constructs a result_json internally for logging/persistence:
        {"matched": bool, "reasoning": str, "source": "llm-first-token|nli-output|nli-premise|undecidable"}
    """
    prompt = _build_prompt(transcript, criteria_text)

    try:
        payload = {"model": DEFAULT_MODEL, "prompt": prompt, "stream": False}
        logger.info(f"[OLLAMA] Evaluating trigger with model={DEFAULT_MODEL} …")
        resp = requests.post(OLLAMA_URL, json=payload, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()

        out = (resp.json().get("response") or "").strip()
        if not out:
            raise ValueError("Empty response from LLM")

        # 1) Strict parse from LLM output
        decision, evidence = _parse_yes_no_and_evidence(out)
        if decision is not None:
            result_json = {"matched": bool(decision), "reasoning": evidence, "source": "llm-first-token"}
            logger.debug(f"[EVAL] Result JSON: {result_json}")
            return bool(decision), None, evidence

        # 2) NLI on the LLM output (often enough)
        nli_label = nli_yes_no(out, threshold=0.60)
        if nli_label in ("yes", "no"):
            matched = (nli_label == "yes")
            reasoning = f"NLI inferred {nli_label.upper()} from model response: {out}"
            result_json = {"matched": matched, "reasoning": reasoning, "source": "nli-output"}
            logger.debug(f"[EVAL] Result JSON: {result_json}")
            return matched, None, reasoning

        # 3) NLI on a compact premise built from transcript+criterion
        compact_premise = f"Transcript: { _truncate(transcript, 2000) } || Criterion: { _truncate(criteria_text, 400) }"
        nli_label2 = nli_yes_no(compact_premise, threshold=0.60)
        if nli_label2 in ("yes", "no"):
            matched = (nli_label2 == "yes")
            reasoning = f"NLI inferred {nli_label2.upper()} from transcript+criterion."
            result_json = {"matched": matched, "reasoning": reasoning, "source": "nli-premise"}
            logger.debug(f"[EVAL] Result JSON: {result_json}")
            return matched, None, reasoning

        # 4) Undecidable
        reasoning = f"Undecidable from model response: {out}"
        result_json = {"matched": False, "reasoning": reasoning, "source": "undecidable"}
        logger.warning(f"[EVAL] Result JSON: {result_json}")
        return False, None, reasoning

    except requests.RequestException as e:
        msg = f"LLM request failed: {e}"
        logger.error(f"[OLLAMA] {msg}")
        result_json = {"matched": False, "reasoning": msg, "source": "request-exception"}
        logger.debug(f"[EVAL] Result JSON: {result_json}")
        return False, None, msg

    except Exception as e:
        msg = f"Internal error during semantic evaluation: {e}"
        logger.exception(f"[EVAL] {msg}")
        result_json = {"matched": False, "reasoning": msg, "source": "internal-exception"}
        logger.debug(f"[EVAL] Result JSON: {result_json}")
        return False, None, msg


def build_short_speaker_summary_prompt(speaker: str, transcript: str) -> str:
    """
    Returns a minimalistic prompt to summarize a single speaker's content.
    """
    return f"""
You are analyzing the speech of {speaker} from a customer service call.

Summarize the key points this speaker made in 1-2 sentences. 
Focus only on what this speaker said — no need to summarize others.

Transcript:
\"\"\"
{transcript}
\"\"\"
"""
def query_ollama(prompt: str, model: str = DEFAULT_MODEL) -> str:
    """
    Sends a prompt to the Ollama LLM and returns the generated response.
    """
    try:
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }

        logger.info(f"[OLLAMA] Sending prompt to {model}: {prompt[:50]}...")

        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        data = response.json()

        return data.get("response", "").strip()

    except requests.RequestException as e:
        logger.error(f"[OLLAMA] Request failed: {e}")
        return "LLM request failed."

    except Exception as e:
        logger.exception(f"[OLLAMA] Unexpected error: {e}")
        return "Internal error during LLM call."
def build_short_summary_prompt(transcript: str) -> str:
    """
    Builds a minimal prompt asking for a concise summary.
    """
    return f"""
Summarise the following customer service call in 1-2 sentences.
Only include the core issue, the agent's response, and the outcome.

Transcript:
\"\"\"
{transcript}
\"\"\"
"""

def summarise_with_callAI(call_id: str) -> str:
    """
    Retrieves the call transcript by ID and returns a short summary using Ollama.
    """
    transcript = get_full_transcription(call_id)
    if not transcript or len(transcript.strip()) < 10:
        logger.warning(f"[CALLAI] Transcript too short or empty for call_id: {call_id}")
        return "Transcript not available or too short to summarize."

    prompt = build_short_summary_prompt(transcript)
    summary = query_ollama(prompt=prompt)
    return summary


def summarise_each_speaker(call_id: str) -> dict[str, str]:
    """
    Generates a concise summary for each speaker in the call using Ollama.
    """
    speaker_map = get_speaker_transcript_by_call(call_id)
    if "error" in speaker_map:
        return speaker_map  # propagate error

    summary_map = {}

    for speaker, transcript in speaker_map.items():
        if not transcript.strip():
            summary_map[speaker] = "(No valid content.)"
            continue

        prompt = build_short_speaker_summary_prompt(speaker, transcript)
        summary = query_ollama(prompt=prompt)
        summary_map[speaker] = summary

    return summary_map



# Optional: test runner
if __name__ == "__main__":
    call_id = "736dfd67-309a-488e-8a59-c9adeb3acbf7"
    result = get_full_transcription(call_id)
    eval_result = evaluate_semantic_trigger(result, "Did this end amicably?")
    print(eval_result)
