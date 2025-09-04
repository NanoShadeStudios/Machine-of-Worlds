// AchievementSystem.js - Handles achievement checking and unlocking

export class AchievementSystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    checkAchievements() {
        const state = this.gameState.getState();
        const achievements = state.achievements;
        const definitions = achievements.definitions;
        
        let newAchievements = [];

        // Check each achievement
        for (const [id, achievement] of Object.entries(definitions)) {
            const achievementId = parseInt(id);
            
            // Skip if already unlocked
            if (achievements.unlocked.includes(achievementId)) continue;
            
            // Skip hidden achievements that don't meet special conditions
            if (achievement.hidden && !this.checkHiddenRequirement(achievement.requirement, state)) continue;
            
            // Check if requirement is met
            if (this.checkRequirement(achievement.requirement, state)) {
                achievements.unlocked.push(achievementId);
                newAchievements.push({ id: achievementId, ...achievement });
                console.log(`Achievement unlocked: ${achievement.name}`);
            }
        }
        
        return newAchievements;
    }

    checkRequirement(requirement, state) {
        if (!requirement) return false;

        switch (requirement.type) {
            case 'resource':
                const currentAmount = state.resources[requirement.resource] || 0;
                return currentAmount >= requirement.amount;

            case 'worlds':
                const worldCount = state.worldsCreated || 0;
                return worldCount >= requirement.amount;

            case 'upgrade':
                if (requirement.count) {
                    const upgradeCount = Object.values(state.upgrades).reduce((count, upgrade) => {
                        return count + (upgrade.level > 0 ? 1 : 0);
                    }, 0);
                    return upgradeCount >= requirement.count;
                }
                if (requirement.maxed) {
                    return requirement.maxed.every(upgradeName => {
                        const upgrade = state.upgrades[upgradeName];
                        return upgrade && upgrade.level >= upgrade.maxLevel;
                    });
                }
                break;

            case 'achievements':
                const unlockedCount = state.achievements.unlocked.length;
                return unlockedCount >= requirement.amount;

            case 'playtime':
                const playtime = state.playtime || 0;
                return playtime >= requirement.amount;

            case 'clicks':
                const clicks = state.totalClicks || 0;
                return clicks >= requirement.amount;

            case 'resets':
                const resets = state.totalResets || 0;
                return resets >= requirement.amount;

            case 'synergy':
                if (requirement.all) {
                    // Check if all synergies are active
                    const pressure = state.resources.pressure || 0;
                    return pressure > 40; // Heat+Pressure synergy condition
                }
                if (requirement.count) {
                    const synergyCount = state.synergyActivations || 0;
                    return synergyCount >= requirement.count;
                }
                break;

            case 'balance':
                if (requirement.resources && requirement.amount) {
                    return requirement.resources.every(resource => {
                        const amount = state.resources[resource] || 0;
                        return amount >= requirement.amount;
                    });
                }
                break;

            case 'total':
                if (requirement.resources === 'all') {
                    const total = Object.values(state.resources).reduce((sum, val) => sum + val, 0);
                    return total >= requirement.amount;
                }
                break;

            case 'completion':
                if (requirement.achievements) {
                    return state.achievements.unlocked.length >= requirement.achievements;
                }
                if (requirement.percentage === 100) {
                    // Check if all basic systems are maxed
                    const basicUpgrades = ['heatGenerator', 'fuelEfficiency'];
                    return basicUpgrades.every(upgradeName => {
                        const upgrade = state.upgrades[upgradeName];
                        return upgrade && upgrade.level >= upgrade.maxLevel;
                    });
                }
                break;

            case 'speed':
                // Speed achievements would need timestamp tracking
                if (requirement.achievement && requirement.time) {
                    const startTime = state.gameStartTime || Date.now();
                    const currentTime = Date.now();
                    const elapsed = (currentTime - startTime) / 1000;
                    
                    // Check if the referenced achievement is unlocked within time limit
                    if (state.achievements.unlocked.includes(requirement.achievement)) {
                        return elapsed <= requirement.time;
                    }
                }
                break;

            default:
                return false;
        }

        return false;
    }

    checkHiddenRequirement(requirement, state) {
        if (requirement.type === 'secret' && requirement.code) {
            // Hidden achievements could be unlocked by secret codes or special conditions
            return state.secretCodes && state.secretCodes.includes(requirement.code);
        }
        return false;
    }

    applyAchievementBonuses(state) {
        const achievements = state.achievements;
        const definitions = achievements.definitions;
        
        // Reset bonuses
        let bonuses = {
            heatGeneration: 1.0,
            fuelGeneration: 1.0,
            pressureGeneration: 1.0,
            energyGeneration: 1.0,
            stabilityGeneration: 1.0,
            upgradeEfficiency: 1.0,
            allGeneration: 1.0
        };

        // Apply bonuses from unlocked achievements
        achievements.unlocked.forEach(id => {
            const achievement = definitions[id];
            if (!achievement || !achievement.reward) return;

            const reward = achievement.reward.toLowerCase();
            
            if (reward.includes('heat generation')) {
                const match = reward.match(/(\d+)%.*heat generation/);
                if (match) {
                    bonuses.heatGeneration += parseInt(match[1]) / 100;
                }
            } else if (reward.includes('fuel generation')) {
                const match = reward.match(/(\d+)%.*fuel generation/);
                if (match) {
                    bonuses.fuelGeneration += parseInt(match[1]) / 100;
                }
            } else if (reward.includes('upgrade efficiency')) {
                const match = reward.match(/(\d+)%.*upgrade efficiency/);
                if (match) {
                    bonuses.upgradeEfficiency += parseInt(match[1]) / 100;
                }
            } else if (reward.includes('all generation')) {
                const match = reward.match(/(\d+)%.*all generation/);
                if (match) {
                    bonuses.allGeneration += parseInt(match[1]) / 100;
                }
            }
        });

        // Store bonuses in state for use by other systems
        state.achievementBonuses = bonuses;
        
        return bonuses;
    }

    initializeAchievementTracking(state) {
        // Initialize tracking variables if they don't exist
        if (!state.gameStartTime) {
            state.gameStartTime = Date.now();
        }
        if (!state.totalClicks) {
            state.totalClicks = 0;
        }
        if (!state.totalResets) {
            state.totalResets = 0;
        }
        if (!state.synergyActivations) {
            state.synergyActivations = 0;
        }
        if (!state.playtime) {
            state.playtime = 0;
        }
    }

    incrementClick() {
        const state = this.gameState.getState();
        state.totalClicks = (state.totalClicks || 0) + 1;
    }

    incrementSynergyActivation() {
        const state = this.gameState.getState();
        state.synergyActivations = (state.synergyActivations || 0) + 1;
    }

    updatePlaytime() {
        const state = this.gameState.getState();
        if (state.lastUpdateTime) {
            const now = Date.now();
            const elapsed = (now - state.lastUpdateTime) / 1000;
            state.playtime = (state.playtime || 0) + elapsed;
        }
        state.lastUpdateTime = Date.now();
    }
}
