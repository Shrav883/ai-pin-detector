// popup.js
// Handles the toggle UI. Saves settings to Chrome storage
// so content.js can read them.

const enabledCheckbox = document.getElementById("enabled");
const modeSelect = document.getElementById("mode");
const statusEl = document.getElementById("status");

// Load saved settings when popup opens
chrome.storage.sync.get(["enabled", "mode"], (data) => {
  enabledCheckbox.checked = data.enabled !== false; // default true
  modeSelect.value = data.mode || "blur";
  statusEl.textContent = enabledCheckbox.checked ? "Detection active." : "Detection paused.";
});

// Save when user changes the checkbox
enabledCheckbox.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabledCheckbox.checked });
  statusEl.textContent = enabledCheckbox.checked ? "Detection active." : "Detection paused.";
});

// Save when user changes the mode
modeSelect.addEventListener("change", () => {
  chrome.storage.sync.set({ mode: modeSelect.value });
});