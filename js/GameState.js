// GameState.js - Handles game state management, initialization, and save/load functionality

export class GameState {
    constructor() {
        this.state = {
            worldsCreated: 0,
            machineComplexity: 0,
            worldHistory: [], // Track created worlds
            resources: {
                heat: 0,
                fuel: 0,
                pressure: 0,
                energy: 0,
                stability: 0,
                water: 0,
                oxygen: 0,
                stone: 0,
                magma: 0,
                ice: 0,
                crystal: 0,
                voidEnergy: 0
            },
            upgrades: {
                heatGenerator: { level: 0, maxLevel: 10, baseCost: 10 },
                fuelEfficiency: { level: 0, maxLevel: 10, baseCost: 15 },
                // Cross-Resource Upgrades (Phase 2)
                thermalAccelerator: { level: 0, maxLevel: 5, baseCost: 25, unlocked: false, requiresHeat: 3, requiresPressure: 30 },
                fuelSynchronizer: { level: 0, maxLevel: 5, baseCost: 30, unlocked: false, requiresFuel: 5, requiresEnergy: 20 },
                pressureValve: { level: 0, maxLevel: 5, baseCost: 35, unlocked: false, requiresStability: 15, requiresPressure: 50 },
                energyMatrix: { level: 0, maxLevel: 5, baseCost: 40, unlocked: false, requiresHeat: 7, requiresFuel: 8 }
            },
            currentWorld: null, // Will be set to Desert Planet initially
            unlockedWorlds: [0], // Desert Planet unlocked by default
            worldProgress: 0, // Current world index (0 = Desert Planet)
            machineParts: [],
            // RNG Event System (Phase 2 Step 3)
            activeEvents: [],
            eventHistory: [],
            permanentBonuses: {
                resourceEfficiency: 1.0, // Multiplier for all resources
                upgradeCostReduction: 1.0 // Multiplier for upgrade costs
            },
            // Legacy systems removed - using structured world progression instead
            // Achievements System
            achievements: {
                unlocked: [],
                progress: {},
                definitions: {
                    1: { name: "First Steps", description: "Generate your first Heat", reward: "+5% Heat generation", requirement: { type: "resource", resource: "heat", amount: 1 } },
                    2: { name: "Fuel Finder", description: "Generate your first Fuel", reward: "+5% Fuel generation", requirement: { type: "resource", resource: "fuel", amount: 1 } },
                    3: { name: "First Upgrade", description: "Purchase your first upgrade", reward: "+2% upgrade efficiency", requirement: { type: "upgrade", count: 1 } },
                    4: { name: "Heat Wave", description: "Reach 100 Heat", reward: "+10% Heat generation", requirement: { type: "resource", resource: "heat", amount: 100 } },
                    5: { name: "Fuel Tank", description: "Reach 100 Fuel", reward: "+8% Fuel generation", requirement: { type: "resource", resource: "fuel", amount: 100 } },
                    6: { name: "World Builder", description: "Create your first world", reward: "Unlock world bonuses", requirement: { type: "worlds", amount: 1 } },
                    7: { name: "Pressure Rising", description: "Reach 50 Pressure", reward: "+15% Pressure generation", requirement: { type: "resource", resource: "pressure", amount: 50 } },
                    8: { name: "Energy Seeker", description: "Reach 25 Energy", reward: "+12% Energy generation", requirement: { type: "resource", resource: "energy", amount: 25 } },
                    9: { name: "Stability Master", description: "Reach 20 Stability", reward: "+10% Stability generation", requirement: { type: "resource", resource: "stability", amount: 20 } },
                    10: { name: "Heat Master", description: "Reach 1000 Heat", reward: "+20% Heat generation", requirement: { type: "resource", resource: "heat", amount: 1000 } },
                    11: { name: "Fuel Depot", description: "Reach 500 Fuel", reward: "+15% Fuel generation", requirement: { type: "resource", resource: "fuel", amount: 500 } },
                    12: { name: "Upgrader", description: "Purchase 5 upgrades", reward: "+5% upgrade efficiency", requirement: { type: "upgrade", count: 5 } },
                    13: { name: "World Collector", description: "Create 5 worlds", reward: "Unlock Tier 2 worlds", requirement: { type: "worlds", amount: 5 } },
                    14: { name: "Pressure Cooker", description: "Reach maximum Pressure (100)", reward: "+25% Pressure conversion", requirement: { type: "resource", resource: "pressure", amount: 100 } },
                    15: { name: "Energy Core", description: "Reach 100 Energy", reward: "+20% Energy generation", requirement: { type: "resource", resource: "energy", amount: 100 } },
                    16: { name: "Synergy User", description: "Activate Heat+Pressure synergy", reward: "+10% synergy bonus", requirement: { type: "synergy", synergy: "heat_pressure", count: 1 } },
                    17: { name: "Dimension Hopper", description: "Create 25 worlds", reward: "Unlock World Generator", requirement: { type: "worlds", amount: 25 } },
                    18: { name: "Mega Heat", description: "Reach 10,000 Heat", reward: "+30% Heat generation", requirement: { type: "resource", resource: "heat", amount: 10000 } },
                    19: { name: "Fuel Empire", description: "Reach 5,000 Fuel", reward: "+25% Fuel generation", requirement: { type: "resource", resource: "fuel", amount: 5000 } },
                    20: { name: "Upgrade Master", description: "Purchase 10 upgrades", reward: "+10% upgrade efficiency", requirement: { type: "upgrade", count: 10 } },
                    21: { name: "World Factory", description: "Create 25 worlds", reward: "Unlock Tier 3 worlds", requirement: { type: "worlds", amount: 25 } },
                    22: { name: "Stability Fortress", description: "Reach 100 Stability", reward: "+30% Stability generation", requirement: { type: "resource", resource: "stability", amount: 100 } },
                    23: { name: "Synergy Master", description: "Activate synergies 100 times", reward: "+25% synergy effectiveness", requirement: { type: "synergy", count: 100 } },
                    24: { name: "Heat Titan", description: "Reach 100,000 Heat", reward: "+50% Heat generation", requirement: { type: "resource", resource: "heat", amount: 100000 } },
                    25: { name: "Fuel Ocean", description: "Reach 50,000 Fuel", reward: "+40% Fuel generation", requirement: { type: "resource", resource: "fuel", amount: 50000 } },
                    26: { name: "Upgrade Legend", description: "Max out all basic upgrades", reward: "Unlock legendary upgrades", requirement: { type: "upgrade", maxed: ["heatGenerator", "fuelEfficiency"] } },
                    27: { name: "Universe Builder", description: "Create 75 worlds", reward: "Unlock universe mode", requirement: { type: "worlds", amount: 75 } },
                    28: { name: "Pressure God", description: "Convert 1000 Pressure to Heat", reward: "+50% Pressure conversion", requirement: { type: "conversion", type: "pressure_to_heat", amount: 1000 } },
                    29: { name: "Energy Nexus", description: "Reach 1000 Energy", reward: "+40% Energy generation", requirement: { type: "resource", resource: "energy", amount: 1000 } },
                    30: { name: "Perfect Balance", description: "Have all resources above 1000", reward: "+25% all generation", requirement: { type: "balance", resources: ["heat", "fuel", "pressure", "energy", "stability"], amount: 1000 } },
                    31: { name: "Speed Runner", description: "Unlock World Generator in under 1 hour", reward: "+100% early game speed", requirement: { type: "speed", achievement: 17, time: 3600 } },
                    32: { name: "Efficiency Expert", description: "Reach 500% upgrade efficiency", reward: "+50% efficiency cap", requirement: { type: "stat", stat: "upgradeEfficiency", amount: 5.0 } },
                    33: { name: "World Architect", description: "Create worlds with all biome types", reward: "Unlock custom worlds", requirement: { type: "variety", category: "biomes", count: 10 } },
                    34: { name: "Resource Hoarder", description: "Have 1M total resources", reward: "+20% resource storage", requirement: { type: "total", resources: "all", amount: 1000000 } },
                    35: { name: "Upgrade Collector", description: "Own all possible upgrades", reward: "+30% upgrade effectiveness", requirement: { type: "collection", category: "upgrades", percentage: 100 } },
                    36: { name: "Hidden Power", description: "???", reward: "???", requirement: { type: "secret", code: "MACHINE_POWER" }, hidden: true },
                    37: { name: "Time Master", description: "Play for 24 hours total", reward: "+50% offline progress", requirement: { type: "playtime", amount: 86400 } },
                    38: { name: "Click Master", description: "Generate resources 1000 times", reward: "+25% manual generation", requirement: { type: "clicks", amount: 1000 } },
                    39: { name: "Reset Veteran", description: "Reset your game 3 times", reward: "+100% reset bonuses", requirement: { type: "resets", amount: 3 } },
                    40: { name: "Achievement Hunter", description: "Unlock 25 achievements", reward: "+50% achievement bonuses", requirement: { type: "achievements", amount: 25 } },
                    41: { name: "Mega Worlds", description: "Create 150 worlds", reward: "Unlock mega worlds", requirement: { type: "worlds", amount: 150 } },
                    42: { name: "Heat Infinity", description: "Reach 1M Heat", reward: "+100% Heat generation", requirement: { type: "resource", resource: "heat", amount: 1000000 } },
                    43: { name: "Fuel Cosmos", description: "Reach 1M Fuel", reward: "+100% Fuel generation", requirement: { type: "resource", resource: "fuel", amount: 1000000 } },
                    44: { name: "Ultimate Builder", description: "Create 250 worlds", reward: "Unlock ultimate mode", requirement: { type: "worlds", amount: 250 } },
                    45: { name: "Perfect Synergy", description: "Have all synergies active", reward: "+100% synergy power", requirement: { type: "synergy", all: true } },
                    46: { name: "Resource God", description: "Have all resources above 100K", reward: "+75% all generation", requirement: { type: "balance", resources: ["heat", "fuel", "pressure", "energy", "stability"], amount: 100000 } },
                    47: { name: "Legendary Status", description: "Reach maximum level in everything", reward: "Unlock prestige mode", requirement: { type: "completion", percentage: 100 } },
                    48: { name: "Secret Keeper", description: "???", reward: "???", requirement: { type: "secret", code: "WORLD_MACHINE" }, hidden: true },
                    49: { name: "Time Lord", description: "Play for 7 days total", reward: "+200% time bonuses", requirement: { type: "playtime", amount: 604800 } },
                    50: { name: "Master of Worlds", description: "Complete all other achievements", reward: "Master title + 1000% all bonuses", requirement: { type: "completion", achievements: 69 } },
                    
                    // New Achievement Variety - Conversion & Efficiency
                    51: { name: "Conversion Expert", description: "Convert 500 Pressure to Heat", reward: "Unlock auto-conversion", requirement: { type: "conversion", from: "pressure", to: "heat", amount: 500 } },
                    52: { name: "Energy Converter", description: "Convert 200 Energy to Fuel", reward: "+50% conversion efficiency", requirement: { type: "conversion", from: "energy", to: "fuel", amount: 200 } },
                    53: { name: "Efficiency Master", description: "Reach 3:1 Heat to Fuel ratio", reward: "Unlock ratio bonuses", requirement: { type: "ratio", resources: ["heat", "fuel"], ratio: [3, 1] } },
                    54: { name: "Resource Optimizer", description: "Maintain 2:1:1 Heat:Fuel:Pressure for 5 minutes", reward: "+25% balanced generation", requirement: { type: "maintain", resources: ["heat", "fuel", "pressure"], ratio: [2, 1, 1], duration: 300 } },
                    
                    // Streak & Consistency Achievements
                    55: { name: "Daily Dedication", description: "Play for 7 consecutive days", reward: "Unlock daily bonuses", requirement: { type: "streak", category: "daily", count: 7 } },
                    56: { name: "Resource Streak", description: "Generate resources for 100 consecutive game updates", reward: "+30% continuous generation", requirement: { type: "streak", category: "generation", count: 100 } },
                    57: { name: "Upgrade Spree", description: "Purchase 5 upgrades within 60 seconds", reward: "Unlock bulk purchasing", requirement: { type: "speed", category: "upgrades", count: 5, time: 60 } },
                    
                    // Discovery & Strategy Achievements
                    58: { name: "Explorer", description: "Discover all resource generation methods", reward: "Resource generation overview", requirement: { type: "discovery", category: "generation", count: 5 } },
                    59: { name: "Strategist", description: "Reach 1000 Heat using only manual generation", reward: "Manual generation x2", requirement: { type: "challenge", method: "manual", resource: "heat", amount: 1000 } },
                    60: { name: "Multi-tasker", description: "Have 5+ resources generating simultaneously", reward: "+20% parallel efficiency", requirement: { type: "simultaneous", category: "generation", count: 5 } },
                    
                    // Quality of Life Rewards
                    61: { name: "Storage Expert", description: "Reach resource caps 10 times", reward: "+50% all resource caps", requirement: { type: "caps", category: "reached", count: 10 } },
                    62: { name: "Automation Lover", description: "Use auto-features for 1 hour total", reward: "Unlock advanced automation", requirement: { type: "usage", category: "automation", duration: 3600 } },
                    63: { name: "Interface Master", description: "Visit all game pages 20+ times each", reward: "Unlock quick navigation", requirement: { type: "navigation", category: "all_pages", count: 20 } },
                    
                    // Challenge & Constraint Achievements
                    64: { name: "Minimalist", description: "Create 10 worlds with only 2 upgrade types", reward: "Upgrade efficiency +100%", requirement: { type: "constraint", category: "upgrades", max: 2, goal: { type: "worlds", amount: 10 } } },
                    65: { name: "Speed Builder", description: "Create 5 worlds in under 10 minutes", reward: "World creation speed +200%", requirement: { type: "speed", category: "worlds", count: 5, time: 600 } },
                    
                    // Tier-Specific Progression Achievements
                    66: { name: "Enhanced Explorer", description: "Create your first Enhanced World (Tier 2)", reward: "+15% Tier 2 world bonuses", requirement: { type: "tier", tier: 2, worldsCreated: 1 } },
                    67: { name: "Enhanced Master", description: "Create 10 Enhanced Worlds", reward: "+25% Tier 2 world generation", requirement: { type: "tier", tier: 2, worldsCreated: 10 } },
                    68: { name: "Exotic Pioneer", description: "Create your first Exotic World (Tier 3)", reward: "+20% Tier 3 world bonuses", requirement: { type: "tier", tier: 3, worldsCreated: 1 } },
                    69: { name: "Reality Bender", description: "Create 5 Exotic Worlds", reward: "Unlock reality manipulation", requirement: { type: "tier", tier: 3, worldsCreated: 5 } },
                    70: { name: "Tier Master", description: "Create worlds from all tiers", reward: "+50% cross-tier synergy", requirement: { type: "tierVariety", tiers: [1, 2, 3], minEach: 3 } }
                }
            },
            // Settings System
            settings: {
                theme: 'dark',
                showResourceDescriptions: true,
                animateProgressBars: true,
                showDetailedTooltips: true,
                autoSaveInterval: 30, // Save every 30 seconds
                showEfficiencyNumbers: true,
                confirmDangerousActions: true,
                showTutorialMessages: true,
                soundEffects: false,
                backgroundMusic: false,
                volume: 50
            }
        };
        
        // Ensure state structure is valid
        this.validateAndFixState();
    }

