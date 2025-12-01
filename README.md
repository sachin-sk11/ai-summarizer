AI Summarizer – Chrome Extension

A simple Chrome extension that extracts article text from any webpage and produces summaries using the Google Gemini API. Supports brief, detailed, and bulleted summaries.

Features

Extracts readable article text from most websites

Generates summaries using the Gemini API

Supports three summary modes: brief, detailed, bullets

Uses a clean popup interface with loading indicator

Copies the generated summary with one click

Stores the API key securely using Chrome storage.sync

Works even on dynamically loaded pages using script injection fallback

Uses the stable model models/gemini-2.5-flash

Installation (Developer Mode)

Clone or download the repository:

git clone https://github.com/sachin-sk11/AI-summarize-chrome-extension.git


Open Chrome and navigate to:

chrome://extensions/


Enable Developer Mode

Click Load unpacked

Select the project folder

The extension will now appear in your browser toolbar

Setting Up the API Key

Open Google AI Studio and create an API key:
https://makersuite.google.com/app/apikey

Open the extension popup → click Options

Enter your Gemini API key

Click Save Settings

The key is saved securely via chrome.storage.sync.

How It Works
1. Popup

User selects summary type and clicks "Summarize"

A loading animation is shown

2. Content Script

Extracts readable text from:

<article> elements

Paragraphs

Page metadata

Or via injected script if the page blocks extension scripts

3. Gemini API

The extracted content is sent to:

https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent

4. Result

The extension displays a generated text summary based on the chosen summary mode.

Project Structure
AI-summarizer-extension/
│
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
├── options.html
├── options.js
├── image.png
└── README.md

Manifest Permissions

activeTab – needed to access the content of the active page

scripting – used to inject the content script when required

storage – stores the API key

host_permissions: ["<all_urls>"] – allows text extraction on any site

Troubleshooting
API key not valid

Generate a new key and update it in the Options page.

Could not extract text

Some websites restrict content scripts. Refresh the page and try again.

“Could not establish connection”

Occurs when the content script has not loaded. Reload the page.

Model not found

If you see models/gemini-1.5-flash not found, update to:

models/gemini-2.5-flash
