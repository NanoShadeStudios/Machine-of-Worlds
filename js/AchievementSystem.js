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
                // Speed challenges (upgrades, worlds within time limit)
                if (requirement.category && requirement.count && requirement.time) {
                    const recentActions = state.recentActions || {};
                    const actions = recentActions[requirement.category] || [];
                    
                    // Count actions within the time window
                    const now = Date.now();
                    const recentCount = actions.filter(timestamp => 
                        (now - timestamp) <= (requirement.time * 1000)
                    ).length;
                    
                    return recentCount >= requirement.count;
                }
                break;

            case 'conversion':
                // Track resource conversions
                if (requirement.from && requirement.to && requirement.amount) {
                    const conversionKey = `${requirement.from}_to_${requirement.to}`;
                    const totalConverted = state.conversions?.[conversionKey] || 0;
                    return totalConverted >= requirement.amount;
                }
                break;

            case 'ratio':
                // Check resource ratios
                if (requirement.resources && requirement.ratio) {
                    const values = requirement.resources.map(r => state.resources[r] || 0);
                    if (values.some(v => v === 0)) return false;
                    
                    // Calculate ratios relative to the first resource
                    const baseValue = values[0];
                    for (let i = 1; i < values.length; i++) {
                        const expectedRatio = requirement.ratio[i] / requirement.ratio[0];
                        const actualRatio = values[i] / baseValue;
                        if (Math.abs(actualRatio - expectedRatio) > 0.1) return false;
                    }
                    return true;
                }
                break;

            case 'maintain':
                // Check if ratio has been maintained for duration
                if (requirement.resources && requirement.ratio && requirement.duration) {
                    const maintainKey = `${requirement.resources.join('_')}_ratio`;
                    const maintenance = state.maintenance?.[maintainKey];
                    return maintenance && maintenance.duration >= requirement.duration;
                }
                break;

            case 'streak':
                // Check various streak types
                if (requirement.category && requirement.count) {
                    const streaks = state.streaks || {};
                    const currentStreak = streaks[requirement.category] || 0;
                    return currentStreak >= requirement.count;
                }
                break;

            case 'discovery':
                // Track discovery of game mechanics
                if (requirement.category && requirement.count) {
                    const discoveries = state.discoveries || {};
                    const discovered = discoveries[requirement.category] || [];
                    return discovered.length >= requirement.count;
                }
                break;

            case 'challenge':
                // Special challenge conditions
                if (requirement.method === 'manual' && requirement.resource && requirement.amount) {
                    const manualGeneration = state.manualGeneration || {};
                    const manualAmount = manualGeneration[requirement.resource] || 0;
                    return manualAmount >= requirement.amount;
                }
                break;

            case 'simultaneous':
                // Check simultaneous activities
                if (requirement.category === 'generation' && requirement.count) {
                    const activeGenerators = Object.values(state.resources).filter(amount => amount > 0).length;
                    return activeGenerators >= requirement.count;
                }
                break;

            case 'caps':
                // Track hitting resource caps
                if (requirement.category === 'reached' && requirement.count) {
                    const capHits = state.capHits || 0;
                    return capHits >= requirement.count;
                }
                break;

            case 'usage':
                // Track feature usage time
                if (requirement.category && requirement.duration) {
                    const usage = state.featureUsage || {};
                    const usageTime = usage[requirement.category] || 0;
                    return usageTime >= requirement.duration;
                }
                break;

            case 'navigation':
                // Track page visits
                if (requirement.category === 'all_pages' && requirement.count) {
                    const visits = state.pageVisits || {};
                    const pages = ['main', 'upgrades', 'worlds', 'achievements', 'settings'];
                    return pages.every(page => (visits[page] || 0) >= requirement.count);
                }
                break;

            case 'constraint':
                // Challenge with constraints
                if (requirement.category === 'upgrades' && requirement.max && requirement.goal) {
                    const upgradeTypes = Object.values(state.upgrades).filter(u => u.level > 0).length;
                    if (upgradeTypes > requirement.max) return false;
                    
                    // Check if goal was achieved with constraint
                    if (requirement.goal.type === 'worlds') {
                        return state.worldsCreated >= requirement.goal.amount;
                    }
                }
                break;

            case 'tier':
                // Tier-specific achievements
                if (requirement.tier && requirement.worldsCreated) {
                    const tierWorlds = state.tierWorldCounts || {};
                    const tierCount = tierWorlds[`tier${requirement.tier}`] || 0;
                    return tierCount >= requirement.worldsCreated;
                }
                break;

            case 'tierVariety':
                // Multi-tier variety achievements
                if (requirement.tiers && requirement.minEach) {
                    const tierWorlds = state.tierWorldCounts || {};
                    return requirement.tiers.every(tier => {
                        const tierCount = tierWorlds[`tier${tier}`] || 0;
                        return tierCount >= requirement.minEach;
                    });
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
            allGeneration: 1.0,
            conversionEfficiency: 1.0,
            manualGeneration: 1.0,
            resourceCaps: 1.0,
            worldCreationSpeed: 1.0,
            balancedGeneration: 1.0,
            continuousGeneration: 1.0,
            parallelEfficiency: 1.0
        };

        // Apply bonuses from unlocked achievements
        achievements.unlocked.forEach(id => {
            const achievement = definitions[id];
            if (!achievement || !achievement.reward) return;

            const reward = achievement.reward.toLowerCase();
            
            // Percentage bonuses
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
            } else if (reward.includes('conversion efficiency')) {
                const match = reward.match(/(\d+)%.*conversion efficiency/);
                if (match) {
                    bonuses.conversionEfficiency += parseInt(match[1]) / 100;
                }
            } else if (reward.includes('balanced generation')) {
                const match = reward.match(/(\d+)%.*balanced generation/);
                if (match) {
                    bonuses.balancedGeneration += parseInt(match[1]) / 100;
                }
            } else if (reward.includes('continuous generation')) {
                const match = reward.match(/(\d+)%.*continuous generation/);
                if (match) {
                    bonuses.continuousGeneration += parseInt(match[1]) / 100;
                }
            } else if (reward.includes('parallel efficiency')) {
                const match = reward.match(/(\d+)%.*parallel efficiency/);
                if (match) {
                    bonuses.parallelEfficiency += parseInt(match[1]) / 100;
                }
            } else if (reward.includes('resource caps')) {
                const match = reward.match(/(\d+)%.*resource caps/);
                if (match) {
                    bonuses.resourceCaps += parseInt(match[1]) / 100;
                }
            } else if (reward.includes('world creation speed')) {
                const match = reward.match(/(\d+)%.*world creation speed/);
                if (match) {
                    bonuses.worldCreationSpeed += parseInt(match[1]) / 100;
                }
            }
            
            // Special multipliers (x2, x3, etc.)
            if (reward.includes('manual generation x2')) {
                bonuses.manualGeneration += 1.0; // +100%
            }
            
            // Feature unlocks (handled separately by systems that check for specific achievements)
            if (reward.includes('unlock auto-conversion')) {
                state.unlockedFeatures = state.unlockedFeatures || {};
                state.unlockedFeatures.autoConversion = true;
            }
            if (reward.includes('unlock ratio bonuses')) {
                state.unlockedFeatures = state.unlockedFeatures || {};
                state.unlockedFeatures.ratioBonuses = true;
            }
            if (reward.includes('unlock daily bonuses')) {
                state.unlockedFeatures = state.unlockedFeatures || {};
                state.unlockedFeatures.dailyBonuses = true;
            }
            if (reward.includes('unlock bulk purchasing')) {
                state.unlockedFeatures = state.unlockedFeatures || {};
                state.unlockedFeatures.bulkPurchasing = true;
            }
            if (reward.includes('resource generation overview')) {
                state.unlockedFeatures = state.unlockedFeatures || {};
                state.unlockedFeatures.generationOverview = true;
            }
            if (reward.includes('unlock advanced automation')) {
                state.unlockedFeatures = state.unlockedFeatures || {};
                state.unlockedFeatures.advancedAutomation = true;
            }
            if (reward.includes('unlock quick navigation')) {
                state.unlockedFeatures = state.unlockedFeatures || {};
                state.unlockedFeatures.quickNavigation = true;
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
        if (!state.conversions) {
            state.conversions = {};
        }
        if (!state.streaks) {
            state.streaks = {};
        }
        if (!state.recentActions) {
            state.recentActions = {};
        }
        if (!state.maintenance) {
            state.maintenance = {};
        }
        if (!state.discoveries) {
            state.discoveries = { generation: [] };
        }
        if (!state.manualGeneration) {
            state.manualGeneration = {};
        }
        if (!state.capHits) {
            state.capHits = 0;
        }
        if (!state.featureUsage) {
            state.featureUsage = {};
        }
        if (!state.pageVisits) {
            state.pageVisits = {};
        }
        if (!state.unlockedFeatures) {
            state.unlockedFeatures = {};
        }
        if (!state.tierWorldCounts) {
            state.tierWorldCounts = { tier1: 0, tier2: 0, tier3: 0 };
        }
    }

    // Existing tracking methods
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

    // New tracking methods for achievement variety
    trackConversion(fromResource, toResource, amount) {
        const state = this.gameState.getState();
        const conversionKey = `${fromResource}_to_${toResource}`;
        state.conversions[conversionKey] = (state.conversions[conversionKey] || 0) + amount;
    }

    trackRecentAction(category) {
        const state = this.gameState.getState();
        if (!state.recentActions[category]) {
            state.recentActions[category] = [];
        }
        state.recentActions[category].push(Date.now());
        
        // Keep only last 100 actions to prevent memory bloat
        if (state.recentActions[category].length > 100) {
            state.recentActions[category] = state.recentActions[category].slice(-50);
        }
    }

    updateStreak(category, isActive) {
        const state = this.gameState.getState();
        if (isActive) {
            state.streaks[category] = (state.streaks[category] || 0) + 1;
        } else {
            state.streaks[category] = 0;
        }
    }

    trackDiscovery(category, method) {
        const state = this.gameState.getState();
        if (!state.discoveries[category]) {
            state.discoveries[category] = [];
        }
        if (!state.discoveries[category].includes(method)) {
            state.discoveries[category].push(method);
        }
    }

    trackManualGeneration(resource, amount) {
        const state = this.gameState.getState();
        state.manualGeneration[resource] = (state.manualGeneration[resource] || 0) + amount;
    }

    incrementCapHit() {
        const state = this.gameState.getState();
        state.capHits = (state.capHits || 0) + 1;
    }

    trackFeatureUsage(feature, duration) {
        const state = this.gameState.getState();
        state.featureUsage[feature] = (state.featureUsage[feature] || 0) + duration;
    }

    trackPageVisit(page) {
        const state = this.gameState.getState();
        state.pageVisits[page] = (state.pageVisits[page] || 0) + 1;
    }

    updateRatioMaintenance(resources, isBalanced) {
        const state = this.gameState.getState();
        const maintainKey = `${resources.join('_')}_ratio`;
        
        if (isBalanced) {
            if (!state.maintenance[maintainKey]) {
                state.maintenance[maintainKey] = { startTime: Date.now(), duration: 0 };
            }
            const elapsed = (Date.now() - state.maintenance[maintainKey].startTime) / 1000;
            state.maintenance[maintainKey].duration = elapsed;
        } else {
            if (state.maintenance[maintainKey]) {
                delete state.maintenance[maintainKey];
            }
        }
    }

    trackTierWorldCreation(tier) {
        const state = this.gameState.getState();
        if (!state.tierWorldCounts) {
            state.tierWorldCounts = { tier1: 0, tier2: 0, tier3: 0 };
        }
        state.tierWorldCounts[`tier${tier}`] = (state.tierWorldCounts[`tier${tier}`] || 0) + 1;
    }
}
