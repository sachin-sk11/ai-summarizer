// options.js (fixed)
document.addEventListener("DOMContentLoaded", () => {
  const KEY = "geminiAPI_key";

  // load saved key
  chrome.storage.sync.get([KEY], (result) => {
    // result is an object like { geminiAPI_key: "the-value" }
    if (result && result[KEY]) {
      document.getElementById("api-key").value = result[KEY];
    }
  });

  // save handler
  document.getElementById("save-button").addEventListener("click", () => {
    const apiKey = document.getElementById("api-key").value.trim();
    if (!apiKey) return;

    const payload = {};
    payload[KEY] = apiKey;

    chrome.storage.sync.set(payload, () => {
      if (chrome.runtime.lastError) {
        console.error("Storage set error:", chrome.runtime.lastError);
      }
      document.getElementById("success-message").style.display = "block";
      setTimeout(() => window.close(), 1000);
    });
  });
});