    getState() {
        return this.state;
    }

    // Method to safely add resources and trigger save
    addResources(resourceDeltas, shouldSave = false) {
        for (const [resource, amount] of Object.entries(resourceDeltas)) {
            if (this.state.resources.hasOwnProperty(resource)) {
                this.state.resources[resource] += amount;
            } else {
                // Initialize new resource types dynamically
                this.state.resources[resource] = amount;
            }
        }
        
        // Apply resource caps after adding
        this.enforceResourceCaps();
        
        // Check for world unlocks after adding resources
        if (window.game && window.game.worldSystem) {
            const worldUnlock = window.game.worldSystem.checkWorldUnlocks();
            if (worldUnlock && window.game.uiSystem) {
                window.game.uiSystem.showNotification(worldUnlock.message);
            }
        }
        
        // Optionally trigger save for important resource changes
        if (shouldSave) {
            this.saveGame();
        }
    }

    // Apply resource caps to ensure resources don't exceed limits
    enforceResourceCaps() {
        const world = this.state.currentWorld;
        
        // Default caps
        let caps = {
            heat: Infinity,        // Heat has no cap
            fuel: Infinity,        // Fuel has no cap
            pressure: 100,         // Pressure cap
            energy: 200,           // Energy cap
            stability: 50          // Stability cap
        };
        
        // Check for Infinite world special effects
        if (world && world.specialEffects && world.specialEffects.effects && 
            world.specialEffects.effects.special === 'noResourceLimits') {
            caps.pressure = 200;   // Double pressure cap for Infinite worlds
            caps.energy = 400;     // Double energy cap for Infinite worlds
            caps.stability = 100;  // Double stability cap for Infinite worlds
        }
        
        // Apply caps to all limited resources
        let capsApplied = false;
        for (const [resource, cap] of Object.entries(caps)) {
            if (cap !== Infinity && this.state.resources[resource] > cap) {
                this.state.resources[resource] = cap;
                capsApplied = true;
            }
            
            // Also ensure no negative values
            if (this.state.resources[resource] < 0) {
                this.state.resources[resource] = 0;
                capsApplied = true;
            }
        }
        
        return capsApplied;
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
    }

