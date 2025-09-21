// Background Service Worker - The Always-On Brain
console.log('🧠 Intelligent Learning Voice Assistant - Background Service Started');

// Global state management
let isListening = false;
let currentSession = null;
let globalMemory = null;

// Initialize when extension starts
chrome.runtime.onStartup.addListener(initialize);
chrome.runtime.onInstalled.addListener(initialize);

async function initialize() {
    console.log('🚀 Initializing Learning Voice Assistant...');
    
    try {
        // Load global memory
        globalMemory = await loadGlobalMemory();
        
        // Set up cross-tab communication
        setupMessageHandling();
        
        // Initialize AI if available
        await initializeAICapabilities();
        
        console.log('✅ Background service initialized successfully');
        
    } catch (error) {
        console.error('❌ Background initialization failed:', error);
    }
}

// Global memory management
async function loadGlobalMemory() {
    try {
        const result = await chrome.storage.local.get(['globalMemory']);
        return result.globalMemory || {
            learnedSites: {},
            userPatterns: {},
            voiceCommands: {},
            preferences: {
                wakeWord: 'hey chrome',
                voiceEnabled: true,
                learningEnabled: true,
                feedbackLevel: 'medium'
            },
            statistics: {
                sitesLearned: 0,
                commandsExecuted: 0,
                sessionsCompleted: 0
            }
        };
    } catch (error) {
        console.error('Error loading global memory:', error);
        return {};
    }
}

async function saveGlobalMemory() {
    try {
        await chrome.storage.local.set({ globalMemory });
        console.log('💾 Global memory saved');
    } catch (error) {
        console.error('Error saving global memory:', error);
    }
}

// Cross-tab communication system
function setupMessageHandling() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('📨 Background received message:', message);
        
        // Always respond immediately to prevent connection errors
        const handleAsync = async () => {
            try {
                switch (message.action) {
                    case 'startVoiceSession':
                        return await handleStartVoiceSession(message, sender);
                        
                    case 'processVoiceCommand':
                        return await handleVoiceCommand(message, sender);
                        
                    case 'executeCommand':
                        return await handleExecuteCommand(message, sender);
                        
                    case 'learnSitePattern':
                        return await handleSiteLearning(message, sender);
                        
                    case 'getGlobalMemory':
                        return { success: true, memory: globalMemory };
                        
                    case 'updatePreferences':
                        updatePreferences(message.preferences);
                        return { success: true };
                        
                    default:
                        console.log('Unknown message action:', message.action);
                        return { success: false, error: 'Unknown action' };
                }
            } catch (error) {
                console.error('Error handling message:', error);
                return { success: false, error: error.message };
            }
        };
        
        // Handle async operations
        handleAsync().then(result => {
            sendResponse(result);
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        
        return true; // Keep message channel open for async response
    });
}

// Handle executeCommand messages from content script
async function handleExecuteCommand(message, sender) {
    try {
        console.log('⚡ Handling executeCommand:', message.analysis);
        
        const analysis = message.analysis;
        const result = await processCommandExecution(analysis, sender.tab);
        
        // Update statistics
        globalMemory.statistics.commandsExecuted++;
        await saveGlobalMemory();
        
        return { 
            success: true, 
            result: result,
            message: 'Command executed successfully'
        };
        
    } catch (error) {
        console.error('Error in handleExecuteCommand:', error);
        return { success: false, error: error.message };
    }
}

