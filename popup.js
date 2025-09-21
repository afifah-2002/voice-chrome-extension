// // Popup Interface - Voice Assistant Control Panel
// console.log('🎛️ Loading Voice Assistant Popup Interface...');

// // State management
// let currentState = {
//     isActive: false,
//     isLearning: false,
//     currentPage: null,
//     memory: [],
//     lastAction: null,
//     initializationComplete: false
// };

// let hasInitialized = false;

// // Initialize popup interface
// (async function initializePopup() {
//     if (hasInitialized) return;
//     hasInitialized = true;
    
//     try {
//         console.log('🚀 Initializing popup interface...');
        
//         // Update status
//         updateStatus('Setting up interface...');
        
//         // Quick setup without complex checks
//         await setupBasicInterface();
        
//         // Set up event listeners
//         setupEventListeners();
        
//         // Load any saved state
//         await loadSavedState();
        
//         // Show ready state
//         showReadyState();
        
//         console.log('✅ Popup interface initialized successfully');
        
//     } catch (error) {
//         console.error('❌ Failed to initialize popup:', error);
//         showErrorState('Initialization failed');
//     }
// })();

// // Basic interface setup
// async function setupBasicInterface() {
//     // Update UI elements to ready state
//     const statusText = document.getElementById('statusText');
//     if (statusText) {
//         statusText.textContent = 'Ready';
//     }
    
//     const statusDot = document.getElementById('statusDot');
//     if (statusDot) {
//         statusDot.className = 'status-dot active';
//     }
    
//     const voiceButton = document.getElementById('voiceButton');
//     if (voiceButton) {
//         voiceButton.classList.remove('disabled');
//     }
    
//     await sleep(100);
// }

// // Update status message
// function updateStatus(message) {
//     const aiStatusText = document.getElementById('aiStatusText');
//     if (aiStatusText && aiStatusText.textContent !== message) {
//         aiStatusText.textContent = message;
//     }
//     console.log('📱', message);
// }

// // Show ready state
// function showReadyState() {
//     updateStatus('AI Ready (Basic Mode)');
    
//     const statusText = document.getElementById('statusText');
//     if (statusText) {
//         statusText.textContent = 'Ready';
//     }
    
//     currentState.initializationComplete = true;
// }

// // Show error state
// function showErrorState(message) {
//     updateStatus(`Error: ${message}`);
    
//     const statusText = document.getElementById('statusText');
//     if (statusText) {
//         statusText.textContent = 'Error';
//     }
// }

// // Set up event listeners
// function setupEventListeners() {
//     console.log('🎮 Setting up event listeners...');
    
//     // Voice button
//     const voiceButton = document.getElementById('voiceButton');
//     if (voiceButton) {
//         voiceButton.addEventListener('click', handleVoiceButtonClick);
//     }
    
//     // Quick action buttons
//     const actionButtons = document.querySelectorAll('.action-button');
//     actionButtons.forEach(button => {
//         button.addEventListener('click', handleActionButtonClick);
//     });
    
//     // Settings toggle
//     const toggleSettings = document.getElementById('toggleSettings');
//     if (toggleSettings) {
//         toggleSettings.addEventListener('click', toggleSettingsPanel);
//     }
    
//     // Save settings
//     const saveSettings = document.getElementById('saveSettings');
//     if (saveSettings) {
//         saveSettings.addEventListener('click', saveSettingsHandler);
//     }
    
//     // Reset memory
//     const resetMemory = document.getElementById('resetMemory');
//     if (resetMemory) {
//         resetMemory.addEventListener('click', resetMemoryHandler);
//     }
    
//     // Demo button
//     const startDemo = document.getElementById('startDemo');
//     if (startDemo) {
//         startDemo.addEventListener('click', startDemoHandler);
//     }
    
//     // Footer links
//     const viewMemory = document.getElementById('viewMemory');
//     if (viewMemory) {
//         viewMemory.addEventListener('click', viewMemoryHandler);
//     }
    