    saveGame() {
        try {
            // Create backup before saving
            this.createBackup();
            
            const gameData = JSON.stringify(this.state);
            localStorage.setItem('machineOfWorldsSave', gameData);
            
            // Clean up old backups (keep only last 3)
            this.cleanupOldBackups();
            
        } catch (error) {
            console.error('Error saving game:', error);
            // Try to restore from backup if save fails
            this.restoreFromBackup();
            throw error;
        }
    }

    // Create a timestamped backup of current save
    createBackup() {
        try {
            const currentSave = localStorage.getItem('machineOfWorldsSave');
            if (currentSave) {
                const timestamp = Date.now();
                const backupKey = `machineOfWorldsBackup_${timestamp}`;
                localStorage.setItem(backupKey, currentSave);
                
                // Store backup metadata
                const backups = this.getBackupList();
                backups.push({
                    key: backupKey,
                    timestamp: timestamp,
                    date: new Date(timestamp).toISOString()
                });
                localStorage.setItem('machineOfWorldsBackups', JSON.stringify(backups));
            }
        } catch (error) {
            console.error('Error creating backup:', error);
        }
    }

    // Get list of available backups
    getBackupList() {
        try {
            const backupsData = localStorage.getItem('machineOfWorldsBackups');
            return backupsData ? JSON.parse(backupsData) : [];
        } catch (error) {
            console.error('Error getting backup list:', error);
            return [];
        }
    }

