// ResourceSystem.js - Handles resource generation, decay, and management

export class ResourceSystem {
    constructor(gameState, achievementSystem = null) {
        this.gameState = gameState;
        this.achievementSystem = achievementSystem;
    }

    // Get passive bonuses from owned worlds (applied to manual generation)
    getWorldBonuses() {
        const state = this.gameState.getState();
        if (!state || !state.worldsCreated) return { heatMultiplier: 1, fuelMultiplier: 1 };
        
        // Each world provides bonuses to manual generation - improved progression
        const worldBonus = 1 + (state.worldsCreated * 0.15); // Increased from 10% to 15% per world
        
        // Apply upgrade multipliers to bonuses
        let heatMultiplier = worldBonus;
        let fuelMultiplier = worldBonus;
        
        if (state.upgrades && state.upgrades.heatGenerator) {
            heatMultiplier += state.upgrades.heatGenerator.level * 0.08; // Increased from 5% to 8% per level
        }
        if (state.upgrades && state.upgrades.fuelEfficiency) {
            fuelMultiplier += state.upgrades.fuelEfficiency.level * 0.08; // Increased from 5% to 8% per level
        }
        
        return { heatMultiplier, fuelMultiplier };
    }

    generateResources(world) {
        if (!world || !world.resourceGeneration) return;
        
        const state = this.gameState.getState();
        const resourceGains = {};
        
        // Generate resources based on world definition
        for (const [resourceType, config] of Object.entries(world.resourceGeneration)) {
            const baseGain = config.base || 0;
            const multiplier = config.multiplier || 1.0;
            
            let gain = baseGain * multiplier;
            
            // Apply temperature effects
            if (resourceType === 'heat' && world.temperature > 50) {
                gain *= 1.2;
            } else if (resourceType === 'ice' && world.temperature < 0) {
                gain *= 1.3;
            } else if (resourceType === 'water' && world.atmosphere > 70) {
                gain *= 1.15;
            }
            
            // Apply upgrade bonuses for heat and fuel
            if (resourceType === 'heat' && state.upgrades.heatGenerator) {
                gain *= (1 + state.upgrades.heatGenerator.level * 0.1);
            } else if (resourceType === 'fuel' && state.upgrades.fuelEfficiency) {
                gain *= (1 + state.upgrades.fuelEfficiency.level * 0.1);
            }
            
            // Apply permanent bonuses
            gain *= state.permanentBonuses.resourceEfficiency;
            
            resourceGains[resourceType] = Math.floor(gain);
        }
        
        // Use the new addResources method
        this.gameState.addResources(resourceGains, true);
        
        return resourceGains;
    }

    generateResource(type) {
        const state = this.gameState.getState();
        const world = state.currentWorld;
        
        if (!world || !world.resourceGeneration || !world.resourceGeneration[type]) {
            return 0;
        }
        
        // Get resource generation config for this world and resource type
        const config = world.resourceGeneration[type];
        const baseGain = config.base || 0;
        const multiplier = config.multiplier || 1.0;
        
        let gain = baseGain * multiplier;
        
        // Apply temperature effects
        if (type === 'heat' && world.temperature > 50) {
            gain *= 1.2;
        } else if (type === 'ice' && world.temperature < 0) {
            gain *= 1.3;
        } else if (type === 'water' && world.atmosphere > 70) {
            gain *= 1.15;
        }
        
        // Apply upgrade bonuses for heat and fuel
        if (type === 'heat' && state.upgrades.heatGenerator) {
            gain *= (1 + state.upgrades.heatGenerator.level * 0.2);
        } else if (type === 'fuel' && state.upgrades.fuelEfficiency) {
            gain *= (1 + state.upgrades.fuelEfficiency.level * 0.2);
        }
        
        // Apply event multipliers
        gain = this.applyEventMultipliers(type, gain);
        
        // Apply permanent bonuses
        gain *= state.permanentBonuses.resourceEfficiency;
        
        // Use addResources method to ensure save is triggered
        const gainAmount = Math.floor(gain);
        this.gameState.addResources({ [type]: gainAmount }, true);
        
        // Track manual generation for achievements
        if (this.achievementSystem) {
            this.achievementSystem.trackManualGeneration(type, gainAmount);
            this.achievementSystem.trackDiscovery('generation', 'manual_' + type);
            this.achievementSystem.incrementClick();
        }
        
        return gainAmount;
    }

    generatePressure(world) {
        if (!world) return;
        
        // Check if world has pressure generation configured
        if (world.resourceGeneration && world.resourceGeneration.pressure) {
            const config = world.resourceGeneration.pressure;
            const baseGain = config.base || 0;
            const multiplier = config.multiplier || 1.0;
            let pressureGain = baseGain * multiplier;
            
            // Apply environmental bonuses for pressure
            if (world.atmosphere > 70) {
                pressureGain *= 1.5;
            }
            if (world.gravity > 2.0) {
                pressureGain *= 1.2;
            }
            
            // Apply pressure using centralized cap system
            this.gameState.addResources({ pressure: Math.floor(pressureGain) });
        } else {
            // Legacy calculation for backwards compatibility
            let pressureGain = 2 + (world.gravity * 3) + (world.atmosphere / 25);
            
            // Weather influences (legacy)
            switch (world.weather) {
                case 'Stormy':
                    pressureGain *= 1.25;
                    break;
                case 'Turbulent':
                    pressureGain *= 2.0; // +100%
                    break;
            }
            
            // High atmosphere bonus
            if (world.atmosphere > 70) {
                pressureGain += 2;
            }
            
            // Apply pressure using centralized cap system
            this.gameState.addResources({ pressure: Math.floor(pressureGain) });
        }
        
        // Cross-Resource Upgrade: Pressure Valve (always apply)
        const state = this.gameState.getState();
        if (state.upgrades && state.upgrades.pressureValve) {
            const valveUpgrade = state.upgrades.pressureValve;
            if (valveUpgrade.level > 0 && state.resources.stability > 20) {
                // Converts excess pressure to heat
                if (state.resources.pressure > 80) {
                    const heatBonus = Math.floor(valveUpgrade.level * 2);
                    this.gameState.addResources({ heat: heatBonus });
                    
                    // Track conversion for achievements
                    if (this.achievementSystem) {
                        this.achievementSystem.trackConversion('pressure', 'heat', heatBonus);
                    }
                }
            }
        }
    }

