// Learning System - Self-Improving Intelligence
console.log('🧠 Learning System Module Loading...');

class LearningSystem {
    constructor() {
        this.patterns = new Map();
        this.siteKnowledge = new Map();
        this.userBehaviors = new Map();
        this.adaptationRules = new Map();
        this.confidenceThreshold = 0.7;
        this.learningRate = 0.1;
    }

    // Main learning function - learns from any interaction
    async learnFromInteraction(interaction) {
        console.log('📚 Learning from interaction:', interaction);
        
        try {
            // Extract learning data
            const learningData = this._extractLearningData(interaction);
            
            // Update different learning layers
            await Promise.all([
                this._updateSiteKnowledge(learningData),
                this._updateUserPatterns(learningData),
                this._updateCommandPatterns(learningData),
                this._updateSuccessPatterns(learningData)
            ]);
            
            // Generate new insights
            const insights = await this._generateInsights(learningData);
            
            // Adapt behavior rules
            await this._adaptBehaviorRules(insights);
            
            console.log('✅ Learning completed, insights generated:', insights);
            
            return {
                success: true,
                insights: insights,
                adaptations: this._getRecentAdaptations()
            };
            
        } catch (error) {
            console.error('❌ Learning failed:', error);
            return { success: false, error: error.message };
        }
    }

    _extractLearningData(interaction) {
        return {
            domain: this._extractDomain(interaction.url || interaction.context?.url),
            command: interaction.command,
            intent: interaction.analysis?.intent,
            success: interaction.result?.success,
            confidence: interaction.analysis?.confidence,
            pageType: interaction.context?.pageAnalysis?.patterns?.pageType,
            elementsUsed: interaction.result?.elementsUsed || [],
            errorType: interaction.result?.error?.type,
            timestamp: interaction.timestamp || Date.now(),
            sessionContext: interaction.sessionContext || {}
        };
    }

