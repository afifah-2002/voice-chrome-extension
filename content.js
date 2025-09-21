// Content Script - The Page Explorer and Learner
console.log('🔍 Learning Voice Assistant - Content Script Loaded on:', window.location.href);

// Page state and learning
let pageAnalysis = null;
let voiceSession = null;
let isLearning = false;
let recognition = null;

// Initialize content script
(async function initializeContentScript() {
    try {
        console.log('🚀 Initializing content script...');
        
        // Wait for page to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startInitialization);
        } else {
            await startInitialization();
        }
        
    } catch (error) {
        console.error('❌ Content script initialization failed:', error);
    }
})();

async function startInitialization() {
    try {
        // Analyze the current page
        pageAnalysis = await analyzePageStructure();
        
        // Set up message handling
        setupMessageHandling();
        
        // Initialize voice recognition
        await initializeVoiceRecognition();
        
        console.log('✅ Content script initialized successfully');
        
    } catch (error) {
        console.error('Error in content script initialization:', error);
    }
}

// Page structure analysis - the learning brain
async function analyzePageStructure() {
    console.log('🧠 Analyzing page structure...');
    
    const analysis = {
        url: window.location.href,
        domain: window.location.hostname,
        title: document.title,
        forms: findForms(),
        links: findLinks(),
        buttons: findButtons(),
        inputs: findInputs(),
        headings: findHeadings(),
        images: findImages(),
        text: extractMainText(),
        interactive: findInteractiveElements(),
        timestamp: Date.now()
    };
    
    console.log('📊 Page analysis complete:', analysis);
    return analysis;
}

// Find all forms on the page
function findForms() {
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.map(form => ({
        id: form.id || null,
        action: form.action || null,
        method: form.method || 'GET',
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
            type: input.type || input.tagName.toLowerCase(),
            name: input.name || null,
            id: input.id || null,
            placeholder: input.placeholder || null,
            required: input.required || false,
            label: findInputLabel(input)
        }))
    }));
}

// Find all links on the page
function findLinks() {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links.slice(0, 50).map(link => ({
        href: link.href,
        text: link.textContent?.trim() || '',
        title: link.title || null
    }));
}

// Find all buttons on the page
function findButtons() {
    const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
    return buttons.map(button => ({
        text: button.textContent?.trim() || button.value || '',
        type: button.type || null,
        id: button.id || null,
        disabled: button.disabled || false
    }));
}

// Find all input elements
function findInputs() {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    return inputs.map(input => ({
        type: input.type || input.tagName.toLowerCase(),
        name: input.name || null,
        id: input.id || null,
        placeholder: input.placeholder || null,
        value: input.value || null,
        required: input.required || false,
        label: findInputLabel(input)
    }));
}

// Find label for an input element
function findInputLabel(input) {
    // Try to find label by 'for' attribute
    if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) return label.textContent?.trim();
    }
    
    // Try to find parent label
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.textContent?.trim();
    
    // Try to find nearby text
    const prevSibling = input.previousElementSibling;
    if (prevSibling && prevSibling.tagName === 'LABEL') {
        return prevSibling.textContent?.trim();
    }
    
    return null;
}

// Find all headings
function findHeadings() {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    return headings.map(heading => ({
        level: parseInt(heading.tagName.charAt(1)),
        text: heading.textContent?.trim() || ''
    }));
}

// Find all images
function findImages() {
    const images = Array.from(document.querySelectorAll('img'));
    return images.slice(0, 20).map(img => ({
        src: img.src || null,
        alt: img.alt || null,
        title: img.title || null
    }));
}

// Extract main text content
function extractMainText() {
    // Remove script and style elements
    const clone = document.cloneNode(true);
    const scripts = clone.querySelectorAll('script, style');
    scripts.forEach(script => script.remove());
    
    const text = clone.body?.textContent || clone.textContent || '';
    return text.trim().substring(0, 1000); // Limit to first 1000 chars
}

// Find interactive elements
function findInteractiveElements() {
    const interactive = Array.from(document.querySelectorAll('button, a, input, textarea, select, [onclick], [role="button"]'));
    return interactive.length;
}

