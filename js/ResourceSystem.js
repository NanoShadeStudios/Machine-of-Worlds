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
        if (!world) return;
        
        // Base resource generation
        const baseGain = 5;
        let heatGain = baseGain * world.gravity;
        let fuelGain = baseGain * world.timeSpeed;

        // Gravity extremes rebalance generation
        if (world.gravity > 2.0) { // High gravity favors heat systems
            heatGain *= 1.15;
            fuelGain *= 0.9;
        } else if (world.gravity < 0.7) { // Low gravity favors fuel efficiency
            fuelGain *= 1.1;
        }

        // Time speed extremes
        if (world.timeSpeed > 1.8) {
            fuelGain *= 1.15; // Fast time increases fuel throughput
        } else if (world.timeSpeed < 0.5) {
            heatGain *= 1.1; // Slow time helps heat retention/generation
        }
        
        // Apply world tier special effects
        if (world.specialEffects && world.specialEffects.effects) {
            const effects = world.specialEffects.effects;
            
            if (effects.heat) heatGain *= effects.heat;
            if (effects.fuel) fuelGain *= effects.fuel;
            
            // Special handling for Quantum worlds
            if (effects.all === 'random') {
                const randomBonus = 0.5 + Math.random() * 1.5; // 0.5x to 2.0x
                heatGain *= randomBonus;
                fuelGain *= randomBonus;
            } else if (typeof effects.all === 'number') {
                heatGain *= effects.all;
                fuelGain *= effects.all;
            }
        }
        
    // Apply upgrade bonuses
        const state = this.gameState.getState();
        const heatUpgradeBonus = 1 + (state.upgrades.heatGenerator.level * 0.1);
        const fuelUpgradeBonus = 1 + (state.upgrades.fuelEfficiency.level * 0.1);
        
        heatGain *= heatUpgradeBonus;
        fuelGain *= fuelUpgradeBonus;
        
        // Apply world bonuses to manual generation
        const worldBonuses = this.getWorldBonuses();
        heatGain *= worldBonuses.heatMultiplier;
        fuelGain *= worldBonuses.fuelMultiplier;
        
        // Apply cross-resource upgrade bonuses
        this.applyCrossResourceBonuses({ heat: heatGain, fuel: fuelGain });
        
        // Temperature effects (hot/cold/moderate)
        if (world.temperature > 75) {
            heatGain *= 1.25;
        } else if (world.temperature < 0) {
            fuelGain *= 1.2;
        }

        // Atmosphere effects
        if (world.atmosphere > 70) {
            heatGain *= 1.15; // High atmosphere improves heat efficiency
        } else if (world.atmosphere < 30) {
            fuelGain *= 1.3; // Low atmosphere improves energy-related systems (proxy fuel)
        }

        // Weather effects
        switch (world.weather) {
            case 'Stormy':
                fuelGain *= 1.5;
                heatGain *= 1.25;
                break;
            case 'Calm':
                fuelGain *= 1.15;
                heatGain *= 1.15;
                break;
            case 'Chaotic': {
                const variance = 0.25 + Math.random() * 0.5; // 25%-75%
                const direction = Math.random() < 0.5 ? -1 : 1;
                heatGain *= 1 + variance * direction;
                fuelGain *= 1 + variance * direction;
                break;
            }
            case 'Serene':
                fuelGain *= 1.3;
                break;
            case 'Turbulent':
                heatGain *= 0.8; // Heat generation suppressed
                break;
        }

        // Combo: Heat + Pressure synergy
        if (state.resources.pressure > 40) {
            heatGain *= 1.3;
        }

        // Apply permanent bonuses last
        heatGain *= state.permanentBonuses.resourceEfficiency;
        fuelGain *= state.permanentBonuses.resourceEfficiency;

        // Use the new addResources method instead of direct modification
        this.gameState.addResources({ 
            heat: Math.floor(heatGain), 
            fuel: Math.floor(fuelGain) 
        }, true); // Trigger save for manual clicks

        // Generate other resources (after applying primaries)
        this.generatePressure(world);
        this.generateStability(world);
        this.generateEnergy(world);
        
        // Apply resource decay from world changes
        this.applyResourceDecay(world);
        
        return { heat: Math.floor(heatGain), fuel: Math.floor(fuelGain) };
    }

    generateResource(type) {
        const baseGain = 8; // Increased from 5 to 8 for better early game
        const state = this.gameState.getState();
        const world = state.currentWorld;
        
        if (!world) {
            return 0;
        }
        
        let gain = 0;
        
        switch (type) {
            case 'heat':
                gain = baseGain * world.gravity;
                // Apply heat generator upgrade - improved effectiveness
                const heatBonus = 1 + (state.upgrades.heatGenerator.level * 0.2); // Increased from 10% to 20% per level
                gain *= heatBonus;
                
                // Apply world effects
                if (world.temperature > 75) {
                    gain *= 1.25; // Hot worlds boost heat
                }
                
                // Weather effects
                if (world.weather === 'Stormy') {
                    gain *= 1.5;
                }
                break;
                
            case 'fuel':
                gain = baseGain * world.timeSpeed;
                // Apply fuel efficiency upgrade - improved effectiveness
                const fuelBonus = 1 + (state.upgrades.fuelEfficiency.level * 0.2); // Increased from 10% to 20% per level
                gain *= fuelBonus;
                
                // Apply world effects
                if (world.temperature < 0) {
                    gain *= 1.2; // Cold worlds boost fuel efficiency
                }
                
                // Weather effects
                if (world.weather === 'Stormy') {
                    gain *= 1.5;
                } else if (world.weather === 'Serene') {
                    gain *= 1.3;
                }
                break;
        }
        
        // Apply event multipliers
        gain = this.applyEventMultipliers(type, gain);
        
        // Use addResources method to ensure save is triggered
        const gainAmount = Math.floor(gain);
        this.gameState.addResources({ [type]: gainAmount }, true); // Save immediately for manual clicks
        
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
        
        // Formula: Base 2 + (Gravity × 3) + (Atmosphere/25)
        let pressureGain = 2 + (world.gravity * 3) + (world.atmosphere / 25);
        
        // Weather influences
        switch (world.weather) {
            case 'Stormy':
                pressureGain *= 1.25;
                break;
            case 'Turbulent':
                pressureGain *= 2.0; // +100%
                break;
        }
        
        // Apply world tier special effects
        if (world.specialEffects && world.specialEffects.effects && world.specialEffects.effects.pressure) {
            pressureGain *= world.specialEffects.effects.pressure;
        }
        
        // Special handling for specific world types
        if (world.specialEffects && world.specialEffects.effects) {
            const effects = world.specialEffects.effects;
            
            if (effects.all === 'random') {
                const randomBonus = 0.5 + Math.random() * 1.5;
                pressureGain *= randomBonus;
            } else if (typeof effects.all === 'number') {
                pressureGain *= effects.all;
            }
            
            // Singularity worlds have extreme pressure
            if (effects.special === 'resourceCompression') {
                pressureGain *= 1.5;
            }
        }
        
        // High atmosphere bonus
        if (world.atmosphere > 70) {
            pressureGain += 2;
        }
        
        // Cross-Resource Upgrade: Pressure Valve
        if (this.gameState.upgrades && this.gameState.upgrades.pressureValve) {
            const valveUpgrade = this.gameState.upgrades.pressureValve;
            if (valveUpgrade.level > 0 && this.gameState.resources.stability > 20) {
                pressureGain *= (1 + (valveUpgrade.level * 0.25)); // +25% per level when Stability > 20
                // Converts excess pressure to heat
                if (this.gameState.resources.pressure > 80) {
                    const heatBonus = Math.floor(valveUpgrade.level * 2);
                    this.gameState.addResources({ heat: heatBonus });
                    
                    // Track conversion for achievements
                    if (this.achievementSystem) {
                        this.achievementSystem.trackConversion('pressure', 'heat', heatBonus);
                    }
                }
            }
        }
        
        // Apply pressure using centralized cap system
        this.gameState.addResources({ pressure: Math.floor(pressureGain) });
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
