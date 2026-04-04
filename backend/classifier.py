# classifier.py
import os
import anthropic
import json

def classify_with_claude(pin_text):
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    prompt = f"""You are classifying Pinterest pins. Analyze the text below and decide if this pin is likely AI-generated content.

Pin text:
\"\"\"{pin_text}\"\"\"

Respond ONLY with a JSON object in this exact format, no extra text, no markdown, no backticks:
{{"label": "likely_ai_generated", "confidence": 0.9, "reason": "your reason here"}}"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    
    # Print exactly what Claude returned so we can debug
    print(f"Claude raw response: '{raw}'")

    # Strip markdown code fences if Claude added them anyway
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    result = json.loads(raw)
    result["source"] = "claude"
    return result