    // Clean up old backups, keeping only the most recent ones
    cleanupOldBackups(maxBackups = 3) {
        try {
            const backups = this.getBackupList();
            
            if (backups.length > maxBackups) {
                // Sort by timestamp (newest first)
                backups.sort((a, b) => b.timestamp - a.timestamp);
                
                // Remove old backups
                const backupsToRemove = backups.slice(maxBackups);
                backupsToRemove.forEach(backup => {
                    localStorage.removeItem(backup.key);
                });
                
                // Update backup list
                const keepBackups = backups.slice(0, maxBackups);
                localStorage.setItem('machineOfWorldsBackups', JSON.stringify(keepBackups));
            }
        } catch (error) {
            console.error('Error cleaning up backups:', error);
        }
    }

    // Restore from the most recent backup
    restoreFromBackup() {
        try {
            const backups = this.getBackupList();
            if (backups.length === 0) {
                console.warn('No backups available to restore from');
                return false;
            }
            
            // Get the most recent backup
            backups.sort((a, b) => b.timestamp - a.timestamp);
            const latestBackup = backups[0];
            
            const backupData = localStorage.getItem(latestBackup.key);
            if (backupData) {
                // Validate backup data before restoring
                const parsedBackup = JSON.parse(backupData);
                if (this.validateSaveData(parsedBackup)) {
                    localStorage.setItem('machineOfWorldsSave', backupData);
                    console.log('Successfully restored from backup:', latestBackup.date);
                    return true;
                } else {
                    console.error('Backup validation failed');
                    return false;
                }
            }
        } catch (error) {
            console.error('Error restoring from backup:', error);
            return false;
        }
        return false;
    }