//     const exportData = document.getElementById('exportData');
//     if (exportData) {
//         exportData.addEventListener('click', exportDataHandler);
//     }
    
//     console.log('✅ Event listeners set up');
// }

// // Handle voice button click
// async function handleVoiceButtonClick() {
//     try {
//         const voiceButton = document.getElementById('voiceButton');
//         const voiceText = voiceButton.querySelector('.voice-text');
        
//         if (!currentState.isLearning) {
//             // Start voice recognition
//             updateStatus('Starting voice recognition...');
            
//             const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//             // Check if we're on a restricted page
//         if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
//             showNotification('Cannot use voice commands on Chrome internal pages. Navigate to a regular website first.', 'error');
//             return;
//         }
            
//             // Check if we can communicate with content script
//             try {
//                 const response = await sendMessageWithTimeout(tab.id, { action: 'startVoiceLearning' });
                
//                 if (response && response.success) {
//                     currentState.isLearning = true;
//                     voiceButton.classList.add('active');
//                     voiceText.textContent = 'Stop Listening';
//                     updateStatus('Voice recognition active - say "hey chrome"');
//                     showNotification('Voice recognition started!', 'success');
//                 } else {
//                     throw new Error('Content script not responding');
//                 }
//             } catch (error) {
//                 // Fallback: try to inject content script
//                 console.log('Injecting content script...');
//                 await chrome.scripting.executeScript({
//                     target: { tabId: tab.id },
//                     files: ['content.js']
//                 });
                
//                 await sleep(1000);
                
//                 const response = await sendMessageWithTimeout(tab.id, { action: 'startVoiceLearning' });
//                 if (response && response.success) {
//                     currentState.isLearning = true;
//                     voiceButton.classList.add('active');
//                     voiceText.textContent = 'Stop Listening';
//                     updateStatus('Voice recognition active');
//                     showNotification('Voice recognition started!', 'success');
//                 } else {
//                     throw new Error('Failed to start voice recognition');
//                 }
//             }
//         } else {
//             // Stop voice recognition
//             const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//             await sendMessageWithTimeout(tab.id, { action: 'stopVoiceLearning' });
            
//             currentState.isLearning = false;
//             voiceButton.classList.remove('active');
//             voiceText.textContent = 'Start Listening';
//             updateStatus('Voice recognition stopped');
//             showNotification('Voice recognition stopped', 'info');
//         }
        
//         await saveState();
        
//     } catch (error) {
//         console.error('Voice button error:', error);
//         updateStatus('Voice recognition failed');
//         showNotification('Failed to start voice recognition. Try on a regular website.', 'error');
//     }
// }

// // Handle action button clicks
// async function handleActionButtonClick(event) {
//     const command = event.currentTarget.dataset.command;
//     console.log('Action button clicked:', command);
    
//     try {
//         const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
//         switch (command) {
//             case 'search':
//                 await sendMessageWithTimeout(tab.id, { 
//                     action: 'performAction', 
//                     actionData: { type: 'search' }
//                 });
//                 showNotification('Search activated', 'success');
//                 break;
                
//             case 'read':
//                 await sendMessageWithTimeout(tab.id, { 
//                     action: 'performAction', 
//                     actionData: { type: 'read' }
//                 });
//                 showNotification('Reading page content', 'success');
//                 break;
                
//             case 'navigate':
//                 showNotification('Say "hey chrome, go to [website]"', 'info');
//                 break;
                
//             case 'help':
//                 showHelpInfo();
//                 break;
//         }
//     } catch (error) {
//         console.error('Action failed:', error);
//         showNotification('Action failed - try on a regular website', 'error');
//     }
// }

// // Toggle settings panel
// function toggleSettingsPanel() {
//     const settingsContent = document.getElementById('settingsContent');
//     if (settingsContent) {
//         const isVisible = settingsContent.style.display !== 'none';
//         settingsContent.style.display = isVisible ? 'none' : 'block';
//     }
// }

