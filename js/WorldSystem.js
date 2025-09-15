// WorldSystem.js - Handles world generation, world tiers, and world properties

export class WorldSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.worldTierDefinitions = this.initializeWorldTiers();
    }

    initializeWorldTiers() {
        return {
            tier1: {
                name: "Basic Worlds",
                types: ['Desert', 'Ocean', 'Forest', 'Mountain', 'Volcanic', 'Ice', 'Crystal', 'Void'],
                unlocked: true,
                propertyRanges: {
                    gravity: { min: 0.5, max: 2.5 },
                    timeSpeed: { min: 0.3, max: 2.0 },
                    temperature: { min: -50, max: 150 },
                    atmosphere: { min: 0, max: 100 }
                }
            },
            tier2: {
                name: "Enhanced Worlds",
                types: ['Plasma', 'Nebula', 'Toxic', 'Frozen', 'Quantum', 'Hybrid'],
                unlockRequirements: {
                    worldsCreated: 5, // Reduced from 25 to match achievement
                    basicUpgradesLevel3: 1, // Need 1 basic upgrade at level 3+ (more achievable)
                    totalResources: 500 // Alternative path: accumulate 500 total resources
                },
                propertyRanges: {
                    gravity: { min: 0.2, max: 3.5 },
                    timeSpeed: { min: 0.1, max: 3.0 },
                    temperature: { min: -100, max: 300 },
                    atmosphere: { min: 0, max: 150 }
                }
            },
            tier3: {
                name: "Exotic Worlds",
                types: ['Dimensional', 'Singularity', 'Living', 'Infinite'],
                unlockRequirements: {
                    worldsCreated: 25, // Reduced from 100 to be more achievable
                    crossUpgradeLevel3: 2, // Need 2 cross-upgrades at level 3+ (more achievable than level 5)
                    tier2WorldsCreated: 10, // Must create some Tier 2 worlds first
                    resourceMilestones: { // Alternative unlock path
                        heat: 5000,
                        fuel: 5000,
                        pressure: 50
                    }
                },
                propertyRanges: {
                    gravity: { min: 0.1, max: 5.0 },
                    timeSpeed: { min: 0.05, max: 4.0 },
                    temperature: { min: -200, max: 500 },
                    atmosphere: { min: 0, max: 200 }
                }
            }
        };
    }

    checkWorldTierUnlocks() {
        const state = this.gameState.getState();
        if (!state || !state.worldTiers || !state.upgrades) return null;
        
        // Check Tier 2 unlock - Multiple paths to unlock
        if (!state.worldTiers.tier2Unlocked) {
            const basicUpgradesLevel3 = Object.keys(state.upgrades)
                .filter(key => ['heatGenerator', 'fuelEfficiency'].includes(key))
                .filter(key => state.upgrades[key] && state.upgrades[key].level >= 3)
                .length;
            
            const totalResources = Object.values(state.resources).reduce((sum, val) => sum + val, 0);
            
            // Check multiple unlock conditions (OR logic for flexibility)
            const worldsRequirement = state.worldsCreated >= this.worldTierDefinitions.tier2.unlockRequirements.worldsCreated;
            const upgradeRequirement = basicUpgradesLevel3 >= this.worldTierDefinitions.tier2.unlockRequirements.basicUpgradesLevel3;
            const resourceRequirement = totalResources >= this.worldTierDefinitions.tier2.unlockRequirements.totalResources;
            
            if (worldsRequirement && (upgradeRequirement || resourceRequirement)) {
                state.worldTiers.tier2Unlocked = true;
                return { tier: 2, message: "🌟 Tier 2: Enhanced Worlds Unlocked! New world types available!" };
            }
        }
        
        // Check Tier 3 unlock - More achievable requirements
        if (!state.worldTiers.tier3Unlocked && state.worldTiers.tier2Unlocked) {
            const crossUpgradesLevel3 = Object.keys(state.upgrades)
                .filter(key => ['thermalAccelerator', 'fuelSynchronizer', 'pressureValve', 'energyMatrix'].includes(key))
                .filter(key => state.upgrades[key] && state.upgrades[key].level >= 3)
                .length;
            
            // Count Tier 2+ worlds created (approximate based on total worlds and tier unlock timing)
            const tier2WorldsEstimate = Math.max(0, state.worldsCreated - 5); // Rough estimate
            
            // Check resource milestones
            const resourceMilestones = this.worldTierDefinitions.tier3.unlockRequirements.resourceMilestones;
            const resourceMilestonesmet = 
                state.resources.heat >= resourceMilestones.heat &&
                state.resources.fuel >= resourceMilestones.fuel &&
                state.resources.pressure >= resourceMilestones.pressure;
            
            // Multiple unlock paths for Tier 3
            const worldsRequirement = state.worldsCreated >= this.worldTierDefinitions.tier3.unlockRequirements.worldsCreated;
            const upgradeRequirement = crossUpgradesLevel3 >= this.worldTierDefinitions.tier3.unlockRequirements.crossUpgradeLevel3;
            const tier2WorldsRequirement = tier2WorldsEstimate >= this.worldTierDefinitions.tier3.unlockRequirements.tier2WorldsCreated;
            
            if (worldsRequirement && upgradeRequirement && (tier2WorldsRequirement || resourceMilestonesmet)) {
                state.worldTiers.tier3Unlocked = true;
                return { tier: 3, message: "✨ Tier 3: Exotic Worlds Unlocked! Reality-bending worlds await!" };
            }
        }
        
        return null;
    }

    getTierUnlockProgress() {
        const state = this.gameState.getState();
        if (!state || !state.worldTiers || !state.upgrades) return {};
        
        const progress = {
            tier2: {
                unlocked: state.worldTiers.tier2Unlocked,
                requirements: []
            },
            tier3: {
                unlocked: state.worldTiers.tier3Unlocked,
                requirements: []
            }
        };
        
        // Tier 2 progress
        if (!state.worldTiers.tier2Unlocked) {
            const basicUpgradesLevel3 = Object.keys(state.upgrades)
                .filter(key => ['heatGenerator', 'fuelEfficiency'].includes(key))
                .filter(key => state.upgrades[key] && state.upgrades[key].level >= 3)
                .length;
            
            const totalResources = Object.values(state.resources).reduce((sum, val) => sum + val, 0);
            
            progress.tier2.requirements = [
                {
                    type: 'worlds',
                    current: state.worldsCreated,
                    required: this.worldTierDefinitions.tier2.unlockRequirements.worldsCreated,
                    completed: state.worldsCreated >= this.worldTierDefinitions.tier2.unlockRequirements.worldsCreated
                },
                {
                    type: 'upgrades',
                    current: basicUpgradesLevel3,
                    required: this.worldTierDefinitions.tier2.unlockRequirements.basicUpgradesLevel3,
                    completed: basicUpgradesLevel3 >= this.worldTierDefinitions.tier2.unlockRequirements.basicUpgradesLevel3,
                    description: 'Basic upgrades at level 3+'
                },
                {
                    type: 'resources',
                    current: totalResources,
                    required: this.worldTierDefinitions.tier2.unlockRequirements.totalResources,
                    completed: totalResources >= this.worldTierDefinitions.tier2.unlockRequirements.totalResources,
                    description: 'Total resources (alternative)',
                    alternative: true
                }
            ];
        }
        
        // Tier 3 progress
        if (!state.worldTiers.tier3Unlocked && state.worldTiers.tier2Unlocked) {
            const crossUpgradesLevel3 = Object.keys(state.upgrades)
                .filter(key => ['thermalAccelerator', 'fuelSynchronizer', 'pressureValve', 'energyMatrix'].includes(key))
                .filter(key => state.upgrades[key] && state.upgrades[key].level >= 3)
                .length;
            
            const resourceMilestones = this.worldTierDefinitions.tier3.unlockRequirements.resourceMilestones;
            const resourceMilestonesmet = 
                state.resources.heat >= resourceMilestones.heat &&
                state.resources.fuel >= resourceMilestones.fuel &&
                state.resources.pressure >= resourceMilestones.pressure;
            
            progress.tier3.requirements = [
                {
                    type: 'worlds',
                    current: state.worldsCreated,
                    required: this.worldTierDefinitions.tier3.unlockRequirements.worldsCreated,
                    completed: state.worldsCreated >= this.worldTierDefinitions.tier3.unlockRequirements.worldsCreated
                },
                {
                    type: 'cross-upgrades',
                    current: crossUpgradesLevel3,
                    required: this.worldTierDefinitions.tier3.unlockRequirements.crossUpgradeLevel3,
                    completed: crossUpgradesLevel3 >= this.worldTierDefinitions.tier3.unlockRequirements.crossUpgradeLevel3,
                    description: 'Cross-resource upgrades at level 3+'
                },
                {
                    type: 'milestones',
                    current: `${state.resources.heat}/${state.resources.fuel}/${state.resources.pressure}`,
                    required: `${resourceMilestones.heat}/${resourceMilestones.fuel}/${resourceMilestones.pressure}`,
                    completed: resourceMilestonesmet,
                    description: 'Heat/Fuel/Pressure milestones (alternative)',
                    alternative: true
                }
            ];
        }
        
        return progress;
    }

    getAvailableWorldTypes() {
        const state = this.gameState.getState();
        if (!state || !state.worldTiers) return [...this.worldTierDefinitions.tier1.types];
        
        let availableTypes = [...this.worldTierDefinitions.tier1.types];
        
        if (state.worldTiers.tier2Unlocked) {
            availableTypes = availableTypes.concat(this.worldTierDefinitions.tier2.types);
        }
        
        if (state.worldTiers.tier3Unlocked) {
            availableTypes = availableTypes.concat(this.worldTierDefinitions.tier3.types);
        }
        
        return availableTypes;
    }

    getWorldTypeProperties(worldType) {
        // Determine which tier this world type belongs to
        let tier = 'tier1';
        if (this.worldTierDefinitions.tier2.types.includes(worldType)) {
            tier = 'tier2';
        } else if (this.worldTierDefinitions.tier3.types.includes(worldType)) {
            tier = 'tier3';
        }
        
        const ranges = this.worldTierDefinitions[tier].propertyRanges;
        
        return {
            gravity: +(ranges.gravity.min + Math.random() * (ranges.gravity.max - ranges.gravity.min)).toFixed(1),
            timeSpeed: +(ranges.timeSpeed.min + Math.random() * (ranges.timeSpeed.max - ranges.timeSpeed.min)).toFixed(1),
            temperature: Math.floor(ranges.temperature.min + Math.random() * (ranges.temperature.max - ranges.temperature.min)),
            atmosphere: Math.floor(ranges.atmosphere.min + Math.random() * (ranges.atmosphere.max - ranges.atmosphere.min))
        };
    }

    getWorldTypeSpecialEffects(worldType) {
        const specialEffects = {
            // Tier 2 Enhanced World Effects
            'Plasma': {
                description: "Superheated matter world with extreme energy potential",
                effects: { heat: 1.5, energy: 1.3, stability: 0.8 }
            },
            'Nebula': {
                description: "Gaseous cloud world with enhanced fuel generation",
                effects: { fuel: 1.4, pressure: 1.2, heat: 0.9 }
            },
            'Toxic': {
                description: "Dangerous world with high pressure but unstable conditions",
                effects: { pressure: 1.6, stability: 0.6, energy: 1.1 }
            },
            'Frozen': {
                description: "Ice-locked world with extreme fuel efficiency",
                effects: { fuel: 1.8, heat: 0.5, stability: 1.2 }
            },
            'Quantum': {
                description: "Reality-shifting world with unpredictable bonuses",
                effects: { all: 'random' } // Special handling in resource generation
            },
            'Hybrid': {
                description: "Combination world with balanced enhanced generation",
                effects: { heat: 1.2, fuel: 1.2, pressure: 1.2, energy: 1.1 }
            },
            // Tier 3 Exotic World Effects
            'Dimensional': {
                description: "Reality-warping world that allows resource conversion",
                effects: { all: 1.2, special: 'resourceConversion' }
            },
            'Singularity': {
                description: "Extreme gravity world with resource compression abilities",
                effects: { pressure: 2.0, gravity: 'extreme', special: 'resourceCompression' }
            },
            'Living': {
                description: "Sentient world that adapts to your actions",
                effects: { adaptive: true, special: 'learningBonus' }
            },
            'Infinite': {
                description: "Limitless world with no resource caps during generation",
                effects: { special: 'noResourceLimits' }
            }
        };
        
        return specialEffects[worldType] || { description: "Standard world properties", effects: {} };
    }

    generateRandomWorld() {
        const availableTypes = this.getAvailableWorldTypes();
        const weatherTypes = ['Calm', 'Stormy', 'Chaotic', 'Serene', 'Turbulent'];
        
        const worldType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const properties = this.getWorldTypeProperties(worldType);
        const specialEffects = this.getWorldTypeSpecialEffects(worldType);
        
        return {
            id: Date.now(),
            type: worldType,
            gravity: properties.gravity,
            timeSpeed: properties.timeSpeed,
            // Weather now has a duration (5-10 actions) then rerolls
            weather: weatherTypes[Math.floor(Math.random() * weatherTypes.length)],
            weatherDuration: 5 + Math.floor(Math.random() * 6),
            temperature: properties.temperature,
            atmosphere: properties.atmosphere,
            specialEffects: specialEffects,
            // Determine tier for display
            tier: this.worldTierDefinitions.tier3.types.includes(worldType) ? 3 : 
                  this.worldTierDefinitions.tier2.types.includes(worldType) ? 2 : 1
        };
    }

    rollNewWeather(world) {
        const weatherTypes = ['Calm', 'Stormy', 'Chaotic', 'Serene', 'Turbulent'];
        world.weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        world.weatherDuration = 5 + Math.floor(Math.random() * 6);
    }

    getTierDefinitions() {
        return this.worldTierDefinitions;
    }
}
