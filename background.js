chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(["geminiAPI_key"], (result) => {
        if (!result.geminiAPI_key) {
            chrome.tabs.create({ url: "options.html" });
        }
    });
});
