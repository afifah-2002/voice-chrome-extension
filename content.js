// Enhanced content script for voice assistant with accessibility features
console.log('Voice Assistant content script loaded on:', window.location.href);

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Content script received message:', request);
    
    try {
        handleMessage(request);
        sendResponse({status: 'success', message: 'Command processed'});
    } catch (error) {
        console.error('Error processing command:', error);
        sendResponse({status: 'error', message: error.message});
    }
    
    return true;
});

function handleMessage(request) {
    switch (request.action) {
        case 'voiceCommand':
            handleVoiceCommand(request.command);
            break;
        case 'scroll':
            handleScroll(request.direction);
            break;
        case 'click':
            handleClick(request.target);
            break;
        case 'read':
            handleRead(request.target);
            break;
        default:
            console.log('Unknown action:', request.action);
    }
}

function handleVoiceCommand(command) {
    console.log('Processing voice command:', command);
    
    const lowerCommand = command.toLowerCase();
    
    // Enhanced command processing
    if (lowerCommand.includes('google doc') || lowerCommand.includes('document')) {
        openGoogleDocs();
    } else if (lowerCommand.includes('scroll down')) {
        handleScroll('down');
    } else if (lowerCommand.includes('scroll up')) {
        handleScroll('up');
    } else if (lowerCommand.includes('click') && lowerCommand.includes('button')) {
        clickFirstButton();
    } else if (lowerCommand.includes('read page') || lowerCommand.includes('read this')) {
        readPageContent();
    } else if (lowerCommand.includes('focus') || lowerCommand.includes('tab')) {
        handleFocusNavigation(lowerCommand);
    } else if (lowerCommand.includes('search') && lowerCommand.includes('page')) {
        openPageSearch();
    } else {
        showFeedback(`Processing: ${command}`);
    }
}

function handleScroll(direction) {
    const scrollAmount = 300;
    
    if (direction === 'down') {
        window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
        });
        showFeedback('Scrolled down');
    } else if (direction === 'up') {
        window.scrollBy({
            top: -scrollAmount,
            behavior: 'smooth'
        });
        showFeedback('Scrolled up');
    } else if (direction === 'top') {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        showFeedback('Scrolled to top');
    } else if (direction === 'bottom') {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
        showFeedback('Scrolled to bottom');
    }
}

function handleClick(target) {
    let element = null;
    
    // Try different ways to find the element
    if (target === 'button' || target.includes('button')) {
        element = document.querySelector('button, input[type="button"], input[type="submit"]');
    } else if (target.includes('link')) {
        element = document.querySelector('a[href]');
    } else if (target.includes('search')) {
        element = document.querySelector('input[type="search"], input[placeholder*="search" i], input[name*="search" i]');
    } else {
        // Try to find by text content
        const allClickable = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
        element = Array.from(allClickable).find(el => 
            el.textContent.toLowerCase().includes(target.toLowerCase())
        );
    }
    
    if (element) {
        // Highlight element briefly before clicking
        highlightElement(element);
        
        setTimeout(() => {
            element.click();
            showFeedback(`Clicked: ${element.textContent || element.type || 'element'}`);
        }, 500);
    } else {
        showFeedback(`Could not find element to click: ${target}`);
    }
}

function handleRead(target) {
    let textToRead = '';
    
    if (target === 'page' || !target) {
        // Read main content
        const mainContent = document.querySelector('main, article, .content, .main-content, #content');
        if (mainContent) {
            textToRead = mainContent.textContent.slice(0, 500); // Limit to first 500 chars
        } else {
            textToRead = document.body.textContent.slice(0, 500);
        }
    } else if (target === 'title') {
        textToRead = document.title;
    } else if (target === 'heading') {
        const heading = document.querySelector('h1, h2, h3');
        if (heading) {
            textToRead = heading.textContent;
        }
    }
    
    if (textToRead) {
        // Use Speech Synthesis API to read text
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.rate = 0.8;
            utterance.voice = speechSynthesis.getVoices().find(voice => voice.lang.startsWith('en')) || null;
            
            speechSynthesis.cancel(); // Stop any current speech
            speechSynthesis.speak(utterance);
            
            showFeedback('Reading content...');
        } else {
            showFeedback('Text-to-speech not supported');
        }
    } else {
        showFeedback('No content found to read');
    }
}

