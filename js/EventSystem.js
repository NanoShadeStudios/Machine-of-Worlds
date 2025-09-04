// EventSystem.js - Handles RNG events, event effects, and event management

export class EventSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.eventDefinitions = this.initializeEvents();
    }

    initializeEvents() {
        return {
            // Common Events (60% chance)
            resourceSurge: {
                name: "Resource Surge",
                rarity: "common",
                description: "A sudden surge of energy flows through your machine!",
                effect: "Choose one resource to gain +25% generation for 3 actions",
                duration: 3,
                choices: [
                    { text: "Boost Heat", effect: "heatBoost" },
                    { text: "Boost Fuel", effect: "fuelBoost" },
                    { text: "Boost Pressure", effect: "pressureBoost" }
                ]
            },
            
            machineTune: {
                name: "Machine Tune-Up",
                rarity: "common",
                description: "Your machine runs smoother than usual today.",
                effect: "All resources +15% generation for 2 actions",
                duration: 2,
                choices: [
                    { text: "Accept Bonus", effect: "allResourceBoost" },
                    { text: "Decline", effect: "none" }
                ]
            },
            
            // Uncommon Events (25% chance)
            solarFlare: {
                name: "Solar Flare",
                rarity: "uncommon",
                description: "Intense solar radiation affects your machine systems!",
                effect: "Heat generation +50% for 4 actions, but Stability -1 per action",
                duration: 4,
                choices: [
                    { text: "Harness Energy", effect: "solarHarvest" },
                    { text: "Shield Systems", effect: "stabilityProtect" }
                ]
            },
            
            quantumFluctuation: {
                name: "Quantum Fluctuation",
                rarity: "uncommon",
                description: "Reality shifts around your machine, offering new possibilities.",
                effect: "Next 2 worlds can be rerolled once each",
                duration: 2,
                choices: [
                    { text: "Embrace Chaos", effect: "worldReroll" },
                    { text: "Stay Grounded", effect: "stabilityGain" }
                ]
            },
            
            // Rare Events (10% chance)
            dimensionalRift: {
                name: "Dimensional Rift",
                rarity: "rare",
                description: "A rift in space-time opens, revealing advanced technology!",
                effect: "Gain access to Tier 2 world for 1 generation (temporary unlock)",
                duration: 1,
                choices: [
                    { text: "Enter Rift", effect: "tierUnlock" },
                    { text: "Seal Rift", effect: "energyGain" }
                ]
            },
            
            ancientTechnology: {
                name: "Ancient Technology",
                rarity: "rare",
                description: "You discover remnants of an advanced civilization!",
                effect: "Next upgrade costs 40% less OR gain 50 of any resource",
                duration: 1,
                choices: [
                    { text: "Study Technology", effect: "cheapUpgrade" },
                    { text: "Harvest Materials", effect: "resourceChoice" }
                ]
            },
            
            // Ultra Rare Events (5% chance)
            luckyCalibration: {
                name: "Lucky Calibration",
                rarity: "ultraRare",
                description: "Perfect harmonic resonance achieved across all systems!",
                effect: "All upgrades cost 50% less for next 10 purchases",
                duration: 10,
                choices: [
                    { text: "Accept Calibration", effect: "cheapUpgrades" },
                    { text: "Decline", effect: "none" }
                ]
            },
            
            crystalResonance: {
                name: "Crystal Resonance",
                rarity: "ultraRare",
                description: "Ancient crystals in your machine achieve perfect harmony!",
                effect: "Machine gains permanent +5% efficiency to all resources",
                duration: -1, // Permanent
                choices: [
                    { text: "Embrace Resonance", effect: "permanentEfficiency" },
                    { text: "Ignore", effect: "none" }
                ]
            },
            
            // Negative Events (15% base, reduced by stability)
            systemGlitch: {
                name: "System Glitch",
                rarity: "negative",
                description: "Critical error detected in machine subsystems!",
                effect: "Lose 20% of highest resource OR spend 30 Energy to prevent",
                duration: 0,
                choices: [
                    { text: "Fix with Energy", effect: "energyCost", cost: { energy: 30 } },
                    { text: "Accept Loss", effect: "resourceLoss", value: 20 }
                ]
            },
            
            pressureLeak: {
                name: "Pressure Leak",
                rarity: "negative",
                description: "A critical leak detected in the pressure systems!",
                effect: "Lose 50% current Pressure OR spend 40 Heat to repair",
                duration: 0,
                choices: [
                    { text: "Emergency Repair", effect: "heatCost", cost: { heat: 40 } },
                    { text: "Accept Leak", effect: "pressureLoss", value: 50 }
                ]
            }
        };
    }

    checkForRandomEvent() {
        // Base 30% chance for an event
        let eventChance = 0.3;
        
        // Stability affects event probability
        const state = this.gameState.getState();
        if (!state || !state.resources) return null; // Guard against undefined state
        
        const stability = state.resources.stability;
        const stabilityModifier = (stability - 25) / 100; // -0.25 to +0.25 modifier
        
        if (Math.random() < eventChance + stabilityModifier) {
            // Determine rarity
            let rand = Math.random();
            
            // Negative events are reduced by high stability
            const negativeChance = Math.max(0.05, 0.15 - (stability / 500)); // 15% base, down to 5% at high stability
            
            if (rand < negativeChance) {
                return this.triggerEvent('negative');
            } else if (rand < 0.60) {
                return this.triggerEvent('common');
            } else if (rand < 0.85) {
                return this.triggerEvent('uncommon');
            } else if (rand < 0.95) {
                return this.triggerEvent('rare');
            } else {
                return this.triggerEvent('ultraRare');
            }
        }
        
        return null;
    }

    triggerEvent(rarity) {
        const eventsOfRarity = Object.values(this.eventDefinitions).filter(event => event.rarity === rarity);
        if (eventsOfRarity.length > 0) {
            const selectedEvent = eventsOfRarity[Math.floor(Math.random() * eventsOfRarity.length)];
            return selectedEvent;
        }
        return null;
    }

    applyEventEffect(effectType, event, choice = null) {
        switch (effectType) {
            case 'heatBoost':
                this.addTemporaryEffect('heat', 1.25);
                break;
            case 'fuelBoost':
                this.addTemporaryEffect('fuel', 1.25);
                break;
            case 'pressureBoost':
                this.addTemporaryEffect('pressure', 1.25);
                break;
            case 'allResourceBoost':
                this.addTemporaryEffect('all', 1.15);
                break;
            case 'solarHarvest':
                this.addTemporaryEffect('heat', 1.5);
                this.addTemporaryEffect('stability', -1);
                break;
            case 'stabilityProtect':
                this.addTemporaryEffect('stability', 2);
                break;
            case 'worldReroll':
                // This would be handled by the world system
                break;
            case 'stabilityGain':
                this.gameState.resources.stability += 10;
                break;
            case 'tierUnlock':
                // Temporary tier unlock - would be handled by world system
                break;
            case 'energyGain':
                this.gameState.resources.energy += 25;
                break;
            case 'cheapUpgrade':
                this.addTemporaryEffect('upgradeCost', 0.6);
                break;
            case 'resourceChoice':
                // This would show a modal for resource selection
                break;
            case 'cheapUpgrades':
                this.addTemporaryEffect('upgradeCost', 0.5);
                break;
            case 'permanentEfficiency':
                this.gameState.permanentBonuses.resourceEfficiency += 0.05;
                break;
            case 'energyCost':
                if (choice && choice.cost) {
                    const canAfford = Object.keys(choice.cost).every(resource => 
                        this.gameState.resources[resource] >= choice.cost[resource]
                    );
                    
                    if (canAfford) {
                        Object.keys(choice.cost).forEach(resource => {
                            this.gameState.resources[resource] -= choice.cost[resource];
                        });
                    } else {
                        // Can't afford, apply backup effect
                        this.applyEventEffect('resourceLoss', event, { value: 20 });
                    }
                }
                break;
            case 'heatCost':
                if (choice && choice.cost && this.gameState.resources.heat >= choice.cost.heat) {
                    this.gameState.resources.heat -= choice.cost.heat;
                } else {
                    this.applyEventEffect('pressureLoss', event, { value: 50 });
                }
                break;
            case 'resourceLoss':
                if (choice && choice.value) {
                    this.loseHighestResource(choice.value);
                }
                break;
            case 'pressureLoss':
                if (choice && choice.value) {
                    const lossAmount = Math.floor(this.gameState.resources.pressure * (choice.value / 100));
                    this.gameState.resources.pressure -= lossAmount;
                    this.gameState.resources.pressure = Math.max(0, this.gameState.resources.pressure);
                }
                break;
            case 'overclock':
                this.addTemporaryEffect('all', 2.0);
                this.addTemporaryEffect('upgradeCost', 1.5);
                break;
            case 'none':
                // Do nothing
                break;
        }
    }

    addTemporaryEffect(effectType, value) {
        this.gameState.activeEvents.forEach(event => {
            if (event.effect === effectType) {
                event.value = value;
            }
        });
    }

    loseHighestResource(percentage) {
        const resources = this.gameState.resources;
        let highest = { type: 'heat', amount: resources.heat };
        
        ['fuel', 'pressure', 'energy'].forEach(type => {
            if (resources[type] > highest.amount) {
                highest = { type, amount: resources[type] };
            }
        });
        
        const lossAmount = Math.floor(highest.amount * (percentage / 100));
        resources[highest.type] -= lossAmount;
        resources[highest.type] = Math.max(0, resources[highest.type]);
        
        return { type: highest.type, amount: lossAmount };
    }

    updateActiveEvents() {
        console.log('[EventSystem] updateActiveEvents called');
        const state = this.gameState.getState();
        console.log('[EventSystem] State:', state);
        
        if (!state) {
            console.error('[EventSystem] State is null/undefined');
            return;
        }
        
        // Initialize activeEvents if it doesn't exist
        if (!state.activeEvents) {
            console.log('[EventSystem] Initializing activeEvents array');
            state.activeEvents = [];
            return;
        }
        
        console.log('[EventSystem] activeEvents before filter:', state.activeEvents);
        state.activeEvents = state.activeEvents.filter(event => {
            event.duration--;
            return event.duration > 0;
        });
        console.log('[EventSystem] activeEvents after filter:', state.activeEvents);
    }

    selectEventChoice(event, choice) {
        // Apply the selected effect
        this.applyEventEffect(choice.effect, event, choice);
        
        // Add to event history
        this.gameState.eventHistory.push({
            name: event.name,
            choice: choice.text,
            timestamp: Date.now()
        });
        
        // If event has duration, add to active events
        if (event.duration > 0) {
            this.gameState.activeEvents.push({
                name: event.name,
                effect: choice.effect,
                duration: event.duration,
                originalDuration: event.duration
            });
        }
    }

    getEventDefinitions() {
        return this.eventDefinitions;
    }
}