// // Save settings
// async function saveSettingsHandler() {
//     try {
//         const settings = {
//             voiceEnabled: document.getElementById('voiceEnabled')?.checked ?? true,
//             learningEnabled: document.getElementById('learningEnabled')?.checked ?? true,
//             wakeWord: document.getElementById('wakeWord')?.value ?? 'hey chrome',
//             feedbackLevel: document.getElementById('feedbackLevel')?.value ?? 'medium'
//         };
        
//         await chrome.storage.local.set({ voiceAssistantSettings: settings });
//         showNotification('Settings saved!', 'success');
        
//     } catch (error) {
//         console.error('Failed to save settings:', error);
//         showNotification('Failed to save settings', 'error');
//     }
// }

// // Reset memory
// async function resetMemoryHandler() {
//     if (confirm('Are you sure you want to reset all learned data?')) {
//         try {
//             await chrome.storage.local.clear();
//             currentState.memory = [];
//             showNotification('Memory reset complete!', 'success');
//         } catch (error) {
//             console.error('Failed to reset memory:', error);
//             showNotification('Failed to reset memory', 'error');
//         }
//     }
// }

// // Start demo
// function startDemoHandler() {
//     const demoCommands = [
//         '"Hey Chrome, search for something"',
//         '"Hey Chrome, read this page"',
//         '"Hey Chrome, find the login button"'
//     ];
    
//     showNotification(`Try these commands: ${demoCommands[0]}`, 'info');
// }

// // View memory
// async function viewMemoryHandler() {
//     try {
//         const result = await chrome.storage.local.get(null);
//         console.log('Current memory:', result);
//         showNotification('Memory data logged to console', 'info');
//     } catch (error) {
//         console.error('Failed to view memory:', error);
//         showNotification('Failed to view memory', 'error');
//     }
// }

// // Export data
// async function exportDataHandler() {
//     try {
//         const result = await chrome.storage.local.get(null);
//         const dataStr = JSON.stringify(result, null, 2);
//         const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
//         const url = URL.createObjectURL(dataBlob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'voice-assistant-data.json';
//         a.click();
        
//         URL.revokeObjectURL(url);
//         showNotification('Data exported successfully!', 'success');
        
//     } catch (error) {
//         console.error('Failed to export data:', error);
//         showNotification('Failed to export data', 'error');
//     }
// }

// // Show help information
// function showHelpInfo() {
//     const helpText = `
// Voice Commands:
// • "Hey Chrome, search for [term]"
// • "Hey Chrome, scroll down/up"
// • "Hey Chrome, click [button name]"
// • "Hey Chrome, read this page"
// • "Hey Chrome, go to [website]"
//     `;
    
//     showNotification('Help info logged to console', 'info');
//     console.log(helpText);
// }

// // Send message with timeout
// function sendMessageWithTimeout(tabId, message, timeout = 3000) {
//     return new Promise((resolve, reject) => {
//         const timer = setTimeout(() => {
//             reject(new Error('Message timeout'));
//         }, timeout);
        
//         chrome.tabs.sendMessage(tabId, message, (response) => {
//             clearTimeout(timer);
//             if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//             } else {
//                 resolve(response);
//             }
//         });
//     });
// }

// // Load saved state
// async function loadSavedState() {
//     try {
//         const result = await chrome.storage.local.get(['voiceAssistantState', 'voiceAssistantSettings']);
        
//         if (result.voiceAssistantState) {
//             currentState = { ...currentState, ...result.voiceAssistantState };
//         }
        
//         if (result.voiceAssistantSettings) {
//             const settings = result.voiceAssistantSettings;
            
//             const voiceEnabled = document.getElementById('voiceEnabled');
//             if (voiceEnabled) voiceEnabled.checked = settings.voiceEnabled ?? true;
            
//             const learningEnabled = document.getElementById('learningEnabled');
//             if (learningEnabled) learningEnabled.checked = settings.learningEnabled ?? true;
            
//             const wakeWord = document.getElementById('wakeWord');
//             if (wakeWord) wakeWord.value = settings.wakeWord ?? 'hey chrome';
            
