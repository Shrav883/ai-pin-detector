# app.py
# Main Flask server. Exposes a /classify endpoint the extension calls.

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from classifier import classify_with_claude
from fallback import fallback_classify
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow the Chrome extension to call this server

@app.route("/health", methods=["GET"])
def health():
    """Simple health check so you can confirm the server is running."""
    return jsonify({"status": "ok"})

@app.route("/classify", methods=["POST"])
def classify():
    """
    Receives pin data from the Chrome extension.
    Tries Claude first, falls back to keyword rules if Claude fails.
    """
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field in request body"}), 400

    pin_text = data["text"]

    # Don't bother classifying empty pins
    if not pin_text.strip():
        return jsonify({"label": "likely_human", "confidence": 0.5,
                        "reason": "No text to analyze.", "source": "skip"})

    try:
        result = classify_with_claude(pin_text)
    except Exception as e:
        print(f"Claude API error: {e} — using fallback")
        result = fallback_classify(pin_text)

    return jsonify(result)

if __name__ == "__main__":
    app.run(port=5000, debug=True)