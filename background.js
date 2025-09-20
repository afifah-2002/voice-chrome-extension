// Background script for handling extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
    console.log('Voice Assistant Extension installed');
});

// Handle messages between different parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle background processing if needed
});