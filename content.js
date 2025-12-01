// content.js - Content script that runs on web pages to extract article text

/**
 * Function to extract text content from the current web page
 * Tries multiple strategies to find the main content
 * @returns {string} - The extracted text content
 */
function getArticleText() {
    let text = '';

    // Strategy 1: Try to find an <article> tag (most semantic)
    const article = document.querySelector("article");
    if (article && article.innerText.trim().length > 100) {
        console.log("Found article tag");
        return article.innerText.trim();
    }

    // Strategy 2: Try common article container classes/IDs
    const commonSelectors = [
        'main',
        '[role="main"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content',
        '#content',
        '.article-body',
        '.story-body'
    ];

    for (const selector of commonSelectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim().length > 100) {
            console.log(`Found content using selector: ${selector}`);
            return element.innerText.trim();
        }
    }

    // Strategy 3: Gather all paragraph elements
    const paragraphs = Array.from(document.querySelectorAll("p"));
    if (paragraphs.length > 0) {
        text = paragraphs
            .map((p) => p.innerText.trim())
            .filter(t => t.length > 0)
            .join("\n\n");
        
        if (text.length > 100) {
            console.log("Found content from paragraphs");
            return text;
        }
    }

    // Strategy 4: Get all visible text from body (last resort)
    const bodyText = document.body.innerText.trim();
    if (bodyText.length > 100) {
        console.log("Using body text as fallback");
        return bodyText;
    }

    console.log("Could not find sufficient text content");
    return text || "No readable content found on this page.";
}

/**
 * Listen for messages from the popup script
 * Handles requests to extract article text from the current page
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request);
    
    // Handle request for article text
    if (request.type === "GET_ARTICLE_TEXT") {
        try {
            const text = getArticleText();
            console.log(`Extracted text length: ${text.length} characters`);
            
            // Send the extracted text back to popup
            sendResponse({ 
                text: text,
                success: true 
            });
        } catch (error) {
            console.error("Error extracting text:", error);
            sendResponse({ 
                text: "", 
                success: false,
                error: error.message 
            });
        }
    }
    
    // CRITICAL: Return true to indicate we will send response asynchronously
    // This prevents the message channel from closing before sendResponse is called
    return true;
});