"""
ExploreMate Chat Blueprint
Gemini Flash proxy route with Pondicherry strict grounding and structured action support.
"""

from flask import Blueprint, jsonify, request
import json
import re
from config import GEMINI_API_KEY, GEMINI_MODEL, BRAND_NAME, CONTACT_PHONE, SAFETY_NUMBERS, DATA_DIR

chat_bp = Blueprint("chat", __name__)

SYSTEM_PROMPT = f"""You are ExploreMate, a friendly, knowledgeable eco-friendly travel guide for Pondicherry / Puducherry.
Give accurate, practical, concise answers about destinations, local culture, food, transport options, low-carbon travel, itineraries, and safety in Pondicherry.
If you are not sure about a fact (such as specific opening hours or prices), say so instead of inventing it.
Never invent places. Keep answers under 150 words unless asked for more. Reply in the user's selected language.

If the user wants to add, remove, or modify a stop in their plan, you may append a structured action JSON block at the very end of your response inside triple backticks:
```action
{{"action": "add_stop" | "remove_stop" | "extend_time", "placeId": "...", "durationMinutes": 30}}
```
"""

def extract_action(text):
    match = re.search(r"```action\s*(\{.*?\})\s*```", text, re.DOTALL)
    if not match:
        return text, None
    clean_text = re.sub(r"```action\s*\{.*?\}\s*```", "", text, flags=re.DOTALL).strip()
    try:
        action_json = json.loads(match.group(1))
        return clean_text, action_json
    except Exception:
        # If action JSON fails to parse, return plain text anyway without crashing
        return text, None

@chat_bp.route("", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400
        
    itinerary = data.get("itinerary", [])
    weather = data.get("weather", {})
    budget = data.get("budget", {})
    expenses = data.get("expenses", [])
    open_lf_count = data.get("openLostFoundCount", 0)
    
    # Check for non-Pondicherry queries
    lower_msg = message.lower()
    non_pondy_places = ["goa", "paris", "mumbai", "delhi", "bangalore", "chennai", "kerala", "bali", "jaipur"]
    for place in non_pondy_places:
        if re.search(rf"\b{place}\b", lower_msg) and not re.search(r"\b(pondicherry|puducherry|pondy)\b", lower_msg):
            return jsonify({
                "reply": f"{place.capitalize()} will be developed in the future. ExploreMate currently supports Pondicherry only.",
                "action": None
            })
            
    if not GEMINI_API_KEY:
        # Graceful fallback response when API key is not configured
        fallback_reply = (
            "Welcome to ExploreMate Pondicherry! "
            "Sri Aurobindo Ashram, Promenade Beach, and White Town are peaceful places to explore. "
            "(Note: Add your GEMINI_API_KEY in backend/.env to enable live AI responses)."
        )
        return jsonify({"reply": fallback_reply, "action": None})
        
    try:
        context_payload = {
            "current_itinerary": itinerary,
            "live_weather": weather,
            "budget_summary": budget,
            "open_lost_found_count": open_lf_count
        }
        
        prompt = (
            f"Context Data:\n{json.dumps(context_payload, indent=2)}\n\n"
            f"User Question: {message}"
        )

        raw_text = None

        # Direct REST call to Gemini endpoint (fast and resilient)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 800}
        }
        try:
            import requests as req
            resp = req.post(url, json=payload, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                for p in parts:
                    if "text" in p and not p.get("thought", False):
                        raw_text = p["text"]
                        break
                if not raw_text and parts:
                    raw_text = parts[-1].get("text")
        except Exception:
            pass

        # Fallback to google.genai SDK
        if not raw_text:
            try:
                from google import genai
                client = genai.Client(api_key=GEMINI_API_KEY)
                response = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=[SYSTEM_PROMPT, prompt]
                )
                raw_text = response.text if response and response.text else None
            except Exception:
                pass

        if not raw_text:
            raw_text = "I don't have verified data on that right now. Feel free to explore the Plan and Destinations tabs."

        clean_text, action = extract_action(raw_text)
        return jsonify({"reply": clean_text, "action": action})
        
    except Exception as e:
        return jsonify({
            "reply": "I'm having trouble connecting to the AI assistant right now. You can check the curated Plan and Destinations tabs.",
            "error": str(e),
            "action": None
        }), 200
