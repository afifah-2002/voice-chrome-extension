// Memory Manager - Persistent Memory System
console.log('💾 Memory Manager Module Loading...');

class MemoryManager {
    constructor() {
        this.storageKey = 'voice_assistant_memory';
        this.backupKey = 'voice_assistant_backup';
        this.maxMemorySize = 50 * 1024 * 1024; // 50MB limit
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
        this.isDirty = false;
        this.lastSave = Date.now();
    }

    // Initialize memory system
    async initialize() {
        try {
            console.log('🚀 Initializing Memory Manager...');
            
            // Load existing memory
            const existingMemory = await this.loadMemory();
            
            // Start auto-save system
            this.startAutoSave();
            
            console.log('✅ Memory Manager initialized');
            
            return {
                success: true,
                memoryLoaded: !!existingMemory,
                lastSave: this.lastSave
            };
            
        } catch (error) {
            console.error('❌ Memory Manager initialization failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Load memory from storage
    async loadMemory() {
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            const memoryData = result[this.storageKey];
            
            if (memoryData) {
                console.log('📖 Loaded existing memory data');
                return this.validateAndRepairMemory(memoryData);
            } else {
                console.log('🆕 No existing memory found, creating new');
                return this.createDefaultMemory();
            }
            
        } catch (error) {
            console.error('❌ Failed to load memory:', error);
            
            // Try to load backup
            try {
                const backupResult = await chrome.storage.local.get([this.backupKey]);
                const backupData = backupResult[this.backupKey];
                
                if (backupData) {
                    console.log('🔄 Loaded from backup memory');
                    return this.validateAndRepairMemory(backupData);
                }
            } catch (backupError) {
                console.error('❌ Backup also failed:', backupError);
            }
            
            return this.createDefaultMemory();
        }
    }

    // Save memory to storage
    async saveMemory(memoryData, createBackup = true) {
        try {
            // Validate memory size
            const memorySize = JSON.stringify(memoryData).length;
            if (memorySize > this.maxMemorySize) {
                console.warn('⚠️ Memory size exceeds limit, compacting...');
                memoryData = await this.compactMemory(memoryData);
            }
            
            // Create backup if requested
            if (createBackup) {
                try {
                    const currentMemory = await chrome.storage.local.get([this.storageKey]);
                    if (currentMemory[this.storageKey]) {
                        await chrome.storage.local.set({
                            [this.backupKey]: {
                                ...currentMemory[this.storageKey],
                                backupTimestamp: Date.now()
                            }
                        });
                    }
                } catch (backupError) {
                    console.warn('⚠️ Failed to create backup:', backupError);
                }
            }
            
            // Save main memory
            await chrome.storage.local.set({
                [this.storageKey]: {
                    ...memoryData,
                    lastSaved: Date.now(),
                    version: '1.0.0'
                }
            });
            
            this.lastSave = Date.now();
            this.isDirty = false;
            
            console.log('💾 Memory saved successfully');
            
            return { success: true, timestamp: this.lastSave };
            
        } catch (error) {
            console.error('❌ Failed to save memory:', error);
            return { success: false, error: error.message };
        }
    }

    // Create default memory structure
    createDefaultMemory() {
        return {
            version: '1.0.0',
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            
            // User preferences
            preferences: {
                wakeWord: 'hey chrome',
                voiceEnabled: true,
                learningEnabled: true,
                feedbackLevel: 'medium',
                autoSave: true,
                privacyMode: false
            },
            
            // Learning data
            learnedSites: {},
            userPatterns: {},
            voiceCommands: {},
            
            // Statistics
            statistics: {
                sitesLearned: 0,
                commandsExecuted: 0,
                sessionsCompleted: 0,
                totalInteractions: 0,
                successfulInteractions: 0,
                averageConfidence: 0,
                learningProgress: 0
            },
            
            // AI capabilities
            aiCapabilities: {
                geminiNano: false,
                writer: false,
                summarizer: false,
                rewriter: false,
                status: 'unknown'
            },
            
            // Session data
            currentSession: null,
            sessionHistory: [],
            
            // Learning system data
            learningData: {
                patterns: [],
                siteKnowledge: [],
                userBehaviors: [],
                adaptationRules: []
            }
        };
    }

    // Validate and repair memory data
    validateAndRepairMemory(memoryData) {
        console.log('🔧 Validating and repairing memory data...');
        
        const defaultMemory = this.createDefaultMemory();
        
        // Ensure all required fields exist
        const repairedMemory = this.deepMerge(defaultMemory, memoryData);
        
        // Validate data types
        repairedMemory.statistics = this.validateStatistics(repairedMemory.statistics);
        repairedMemory.preferences = this.validatePreferences(repairedMemory.preferences);
        
        // Clean up old data
        repairedMemory.sessionHistory = this.cleanupSessionHistory(repairedMemory.sessionHistory);
        
        // Update metadata
        repairedMemory.lastUpdated = Date.now();
        repairedMemory.version = '1.0.0';
        
        console.log('✅ Memory validation complete');
        
        return repairedMemory;
    }

    validateStatistics(stats) {
        const defaults = {
            sitesLearned: 0,
            commandsExecuted: 0,
            sessionsCompleted: 0,
            totalInteractions: 0,
            successfulInteractions: 0,
            averageConfidence: 0,
            learningProgress: 0
        };
        
        const validated = { ...defaults, ...stats };
        
        // Ensure numbers are valid
        Object.keys(validated).forEach(key => {
            if (typeof validated[key] !== 'number' || isNaN(validated[key])) {
                validated[key] = defaults[key];
            }
        });
        
        return validated;
    }

    validatePreferences(prefs) {
        const defaults = {
            wakeWord: 'hey chrome',
            voiceEnabled: true,
            learningEnabled: true,
            feedbackLevel: 'medium',
            autoSave: true,
            privacyMode: false
        };
        
        return { ...defaults, ...prefs };
    }

    cleanupSessionHistory(history) {
        if (!Array.isArray(history)) return [];
        
        // Keep only last 100 sessions
        const cleaned = history.slice(-100);
        
        // Remove sessions older than 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        return cleaned.filter(session => 
            session.timestamp && session.timestamp > thirtyDaysAgo
        );
    }

    // Compact memory to reduce size
    async compactMemory(memoryData) {
        console.log('🗜️ Compacting memory data...');
        
        const compacted = { ...memoryData };
        
        // Limit learned sites to most recent and successful
        if (compacted.learnedSites) {
            const sites = Object.entries(compacted.learnedSites)
                .sort((a, b) => (b[1].lastAccessed || 0) - (a[1].lastAccessed || 0))
                .slice(0, 100); // Keep top 100 sites
            
            compacted.learnedSites = Object.fromEntries(sites);
        }
        
        // Limit user patterns
        if (compacted.userPatterns) {
            const patterns = Object.entries(compacted.userPatterns)
                .sort((a, b) => (b[1].frequency || 0) - (a[1].frequency || 0))
                .slice(0, 500); // Keep top 500 patterns
            
            compacted.userPatterns = Object.fromEntries(patterns);
        }
        
        // Limit session history
        compacted.sessionHistory = this.cleanupSessionHistory(compacted.sessionHistory);
        
        // Compact learning data
        if (compacted.learningData) {
            compacted.learningData.patterns = compacted.learningData.patterns.slice(-1000);
            compacted.learningData.siteKnowledge = compacted.learningData.siteKnowledge.slice(-500);
            compacted.learningData.userBehaviors = compacted.learningData.userBehaviors.slice(-1000);
            compacted.learningData.adaptationRules = compacted.learningData.adaptationRules.slice(-200);
        }
        
        const originalSize = JSON.stringify(memoryData).length;
        const compactedSize = JSON.stringify(compacted).length;
        
        console.log(`🗜️ Memory compacted: ${originalSize} → ${compactedSize} bytes`);
        
        return compacted;
    }

    // Update specific memory sections
    async updateMemorySection(section, data) {
        try {
            const currentMemory = await this.loadMemory();
            
            if (section === 'statistics') {
                currentMemory.statistics = this.validateStatistics(data);
            } else if (section === 'preferences') {
                currentMemory.preferences = this.validatePreferences(data);
            } else {
                currentMemory[section] = data;
            }
            
            currentMemory.lastUpdated = Date.now();
            this.markDirty();
            
            return await this.saveMemory(currentMemory);
            
        } catch (error) {
            console.error(`❌ Failed to update ${section}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Increment statistics
    async incrementStatistic(statName, value = 1) {
        try {
            const currentMemory = await this.loadMemory();
            
            if (!currentMemory.statistics[statName]) {
                currentMemory.statistics[statName] = 0;
            }
            
            currentMemory.statistics[statName] += value;
            currentMemory.lastUpdated = Date.now();
            
            this.markDirty();
            
            return await this.saveMemory(currentMemory, false); // Don't backup for simple increments
            
        } catch (error) {
            console.error(`❌ Failed to increment ${statName}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Add session to history
    async addSession(sessionData) {
        try {
            const currentMemory = await this.loadMemory();
            
            if (!currentMemory.sessionHistory) {
                currentMemory.sessionHistory = [];
            }
            
            currentMemory.sessionHistory.push({
                ...sessionData,
                timestamp: Date.now()
            });
            
            // Keep only last 50 sessions in memory
            if (currentMemory.sessionHistory.length > 50) {
                currentMemory.sessionHistory = currentMemory.sessionHistory.slice(-50);
            }
            
            currentMemory.lastUpdated = Date.now();
            this.markDirty();
            
            return await this.saveMemory(currentMemory, false);
            
        } catch (error) {
            console.error('❌ Failed to add session:', error);
            return { success: false, error: error.message };
        }
    }

    // Auto-save system
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(async () => {
            if (this.isDirty) {
                console.log('⏰ Auto-saving memory...');
                const currentMemory = await this.loadMemory();
                await this.saveMemory(currentMemory, false);
            }
        }, this.autoSaveInterval);
        
        console.log('⏰ Auto-save system started');
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('⏹️ Auto-save system stopped');
        }
    }

    markDirty() {
        this.isDirty = true;
    }

    // Export and import
    async exportMemory() {
        try {
            const memoryData = await this.loadMemory();
            
            const exportData = {
                exportVersion: '1.0.0',
                exportDate: new Date().toISOString(),
                userAgent: navigator.userAgent,
                memory: memoryData,
                metadata: {
                    totalSize: JSON.stringify(memoryData).length,
                    sitesCount: Object.keys(memoryData.learnedSites || {}).length,
                    patternsCount: Object.keys(memoryData.userPatterns || {}).length,
                    sessionsCount: (memoryData.sessionHistory || []).length
                }
            };
            
            return {
                success: true,
                data: exportData,
                size: JSON.stringify(exportData).length
            };
            
        } catch (error) {
            console.error('❌ Failed to export memory:', error);
            return { success: false, error: error.message };
        }
    }

    async importMemory(importData, mergeWithExisting = false) {
        try {
            console.log('📥 Importing memory data...');
            
            // Validate import data
            if (!importData.memory || !importData.exportVersion) {
                throw new Error('Invalid import data format');
            }
            
            let memoryToImport = importData.memory;
            
            if (mergeWithExisting) {
                const currentMemory = await this.loadMemory();
                memoryToImport = this.deepMerge(currentMemory, memoryToImport);
            }
            
            // Validate and repair imported memory
            const validatedMemory = this.validateAndRepairMemory(memoryToImport);
            
            // Save imported memory
            const saveResult = await this.saveMemory(validatedMemory, true);
            
            if (saveResult.success) {
                console.log('✅ Memory imported successfully');
                return {
                    success: true,
                    imported: importData.metadata || {},
                    timestamp: saveResult.timestamp
                };
            } else {
                throw new Error('Failed to save imported memory');
            }
            
        } catch (error) {
            console.error('❌ Failed to import memory:', error);
            return { success: false, error: error.message };
        }
    }

    // Clear all memory
    async clearMemory(keepPreferences = true) {
        try {
            console.log('🧹 Clearing memory...');
            
            let newMemory = this.createDefaultMemory();
            
            if (keepPreferences) {
                const currentMemory = await this.loadMemory();
                newMemory.preferences = currentMemory.preferences || newMemory.preferences;
            }
            
            await chrome.storage.local.remove([this.storageKey, this.backupKey]);
            const saveResult = await this.saveMemory(newMemory, false);
            
            console.log('✅ Memory cleared');
            
            return saveResult;
            
        } catch (error) {
            console.error('❌ Failed to clear memory:', error);
            return { success: false, error: error.message };
        }
    }

    // Memory analytics
    async getMemoryAnalytics() {
        try {
            const memoryData = await this.loadMemory();
            const memoryString = JSON.stringify(memoryData);
            
            const analytics = {
                totalSize: memoryString.length,
                sizeFormatted: this.formatBytes(memoryString.length),
                maxSize: this.maxMemorySize,
                maxSizeFormatted: this.formatBytes(this.maxMemorySize),
                usagePercentage: (memoryString.length / this.maxMemorySize) * 100,
                
                // Data breakdown
                breakdown: {
                    learnedSites: Object.keys(memoryData.learnedSites || {}).length,
                    userPatterns: Object.keys(memoryData.userPatterns || {}).length,
                    voiceCommands: Object.keys(memoryData.voiceCommands || {}).length,
                    sessionHistory: (memoryData.sessionHistory || []).length,
                    learningPatterns: (memoryData.learningData?.patterns || []).length
                },
                
                // Size by section
                sectionSizes: this.calculateSectionSizes(memoryData),
                
                // Timestamps
                createdAt: memoryData.createdAt,
                lastUpdated: memoryData.lastUpdated,
                lastSaved: this.lastSave,
                
                // Health metrics
                health: {
                    hasBackup: await this.hasBackup(),
                    autoSaveEnabled: !!this.autoSaveTimer,
                    isDirty: this.isDirty,
                    corruptionRisk: this.calculateCorruptionRisk(memoryData)
                }
            };
            
            return { success: true, analytics };
            
        } catch (error) {
            console.error('❌ Failed to get memory analytics:', error);
            return { success: false, error: error.message };
        }
    }

    calculateSectionSizes(memoryData) {
        const sections = {};
        
        Object.keys(memoryData).forEach(key => {
            sections[key] = JSON.stringify(memoryData[key]).length;
        });
        
        return sections;
    }

    calculateCorruptionRisk(memoryData) {
        let risk = 0;
        
        // Check for missing critical fields
        if (!memoryData.preferences) risk += 0.2;
        if (!memoryData.statistics) risk += 0.2;
        if (!memoryData.version) risk += 0.1;
        
        // Check for data inconsistencies
        const stats = memoryData.statistics || {};
        if (stats.successfulInteractions > stats.totalInteractions) risk += 0.3;
        if (stats.sitesLearned !== Object.keys(memoryData.learnedSites || {}).length) risk += 0.2;
        
        return Math.min(risk, 1.0);
    }

    async hasBackup() {
        try {
            const result = await chrome.storage.local.get([this.backupKey]);
            return !!result[this.backupKey];
        } catch {
            return false;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Utility functions
    deepMerge(target, source) {
        const result = { ...target };
        
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        });
        
        return result;
    }

    // Memory optimization
    async optimizeMemory() {
        try {
            console.log('🔧 Optimizing memory...');
            
            const currentMemory = await this.loadMemory();
            const optimizedMemory = await this.compactMemory(currentMemory);
            
            // Additional optimizations
            optimizedMemory.lastOptimized = Date.now();
            
            // Remove duplicate patterns
            if (optimizedMemory.userPatterns) {
                optimizedMemory.userPatterns = this.removeDuplicatePatterns(optimizedMemory.userPatterns);
            }
            
            // Merge similar learned sites
            if (optimizedMemory.learnedSites) {
                optimizedMemory.learnedSites = this.mergeSimilarSites(optimizedMemory.learnedSites);
            }
            
            const saveResult = await this.saveMemory(optimizedMemory, true);
            
            console.log('✅ Memory optimization complete');
            
            return saveResult;
            
        } catch (error) {
            console.error('❌ Memory optimization failed:', error);
            return { success: false, error: error.message };
        }
    }

    removeDuplicatePatterns(patterns) {
        const unique = {};
        const seen = new Set();
        
        Object.entries(patterns).forEach(([key, pattern]) => {
            const signature = JSON.stringify({
                intent: pattern.intent,
                domain: pattern.domain,
                command: pattern.command?.toLowerCase()
            });
            
            if (!seen.has(signature)) {
                seen.add(signature);
                unique[key] = pattern;
            }
        });
        
        return unique;
    }

    mergeSimilarSites(sites) {
        const merged = {};
        
        Object.entries(sites).forEach(([domain, siteData]) => {
            // For now, just keep all sites but could implement domain similarity logic
            merged[domain] = siteData;
        });
        
        return merged;
    }

    // Memory health monitoring
    async performHealthCheck() {
        try {
            const analytics = await this.getMemoryAnalytics();
            
            if (!analytics.success) {
                return { success: false, error: 'Failed to get analytics' };
            }
            
            const health = analytics.analytics.health;
            const issues = [];
            const recommendations = [];
            
            // Check for issues
            if (!health.hasBackup) {
                issues.push('No backup available');
                recommendations.push('Create a backup to prevent data loss');
            }
            
            if (health.corruptionRisk > 0.3) {
                issues.push('High corruption risk detected');
                recommendations.push('Run memory optimization to fix inconsistencies');
            }
            
            if (analytics.analytics.usagePercentage > 80) {
                issues.push('Memory usage is high');
                recommendations.push('Consider clearing old data or optimizing memory');
            }
            
            if (health.isDirty && (Date.now() - this.lastSave) > 60000) {
                issues.push('Unsaved changes detected');
                recommendations.push('Save memory to prevent data loss');
            }
            
            return {
                success: true,
                health: {
                    score: this.calculateHealthScore(issues.length),
                    status: issues.length === 0 ? 'healthy' : issues.length < 3 ? 'warning' : 'critical',
                    issues,
                    recommendations,
                    lastCheck: Date.now()
                }
            };
            
        } catch (error) {
            console.error('❌ Health check failed:', error);
            return { success: false, error: error.message };
        }
    }

    calculateHealthScore(issueCount) {
        return Math.max(0, 100 - (issueCount * 25));
    }

    // Cleanup and shutdown
    async cleanup() {
        try {
            console.log('🧹 Cleaning up Memory Manager...');
            
            // Stop auto-save
            this.stopAutoSave();
            
            // Save any pending changes
            if (this.isDirty) {
                const currentMemory = await this.loadMemory();
                await this.saveMemory(currentMemory, false);
            }
            
            console.log('✅ Memory Manager cleanup complete');
            
        } catch (error) {
            console.error('❌ Memory Manager cleanup failed:', error);
        }
    }

    // Get current status
    getStatus() {
        return {
            isInitialized: !!this.autoSaveTimer,
            isDirty: this.isDirty,
            lastSave: this.lastSave,
            autoSaveEnabled: !!this.autoSaveTimer,
            autoSaveInterval: this.autoSaveInterval,
            maxMemorySize: this.maxMemorySize,
            storageKeys: {
                main: this.storageKey,
                backup: this.backupKey
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryManager;
} else {
    window.MemoryManager = MemoryManager;
}

console.log('💾 Memory Manager Module Loaded');