# AI Pin Detector — Pinterest

A Chrome extension that detects likely AI-generated Pins on Pinterest and blurs, hides, or labels them in real time.

Built with a Chrome extension (Manifest V3), a local Python Flask backend, and the Claude API for classification.

---

## How It Works

```
Pinterest Page → Chrome Extension → Python Backend → Claude API
     (you browse)    (reads the DOM)    (classifies it)    (AI verdict)
          ↑                                    |
          └────────────────────────────────────┘
                   blur / label / hide
```

1. The extension runs inside your browser while you browse Pinterest
2. It finds Pin cards on the page and extracts visible text and metadata
3. That text is sent to a local Python server
4. The server calls the Claude API to classify whether the Pin is likely AI-generated
5. The extension then blurs, labels, or hides flagged Pins based on your settings

---

## Features

- Detects AI-generated Pins based on extracted text and metadata
- Three display modes: **blur**, **label only**, or **hide**
- Handles Pinterest's infinite scroll using `MutationObserver`
- Avoids re-classifying the same Pin more than once
- Falls back to keyword-based detection if the Claude API is unavailable
- Toggle detection on/off from the extension popup
- Works on all Pinterest regional domains (e.g. `in.pinterest.com`)

---

## Project Structure

```
ai-pin-detector/
│
├── extension/
│   ├── manifest.json       # Chrome extension config and permissions
│   ├── content.js          # Runs on Pinterest, finds and extracts Pin data
│   ├── background.js       # Service worker, relays requests to Python backend
│   ├── popup.html          # Toggle UI (blur / label / hide mode)
│   ├── popup.js            # Handles popup settings, saves to chrome.storage
│   └── styles.css          # Blur and label visual styles
│
├── backend/
│   ├── app.py              # Flask server with /classify endpoint
│   ├── classifier.py       # Calls Claude API, returns label + confidence + reason
│   ├── fallback.py         # Keyword-based classifier used when Claude is unavailable
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Template for environment variables (safe to commit)
│   └── .env                # Your real API key — never commit this
│
└── .gitignore
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Chrome Extension | Manifest V3, JavaScript |
| Backend | Python, Flask, Flask-CORS |
| AI Classification | Claude API (`claude-haiku-4-5`) |
| Environment | python-dotenv |

---

## Setup

### Prerequisites

- Python 3.9 or higher
- Google Chrome
- An Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

---

### 1. Clone the repository

```bash
git clone https://github.com/Shrav883/ai-pin-detector.git
cd ai-pin-detector
```

---

### 2. Set up the Python backend

```bash
cd backend
python -m venv venv

# Mac/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

---

### 3. Add your API key

Copy the example env file and add your real key:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

### 4. Start the backend server

```bash
python app.py
```

You should see:

```
Running on http://127.0.0.1:5000
```

---

### 5. Load the Chrome extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder

The AI Pin Detector icon will appear in your Chrome toolbar.

---

### 6. Test it

Go to [pinterest.com](https://pinterest.com) and search for something like `midjourney art` or `AI digital art`. Pins flagged as likely AI-generated will be blurred automatically.

Click the extension icon in your toolbar to switch between blur, label, and hide modes.

---

## API Response Format

The `/classify` endpoint returns:

```json
{
  "label": "likely_ai_generated",
  "confidence": 0.95,
  "reason": "Pin text explicitly references Midjourney and AI-generated artwork.",
  "source": "claude"
}
```

| Field | Values |
|---|---|
| `label` | `likely_ai_generated` or `likely_human` |
| `confidence` | Float between 0.0 and 1.0 |
| `reason` | Short explanation from Claude |
| `source` | `claude` or `fallback` |

---

## How the Extension Handles Pinterest's Dynamic Loading

Pinterest loads new Pins as you scroll without refreshing the page. The extension uses a `MutationObserver` to watch for new DOM elements being added and classifies them automatically. Already-classified Pins are tracked in a `Set` to prevent duplicate API calls.

---

## Fallback Classifier

If the Claude API is unavailable, the backend falls back to a keyword-based classifier that checks for terms like:

`midjourney`, `stable diffusion`, `dall-e`, `ai generated`, `ai art`, `adobe firefly`, `#aiart`, `prompt:`

Fallback responses include `"source": "fallback"` in the response so you can tell the difference.

---

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

---

## Future Improvements

- Add image analysis using Claude's vision API for better accuracy
- Persist classification results across page loads using a local database
- Batch API calls to reduce latency
- Add a confidence threshold slider in the popup
- Show a count of flagged Pins in the popup

---

## Important Note

This extension reads the Pinterest page you are already viewing in your browser. It does not scrape Pinterest's servers independently. Your API key is stored only in the local `.env` file and is never exposed to the browser or committed to version control.