    generateStability(world) {
        let stabilityGain = 1; // Base 1 per action
        
        if (world) {
            // Apply world tier special effects
            if (world.specialEffects && world.specialEffects.effects && world.specialEffects.effects.stability) {
                stabilityGain *= world.specialEffects.effects.stability;
            }
            
            // Special handling for specific world types
            if (world.specialEffects && world.specialEffects.effects) {
                const effects = world.specialEffects.effects;
                
                if (effects.all === 'random') {
                    const randomBonus = 0.5 + Math.random() * 1.5;
                    stabilityGain *= randomBonus;
                } else if (typeof effects.all === 'number') {
                    stabilityGain *= effects.all;
                }
                
                // Living worlds adapt over time
                if (effects.special === 'learningBonus') {
                    const learningBonus = 1 + (this.gameState.worldsCreated * 0.01); // 1% per world created
                    stabilityGain *= learningBonus;
                }
            }
            
            // Temperature effects
            if (world.temperature >= 0 && world.temperature <= 75) {
                stabilityGain += 1; // Moderate temperature bonus
            } else if (world.temperature > 75) {
                stabilityGain -= 1; // Hot worlds reduce stability
            }

            // Weather effects (expanded)
            switch (world.weather) {
                case 'Calm':
                    stabilityGain += 1;
                    break;
                case 'Chaotic':
                    stabilityGain -= 3;
                    break;
                case 'Serene':
                    stabilityGain += 2;
                    break;
                case 'Stormy':
                    stabilityGain -= 2;
                    break;
                case 'Turbulent':
                    stabilityGain -= 1;
                    break;
            }
        }
        
        // Apply stability using centralized cap system
        this.gameState.addResources({ stability: Math.floor(stabilityGain) });
    }

    generateEnergy(world) {
        if (!world) return;
        
        // Energy is generated from Heat + Fuel combination
        const heatContribution = this.gameState.resources.heat * 0.1;
        const fuelContribution = this.gameState.resources.fuel * 0.1;
        let energyGain = (heatContribution + fuelContribution) / 4;
        
        // Apply world tier special effects
        if (world.specialEffects && world.specialEffects.effects && world.specialEffects.effects.energy) {
            energyGain *= world.specialEffects.effects.energy;
        }
        
        // Special handling for specific world types
        if (world.specialEffects && world.specialEffects.effects) {
            const effects = world.specialEffects.effects;
            
            if (effects.all === 'random') {
                const randomBonus = 0.5 + Math.random() * 1.5;
                energyGain *= randomBonus;
            } else if (typeof effects.all === 'number') {
                energyGain *= effects.all;
            }
        }
        
        // Cross-Resource Upgrade: Energy Matrix
        if (this.gameState.upgrades && this.gameState.upgrades.energyMatrix) {
            const matrixUpgrade = this.gameState.upgrades.energyMatrix;
            if (matrixUpgrade.level > 0) {
                energyGain *= (1 + (matrixUpgrade.level * 0.15)); // +15% per level
            }
        }
        
        // Apply energy gain using centralized cap system
        this.gameState.addResources({ energy: Math.floor(energyGain) });
        
        // Energy decay based on time speed
        const decayRate = world.timeSpeed * 0.02; // Faster worlds decay energy faster
        this.gameState.addResources({ energy: -Math.floor(decayRate) });
    }

    applyCrossResourceBonuses(baseGains) {
        // This method would be called to apply cross-resource upgrade bonuses
        // Implementation would depend on specific upgrade mechanics
    }

    applyResourceDecay(world) {
        // Pressure decays by 5% per world change
        this.gameState.resources.pressure *= 0.95;
        this.gameState.resources.pressure = Math.floor(this.gameState.resources.pressure);
        
        // Energy decays based on time speed
        if (world && this.gameState.resources.energy > 0) {
            const energyDecay = Math.floor(world.timeSpeed * 2);
            this.gameState.resources.energy = Math.max(0, this.gameState.resources.energy - energyDecay);
        }
    }

    applyEventMultipliers(resourceType, baseAmount) {
        let multiplier = 1;
        
        const state = this.gameState.getState();
        if (!state || !state.activeEvents) return baseAmount; // Guard against undefined state
        
        // Apply active event effects
        state.activeEvents.forEach(event => {
            switch (event.effect) {
                case 'heatBoost':
                    if (resourceType === 'heat') multiplier *= 1.25;
                    break;
                case 'fuelBoost':
                    if (resourceType === 'fuel') multiplier *= 1.25;
                    break;
                case 'allResourceBoost':
                    multiplier *= 1.15;
                    break;
                case 'overclock':
                    multiplier *= 2.0;
                    break;
            }
        });
        
        return baseAmount * multiplier;
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
}
