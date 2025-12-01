// popup.js - Main logic for the extension popup interface

// Event listener for the summarize button
document.getElementById("summerize").addEventListener('click', async () => {
    const resultDiv = document.getElementById("result");
    // Show loading spinner while processing
    resultDiv.innerHTML = `<div class="loading"><div class="loader"></div></div>`;

    // Get selected summary type from dropdown
    const summaryType = document.getElementById("summary-type").value;

    // Retrieve API key from Chrome storage
    chrome.storage.sync.get(["geminiAPI_key"], async (storageResult) => {
        // Check if API key exists in storage
        if (!storageResult.geminiAPI_key) {
            resultDiv.innerHTML = "API key not found. Please set your API key in the extension options";
            return;
        }

        try {
            // Query the currently active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we can access this tab (some pages like chrome:// are restricted)
            if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
                resultDiv.innerText = "Cannot access this page. Chrome extension pages and browser internal pages are restricted.";
                return;
            }

            // Inject content script if not already injected (for dynamically loaded pages)
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                // Wait a bit for script to initialize
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (injectionError) {
                // Script might already be injected, continue anyway
                console.log("Script injection note:", injectionError.message);
            }

            // Send message to content script to extract article text
            chrome.tabs.sendMessage(
                tab.id,
                { type: "GET_ARTICLE_TEXT" },
                async (response) => {
                    // Check for Chrome runtime errors
                    if (chrome.runtime.lastError) {
                        console.error("Runtime error:", chrome.runtime.lastError);
                        resultDiv.innerText = `Error: ${chrome.runtime.lastError.message}. Try refreshing the page.`;
                        return;
                    }

                    // Check if we received valid text from the page
                    if (!response || !response.text || response.text.trim().length === 0) {
                        resultDiv.innerText = "Could not extract article text from this page. The page might not contain readable content or may be restricted.";
                        return;
                    }

                    try {
                        // Call Gemini API to generate summary
                        const summary = await getGeminiSummary(
                            response.text,
                            summaryType,
                            storageResult.geminiAPI_key
                        );
                        // Display the generated summary
                        resultDiv.innerText = summary;
                    } catch (error) {
                        // Display error message if summary generation fails
                        resultDiv.innerText = `Error: ${error.message || "Failed to generate summary"}`;
                    }
                }
            );
        } catch (error) {
            resultDiv.innerText = `Error: ${error.message}`;
            console.error("Error in summarize process:", error);
        }
    });
});

// Event listener for the copy button
document.getElementById("copy-btn").addEventListener("click", () => {
    const summaryText = document.getElementById("result").innerText;

    // Only copy if there's actual content to copy
    if (summaryText && summaryText.trim() !== "" && !summaryText.includes("Select a type")) {
        navigator.clipboard
            .writeText(summaryText)
            .then(() => {
                const copybtn = document.getElementById("copy-btn");
                const originalText = copybtn.innerText;

                // Show "Copied!" feedback for 2 seconds
                copybtn.innerText = "Copied!";
                setTimeout(() => {
                    copybtn.innerText = originalText;
                }, 2000);
            })
            .catch((err) => {
                console.error("Failed to copy text:", err);
            });
    }
});

/**
 * Function to call Gemini API and generate summary
 * @param {string} text - The article text to summarize
 * @param {string} summaryType - Type of summary (brief, detailed, bullets)
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string>} - The generated summary
 */
async function getGeminiSummary(text, summaryType, apiKey) {
    // Limit text length to prevent API overload
    const maxLength = 20000;
    const truncatedText = text.length > maxLength 
        ? text.substring(0, maxLength) + "..." 
        : text;

    // Create appropriate prompt based on summary type
    let prompt;
    switch (summaryType) {
        case "brief":
            prompt = `Provide a brief summary of the following article in 2-3 sentences:\n\n${truncatedText}`;
            break;
        case "detailed":
            prompt = `Provide a detailed summary of the following article, covering all main points and key details:\n\n${truncatedText}`;
            break;
        case "bullets":
            prompt = `Summarize the following article in 5-7 key points. Format each point as a line starting with "- " (dash followed by a space). Do not use asterisks or other bullet symbols, only use the dash. Keep each point concise and focused on a single key insight from the article:\n\n${truncatedText}`;
            break;
        default:
            prompt = `Summarize the following article:\n\n${truncatedText}`;
    }

    try {
        // Make API request to Gemini
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.2, // Lower temperature for more consistent summaries
                    },
                }),
            }
        );

        // Check if API request was successful
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error?.message || "API request failed");
        }

        // Parse and return the summary from API response
        const data = await res.json();
        return (
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No summary available."
        );
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate summary. Please try again later.");
    }
}