function handleFocusNavigation(command) {
    const focusableElements = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (command.includes('next')) {
        // Focus next element
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex]?.focus();
        showFeedback('Focused next element');
    } else if (command.includes('previous') || command.includes('back')) {
        // Focus previous element
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
        const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        focusableElements[prevIndex]?.focus();
        showFeedback('Focused previous element');
    } else {
        // Focus first focusable element
        focusableElements[0]?.focus();
        showFeedback('Focused first element');
    }
}

function openGoogleDocs() {
    // Look for Google Docs links on current page first
    const docLinks = document.querySelectorAll('a[href*="docs.google.com"]');
    
    if (docLinks.length > 0) {
        docLinks[0].click();
        showFeedback('Opening Google Doc from page...');
    } else {
        window.open('https://docs.google.com', '_blank');
        showFeedback('Opening Google Docs...');
    }
}

function clickFirstButton() {
    const button = document.querySelector('button, input[type="button"], input[type="submit"]');
    if (button) {
        highlightElement(button);
        setTimeout(() => {
            button.click();
            showFeedback(`Clicked: ${button.textContent || button.type}`);
        }, 500);
    } else {
        showFeedback('No button found on page');
    }
}

function readPageContent() {
    // Find and read the main content of the page
    let contentElement = document.querySelector('main, article, .content, [role="main"]');
    
    if (!contentElement) {
        // Fallback to the largest text block
        const textElements = document.querySelectorAll('p, div');
        contentElement = Array.from(textElements)
            .filter(el => el.textContent.length > 100)
            .sort((a, b) => b.textContent.length - a.textContent.length)[0];
    }
    
    if (contentElement) {
        const text = contentElement.textContent.slice(0, 300).trim();
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            speechSynthesis.cancel();
            speechSynthesis.speak(utterance);
            showFeedback('Reading page content...');
        } else {
            showFeedback('Text-to-speech not available');
        }
    } else {
        showFeedback('No readable content found');
    }
}

function openPageSearch() {
    // Trigger browser's find in page
    if (document.execCommand) {
        document.execCommand('find');
        showFeedback('Opened page search');
    } else {
        // Fallback - focus search input if available
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
        if (searchInput) {
            searchInput.focus();
            showFeedback('Focused search box');
        } else {
            showFeedback('Page search not available');
        }
    }
}

function highlightElement(element) {
    // Temporarily highlight the element
    const originalStyle = element.style.cssText;
    element.style.cssText += `
        outline: 3px solid #4285f4 !important;
        outline-offset: 2px !important;
        background-color: rgba(66, 133, 244, 0.1) !important;
    `;
    
    setTimeout(() => {
        element.style.cssText = originalStyle;
    }, 1000);
}

function showFeedback(message) {
    // Remove any existing feedback
    const existingFeedback = document.getElementById('voice-assistant-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    const feedback = document.createElement('div');
    feedback.id = 'voice-assistant-feedback';
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4285f4;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        max-width: 300px;
        word-wrap: break-word;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(feedback);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (feedback && feedback.parentNode) {
            feedback.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }
    }, 3000);
}

// Add keyboard shortcut for voice activation (optional)
document.addEventListener('keydown', function(event) {
    // Ctrl + Shift + V to activate voice assistant
    if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        showFeedback('Voice assistant activated! Use the extension popup to start speaking.');
    }
});

// Announce when extension is ready
if (document.readyState === 'complete') {
    console.log('Voice Assistant ready on:', document.title);
} else {
    window.addEventListener('load', function() {
        console.log('Voice Assistant ready on:', document.title);
    });
}