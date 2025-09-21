// AI Engine - Gemini Nano + Writer + Summarizer
console.log('🤖 AI Engine Loading...');

class AIEngine {
    constructor() {
        this.session = null;
        this.writer = null;
        this.summarizer = null;
        this.isReady = false;
        this.initializationAttempted = false;
    }

    async initialize() {
        if (this.initializationAttempted) {
            return { success: this.isReady };
        }
        
        this.initializationAttempted = true;
        
        try {
            console.log('🚀 Initializing AI Engine...');
            
            // Check if AI APIs exist
            if (typeof ai === 'undefined') {
                throw new Error('Chrome AI APIs not available');
            }
            
            // Check Gemini Nano availability
            const canCreate = await ai.languageModel.capabilities();
            console.log('📊 AI Capabilities:', canCreate);
            
            if (canCreate.available === 'no') {
                throw new Error('Gemini Nano not available on this device');
            }
            
            if (canCreate.available === 'after-download') {
                console.log('📥 Gemini Nano needs to be downloaded...');
            }
            
            // Create session
            this.session = await ai.languageModel.create({
                systemPrompt: "You are a helpful Chrome voice assistant that analyzes voice commands and responds with JSON."
            });
            
            this.isReady = true;
            console.log('✅ AI Engine initialized successfully');
            return { success: true };
            
        } catch (error) {
            console.error('❌ AI Engine failed to initialize:', error);
            this.isReady = false;
            return { success: false, error: error.message };
        }
    }

    async analyzeCommand(command) {
        if (!this.isReady || !this.session) {
            // Fallback to basic analysis
            return this._basicAnalysis(command);
        }
        
        try {
            const prompt = `Analyze this voice command and respond with JSON: "${command}"
            
Return format: {"intent": "scroll|click|search|navigate", "target": "element or direction", "confidence": 0.8}`;
            
            const response = await this.session.prompt(prompt);
            console.log('🤖 AI Response:', response);
            
            return this._parseResponse(response);
            
        } catch (error) {
            console.error('❌ AI analysis failed:', error);
            return this._basicAnalysis(command);
        }
    }

    _basicAnalysis(command) {
        const lower = command.toLowerCase();
        
        if (lower.includes('scroll down')) {
            return { intent: 'scroll', target: 'down', confidence: 0.9 };
        }
        if (lower.includes('scroll up')) {
            return { intent: 'scroll', target: 'up', confidence: 0.9 };
        }
        if (lower.includes('click')) {
            return { intent: 'click', target: 'button', confidence: 0.7 };
        }
        if (lower.includes('search')) {
            return { intent: 'search', target: '', confidence: 0.8 };
        }
        
        return { intent: 'unknown', target: '', confidence: 0.3 };
    }

    _parseResponse(response) {
        try {
            // Clean and parse JSON
            const cleaned = response.replace(/```json|```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('Failed to parse AI response:', response);
            return { intent: 'unknown', target: '', confidence: 0.3 };
        }
    }

    async writeContent(prompt) {
        try {
            if (!this.writer && typeof ai !== 'undefined' && ai.writer) {
                this.writer = await ai.writer.create();
            }
            if (this.writer) {
                return await this.writer.write(prompt);
            }
        } catch (error) {
            console.error('Writer failed:', error);
        }
        return `Generated content for: ${prompt}`;
    }

    async summarizeContent(text) {
        try {
            if (!this.summarizer && typeof ai !== 'undefined' && ai.summarizer) {
                this.summarizer = await ai.summarizer.create();
            }
            if (this.summarizer) {
                return await this.summarizer.summarize(text);
            }
        } catch (error) {
            console.error('Summarizer failed:', error);
        }
        return text.substring(0, 100) + '...';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIEngine;
} else {
    window.AIEngine = AIEngine;
}

console.log('🤖 AI Engine Loaded');