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
                stability: 0
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
            currentWorld: {
                type: 'Desert',
                tier: 1,
                gravity: 1.0,
                timeSpeed: 1.0,
                temperature: 25,
                atmosphere: 50,
                weather: 'Calm',
                weatherDuration: 10
            },
            machineParts: [],
            // RNG Event System (Phase 2 Step 3)
            activeEvents: [],
            eventHistory: [],
            permanentBonuses: {
                resourceEfficiency: 1.0, // Multiplier for all resources
                upgradeCostReduction: 1.0 // Multiplier for upgrade costs
            },
            // World Tier System (Phase 2 Step 4)
            worldTiers: {
                tier1Unlocked: true,
                tier2Unlocked: false,
                tier3Unlocked: false
            },
            // Unlocks System
            unlocks: {
                worldGenerator: false // Unlocked after creating 25 worlds
            },
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
                    21: { name: "World Factory", description: "Create 50 worlds", reward: "Unlock Tier 3 worlds", requirement: { type: "worlds", amount: 50 } },
                    22: { name: "Stability Fortress", description: "Reach 100 Stability", reward: "+30% Stability generation", requirement: { type: "resource", resource: "stability", amount: 100 } },
                    23: { name: "Synergy Master", description: "Activate synergies 100 times", reward: "+25% synergy effectiveness", requirement: { type: "synergy", count: 100 } },
                    24: { name: "Heat Titan", description: "Reach 100,000 Heat", reward: "+50% Heat generation", requirement: { type: "resource", resource: "heat", amount: 100000 } },
                    25: { name: "Fuel Ocean", description: "Reach 50,000 Fuel", reward: "+40% Fuel generation", requirement: { type: "resource", resource: "fuel", amount: 50000 } },
                    26: { name: "Upgrade Legend", description: "Max out all basic upgrades", reward: "Unlock legendary upgrades", requirement: { type: "upgrade", maxed: ["heatGenerator", "fuelEfficiency"] } },
                    27: { name: "Universe Builder", description: "Create 100 worlds", reward: "Unlock universe mode", requirement: { type: "worlds", amount: 100 } },
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
                    41: { name: "Mega Worlds", description: "Create 500 worlds", reward: "Unlock mega worlds", requirement: { type: "worlds", amount: 500 } },
                    42: { name: "Heat Infinity", description: "Reach 1M Heat", reward: "+100% Heat generation", requirement: { type: "resource", resource: "heat", amount: 1000000 } },
                    43: { name: "Fuel Cosmos", description: "Reach 1M Fuel", reward: "+100% Fuel generation", requirement: { type: "resource", resource: "fuel", amount: 1000000 } },
                    44: { name: "Ultimate Builder", description: "Create 1000 worlds", reward: "Unlock ultimate mode", requirement: { type: "worlds", amount: 1000 } },
                    45: { name: "Perfect Synergy", description: "Have all synergies active", reward: "+100% synergy power", requirement: { type: "synergy", all: true } },
                    46: { name: "Resource God", description: "Have all resources above 100K", reward: "+75% all generation", requirement: { type: "balance", resources: ["heat", "fuel", "pressure", "energy", "stability"], amount: 100000 } },
                    47: { name: "Legendary Status", description: "Reach maximum level in everything", reward: "Unlock prestige mode", requirement: { type: "completion", percentage: 100 } },
                    48: { name: "Secret Keeper", description: "???", reward: "???", requirement: { type: "secret", code: "WORLD_MACHINE" }, hidden: true },
                    49: { name: "Time Lord", description: "Play for 7 days total", reward: "+200% time bonuses", requirement: { type: "playtime", amount: 604800 } },
                    50: { name: "Master of Worlds", description: "Complete all other achievements", reward: "Master title + 1000% all bonuses", requirement: { type: "completion", achievements: 49 } }
                }
            },
            // Settings System
            settings: {
                theme: 'dark',
                showResourceDescriptions: true,
                animateProgressBars: true,
                showDetailedTooltips: true,
                autoSaveInterval: 60,
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

    updateState(newState) {
        this.state = { ...this.state, ...newState };
    }

    saveGame() {
        const gameData = JSON.stringify(this.state);
        localStorage.setItem('machineOfWorldsSave', gameData);
    }

    loadGame() {
        const savedData = localStorage.getItem('machineOfWorldsSave');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                
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
                    }
                };
                
                
                // Validate state structure and fix any missing properties
                this.validateAndFixState();
            
                return true;
            } catch (error) {
                console.error('Error loading saved game:', error);
                return false;
            }
        }
        return false;
    }

    validateAndFixState() {

        
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
        const beforeResources = { ...this.state.resources };
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
