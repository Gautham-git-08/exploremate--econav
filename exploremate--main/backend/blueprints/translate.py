"""
ExploreMate Translate Blueprint
3-tier failover translation pipeline:
1. Google Cloud Translation v2 (if key provided)
2. Gemini Flash (temp 0.2, concise prompt)
3. MyMemory free endpoint (split long text, decode HTML)
With circuit breakers and in-memory caching.
"""

from flask import Blueprint, jsonify, request
import requests
import html
import time
from config import GOOGLE_TRANSLATE_KEY, GEMINI_API_KEY, GEMINI_MODEL

translate_bp = Blueprint("translate", __name__)

_TRANS_CACHE = {}
_CIRCUIT_BREAKER = {
    "google": 0,
    "gemini": 0,
    "mymemory": 0
}
COOLDOWN_SEC = 60

def is_available(provider):
    return time.time() > _CIRCUIT_BREAKER.get(provider, 0)

def record_failure(provider):
    _CIRCUIT_BREAKER[provider] = time.time() + COOLDOWN_SEC

def call_google_translate(text, source_lang, target_lang):
    if not GOOGLE_TRANSLATE_KEY or not is_available("google"):
        return None
    url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_TRANSLATE_KEY}"
    payload = {
        "q": text,
        "target": target_lang,
        "format": "text"
    }
    if source_lang and source_lang != "auto":
        payload["source"] = source_lang
    try:
        res = requests.post(url, json=payload, timeout=8)
        if res.status_code == 200:
            data = res.json()
            translations = data.get("data", {}).get("translations", [])
            if translations:
                t = html.unescape(translations[0].get("translatedText", ""))
                detected = translations[0].get("detectedSourceLanguage", source_lang)
                return {"translation": t, "detected": detected, "provider": "Google Cloud"}
        record_failure("google")
    except Exception:
        record_failure("google")
    return None

def call_gemini_translate(text, source_lang, target_lang):
    if not GEMINI_API_KEY or not is_available("gemini"):
        return None
    src = source_lang if (source_lang and source_lang != "auto") else "the detected language"
    prompt = (
        f"Translate from {src} to {target_lang}. "
        "Return ONLY the translation, no quotes or explanation. "
        "Keep place names and numbers unchanged.\n"
        f"Text: {text}"
    )

    # 1. Direct REST call to Gemini endpoint
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 400}
        }
        res = requests.post(url, json=payload, timeout=30)
        if res.status_code == 200:
            data = res.json()
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            for p in parts:
                if "text" in p and not p.get("thought", False):
                    return {"translation": p["text"].strip(), "detected": source_lang, "provider": "Gemini AI"}
            if parts and "text" in parts[-1]:
                return {"translation": parts[-1]["text"].strip(), "detected": source_lang, "provider": "Gemini AI"}
    except Exception:
        pass

    # 2. Fallback to google.genai SDK
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        if response and response.text:
            return {"translation": response.text.strip(), "detected": source_lang, "provider": "Gemini AI"}
        record_failure("gemini")
    except Exception:
        record_failure("gemini")
    return None

def call_mymemory_translate(text, source_lang, target_lang):
    if not is_available("mymemory"):
        return None
    src = "en" if (not source_lang or source_lang == "auto") else source_lang
    # MyMemory chunks text <= 450 chars
    chunks = [text[i:i+400] for i in range(0, len(text), 400)]
    translated_chunks = []
    try:
        for chunk in chunks:
            url = f"https://api.mymemory.translated.net/get?q={requests.utils.quote(chunk)}&langpair={src}|{target_lang}"
            res = requests.get(url, timeout=8)
            if res.status_code == 200:
                data = res.json()
                t = html.unescape(data.get("responseData", {}).get("translatedText", ""))
                translated_chunks.append(t)
            else:
                record_failure("mymemory")
                return None
        return {"translation": " ".join(translated_chunks), "detected": src, "provider": "MyMemory"}
    except Exception:
        record_failure("mymemory")
    return None

@translate_bp.route("", methods=["POST"])
def translate():
    """Execute 3-tier translation with circuit breaker and caching."""
    data = request.get_json() or {}
    text = data.get("text", "").strip()
    source_lang = data.get("from") or data.get("sourceLang") or "auto"
    target_lang = data.get("to") or data.get("targetLang") or "en"
    
    if not text:
        return jsonify({"error": "Empty text provided"}), 400
        
    cache_key = f"{source_lang}|{target_lang}|{text}"
    if cache_key in _TRANS_CACHE:
        return jsonify(_TRANS_CACHE[cache_key])
        
    # Tier 1: Google Cloud Translate
    result = call_google_translate(text, source_lang, target_lang)
    
    # Tier 2: Gemini Flash
    if not result:
        result = call_gemini_translate(text, source_lang, target_lang)
        
    # Tier 3: MyMemory
    if not result:
        result = call_mymemory_translate(text, source_lang, target_lang)
        
    if result:
        _TRANS_CACHE[cache_key] = result
        return jsonify(result)
        
    return jsonify({
        "error": "All translation providers are currently unavailable or timed out.",
        "fallback": text
    }), 503