    // Restore from a specific backup by timestamp
    restoreFromSpecificBackup(timestamp) {
        try {
            const backupKey = `machineOfWorldsBackup_${timestamp}`;
            const backupData = localStorage.getItem(backupKey);
            
            if (backupData) {
                // Validate backup data before restoring
                const parsedBackup = JSON.parse(backupData);
                if (this.validateSaveData(parsedBackup)) {
                    // Create a backup of current state before restoring
                    this.createBackup();
                    
                    localStorage.setItem('machineOfWorldsSave', backupData);
                    console.log('Successfully restored from backup:', new Date(timestamp).toISOString());
                    return true;
                } else {
                    console.error('Backup validation failed');
                    return false;
                }
            } else {
                console.error('Backup not found');
                return false;
            }
        } catch (error) {
            console.error('Error restoring from specific backup:', error);
            return false;
        }
    }

    loadGame() {
        const savedData = localStorage.getItem('machineOfWorldsSave');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                
                // Validate save data integrity
                if (!this.validateSaveData(parsedData)) {
                    console.error('Save data validation failed - attempting backup recovery');
                    
                    // Try to restore from backup
                    if (this.restoreFromBackup()) {
                        // Retry loading after backup restoration
                        return this.loadGame();
                    } else {
                        console.error('Backup recovery failed - using default state');
                        return false;
                    }
                }
                
                // Create backup of current state before loading
                this.createBackup();
                
                // Store current state as fallback
                const fallbackState = JSON.parse(JSON.stringify(this.state));
                
                // Merge saved data with current state structure to handle new properties
                this.state = {
                    ...this.state,
                    ...parsedData,
                    // Ensure upgrades structure is properly merged
                    upgrades: {
                        ...this.state.upgrades,
                        ...parsedData.upgrades
                    },
                    // Ensure resources structure is properly merged
                    resources: {
                        ...this.state.resources,
                        ...parsedData.resources
                    },
                    // Ensure currentWorld is preserved
                    currentWorld: parsedData.currentWorld || this.state.currentWorld,
                    // Ensure new properties exist even in old saves
                    permanentBonuses: {
                        ...this.state.permanentBonuses,
                        ...parsedData.permanentBonuses
                    },
                    worldTiers: {
                        ...this.state.worldTiers,
                        ...parsedData.worldTiers
                    },
                    unlocks: {
                        ...this.state.unlocks,
                        ...parsedData.unlocks
                    },
                    achievements: {
                        ...this.state.achievements,
                        ...parsedData.achievements
                    },
                    settings: {
                        ...this.state.settings,
                        ...parsedData.settings
                    },
                    // Ensure worldHistory exists (for compatibility with old saves)
                    worldHistory: parsedData.worldHistory || []
                };
                
                try {
                    // Validate state structure and fix any missing properties
                    this.validateAndFixState();
                    
                    return true;
                } catch (stateError) {
                    console.error('Error validating loaded state:', stateError);
                    
                    // Restore fallback state if validation fails
                    this.state = fallbackState;
                    
                    // Try to restore from backup as last resort
                    if (this.restoreFromBackup()) {
                        console.log('Recovered using backup after state validation failure');
                        return this.loadGame(); // Retry loading
                    } else {
                        throw stateError;
                    }
                }
                
            } catch (error) {
                console.error('Error loading saved game:', error);
                
                // Try to restore from backup as final fallback
                if (this.restoreFromBackup()) {
                    console.log('Attempting backup recovery after load failure');
                    return this.loadGame(); // Retry loading
                }
                
                return false;
            }
        }
        return false;
    }

    // Validate save data integrity to prevent corruption
    validateSaveData(data) {
        // Check if data is an object
        if (!data || typeof data !== 'object') {
            console.error('Save data is not a valid object');
            return false;
        }

        // Check for required top-level properties
        const requiredProperties = ['worldsCreated', 'resources', 'upgrades'];
        for (const prop of requiredProperties) {
            if (!(prop in data)) {
                console.error(`Missing required property: ${prop}`);
                return false;
            }
        }

        // Validate numeric properties
        if (typeof data.worldsCreated !== 'number' || data.worldsCreated < 0) {
            console.error('Invalid worldsCreated value');
            return false;
        }

        // Validate resources object
        if (!data.resources || typeof data.resources !== 'object') {
            console.error('Invalid resources object');
            return false;
        }

        // Validate resource values are numbers and non-negative
        const resourceTypes = ['heat', 'fuel', 'pressure', 'energy', 'stability'];
        for (const resource of resourceTypes) {
            if (data.resources[resource] !== undefined) {
                const value = data.resources[resource];
                if (typeof value !== 'number' || value < 0 || !isFinite(value)) {
                    console.error(`Invalid resource value for ${resource}: ${value}`);
                    return false;
                }
            }
        }

        // Validate upgrades object
        if (!data.upgrades || typeof data.upgrades !== 'object') {
            console.error('Invalid upgrades object');
            return false;
        }

        // Validate upgrade levels
        for (const [upgradeName, upgrade] of Object.entries(data.upgrades)) {
            if (upgrade && typeof upgrade === 'object') {
                if (upgrade.level !== undefined) {
                    if (typeof upgrade.level !== 'number' || upgrade.level < 0 || !isFinite(upgrade.level)) {
                        console.error(`Invalid upgrade level for ${upgradeName}: ${upgrade.level}`);
                        return false;
                    }
                }
            }
        }

        // Validate world history if present
        if (data.worldHistory && !Array.isArray(data.worldHistory)) {
            console.error('Invalid worldHistory - must be an array');
            return false;
        }

        // All validations passed
        return true;
    }

    validateAndFixState() {
        // Migrate old saves: if worldHistory is empty but worldsCreated > 0, create placeholder history
        if ((!this.state.worldHistory || this.state.worldHistory.length === 0) && this.state.worldsCreated > 0) {
            this.state.worldHistory = [];
            for (let i = 1; i <= this.state.worldsCreated; i++) {
                this.state.worldHistory.push({
                    id: i,
                    type: 'Desert', // Placeholder type
                    tier: 1,
                    gravity: 1.0,
                    timeSpeed: 1.0,
                    temperature: 25,
                    atmosphere: 50,
                    weather: 'Calm',
                    weatherDuration: 10,
                    createdAt: Date.now() - (this.state.worldsCreated - i) * 60000 // Fake timestamps
                });
            }
        }
        
        // Ensure worldHistory exists
        if (!this.state.worldHistory) {
            this.state.worldHistory = [];
        }

        
        // Ensure all required upgrade properties exist
        const defaultUpgrades = {
            heatGenerator: { level: 0, maxLevel: 10, baseCost: 10 },
            fuelEfficiency: { level: 0, maxLevel: 10, baseCost: 15 },
            thermalAccelerator: { level: 0, maxLevel: 5, baseCost: 25, unlocked: false, requiresHeat: 3, requiresPressure: 30 },
            fuelSynchronizer: { level: 0, maxLevel: 5, baseCost: 30, unlocked: false, requiresFuel: 5, requiresEnergy: 20 },
            pressureValve: { level: 0, maxLevel: 5, baseCost: 35, unlocked: false, requiresStability: 15, requiresPressure: 50 },
            energyMatrix: { level: 0, maxLevel: 5, baseCost: 40, unlocked: false, requiresHeat: 7, requiresFuel: 8 }
        };

        // Fix any missing upgrade properties
        for (const [key, defaultUpgrade] of Object.entries(defaultUpgrades)) {
            if (!this.state.upgrades[key]) {
                this.state.upgrades[key] = { ...defaultUpgrade };
            } else {
                // Ensure all properties exist
                const before = { ...this.state.upgrades[key] };
                this.state.upgrades[key] = { ...defaultUpgrade, ...this.state.upgrades[key] };
              
            }
        }

        // Ensure activeEvents array exists
        if (!this.state.activeEvents) {
            this.state.activeEvents = [];
        }

        // Ensure all required resources exist
        const defaultResources = { heat: 0, fuel: 0, pressure: 0, energy: 0, stability: 0 };
        this.state.resources = { ...defaultResources, ...this.state.resources };
    }

    resetGame() {
        const confirmReset = confirm('Are you sure you want to reset your progress? This cannot be undone.');
        if (confirmReset) {
            localStorage.removeItem('machineOfWorldsSave');
            // Reset to initial state
            this.state = new GameState().state;
            return true;
        }
        return false;
    }

    // Debug function to force clear localStorage and reset
    forceClearAndReset() {

        localStorage.removeItem('machineOfWorldsSave');
        // Create a fresh state
        const freshGameState = new GameState();
        this.state = freshGameState.state
    }
}