// Set up message handling between content script and extension
function setupMessageHandling() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📩 Received message:', request);
        
        try {
            switch (request.action) {
                case 'ping':
                    sendResponse({ pong: true });
                    break;
                    
                case 'getPageAnalysis':
                    sendResponse({ analysis: pageAnalysis });
                    break;
                    
                case 'startVoiceLearning':
                    startVoiceLearning();
                    sendResponse({ success: true });
                    break;
                    
                case 'stopVoiceLearning':
                    stopVoiceLearning();
                    sendResponse({ success: true });
                    break;
                    
                case 'performAction':
                    performPageAction(request.actionData);
                    sendResponse({ success: true });
                    break;
                    
                case 'executeCommand':
                    // Process command directly without sending back to background
                    const result = processExecuteCommand(request.analysis);
                    sendResponse({ success: true, result: result });
                    break;
                    
                default:
                    console.log('❓ Unknown message action:', request.action);
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
        
        return true; // Keep message channel open for async response
    });
}

// Process execute command directly
function processExecuteCommand(analysis) {
    console.log('⚡ Processing execute command:', analysis);
    
    let actionData = null;
    
    switch (analysis.intent) {
        case 'navigate':
            if (analysis.command.includes('google docs')) {
                actionData = { type: 'navigate', url: 'https://docs.google.com' };
            } else if (analysis.command.includes('youtube')) {
                actionData = { type: 'navigate', url: 'https://youtube.com' };
            } else if (analysis.command.includes('gmail')) {
                actionData = { type: 'navigate', url: 'https://gmail.com' };
            }
            break;
            
        case 'search':
            const query = extractSearchQuery(analysis.command);
            actionData = { type: 'search', query: query };
            break;
            
        case 'scroll':
            const direction = analysis.command.includes('down') ? 'down' : 'up';
            actionData = { type: 'scroll', direction: direction };
            break;
            
        case 'read':
            actionData = { type: 'read' };
            break;
            
        default:
            showNotification(`I heard: "${analysis.command}" but didn't understand the action`, 'info');
            return { success: false, message: 'Unknown intent' };
    }
    
    if (actionData) {
        performPageAction(actionData);
        return { success: true, action: actionData };
    }
    
    return { success: false, message: 'No action generated' };
}

// Extract search query from command
function extractSearchQuery(command) {
    const searchKeywords = ['search for', 'find', 'look for', 'search'];
    let query = command.toLowerCase();
    
    for (const keyword of searchKeywords) {
        if (query.includes(keyword)) {
            query = query.split(keyword)[1]?.trim();
            break;
        }
    }
    
    return query || '';
}

// Initialize voice recognition
async function initializeVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('❌ Speech recognition not supported');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        
        if (finalTranscript) {
            processVoiceCommand(finalTranscript);
        }
    };
    
    recognition.onerror = (event) => {
        console.error('🎤 Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            showNotification('Microphone access denied. Please allow microphone access.', 'error');
        }
    };
    
    recognition.onend = () => {
        // Auto-restart if still learning
        if (isLearning) {
            console.log('🔄 Restarting voice recognition...');
            setTimeout(() => {
                if (isLearning) {
                    recognition.start();
                }
            }, 100);
        }
    };
    
    console.log('🎤 Voice recognition initialized');
}

// Start voice learning session
function startVoiceLearning() {
    if (!recognition) {
        console.error('❌ Voice recognition not available');
        showNotification('Voice recognition not available', 'error');
        return;
    }
    
    isLearning = true;
    
    try {
        recognition.start();
        console.log('🎤 Started voice learning');
        showNotification('Voice recognition started! Say "hey chrome" followed by your command.', 'success');
    } catch (error) {
        console.error('Failed to start recognition:', error);
        showNotification('Failed to start voice recognition', 'error');
        isLearning = false;
    }
}

// Stop voice learning session
function stopVoiceLearning() {
    if (recognition && isLearning) {
        isLearning = false;
        recognition.stop();
        console.log('🎤 Stopped voice learning');
        showNotification('Voice recognition stopped.', 'info');
    }
}