// Process command execution
async function processCommandExecution(analysis, tab) {
    console.log('🎯 Processing command execution:', analysis);
    
    // Create action data based on analysis
    let actionData = null;
    
    switch (analysis.intent) {
        case 'search':
            actionData = {
                type: 'search',
                query: extractSearchQuery(analysis.command)
            };
            break;
            
        case 'navigate':
            if (analysis.command.includes('google docs')) {
                actionData = {
                    type: 'navigate',
                    url: 'https://docs.google.com'
                };
            } else if (analysis.command.includes('open')) {
                const target = extractNavigationTarget(analysis.command);
                actionData = {
                    type: 'navigate',
                    target: target
                };
            }
            break;
            
        case 'read':
            actionData = {
                type: 'read'
            };
            break;
            
        case 'scroll':
            const direction = analysis.command.includes('down') ? 'down' : 'up';
            actionData = {
                type: 'scroll',
                direction: direction
            };
            break;
            
        default:
            actionData = {
                type: 'unknown',
                message: 'Command not recognized'
            };
    }
    
    // Send action back to content script for execution
    if (actionData) {
        try {
            // const result = await chrome.tabs.sendMessage(tab.id, {
            //     action: 'performAction',
            //     actionData: actionData
            // });
            
            //return result || { success: true, action: actionData };
            return { 
                success: true, 
                actionData: actionData,
                message: 'Action data prepared'
            };
            
        } catch (error) {
            console.error('Error sending action to content script:', error);
            return { success: false, error: 'Failed to execute action' };
        }
    }
    
    return { success: false, error: 'No action generated' };
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

// Extract navigation target from command
function extractNavigationTarget(command) {
    if (command.includes('google docs')) return 'Google Docs';
    if (command.includes('gmail')) return 'Gmail';
    if (command.includes('youtube')) return 'YouTube';
    
    // Try to extract "open [something]"
    const openMatch = command.match(/open\s+(.+)/i);
    if (openMatch) {
        return openMatch[1].trim();
    }
    
    return '';
}

// Voice session management
async function handleStartVoiceSession(message, sender) {
    try {
        console.log('🎤 Starting voice session for tab:', sender.tab.id);
        
        currentSession = {
            tabId: sender.tab.id,
            url: sender.tab.url,
            startTime: Date.now(),
            commands: []
        };
        
        // Get site-specific learning data
        const siteLearning = await getSiteLearning(sender.tab.url);
        
        return { 
            success: true, 
            sessionId: currentSession.startTime,
            siteLearning: siteLearning,
            preferences: globalMemory.preferences
        };
        
    } catch (error) {
        console.error('Error starting voice session:', error);
        return { success: false, error: error.message };
    }
}

// Main voice command processing
async function handleVoiceCommand(message, sender) {
    try {
        console.log('🗣️ Processing voice command:', message.command);
        
        // Add to session history
        if (currentSession && currentSession.tabId === sender.tab.id) {
            currentSession.commands.push({
                command: message.command,
                timestamp: Date.now(),
                context: message.context
            });
        }
        
        // Analyze command with AI and site context
        const analysis = await analyzeVoiceCommand(message.command, message.context, sender.tab.url);
        
        // Execute or coordinate execution
        const result = await executeCommand(analysis, sender.tab);
        
        // Learn from this interaction
        await learnFromInteraction(message.command, analysis, result, sender.tab.url);
        
        // Update statistics
        globalMemory.statistics.commandsExecuted++;
        await saveGlobalMemory();
        
        return { 
            success: true, 
            analysis: analysis,
            result: result,
            learning: 'Command processed and patterns updated'
        };
        
    } catch (error) {
        console.error('Error processing voice command:', error);
        return { success: false, error: error.message };
    }
}

// Site learning system
async function handleSiteLearning(message, sender) {
    try {
        console.log('📚 Learning site pattern:', message.pattern);
        
        const url = new URL(sender.tab.url);
        const domain = url.hostname;
        
        if (!globalMemory.learnedSites[domain]) {
            globalMemory.learnedSites[domain] = {
                firstLearned: Date.now(),
                patterns: {},
                interactions: 0,
                success_rate: 0
            };
            globalMemory.statistics.sitesLearned++;
        }
        
        // Store the learned pattern
        const patternKey = message.pattern.type || 'general';
        globalMemory.learnedSites[domain].patterns[patternKey] = {
            ...message.pattern,
            learnedAt: Date.now(),
            confidence: message.confidence || 0.5
        };
        
        globalMemory.learnedSites[domain].interactions++;
        
        await saveGlobalMemory();
        
        return { 
            success: true, 
            message: `Learned new pattern for ${domain}`,
            totalSitesLearned: globalMemory.statistics.sitesLearned
        };
        
    } catch (error) {
        console.error('Error in site learning:', error);
        return { success: false, error: error.message };
    }
}

// Get existing learning for a site
async function getSiteLearning(url) {
    try {
        const domain = new URL(url).hostname;
        return globalMemory.learnedSites[domain] || null;
    } catch (error) {
        console.error('Error getting site learning:', error);
        return null;
    }
}

// AI command analysis (enhanced with better logic)
async function analyzeVoiceCommand(command, context, url) {
    const analysis = {
        command: command.toLowerCase(),
        intent: 'unknown',
        confidence: 0.5,
        suggestedActions: [],
        needsLearning: false
    };
    
    const lowerCommand = command.toLowerCase();
    
    // Enhanced intent detection
    if (lowerCommand.includes('search') || lowerCommand.includes('find') || lowerCommand.includes('look for')) {
        analysis.intent = 'search';
        analysis.confidence = 0.8;
    } else if (lowerCommand.includes('open') || lowerCommand.includes('go to') || lowerCommand.includes('navigate')) {
        analysis.intent = 'navigate';
        analysis.confidence = 0.9;
    } else if (lowerCommand.includes('click') || lowerCommand.includes('press')) {
        analysis.intent = 'click';
        analysis.confidence = 0.7;
    } else if (lowerCommand.includes('read') || lowerCommand.includes('tell me')) {
        analysis.intent = 'read';
        analysis.confidence = 0.6;
    } else if (lowerCommand.includes('scroll')) {
        analysis.intent = 'scroll';
        analysis.confidence = 0.9;
    }
    
    // Check if we have learned patterns for this site
    const siteLearning = await getSiteLearning(url);
    if (!siteLearning) {
        analysis.needsLearning = true;
        analysis.suggestedActions.push('analyze_page_structure');
    }
    
    return analysis;
}

// Command execution coordinator
async function executeCommand(analysis, tab) {
    try {
        // Send execution request to content script
        const result = await chrome.tabs.sendMessage(tab.id, {
            action: 'executeCommand',
            analysis: analysis,
            timestamp: Date.now()
        });
        
        return result;
        
    } catch (error) {
        console.error('Error executing command:', error);
        return { success: false, error: error.message };
    }
}

// Learning from interactions
async function learnFromInteraction(command, analysis, result, url) {
    try {
        const domain = new URL(url).hostname;
        
        // Update success rates and patterns based on result
        if (globalMemory.learnedSites[domain]) {
            if (result && result.success) {
                globalMemory.learnedSites[domain].success_rate = 
                    (globalMemory.learnedSites[domain].success_rate + 1) / 2;
            } else {
                globalMemory.learnedSites[domain].success_rate = 
                    globalMemory.learnedSites[domain].success_rate * 0.9;
            }
        }
        
        // Store command patterns for future use
        if (!globalMemory.userPatterns[domain]) {
            globalMemory.userPatterns[domain] = [];
        }
        
        globalMemory.userPatterns[domain].push({
            command: command,
            intent: analysis.intent,
            success: result && result.success,
            timestamp: Date.now()
        });
        
        // Keep only recent patterns (last 100)
        if (globalMemory.userPatterns[domain].length > 100) {
            globalMemory.userPatterns[domain] = globalMemory.userPatterns[domain].slice(-100);
        }
        
        await saveGlobalMemory();
        
    } catch (error) {
        console.error('Error learning from interaction:', error);
    }
}

// AI capabilities initialization
async function initializeAICapabilities() {
    try {
        // Check if Chrome AI is available
        if (typeof ai !== 'undefined' && ai.languageModel) {
            const capabilities = await ai.languageModel.capabilities();
            console.log('🤖 Gemini Nano capabilities:', capabilities);
            
            if (capabilities.available === 'readily') {
                console.log('✅ Gemini Nano is ready');
                globalMemory.aiCapabilities = {
                    geminiNano: true,
                    status: 'ready'
                };
            } else if (capabilities.available === 'after-download') {
                console.log('📥 Gemini Nano needs download');
                globalMemory.aiCapabilities = {
                    geminiNano: true,
                    status: 'downloading'
                };
            } else {
                console.log('❌ Gemini Nano not available');
                globalMemory.aiCapabilities = {
                    geminiNano: false,
                    status: 'unavailable'
                };
            }
        } else {
            console.log('❌ Chrome AI APIs not available');
            globalMemory.aiCapabilities = {
                geminiNano: false,
                status: 'unavailable'
            };
        }
        
        await saveGlobalMemory();
        
    } catch (error) {
        console.error('Error initializing AI capabilities:', error);
        globalMemory.aiCapabilities = {
            geminiNano: false,
            status: 'error'
        };
    }
}

// Preferences management
async function updatePreferences(newPreferences) {
    globalMemory.preferences = { ...globalMemory.preferences, ...newPreferences };
    await saveGlobalMemory();
    
    // Broadcast preference changes to all tabs
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
            action: 'preferencesUpdated',
            preferences: globalMemory.preferences
        }).catch(() => {}); // Ignore errors for tabs without content script
    });
}

// Tab change handling
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        console.log(`📱 Switched to tab: ${tab.url}`);
        
        // Update current session if exists
        if (currentSession) {
            currentSession.tabId = activeInfo.tabId;
        }
        
    } catch (error) {
        console.error('Error handling tab change:', error);
    }
});

// Cleanup on extension shutdown
chrome.runtime.onSuspend.addListener(() => {
    console.log('💤 Background service suspending - saving final state');
    if (globalMemory) {
        saveGlobalMemory();
    }
});

console.log('🎯 Background service worker ready');