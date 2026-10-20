"""
ExploreMate Flask Application
Main backend entrypoint registering all core and feature blueprints with CORS and Limiter.
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import BRAND_NAME
from blueprints.core import core_bp
from blueprints.budget import budget_bp
from blueprints.lostfound import lostfound_bp
from blueprints.translate import translate_bp
from blueprints.chat import chat_bp
from blueprints.chapters import chapters_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["500 per day", "120 per hour"],
    storage_uri="memory://"
)

# Register Blueprints
app.register_blueprint(core_bp, url_prefix="/api")
app.register_blueprint(budget_bp, url_prefix="/api/budget")
app.register_blueprint(lostfound_bp, url_prefix="/api/lostfound")
app.register_blueprint(translate_bp, url_prefix="/api/translate")
app.register_blueprint(chat_bp, url_prefix="/api/chat")
app.register_blueprint(chapters_bp, url_prefix="/api/chapters")

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "app": BRAND_NAME,
        "scope": "Pondicherry / Puducherry"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