// Process voice commands
function processVoiceCommand(command) {
    console.log('🗣️ Voice command:', command);
    
    // Check if command starts with wake word
    const lowerCommand = command.toLowerCase();
    if (!lowerCommand.includes('hey chrome') && !lowerCommand.includes('chrome')) {
        console.log('Command does not contain wake word, ignoring');
        return;
    }
    
    // Remove wake word and process
    const cleanCommand = lowerCommand
        .replace(/hey chrome/gi, '')
        .replace(/chrome/gi, '')
        .trim();
    
    if (!cleanCommand) {
        showNotification('I heard "hey chrome" but no command. Try "hey chrome, open google docs"', 'info');
        return;
    }
    
    // Send command to background script for analysis
    chrome.runtime.sendMessage({
        action: 'processVoiceCommand',
        command: cleanCommand,
        pageAnalysis: pageAnalysis
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error sending command:', chrome.runtime.lastError);
            // Fallback: process locally
            processCommandLocally(cleanCommand);
        } else if (response && response.success) {
            console.log('Command processed by background script');
        }
    });
}

// Fallback local command processing
function processCommandLocally(command) {
    console.log('🔄 Processing command locally:', command);
    
    if (command.includes('google docs') || command.includes('docs')) {
        window.location.href = 'https://docs.google.com';
        showNotification('Opening Google Docs...', 'success');
    } else if (command.includes('scroll down')) {
        scrollPage('down');
    } else if (command.includes('scroll up')) {
        scrollPage('up');
    } else if (command.includes('search')) {
        const searchBox = document.querySelector('input[type="search"], input[name="q"], input[name="search"]');
        if (searchBox) {
            searchBox.focus();
            showNotification('Search box focused', 'success');
        } else {
            showNotification('No search box found on this page', 'error');
        }
    } else {
        showNotification(`I heard "${command}" but don't know how to handle it yet`, 'info');
    }
}

// Perform actions on the page
function performPageAction(actionData) {
    console.log('⚡ Performing action:', actionData);
    
    switch (actionData.type) {
        case 'navigate':
            if (actionData.url) {
                showNotification(`Opening ${actionData.url}...`, 'success');
                window.location.href = actionData.url;
            }
            break;
            
        case 'search':
            const searchBox = document.querySelector('input[type="search"], input[name="q"], input[name="search"]');
            if (searchBox) {
                searchBox.focus();
                if (actionData.query) {
                    searchBox.value = actionData.query;
                    searchBox.dispatchEvent(new Event('input', { bubbles: true }));
                }
                showNotification(`Search for: ${actionData.query}`, 'success');
            } else {
                showNotification('No search box found', 'error');
            }
            break;
            
        case 'scroll':
            scrollPage(actionData.direction);
            break;
            
        case 'read':
            const mainContent = document.querySelector('main, article, .content, #content') || document.body;
            const text = mainContent.textContent.trim().substring(0, 200);
            showNotification(`Reading: ${text}...`, 'info');
            break;
            
        case 'click':
            clickElement(actionData.selector);
            break;
            
        case 'fill':
            fillInput(actionData.selector, actionData.value);
            break;
            
        default:
            console.log('❓ Unknown action type:', actionData.type);
            showNotification(`Unknown action: ${actionData.type}`, 'error');
    }
}

// Click an element
function clickElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.click();
        showNotification(`Clicked: ${selector}`, 'success');
    } else {
        showNotification(`Element not found: ${selector}`, 'error');
    }
}

// Fill an input field
function fillInput(selector, value) {
    const input = document.querySelector(selector);
    if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        showNotification(`Filled: ${selector} with "${value}"`, 'success');
    } else {
        showNotification(`Input not found: ${selector}`, 'error');
    }
}

// Scroll the page
function scrollPage(direction) {
    const scrollAmount = window.innerHeight * 0.8;
    
    switch (direction) {
        case 'up':
            window.scrollBy(0, -scrollAmount);
            showNotification('Scrolled up', 'info');
            break;
        case 'down':
            window.scrollBy(0, scrollAmount);
            showNotification('Scrolled down', 'info');
            break;
        case 'top':
            window.scrollTo(0, 0);
            showNotification('Scrolled to top', 'info');
            break;
        case 'bottom':
            window.scrollTo(0, document.body.scrollHeight);
            showNotification('Scrolled to bottom', 'info');
            break;
        default:
            console.log('Unknown scroll direction:', direction);
    }
}

// Show notification to user
function showNotification(message, type = 'info') {
    // Remove existing notifications first
    const existing = document.querySelectorAll('.voice-assistant-notification');
    existing.forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'voice-assistant-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    if (!document.head.querySelector('#voice-assistant-styles')) {
        style.id = 'voice-assistant-styles';
        document.head.appendChild(style);
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

console.log('🎯 Content script fully loaded and ready!');