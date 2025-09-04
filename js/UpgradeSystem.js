// UpgradeSystem.js - Handles upgrade logic, costs, and unlock conditions
// Updated to fix state access issues

export class UpgradeSystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    checkUpgradeUnlocksFixed() {
        const state = this.gameState.getState();
        
        if (!state) {
            console.error('[UpgradeSystem] State is null/undefined');
            return;
        }
        if (!state.upgrades) {
            console.error('[UpgradeSystem] state.upgrades is null/undefined');
            return;
        }
        if (!state.resources) {
            console.error('[UpgradeSystem] state.resources is null/undefined');
            return;
        }
        
        const upgrades = state.upgrades;
        
        // Thermal Accelerator: Requires Heat Generator Level 3+ and reaching 30+ Pressure
        if (upgrades.thermalAccelerator && upgrades.heatGenerator && !upgrades.thermalAccelerator.unlocked && 
            upgrades.heatGenerator.level >= upgrades.thermalAccelerator.requiresHeat && 
            state.resources.pressure >= upgrades.thermalAccelerator.requiresPressure) {
            upgrades.thermalAccelerator.unlocked = true;
        }
        
        // Fuel Synchronizer: Requires Fuel Efficiency Level 5+ and reaching 20+ Energy
        if (upgrades.fuelSynchronizer && upgrades.fuelEfficiency && !upgrades.fuelSynchronizer.unlocked && 
            upgrades.fuelEfficiency.level >= upgrades.fuelSynchronizer.requiresFuel && 
            state.resources.energy >= upgrades.fuelSynchronizer.requiresEnergy) {
            upgrades.fuelSynchronizer.unlocked = true;
        }
        
        // Pressure Valve: Requires reaching 15+ Stability and 50+ Pressure
        if (upgrades.pressureValve && !upgrades.pressureValve.unlocked && 
            state.resources.stability >= upgrades.pressureValve.requiresStability && 
            state.resources.pressure >= upgrades.pressureValve.requiresPressure) {
            upgrades.pressureValve.unlocked = true;
        }
        