    _extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'unknown';
        }
    }

    // Site-specific knowledge learning
    async _updateSiteKnowledge(data) {
        const { domain, pageType, elementsUsed, success, intent } = data;
        
        if (!domain || domain === 'unknown') return;
        
        // Get or create site knowledge
        let siteData = this.siteKnowledge.get(domain) || {
            pageTypes: new Map(),
            successfulPatterns: new Map(),
            failurePatterns: new Map(),
            elementMappings: new Map(),
            workflowPatterns: [],
            adaptationHistory: [],
            lastUpdated: Date.now()
        };
        
        // Update page type knowledge
        if (pageType) {
            const pageTypeData = siteData.pageTypes.get(pageType) || {
                frequency: 0,
                successRate: 0,
                commonElements: new Map(),
                workingCommands: new Set(),
                failingCommands: new Set()
            };
            
            pageTypeData.frequency++;
            
            if (success) {
                pageTypeData.successRate = this._updateAverage(
                    pageTypeData.successRate,
                    1,
                    pageTypeData.frequency
                );
                pageTypeData.workingCommands.add(`${intent}:${data.command}`);
            } else {
                pageTypeData.successRate = this._updateAverage(
                    pageTypeData.successRate,
                    0,
                    pageTypeData.frequency
                );
                pageTypeData.failingCommands.add(`${intent}:${data.command}`);
            }
            
            siteData.pageTypes.set(pageType, pageTypeData);
        }
        
        // Learn element interaction patterns
        if (elementsUsed.length > 0) {
            elementsUsed.forEach(element => {
                const key = `${intent}:${element.type}`;
                const elementData = siteData.elementMappings.get(key) || {
                    successCount: 0,
                    totalCount: 0,
                    selectors: new Set(),
                    workingApproaches: new Set()
                };
                
                elementData.totalCount++;
                if (success) {
                    elementData.successCount++;
                    elementData.selectors.add(element.selector);
                    elementData.workingApproaches.add(element.approach);
                }
                
                siteData.elementMappings.set(key, elementData);
            });
        }
        
        siteData.lastUpdated = Date.now();
        this.siteKnowledge.set(domain, siteData);
        
        console.log(`📊 Updated site knowledge for ${domain}`);
    }

    // User behavior pattern learning
    async _updateUserPatterns(data) {
        const { command, intent, success, timestamp, sessionContext } = data;
        
        // Extract user behavior patterns
        const behaviorKey = this._generateBehaviorKey(data);
        let behaviorData = this.userBehaviors.get(behaviorKey) || {
            frequency: 0,
            successRate: 0,
            timePatterns: [],
            contextPatterns: new Map(),
            variations: new Set(),
            evolution: []
        };
        
        // Update frequency and success rate
        behaviorData.frequency++;
        behaviorData.successRate = this._updateAverage(
            behaviorData.successRate,
            success ? 1 : 0,
            behaviorData.frequency
        );
        
        // Track time patterns
        const hour = new Date(timestamp).getHours();
        behaviorData.timePatterns.push(hour);
        if (behaviorData.timePatterns.length > 100) {
            behaviorData.timePatterns = behaviorData.timePatterns.slice(-100);
        }
        
        // Track command variations
        behaviorData.variations.add(command);
        
        // Track evolution over time
        behaviorData.evolution.push({
            timestamp,
            success,
            confidence: data.confidence,
            context: sessionContext
        });
        
        if (behaviorData.evolution.length > 50) {
            behaviorData.evolution = behaviorData.evolution.slice(-50);
        }
        
        this.userBehaviors.set(behaviorKey, behaviorData);
        
        console.log(`👤 Updated user behavior pattern: ${behaviorKey}`);
    }

    _generateBehaviorKey(data) {
        // Generate a key that represents the user's behavioral intent
        return `${data.intent}:${data.pageType || 'general'}`;
    }

    // Command pattern learning
    async _updateCommandPatterns(data) {
        const { command, intent, success, confidence } = data;
        
        // Learn successful command phrasings
        const patternKey = intent || 'unknown';
        let commandData = this.patterns.get(patternKey) || {
            successfulPhrases: new Map(),
            failedPhrases: new Map(),
            confidence: 0,
            learningProgress: 0
        };
        
        // Update phrase patterns
        const phraseMap = success ? commandData.successfulPhrases : commandData.failedPhrases;
        const normalizedCommand = this._normalizeCommand(command);
        
        const phraseData = phraseMap.get(normalizedCommand) || { count: 0, avgConfidence: 0 };
        phraseData.count++;
        phraseData.avgConfidence = this._updateAverage(
            phraseData.avgConfidence,
            confidence || 0.5,
            phraseData.count
        );
        
        phraseMap.set(normalizedCommand, phraseData);
        
        // Update overall pattern confidence
        commandData.confidence = this._calculatePatternConfidence(commandData);
        commandData.learningProgress = Math.min(
            commandData.learningProgress + this.learningRate,
            1.0
        );
        
        this.patterns.set(patternKey, commandData);
        
        console.log(`🗣️ Updated command pattern for ${patternKey}`);
    }

    _normalizeCommand(command) {
        // Normalize command for pattern recognition
        return command.toLowerCase()
            .replace(/hey chrome/gi, '')
            .replace(/please/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    _calculatePatternConfidence(commandData) {
        const successCount = Array.from(commandData.successfulPhrases.values())
            .reduce((sum, data) => sum + data.count, 0);
        const failCount = Array.from(commandData.failedPhrases.values())
            .reduce((sum, data) => sum + data.count, 0);
        
        const total = successCount + failCount;
        return total > 0 ? successCount / total : 0.5;
    }

    // Success pattern learning
    async _updateSuccessPatterns(data) {
        const { domain, pageType, intent, success, elementsUsed } = data;
        
        if (!success) return; // Only learn from successful interactions
        
        // Create success pattern signature
        const patternSignature = {
            domain,
            pageType,
            intent,
            elementTypes: elementsUsed.map(e => e.type),
            approach: elementsUsed.map(e => e.approach).join('+')
        };
        
        const key = JSON.stringify(patternSignature);
        const existing = this.adaptationRules.get(key) || {
            confidence: 0,
            frequency: 0,
            applicability: new Set(),
            variations: []
        };
        
        existing.frequency++;
        existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
        existing.applicability.add(domain);
        existing.variations.push(data);
        
        // Keep only recent variations
        if (existing.variations.length > 20) {
            existing.variations = existing.variations.slice(-20);
        }
        
        this.adaptationRules.set(key, existing);
        
        console.log(`✅ Learned success pattern: ${intent} on ${pageType}`);
    }

    // Generate insights from learning data
    async _generateInsights(data) {
        const insights = [];
        
        // Site-specific insights
        const siteInsights = this._generateSiteInsights(data.domain);
        insights.push(...siteInsights);
        
        // User behavior insights
        const userInsights = this._generateUserInsights(data);
        insights.push(...userInsights);
        
        // Pattern efficiency insights
        const efficiencyInsights = this._generateEfficiencyInsights();
        insights.push(...efficiencyInsights);
        
        return insights;
    }

    _generateSiteInsights(domain) {
        const siteData = this.siteKnowledge.get(domain);
        if (!siteData) return [];
        
        const insights = [];
        
        // Analyze page type patterns
        for (const [pageType, data] of siteData.pageTypes) {
            if (data.frequency > 5 && data.successRate > 0.8) {
                insights.push({
                    type: 'site_mastery',
                    domain,
                    pageType,
                    confidence: data.successRate,
                    message: `Highly proficient with ${pageType} pages on ${domain}`
                });
            } else if (data.frequency > 3 && data.successRate < 0.5) {
                insights.push({
                    type: 'site_difficulty',
                    domain,
                    pageType,
                    confidence: 1 - data.successRate,
                    message: `Struggling with ${pageType} pages on ${domain}, needs more learning`
                });
            }
        }
        
        return insights;
    }

    _generateUserInsights(data) {
        const behaviorKey = this._generateBehaviorKey(data);
        const behaviorData = this.userBehaviors.get(behaviorKey);
        if (!behaviorData) return [];
        
        const insights = [];
        
        // Analyze user proficiency
        if (behaviorData.frequency > 10) {
            if (behaviorData.successRate > 0.9) {
                insights.push({
                    type: 'user_expertise',
                    pattern: behaviorKey,
                    confidence: behaviorData.successRate,
                    message: `User is expert at ${data.intent} commands`
                });
            } else if (behaviorData.successRate < 0.4) {
                insights.push({
                    type: 'user_difficulty',
                    pattern: behaviorKey,
                    confidence: 1 - behaviorData.successRate,
                    message: `User needs assistance with ${data.intent} commands`,
                    suggestion: 'Consider providing more guidance or simpler alternatives'
                });
            }
        }
        
        // Analyze time patterns
        const timeInsights = this._analyzeTimePatterns(behaviorData.timePatterns);
        insights.push(...timeInsights);
        
        // Analyze command evolution
        if (behaviorData.evolution.length > 20) {
            const recentSuccess = behaviorData.evolution.slice(-10)
                .reduce((sum, e) => sum + (e.success ? 1 : 0), 0) / 10;
            const olderSuccess = behaviorData.evolution.slice(-20, -10)
                .reduce((sum, e) => sum + (e.success ? 1 : 0), 0) / 10;
            
            if (recentSuccess > olderSuccess + 0.2) {
                insights.push({
                    type: 'learning_progress',
                    pattern: behaviorKey,
                    confidence: recentSuccess - olderSuccess,
                    message: `User is improving at ${data.intent} commands`
                });
            }
        }
        
        return insights;
    }

    _analyzeTimePatterns(timePatterns) {
        if (timePatterns.length < 10) return [];
        
        const insights = [];
        const hourCounts = new Array(24).fill(0);
        
        timePatterns.forEach(hour => hourCounts[hour]++);
        
        // Find peak usage hours
        const maxCount = Math.max(...hourCounts);
        const peakHours = hourCounts
            .map((count, hour) => ({ hour, count }))
            .filter(item => item.count === maxCount)
            .map(item => item.hour);
        
        if (peakHours.length <= 3 && maxCount > timePatterns.length * 0.3) {
            insights.push({
                type: 'usage_pattern',
                pattern: 'time_preference',
                confidence: maxCount / timePatterns.length,
                message: `User most active during ${peakHours.join(', ')}:00 hours`,
                data: { peakHours, totalUsage: timePatterns.length }
            });
        }
        
        return insights;
    }

    _generateEfficiencyInsights() {
        const insights = [];
        
        // Analyze pattern effectiveness across all domains
        for (const [intent, patternData] of this.patterns) {
            if (patternData.learningProgress > 0.8 && patternData.confidence > 0.85) {
                insights.push({
                    type: 'pattern_mastery',
                    pattern: intent,
                    confidence: patternData.confidence,
                    message: `Highly effective at understanding ${intent} commands`
                });
            }
        }
        
        // Identify transferable patterns
        const transferablePatterns = this._identifyTransferablePatterns();
        insights.push(...transferablePatterns);
        
        return insights;
    }

    _identifyTransferablePatterns() {
        const insights = [];
        const domainPatterns = new Map();
        
        // Group successful patterns by domain
        for (const [domain, siteData] of this.siteKnowledge) {
            for (const [pageType, typeData] of siteData.pageTypes) {
                if (typeData.successRate > 0.8 && typeData.frequency > 5) {
                    const key = pageType;
                    if (!domainPatterns.has(key)) {
                        domainPatterns.set(key, []);
                    }
                    domainPatterns.get(key).push({
                        domain,
                        successRate: typeData.successRate,
                        frequency: typeData.frequency
                    });
                }
            }
        }
        
        // Find patterns that work across multiple domains
        for (const [pageType, domains] of domainPatterns) {
            if (domains.length >= 3) {
                const avgSuccess = domains.reduce((sum, d) => sum + d.successRate, 0) / domains.length;
                if (avgSuccess > 0.8) {
                    insights.push({
                        type: 'transferable_pattern',
                        pattern: pageType,
                        confidence: avgSuccess,
                        message: `Learned ${pageType} patterns work across ${domains.length} different sites`,
                        applicableDomains: domains.map(d => d.domain)
                    });
                }
            }
        }
        
        return insights;
    }

    // Behavior adaptation based on insights
    async _adaptBehaviorRules(insights) {
        for (const insight of insights) {
            switch (insight.type) {
                case 'site_difficulty':
                    await this._adaptForSiteDifficulty(insight);
                    break;
                    
                case 'user_difficulty':
                    await this._adaptForUserDifficulty(insight);
                    break;
                    
                case 'transferable_pattern':
                    await this._applyTransferablePattern(insight);
                    break;
                    
                case 'usage_pattern':
                    await this._adaptToUsagePattern(insight);
                    break;
            }
        }
    }

    async _adaptForSiteDifficulty(insight) {
        // Increase learning rate for difficult sites
        const adaptationKey = `difficulty:${insight.domain}:${insight.pageType}`;
        this.adaptationRules.set(adaptationKey, {
            type: 'increased_learning',
            learningRate: this.learningRate * 1.5,
            requiresConfirmation: true,
            detailedFeedback: true,
            fallbackStrategies: ['basic_interaction', 'help_mode']
        });
        
        console.log(`🔧 Adapted for difficulty on ${insight.domain} ${insight.pageType}`);
    }

    async _adaptForUserDifficulty(insight) {
        // Provide more guidance for users struggling with specific commands
        const adaptationKey = `user_help:${insight.pattern}`;
        this.adaptationRules.set(adaptationKey, {
            type: 'enhanced_guidance',
            provideStepByStep: true,
            confirmEachStep: true,
            offerAlternatives: true,
            simplifyLanguage: true
        });
        
        console.log(`👤 Adapted guidance for user difficulty with ${insight.pattern}`);
    }

    async _applyTransferablePattern(insight) {
        // Apply successful patterns to new similar sites
        for (const domain of insight.applicableDomains) {
            const adaptationKey = `transfer:${domain}:${insight.pattern}`;
            this.adaptationRules.set(adaptationKey, {
                type: 'pattern_transfer',
                sourcePattern: insight.pattern,
                confidence: insight.confidence,
                autoApply: insight.confidence > 0.9,
                monitorResults: true
            });
        }
        
        console.log(`🔄 Applied transferable pattern ${insight.pattern} to ${insight.applicableDomains.length} domains`);
    }

    async _adaptToUsagePattern(insight) {
        if (insight.data && insight.data.peakHours) {
            const adaptationKey = `timing:${insight.data.peakHours.join('-')}`;
            this.adaptationRules.set(adaptationKey, {
                type: 'timing_optimization',
                peakHours: insight.data.peakHours,
                optimizeForSpeed: true,
                preloadResources: true,
                enhancedAvailability: true
            });
            
            console.log(`⏰ Adapted for peak usage during ${insight.data.peakHours.join(', ')}:00`);
        }
    }

    // Prediction and suggestion system
    async predictUserIntent(partialCommand, context) {
        const predictions = [];
        
        // Use learned patterns to predict intent
        for (const [intent, patternData] of this.patterns) {
            if (patternData.confidence > this.confidenceThreshold) {
                for (const [phrase, phraseData] of patternData.successfulPhrases) {
                    if (phrase.startsWith(partialCommand.toLowerCase())) {
                        predictions.push({
                            intent,
                            completedCommand: phrase,
                            confidence: phraseData.avgConfidence,
                            frequency: phraseData.count
                        });
                    }
                }
            }
        }
        
        // Sort by confidence and frequency
        predictions.sort((a, b) => 
            (b.confidence * b.frequency) - (a.confidence * a.frequency)
        );
        
        return predictions.slice(0, 5); // Top 5 predictions
    }

    async suggestImprovements(domain, pageType) {
        const suggestions = [];
        const siteData = this.siteKnowledge.get(domain);
        
        if (!siteData) {
            return [{
                type: 'exploration',
                message: 'This is a new site. I\'ll learn its patterns as we interact.',
                confidence: 1.0
            }];
        }
        
        const pageTypeData = siteData.pageTypes.get(pageType);
        if (pageTypeData) {
            if (pageTypeData.successRate < 0.6) {
                suggestions.push({
                    type: 'learning_needed',
                    message: `I'm still learning this type of page. Try being more specific in your commands.`,
                    confidence: 1 - pageTypeData.successRate,
                    workingCommands: Array.from(pageTypeData.workingCommands).slice(0, 3)
                });
            }
            
            if (pageTypeData.workingCommands.size > 0) {
                suggestions.push({
                    type: 'proven_commands',
                    message: 'Commands that work well on this page:',
                    confidence: pageTypeData.successRate,
                    commands: Array.from(pageTypeData.workingCommands).slice(0, 5)
                });
            }
        }
        
        return suggestions;
    }

    // Analytics and reporting
    generateLearningReport() {
        const report = {
            timestamp: Date.now(),
            totalSitesLearned: this.siteKnowledge.size,
            totalPatterns: this.patterns.size,
            totalBehaviors: this.userBehaviors.size,
            adaptationRules: this.adaptationRules.size,
            
            siteMastery: [],
            userProficiency: [],
            learningProgress: [],
            recommendations: []
        };
        
        // Site mastery analysis
        for (const [domain, siteData] of this.siteKnowledge) {
            const avgSuccessRate = Array.from(siteData.pageTypes.values())
                .reduce((sum, data) => sum + data.successRate, 0) / siteData.pageTypes.size;
            
            if (avgSuccessRate > 0) {
                report.siteMastery.push({
                    domain,
                    successRate: avgSuccessRate,
                    pageTypesLearned: siteData.pageTypes.size,
                    interactionCount: Array.from(siteData.pageTypes.values())
                        .reduce((sum, data) => sum + data.frequency, 0)
                });
            }
        }
        
        // User proficiency analysis
        for (const [pattern, behaviorData] of this.userBehaviors) {
            if (behaviorData.frequency > 5) {
                report.userProficiency.push({
                    pattern,
                    successRate: behaviorData.successRate,
                    frequency: behaviorData.frequency,
                    proficiencyLevel: this._calculateProficiencyLevel(behaviorData)
                });
            }
        }
        
        // Learning progress
        for (const [intent, patternData] of this.patterns) {
            report.learningProgress.push({
                intent,
                confidence: patternData.confidence,
                learningProgress: patternData.learningProgress,
                phrasesLearned: patternData.successfulPhrases.size
            });
        }
        
        return report;
    }

    _calculateProficiencyLevel(behaviorData) {
        const score = (behaviorData.successRate * 0.7) + 
                     (Math.min(behaviorData.frequency / 20, 1) * 0.3);
        
        if (score > 0.8) return 'expert';
        if (score > 0.6) return 'proficient';
        if (score > 0.4) return 'learning';
        return 'beginner';
    }

    // Utility functions
    _updateAverage(currentAvg, newValue, count) {
        return ((currentAvg * (count - 1)) + newValue) / count;
    }

    _getRecentAdaptations() {
        const recent = [];
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
        
        for (const [key, rule] of this.adaptationRules) {
            if (rule.timestamp && rule.timestamp > cutoff) {
                recent.push({ key, rule });
            }
        }
        
        return recent;
    }

    // Data export and import for persistence
    exportLearningData() {
        return {
            patterns: Array.from(this.patterns.entries()),
            siteKnowledge: Array.from(this.siteKnowledge.entries()),
            userBehaviors: Array.from(this.userBehaviors.entries()),
            adaptationRules: Array.from(this.adaptationRules.entries()),
            metadata: {
                version: '1.0.0',
                exportDate: Date.now(),
                confidenceThreshold: this.confidenceThreshold,
                learningRate: this.learningRate
            }
        };
    }

    importLearningData(data) {
        try {
            if (data.patterns) {
                this.patterns = new Map(data.patterns);
            }
            if (data.siteKnowledge) {
                this.siteKnowledge = new Map(data.siteKnowledge);
            }
            if (data.userBehaviors) {
                this.userBehaviors = new Map(data.userBehaviors);
            }
            if (data.adaptationRules) {
                this.adaptationRules = new Map(data.adaptationRules);
            }
            if (data.metadata) {
                this.confidenceThreshold = data.metadata.confidenceThreshold || this.confidenceThreshold;
                this.learningRate = data.metadata.learningRate || this.learningRate;
            }
            
            console.log('✅ Learning data imported successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to import learning data:', error);
            return false;
        }
    }

    // Reset learning data
    resetLearning(type = 'all') {
        switch (type) {
            case 'patterns':
                this.patterns.clear();
                break;
            case 'sites':
                this.siteKnowledge.clear();
                break;
            case 'behaviors':
                this.userBehaviors.clear();
                break;
            case 'adaptations':
                this.adaptationRules.clear();
                break;
            case 'all':
                this.patterns.clear();
                this.siteKnowledge.clear();
                this.userBehaviors.clear();
                this.adaptationRules.clear();
                break;
        }
        
        console.log(`🧹 Reset learning data: ${type}`);
    }

    // Get current learning status
    getStatus() {
        return {
            isLearning: true,
            totalPatterns: this.patterns.size,
            totalSites: this.siteKnowledge.size,
            totalBehaviors: this.userBehaviors.size,
            adaptationRules: this.adaptationRules.size,
            confidenceThreshold: this.confidenceThreshold,
            learningRate: this.learningRate,
            lastActivity: Date.now()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearningSystem;
} else {
    window.LearningSystem = LearningSystem;
}

console.log('🧠 Learning System Module Loaded');