//             const feedbackLevel = document.getElementById('feedbackLevel');
//             if (feedbackLevel) feedbackLevel.value = settings.feedbackLevel ?? 'medium';
//         }
        
//         console.log('✅ Loaded saved state');
        
//     } catch (error) {
//         console.error('Failed to load saved state:', error);
//     }
// }

// // Save current state
// async function saveState() {
//     try {
//         await chrome.storage.local.set({ voiceAssistantState: currentState });
//     } catch (error) {
//         console.error('Failed to save state:', error);
//     }
// }

// // Show notification
// function showNotification(message, type = 'info') {
//     // Remove existing notifications
//     const existing = document.querySelectorAll('.notification');
//     existing.forEach(n => n.remove());
    
//     // Create new notification
//     const notification = document.createElement('div');
//     notification.className = `notification ${type}`;
//     notification.textContent = message;
    
//     document.body.appendChild(notification);
    
//     // Auto-remove after 3 seconds
//     setTimeout(() => {
//         if (notification.parentNode) {
//             notification.parentNode.removeChild(notification);
//         }
//     }, 3000);
    
//     console.log(`📱 ${type.toUpperCase()}: ${message}`);
// }

// // Utility function
// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// // Initialize stats display
// setInterval(async () => {
//     try {
//         const result = await chrome.storage.local.get(null);
//         const stats = result.voiceAssistantStats || {};
        
//         const sitesLearned = document.getElementById('sitesLearned');
//         if (sitesLearned) sitesLearned.textContent = stats.sitesLearned || 0;
        
//         const commandsExecuted = document.getElementById('commandsExecuted');
//         if (commandsExecuted) commandsExecuted.textContent = stats.commandsExecuted || 0;
        
//         const successRate = document.getElementById('successRate');
//         if (successRate) {
//             const rate = stats.successRate || 0;
//             successRate.textContent = Math.round(rate * 100) + '%';
//         }
//     } catch (error) {
//         // Ignore errors in stats update
//     }
// }, 5000);

// console.log('🎛️ Popup interface script loaded');

// Simple Voice Assistant Popup
console.log('🎤 Voice Assistant Popup Loading...');

let isListening = false;
let hasInitialized = false;

// Initialize popup
(async function initializePopup() {
    if (hasInitialized) return;
    hasInitialized = true;
    
    try {
        console.log('🚀 Initializing popup...');
        
        updateStatus('Setting up...');
        
        // Set up event listeners
        setupEventListeners();
        
        // Check if we can run on current page
        const canRun = await checkPageCompatibility();
        
        if (canRun) {
            showReadyState();
        } else {
            showRestrictedPageState();
        }
        
        console.log('✅ Popup initialized successfully');
        
    } catch (error) {
        console.error('❌ Popup initialization failed:', error);
        showErrorState('Initialization failed');
    }
})();

// Set up event listeners
function setupEventListeners() {
    const voiceButton = document.getElementById('voiceButton');
    if (voiceButton) {
        voiceButton.addEventListener('click', handleVoiceButtonClick);
        console.log('✅ Voice button listener added');
    }
}