        // Energy Matrix: Requires Heat Generator Level 7+ and Fuel Efficiency Level 8+
        if (upgrades.energyMatrix && upgrades.heatGenerator && upgrades.fuelEfficiency && !upgrades.energyMatrix.unlocked && 
            upgrades.heatGenerator.level >= upgrades.energyMatrix.requiresHeat && 
            upgrades.fuelEfficiency.level >= upgrades.energyMatrix.requiresFuel) {
            upgrades.energyMatrix.unlocked = true;
        }
    }

    // Keep old method for compatibility but make it call the fixed one
    checkUpgradeUnlocks() {
        return this.checkUpgradeUnlocksFixed();
    }

    upgradeResource(upgradeType, resourceType) {
        const state = this.gameState.getState();
        
        if (!state) {
            console.error('[UpgradeSystem] State is null/undefined in upgradeResource');
            return false;
        }
        if (!state.upgrades) {
            console.error('[UpgradeSystem] state.upgrades is null/undefined in upgradeResource');
            return false;
        }
        if (!state.resources) {
            console.error('[UpgradeSystem] state.resources is null/undefined in upgradeResource');
            return false;
        }
        
        const upgrade = state.upgrades[upgradeType];
        if (!upgrade) {
            console.error('[UpgradeSystem] Upgrade not found for:', upgradeType);
            return false;
        }
        
        const cost = this.getUpgradeCost(upgradeType);
        
        if (state.resources[resourceType] >= cost && upgrade.level < upgrade.maxLevel) {
            state.resources[resourceType] -= cost;
            upgrade.level++;
            return true;
        }
        return false;
    }

    upgradeCrossResource(upgradeType, primaryResourceType) {
        const state = this.gameState.getState();
        if (!state || !state.upgrades || !state.resources) return false; // Guard against undefined state
        
        const upgrade = state.upgrades[upgradeType];
        if (!upgrade) return false; // Guard against undefined upgrade
        
        const cost = this.getUpgradeCost(upgradeType);
        
        // Check if we can afford it
        if (state.resources[primaryResourceType] >= cost && upgrade.level < upgrade.maxLevel) {
            state.resources[primaryResourceType] -= cost;
            upgrade.level++;
            
            // Apply cross-resource effects based on upgrade type
            this.applyCrossUpgradeEffects(upgradeType);
            
            return true;
        }
        return false;
    }

    applyCrossUpgradeEffects(upgradeType) {
        const state = this.gameState.getState();
        const level = state.upgrades[upgradeType].level;
        
        switch (upgradeType) {
            case 'thermalAccelerator':
                // Heat generation +15% per level when Pressure > 50
                // Effect is applied during resource generation
                break;
                
            case 'fuelSynchronizer':
                // Fuel generation +12% per level, also generates Energy
                // Generate bonus energy based on level
                this.gameState.resources.energy += Math.floor(level * 2);
                break;
                
            case 'pressureValve':
                // Pressure generation +25% per level when Stability > 20
                // Converts excess pressure to heat
                if (this.gameState.resources.pressure > 80) {
                    const heatBonus = Math.floor(level * 3);
                    this.gameState.resources.heat += heatBonus;
                }
                break;
                
            case 'energyMatrix':
                // Energy creation +30% per level, also generates Stability
                const stabilityBonus = Math.floor(level * 1.5);
                this.gameState.resources.stability += stabilityBonus;
                this.gameState.resources.stability = Math.min(50, this.gameState.resources.stability);
                break;
        }
    }

    getUpgradeCost(upgradeType) {
        const state = this.gameState.getState();
        if (!state || !state.upgrades || !state.permanentBonuses || !state.activeEvents) return 0; // Guard against undefined state
        
        const upgrade = state.upgrades[upgradeType];
        if (!upgrade) return 0; // Guard against undefined upgrade
        
        let cost = Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.level));
        
        // Apply cost reduction bonuses
        cost *= state.permanentBonuses.upgradeCostReduction;
        
        // Apply temporary cost reduction from events
        state.activeEvents.forEach(event => {
            if (event.effect === 'cheapUpgrade' || event.effect === 'cheapUpgrades') {
                cost *= 0.5; // 50% cost reduction
            }
        });
        
        return Math.floor(cost);
    }

    canAffordUpgrade(upgradeType, resourceType) {
        const cost = this.getUpgradeCost(upgradeType);
        const upgrade = this.gameState.upgrades[upgradeType];
        
        return this.gameState.resources[resourceType] >= cost && upgrade.level < upgrade.maxLevel;
    }

    getUpgradeBonus(upgradeType) {
        const level = this.gameState.upgrades[upgradeType].level;
        
        switch (upgradeType) {
            case 'heatGenerator':
                return 1 + (level * 0.1); // +10% per level
            case 'fuelEfficiency':
                return 1 + (level * 0.1); // +10% per level
            case 'thermalAccelerator':
                // Only active when Pressure > 50
                if (this.gameState.resources.pressure > 50) {
                    return 1 + (level * 0.15); // +15% per level
                }
                return 1;
            case 'fuelSynchronizer':
                return 1 + (level * 0.12); // +12% per level
            case 'pressureValve':
                // Only active when Stability > 20
                if (this.gameState.resources.stability > 20) {
                    return 1 + (level * 0.25); // +25% per level
                }
                return 1;
            case 'energyMatrix':
                return 1 + (level * 0.30); // +30% per level
            default:
                return 1;
        }
    }

    getUpgradeEfficiencyBonus(resourceType) {
        let bonus = 1;
        
        switch (resourceType) {
            case 'heat':
                bonus *= this.getUpgradeBonus('heatGenerator');
                if (this.gameState.resources.pressure > 50) {
                    bonus *= this.getUpgradeBonus('thermalAccelerator');
                }
                break;
            case 'fuel':
                bonus *= this.getUpgradeBonus('fuelEfficiency');
                bonus *= this.getUpgradeBonus('fuelSynchronizer');
                break;
            case 'pressure':
                if (this.gameState.resources.stability > 20) {
                    bonus *= this.getUpgradeBonus('pressureValve');
                }
                break;
            case 'energy':
                bonus *= this.getUpgradeBonus('energyMatrix');
                break;
        }
        
        return bonus;
    }

    getUpgradeProgress(upgradeType) {
        const upgrade = this.gameState.upgrades[upgradeType];
        return {
            level: upgrade.level,
            maxLevel: upgrade.maxLevel,
            progress: upgrade.level / upgrade.maxLevel,
            isMaxed: upgrade.level >= upgrade.maxLevel
        };
    }

    getUnlockedUpgrades() {
        return Object.keys(this.gameState.upgrades).filter(key => 
            this.gameState.upgrades[key].unlocked !== false
        );
    }

    getCrossResourceUpgrades() {
        return {
            thermalAccelerator: this.gameState.upgrades.thermalAccelerator,
            fuelSynchronizer: this.gameState.upgrades.fuelSynchronizer,
            pressureValve: this.gameState.upgrades.pressureValve,
            energyMatrix: this.gameState.upgrades.energyMatrix
        };
    }
}
