// background.js
// Service worker that relays messages from content.js to the Python backend.
// Content scripts can't always make cross-origin requests directly,
// so we route them through the background worker.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CLASSIFY_PIN") {
    
    fetch("http://localhost:5000/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message.text })
    })
      .then(res => res.json())
      .then(data => sendResponse({ success: true, result: data }))
      .catch(err => sendResponse({ success: false, error: err.message }));

    // Return true to keep the message channel open for async response
    return true;
  }
});