// Handle voice button click
async function handleVoiceButtonClick() {
    try {
        const voiceButton = document.getElementById('voiceButton');
        const voiceText = voiceButton.querySelector('.voice-text');
        
        if (!isListening) {
            // Start voice recognition
            updateAIStatus('Starting voice recognition...');
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check for restricted pages
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                showNotification('Cannot use voice commands on Chrome internal pages. Navigate to a regular website first.', 'error');
                return;
            }
            
            // Test if content script responds
            let contentScriptReady = false;
            try {
                const pingResponse = await sendMessageWithTimeout(tab.id, { action: 'ping' }, 1000);
                contentScriptReady = pingResponse && pingResponse.pong;
            } catch (e) {
                console.log('Content script not responding, injecting...');
            }
            
            // Inject if not ready
            if (!contentScriptReady) {
                updateAIStatus('Loading voice recognition...');
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                await sleep(2000);
                
                // Test again
                const pingResponse = await sendMessageWithTimeout(tab.id, { action: 'ping' }, 1000);
                if (!pingResponse || !pingResponse.pong) {
                    throw new Error('Content script injection failed');
                }
            }
            
            // Start voice recognition
            const response = await sendMessageWithTimeout(tab.id, { action: 'startVoiceLearning' });
            if (response && response.success) {
                isListening = true;
                voiceButton.classList.add('active');
                voiceButton.classList.remove('disabled');
                voiceText.textContent = 'Stop Listening';
                updateStatus('Listening...');
                updateAIStatus('Voice recognition active - say "hey chrome [command]"');
                showNotification('Voice recognition started! Say "hey chrome" followed by your command.', 'success');
            } else {
                throw new Error('Failed to start voice recognition');
            }
            
        } else {
            // Stop voice recognition
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await sendMessageWithTimeout(tab.id, { action: 'stopVoiceLearning' });
            
            isListening = false;
            voiceButton.classList.remove('active');
            voiceText.textContent = 'Start Listening';
            updateStatus('Ready');
            updateAIStatus('Voice recognition stopped');
            showNotification('Voice recognition stopped', 'info');
        }
        
    } catch (error) {
        console.error('Voice button error:', error);
        updateStatus('Error');
        updateAIStatus('Voice recognition failed');
        showNotification('Failed to start voice recognition. Make sure you\'re on a regular website.', 'error');
        
        // Reset button state
        const voiceButton = document.getElementById('voiceButton');
        const voiceText = voiceButton.querySelector('.voice-text');
        isListening = false;
        voiceButton.classList.remove('active');
        voiceText.textContent = 'Start Listening';
    }
}

// Check page compatibility
async function checkPageCompatibility() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            return false;
        }
        
        // Check for restricted URLs
        const restrictedPatterns = [
            'chrome://',
            'chrome-extension://',
            'moz-extension://',
            'edge://',
            'about:',
            'file://'
        ];
        
        const isRestricted = restrictedPatterns.some(pattern => 
            tab.url.startsWith(pattern)
        );
        
        return !isRestricted;
        
    } catch (error) {
        console.error('Error checking page compatibility:', error);
        return false;
    }
}

// Show ready state
function showReadyState() {
    updateStatus('Ready');
    updateAIStatus('AI Ready - Click button to start listening');
    
    const statusDot = document.getElementById('statusDot');
    if (statusDot) {
        statusDot.classList.add('active');
    }
    
    const voiceButton = document.getElementById('voiceButton');
    if (voiceButton) {
        voiceButton.classList.remove('disabled');
    }
}

// Show restricted page state
function showRestrictedPageState() {
    updateStatus('Restricted Page');
    updateAIStatus('Cannot run on Chrome internal pages - navigate to a regular website');
    
    const voiceButton = document.getElementById('voiceButton');
    if (voiceButton) {
        voiceButton.classList.add('disabled');
    }
    
    showNotification('Navigate to a regular website to use voice commands', 'info');
}

// Show error state
function showErrorState(message) {
    updateStatus('Error');
    updateAIStatus(`Error: ${message}`);
    
    const voiceButton = document.getElementById('voiceButton');
    if (voiceButton) {
        voiceButton.classList.add('disabled');
    }
}

// Update status text
function updateStatus(message) {
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = message;
    }
    console.log('📱 Status:', message);
}

// Update AI status text
function updateAIStatus(message) {
    const aiStatusText = document.getElementById('aiStatusText');
    if (aiStatusText) {
        aiStatusText.textContent = message;
    }
    console.log('🤖 AI Status:', message);
}

// Send message with timeout
function sendMessageWithTimeout(tabId, message, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Message timeout'));
        }, timeout);
        
        chrome.tabs.sendMessage(tabId, message, (response) => {
            clearTimeout(timer);
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
    
    console.log(`📱 ${type.toUpperCase()}: ${message}`);
}

// Utility function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('🎤 Voice Assistant Popup Ready');