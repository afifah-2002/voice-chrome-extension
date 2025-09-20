let recognition;
let isListening = false;
let aiSession = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Voice Assistant loaded - initializing Gemini Nano...');
    
    const startButton = document.getElementById('startListening');
    const statusDiv = document.getElementById('status');
    const transcriptDiv = document.getElementById('transcript');

    // Check if elements exist
    if (!startButton || !statusDiv || !transcriptDiv) {
        console.error('Required elements not found');
        return;
    }

    // Initialize Gemini Nano
    await initializeGeminiNano();

    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.error('Speech recognition not supported');
        statusDiv.textContent = 'Speech recognition not supported';
        startButton.disabled = true;
        return;
    }

    // Initialize speech recognition
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
        console.log('Speech recognition started');
        isListening = true;
        statusDiv.textContent = 'Listening...';
        startButton.textContent = '🛑 Stop Listening';
        startButton.style.backgroundColor = '#dc3545';
    };

    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Show interim results in gray, final in black
        transcriptDiv.innerHTML = finalTranscript + 
            '<span style="color: #999;">' + interimTranscript + '</span>';
        
        // Only process final results with Gemini Nano
        if (finalTranscript.trim()) {
            processVoiceCommandWithAI(finalTranscript.trim());
        }
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        statusDiv.textContent = 'Error: ' + event.error;
        
        if (event.error === 'not-allowed') {
            statusDiv.textContent = 'Microphone access denied. Please allow microphone access.';
        } else if (event.error === 'no-speech') {
            statusDiv.textContent = 'No speech detected. Try again.';
        }
        
        resetButton();
    };

    recognition.onend = function() {
        console.log('Speech recognition ended');
        resetButton();
    };

    startButton.addEventListener('click', function() {
        console.log('Button clicked, isListening:', isListening);
        
        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
                console.log('Starting speech recognition...');
            } catch (error) {
                console.error('Error starting recognition:', error);
                statusDiv.textContent = 'Error: ' + error.message;
            }
        }
    });

    function resetButton() {
        isListening = false;
        statusDiv.textContent = aiSession ? 'Ready to listen... (AI Ready)' : 'Ready to listen... (AI Loading)';
        startButton.textContent = '🎤 Start Listening';
        startButton.style.backgroundColor = '#4285f4';
    }

    async function initializeGeminiNano() {
        try {
            // Check if Prompt API is available
            if (!('LanguageModel' in window)) {
                statusDiv.textContent = 'Gemini Nano not available. Enable flags in chrome://flags';
                console.error('LanguageModel API not available');
                return;
            }

            statusDiv.textContent = 'Checking AI availability...';
            
            // Check availability
            const availability = await LanguageModel.availability();
            console.log('AI availability:', availability);

            if (availability === 'no') {
                statusDiv.textContent = 'AI not supported on this device';
                return;
            }

            if (availability === 'downloadable') {
                statusDiv.textContent = 'Downloading AI model... (this may take a few minutes)';
            } else if (availability === 'downloading') {
                statusDiv.textContent = 'AI model downloading...';
            }

            // Create AI session
            aiSession = await LanguageModel.create({
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        const percent = Math.round(e.loaded / e.total * 100);
                        statusDiv.textContent = `Downloading AI model: ${percent}%`;
                        console.log(`Downloaded ${percent}%`);
                    });
                }
            });

            console.log('Gemini Nano session created successfully');
            statusDiv.textContent = 'AI Ready! Click to start voice commands.';
            
        } catch (error) {
            console.error('Failed to initialize Gemini Nano:', error);
            statusDiv.textContent = 'AI initialization failed. Using basic commands.';
        }
    }

    async function processVoiceCommandWithAI(command) {
        console.log('Processing voice command with AI:', command);
        statusDiv.textContent = 'AI is thinking...';

        try {
            if (!aiSession) {
                // Fallback to basic command processing
                processBasicCommand(command);
                return;
            }

            // Create a smart prompt for Gemini Nano
            const prompt = `
You are an accessibility assistant that helps users navigate the web with voice commands. 

The user said: "${command}"

Analyze this command and respond with a JSON object containing the user's intent. Use this exact format:

{
  "command": "action_type",
  "target": "website_or_element", 
  "query": "search_term_if_applicable",
  "confidence": "high|medium|low"
}

Available commands:
- "search" (for searching on websites like Google, YouTube, etc.)
- "navigate" (for opening websites or pages)
- "open_document" (for opening Google Docs, Drive files)
- "scroll" (for scrolling up/down)
- "click" (for clicking elements)
- "read" (for reading page content)
- "unclear" (if the command is not clear)

Examples:
- "open Google Docs" → {"command": "navigate", "target": "docs.google.com", "query": "", "confidence": "high"}
- "search for cats on YouTube" → {"command": "search", "target": "youtube", "query": "cats", "confidence": "high"}
- "scroll down" → {"command": "scroll", "target": "down", "query": "", "confidence": "high"}
- "find my last document" → {"command": "open_document", "target": "drive", "query": "recent", "confidence": "medium"}

Respond only with the JSON object, no other text.`;

            const response = await aiSession.prompt(prompt);
            console.log('AI response:', response);

            // Parse AI response
            let parsedCommand;
            try {
                // Clean the response and parse JSON
                const cleanResponse = response.trim().replace(/```json\n?|\n?```/g, '');
                parsedCommand = JSON.parse(cleanResponse);
            } catch (parseError) {
                console.error('Failed to parse AI response:', parseError);
                processBasicCommand(command);
                return;
            }

            // Execute the AI-parsed command
            executeAICommand(parsedCommand, command);

        } catch (error) {
            console.error('AI processing failed:', error);
            statusDiv.textContent = 'AI error, using basic processing...';
            processBasicCommand(command);
        }
    }

    function executeAICommand(parsedCommand, originalCommand) {
        console.log('Executing AI command:', parsedCommand);
        
        const { command, target, query, confidence } = parsedCommand;
        
        // Show confidence in status
        statusDiv.textContent = `Executing (${confidence} confidence): ${originalCommand}`;

        // Execute based on AI understanding
        switch (command) {
            case 'navigate':
                if (target.includes('docs.google') || target.includes('google docs')) {
                    openGoogleDocs();
                } else if (target.includes('youtube')) {
                    window.open('https://youtube.com', '_blank');
                } else if (target.includes('google')) {
                    window.open('https://google.com', '_blank');
                } else {
                    window.open(`https://${target}`, '_blank');
                }
                break;
                
            case 'search':
                if (target === 'youtube') {
                    window.open(`https://youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
                } else if (target === 'google') {
                    window.open(`https://google.com/search?q=${encodeURIComponent(query)}`, '_blank');
                } else {
                    window.open(`https://google.com/search?q=${encodeURIComponent(query)}`, '_blank');
                }
                break;
                
            case 'open_document':
                openGoogleDocs();
                break;
                
            case 'scroll':
                sendToContentScript({
                    action: 'scroll',
                    direction: target
                });
                break;
                
            case 'click':
                sendToContentScript({
                    action: 'click',
                    target: target
                });
                break;
                
            case 'read':
                sendToContentScript({
                    action: 'read',
                    target: target
                });
                break;
                
            default:
                statusDiv.textContent = `Command understood but not implemented: ${command}`;
        }
    }

    function processBasicCommand(command) {
        console.log('Processing with basic commands:', command);
        const lowerCommand = command.toLowerCase();
        
        if (lowerCommand.includes('google') && (lowerCommand.includes('doc') || lowerCommand.includes('document'))) {
            openGoogleDocs();
            statusDiv.textContent = 'Opening Google Docs...';
        } else if (lowerCommand.includes('youtube')) {
            window.open('https://youtube.com', '_blank');
            statusDiv.textContent = 'Opening YouTube...';
        } else if (lowerCommand.includes('scroll down')) {
            sendToContentScript({ action: 'scroll', direction: 'down' });
            statusDiv.textContent = 'Scrolling down...';
        } else if (lowerCommand.includes('scroll up')) {
            sendToContentScript({ action: 'scroll', direction: 'up' });
            statusDiv.textContent = 'Scrolling up...';
        } else {
            statusDiv.textContent = `Command received: ${command}`;
        }
    }

    function openGoogleDocs() {
        window.open('https://docs.google.com', '_blank');
    }

    function sendToContentScript(message) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('Error sending message:', chrome.runtime.lastError.message);
                    }
                });
            }
        });
    }
});