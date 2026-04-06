// content.js
// Runs on Pinterest pages. Finds Pin cards, extracts text,
// sends to backend, and applies blur/label/hide based on result.
// console.log("AI Pin Detector: content script loaded");

const classifiedPins = new Set(); // track pins we've already processed

// Read current settings from Chrome storage
function getSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(["enabled", "mode"], data => {
      resolve({
        enabled: data.enabled !== false,
        mode: data.mode || "blur"
      });
    });
  });
}

// Extract useful text from a Pin element
function extractPinText(pin) {
  const texts = [];

  // These are Pinterest UI strings we want to ignore
  const noise = new Set([
    "pin card", "pin page", "more actions", "save", "send",
    "pinwrapper", "pin-missing-alt-text", "pin-with-alt-text",
    "sponsored", "select a board to save to"
  ]);

  // Check for Pinterest's own AI label in aria-labels
  pin.querySelectorAll("[aria-label]").forEach(el => {
    const label = el.getAttribute("aria-label")?.toLowerCase() || "";
    if (label.includes("ai") || label.includes("generated") || label.includes("created with") || label.includes("AI Modified") ) {
      texts.push(el.getAttribute("aria-label"));
    }
  });

  // Alt text from images — this is the most useful signal
  pin.querySelectorAll("img").forEach(img => {
    if (img.alt && img.alt.trim().length > 3) {
      texts.push(img.alt.trim());
    }
  });

  // Visible text — skip anything that looks like a UI label
  pin.querySelectorAll("div, span, p, h1, h2, h3").forEach(el => {
    // Only get direct text, not nested children's text
    const t = el.innerText?.trim();
    if (!t || t.length < 4 || t.length > 300) return;
    if (noise.has(t.toLowerCase())) return;
    if (t.includes("|")) return; // skip concatenated UI strings
    texts.push(t);
  });

  return [...new Set(texts)].join(" | ").slice(0, 600);
}

// Apply visual treatment to a flagged pin
function applyTreatment(pin, result, mode) {
  // Wrap in a relative container so label can be positioned
  if (!pin.parentElement.classList.contains("ai-pin-wrapper")) {
    const wrapper = document.createElement("div");
    wrapper.className = "ai-pin-wrapper";
    pin.parentNode.insertBefore(wrapper, pin);
    wrapper.appendChild(pin);
  }

  const wrapper = pin.parentElement;

  if (mode === "blur") {
    pin.classList.add("ai-pin-blurred");
  } else if (mode === "hide") {
    wrapper.style.display = "none";
  }

  // Always add a label in blur or label mode
  if (mode === "blur" || mode === "label") {
    const label = document.createElement("div");
    label.className = "ai-pin-label";
    label.textContent = `AI ${Math.round(result.confidence * 100)}%`;
    label.title = result.reason;
    wrapper.appendChild(label);
  }
}

// Classify a single pin
async function classifyPin(pin) {
  const text = extractPinText(pin);
  if (!text) return;

  const key = text.slice(0, 100);
  if (classifiedPins.has(key)) return;
  classifiedPins.add(key);

  console.log(`AI Pin Detector: classifying pin with text: "${text.slice(0, 80)}"`);

  chrome.runtime.sendMessage(
    { type: "CLASSIFY_PIN", text },
    (response) => {
      console.log("AI Pin Detector: response:", response);
      if (!response?.success) return;
      const result = response.result;
      if (result.label?.includes("ai_generated") && result.confidence > 0.6) {
        applyTreatment(pin, result, settings.mode);
      }
    }
  );
}

let settings = { enabled: true, mode: "blur" };

// Load settings once upfront instead of per-pin
getSettings().then(s => { settings = s; });

// Process pins in parallel instead of one at a time
function processPins() {
  const pins = document.querySelectorAll('[data-test-id="pin"]');
  console.log(`AI Pin Detector: found ${pins.length} pins`);
  pins.forEach(pin => classifyPin(pin));
}

const observer = new MutationObserver(() => processPins());
observer.observe(document.body, { childList: true, subtree: true });
processPins();
