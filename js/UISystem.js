// UISystem.js - Handles UI updates, event handlers, and notifications

export class UISystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.eventModal = null;
        this.currentPage = 'main';
        this.isTransitioning = false;
        this.resourceDescriptions = {
            heat: "Generated from world gravity. Used for upgrades and energy creation. Essential for machine operation.",
            fuel: "Generated from world time speed. Used for upgrades and energy creation. Improves with cold worlds.",
            pressure: "Generated from gravity and atmosphere. Used for cross-resource upgrades. Decays when changing worlds.",
            energy: "Created from combining Heat and Fuel. Used for advanced actions and emergency repairs. Decays over time.",
            stability: "Generated slowly from favorable conditions. Reduces negative events and enables advanced upgrades."
        };
    }

    // Screen reader announcement method for accessibility
    announceToScreenReader(message) {
        const srElement = document.getElementById('sr-announcements');
        if (srElement) {
            srElement.textContent = message;
            // Clear after a delay to allow for repeated announcements
            setTimeout(() => {
                srElement.textContent = '';
            }, 1000);
        }
    }

    // Set callback for when returning to main page
    setMainPageReturnCallback(callback) {
        this.onMainPageReturn = callback;
    }

    setupPageNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        console.log('Found nav buttons:', navButtons.length);
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Nav button clicked:', e.target.dataset.page);
                // Prevent navigation during transitions
                if (this.isTransitioning) {
                    console.log('Navigation blocked - transition in progress');
                    return;
                }
                
                const page = e.target.dataset.page;
                console.log('Switching to page:', page);
                
                // Special handling for worlds button unlock
                if (page === 'worlds' && btn.textContent === 'UNLOCK!!') {
                    this.handleWorldsUnlock(btn);
                } else {
                    this.switchToPage(page);
                }
            });
        });
    }

    // Handle the exciting worlds unlock experience
    handleWorldsUnlock(worldsBtn) {
        const state = this.gameState.getState();
        const heatRequired = 100;
        const fuelRequired = 50;
        
        // Check if player has enough resources
        if (state.resources.heat >= heatRequired && state.resources.fuel >= fuelRequired && !state.unlocks.worldGenerator) {
            // Trigger the unlock!
            worldsBtn.textContent = 'Unlocked!';
            worldsBtn.classList.add('unlocking');
            
            // Announce to screen readers
            this.announceToScreenReader('World Generator unlocked!');
            
            // Call the actual unlock function
            if (this.unlockWorldsCallback) {
                this.unlockWorldsCallback();
            }
            
            // After 1.5 seconds, change to "Worlds" and enable navigation
            setTimeout(() => {
                worldsBtn.textContent = 'Worlds';
                worldsBtn.classList.remove('unlocking', 'unlock-ready');
                // Now allow normal navigation
                this.switchToPage('worlds');
            }, 1500);
        }
    }

    // Set callback for worlds unlock
    setUnlockWorldsCallback(callback) {
        this.unlockWorldsCallback = callback;
    }

    switchToPage(pageName) {
        // If already on the target page, do nothing
        if (this.currentPage === pageName) return;
        
        const currentPageElement = this.currentPage ? document.getElementById(this.currentPage + 'Page') : null;
        const targetPageElement = document.getElementById(pageName + 'Page');
        
        if (!targetPageElement) return;
        
        // Start transition
        this.isTransitioning = true;
        
        // Add loading indicator
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('transitioning');
        }
        
        // Add transitioning-out class to current page
        if (currentPageElement) {
            currentPageElement.classList.add('transitioning-out');
        }
        
        // Update navigation buttons immediately for responsiveness
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.removeAttribute('aria-current');
        });
        
        const activeBtn = document.querySelector(`[data-page="${pageName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-current', 'page');
        }
        
        // After a short delay, show the new page
        setTimeout(() => {
            // Hide current page
            if (currentPageElement) {
                currentPageElement.classList.remove('active', 'transitioning-out');
            }
            
            // Show target page
            targetPageElement.classList.add('active');
            
            this.currentPage = pageName;
            
            // Announce page change to screen readers
            const pageNames = {
                main: 'Main game page',
                worlds: 'World generator page',
                options: 'Options and settings page',
                achievements: 'Achievements page'
            };
            this.announceToScreenReader(`Switched to ${pageNames[pageName] || pageName}`);
            
            // Update page-specific UI after transition
            setTimeout(() => {
                if (pageName === 'achievements') {
                    this.updateAchievementsUI();
                } else if (pageName === 'options') {
                    this.updateOptionsUI();
                } else if (pageName === 'worlds') {
                    this.updateWorldsPageUI();
                } else if (pageName === 'main') {
                    // Re-render machine and update main page when switching back
                    if (this.onMainPageReturn) {
                        this.onMainPageReturn();
                    }
                }
                
                // Remove loading indicator and finish transition
                if (gameContainer) {
                    gameContainer.classList.remove('transitioning');
                }
                this.isTransitioning = false;
            }, 100); // Small delay to ensure page is visible before updating content
            
        }, 150); // Half of the transition duration for smoother overlap
    }

    updateUnlockStatus() {
        const state = this.gameState.getState();
        if (!state || !state.unlocks) return; // Guard against undefined state
        
        const worldsNavBtn = document.getElementById('worldsNavBtn');
        const unlockWorldsBtn = document.getElementById('unlockWorldsBtn');
        
        const heatRequired = 100;
        const fuelRequired = 50;
        
        // Update navigation button state with enhanced experience
        if (worldsNavBtn) {
            const hasEnoughResources = state.resources.heat >= heatRequired && state.resources.fuel >= fuelRequired;
            
            if (state.unlocks.worldGenerator) {
                // Already unlocked - show normal state
                worldsNavBtn.textContent = 'Worlds';
                worldsNavBtn.disabled = false;
                worldsNavBtn.classList.remove('locked', 'unlock-ready');
            } else if (hasEnoughResources) {
                // Can unlock - show exciting unlock prompt
                worldsNavBtn.textContent = 'UNLOCK!!';
                worldsNavBtn.disabled = false;
                worldsNavBtn.classList.remove('locked');
                worldsNavBtn.classList.add('unlock-ready');
            } else {
                // Locked - show required materials mysteriously
                worldsNavBtn.textContent = `${heatRequired} Heat + ${fuelRequired} Fuel`;
                worldsNavBtn.disabled = true;
                worldsNavBtn.classList.add('locked');
                worldsNavBtn.classList.remove('unlock-ready');
            }
        }
        
        // Update unlock button (keep existing logic but hide when nav button shows UNLOCK!!)
        if (unlockWorldsBtn) {
            const hasEnoughResources = state.resources.heat >= heatRequired && state.resources.fuel >= fuelRequired;
            
            if (hasEnoughResources && !state.unlocks.worldGenerator) {
                // Hide unlock button when nav button shows UNLOCK!!
                unlockWorldsBtn.style.display = 'none';
            } else if (!state.unlocks.worldGenerator) {
                unlockWorldsBtn.style.display = 'block';
                unlockWorldsBtn.disabled = true;
                unlockWorldsBtn.textContent = `Need ${heatRequired} Heat + ${fuelRequired} Fuel`;
                unlockWorldsBtn.className = 'primary-btn disabled';
            } else {
                unlockWorldsBtn.style.display = 'none';
            }
        }
    }

    updateWorldsPageUI() {
        const state = this.gameState.getState();
        
        // Update total worlds created
        const totalWorldsElement = document.getElementById('totalWorldsCreated');
        if (totalWorldsElement) {
            totalWorldsElement.textContent = state.worldsCreated;
        }
        
        // Update active world benefits
        const benefitsElement = document.getElementById('activeWorldBenefits');
        if (benefitsElement && state.currentWorld) {
            let benefits = [];
            if (state.currentWorld.gravity !== 1.0) {
                benefits.push(`Heat +${Math.round((state.currentWorld.gravity - 1) * 100)}%`);
            }
            if (state.currentWorld.timeSpeed !== 1.0) {
                benefits.push(`Fuel +${Math.round((state.currentWorld.timeSpeed - 1) * 100)}%`);
            }
            benefitsElement.textContent = benefits.length > 0 ? benefits.join(', ') : 'None';
        }
        
        // Update world history
        this.updateWorldHistory();
    }
    
    updateWorldHistory() {
        const state = this.gameState.getState();
        const historyContainer = document.getElementById('worldHistory');
        
        if (!historyContainer) return;
        
        if (!state.worldHistory || state.worldHistory.length === 0) {
            historyContainer.innerHTML = '<p class="no-worlds">No worlds created yet</p>';
            return;
        }
        
        // Show last 10 worlds
        const recentWorlds = state.worldHistory.slice(-10).reverse();
        
        historyContainer.innerHTML = recentWorlds.map(world => `
            <div class="world-history-item">
                <div class="world-header">
                    <span class="world-number">#${world.id}</span>
                    <span class="world-type">${world.type}</span>
                    <span class="world-tier">Tier ${world.tier || 1}</span>
                </div>
                <div class="world-properties">
                    <span>Gravity: ${world.gravity}x</span>
                    <span>Time: ${world.timeSpeed}x</span>
                    <span>Temp: ${world.temperature}°C</span>
                </div>
                ${world.specialEffects ? `<div class="world-special">${world.specialEffects.description}</div>` : ''}
            </div>
        `).join('');
    }

    updateAchievementsUI() {
        const state = this.gameState.getState();
        
        if (!state || !state.achievements) {
            return;
        }
        
        const achievements = state.achievements;
        const definitions = achievements.definitions;
        
        
        // Update progress bar
        const totalAchievements = Object.keys(definitions).length;
        const unlockedAchievements = achievements.unlocked.length;
        const progressPercent = (unlockedAchievements / totalAchievements) * 100;
        
        const progressBar = document.getElementById('achievementsProgress');
        const completedSpan = document.getElementById('achievementsUnlocked');
        const totalSpan = document.getElementById('achievementsTotal');
        
        if (progressBar) {
            progressBar.style.width = `${progressPercent}%`;
            // Update aria attributes for screen readers
            const progressContainer = progressBar.parentElement;
            if (progressContainer) {
                progressContainer.setAttribute('aria-valuenow', unlockedAchievements);
                progressContainer.setAttribute('aria-valuemax', totalAchievements);
            }
        }
        if (completedSpan) completedSpan.textContent = unlockedAchievements;
        if (totalSpan) totalSpan.textContent = totalAchievements;
        
        // Create achievement grid
        this.createAchievementGrid(achievements, definitions);
    }
    
    createAchievementGrid(achievements, definitions) {
        const container = document.getElementById('achievementsGrid');
        
        if (!container) {
            return;
        }
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create numbered boxes (1-50)
        for (let i = 1; i <= 50; i++) {
            const box = document.createElement('div');
            box.className = 'achievement-box';
            box.textContent = i;
            box.dataset.achievementId = i;
            
            // Check if achievement is unlocked
            if (achievements.unlocked.includes(i)) {
                box.classList.add('unlocked');
            } else {
                box.classList.add('locked');
            }
            
            // Add hover event listeners
            box.addEventListener('mouseenter', (e) => this.showAchievementTooltip(e, i, definitions[i], achievements.unlocked.includes(i)));
            box.addEventListener('mouseleave', () => this.hideAchievementTooltip());
            
            container.appendChild(box);
        }
    }
    
    showAchievementTooltip(event, id, achievement, isUnlocked) {
        if (!achievement) {
            return;
        }
        
        const tooltip = document.getElementById('achievementTooltip');
        if (!tooltip) {
            return;
        }
        
        const title = tooltip.querySelector('.tooltip-title');
        const description = tooltip.querySelector('.tooltip-description');
        const reward = tooltip.querySelector('.tooltip-reward');
        const progress = tooltip.querySelector('.tooltip-progress');
        

        
        // Handle hidden achievements
        if (achievement.hidden && !isUnlocked) {
            title.textContent = '???';
            description.textContent = 'This achievement is hidden';
            reward.textContent = '???';
            progress.textContent = '';
        } else {
            title.textContent = achievement.name;
            description.textContent = achievement.description;
            reward.textContent = achievement.reward;
            
            // Show progress if available
            const state = this.gameState.getState();
            const achievementProgress = this.calculateAchievementProgress(achievement.requirement, state);
            progress.textContent = achievementProgress;
        }
        
        // Apply locked/unlocked styling
        tooltip.className = `achievement-tooltip ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
        
        // Show tooltip
        tooltip.classList.add('show');
    }
    
    hideAchievementTooltip() {
        const tooltip = document.getElementById('achievementTooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
        }
    }
    
    calculateAchievementProgress(requirement, state) {
        if (!requirement || !state) return '';
        
        switch (requirement.type) {
            case 'resource':
                const currentAmount = state.resources[requirement.resource] || 0;
                return `${Math.floor(currentAmount)}/${requirement.amount}`;
                
            case 'worlds':
                const worldCount = state.worldsCreated || 0;
                return `${worldCount}/${requirement.amount}`;
                
            case 'upgrade':
                if (requirement.count) {
                    const upgradeCount = Object.values(state.upgrades).reduce((count, upgrade) => {
                        return count + (upgrade.level > 0 ? 1 : 0);
                    }, 0);
                    return `${upgradeCount}/${requirement.count}`;
                }
                break;
                
            case 'achievements':
                const unlockedCount = state.achievements.unlocked.length;
                return `${unlockedCount}/${requirement.amount}`;
                
            case 'playtime':
                const playtime = state.playtime || 0;
                const hours = Math.floor(playtime / 3600);
                const reqHours = Math.floor(requirement.amount / 3600);
                return `${hours}h/${reqHours}h`;
                
            case 'clicks':
                const clicks = state.totalClicks || 0;
                return `${clicks}/${requirement.amount}`;
                
            default:
                return 'Progress tracking';
        }
        
        return '';
    }

    updateOptionsUI() {
        const state = this.gameState.getState();
        if (!state || !state.settings) return; // Guard against undefined state/settings
        
        const settings = state.settings;
        
        // Update all option inputs with current settings
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) themeSelect.value = settings.theme;
        
        const showResourceDescriptions = document.getElementById('showResourceDescriptions');
        if (showResourceDescriptions) showResourceDescriptions.checked = settings.showResourceDescriptions;
        
        const animateProgressBars = document.getElementById('animateProgressBars');
        if (animateProgressBars) animateProgressBars.checked = settings.animateProgressBars;
        
        const showDetailedTooltips = document.getElementById('showDetailedTooltips');
        if (showDetailedTooltips) showDetailedTooltips.checked = settings.showDetailedTooltips;
        
        const autoSaveInterval = document.getElementById('autoSaveInterval');
        if (autoSaveInterval) autoSaveInterval.value = settings.autoSaveInterval;
        
        const showEfficiencyNumbers = document.getElementById('showEfficiencyNumbers');
        if (showEfficiencyNumbers) showEfficiencyNumbers.checked = settings.showEfficiencyNumbers;
        
        const confirmDangerousActions = document.getElementById('confirmDangerousActions');
        if (confirmDangerousActions) confirmDangerousActions.checked = settings.confirmDangerousActions;
        
        const showTutorialMessages = document.getElementById('showTutorialMessages');
        if (showTutorialMessages) showTutorialMessages.checked = settings.showTutorialMessages;
        
        const soundEffects = document.getElementById('soundEffects');
        if (soundEffects) soundEffects.checked = settings.soundEffects;
        
        const backgroundMusic = document.getElementById('backgroundMusic');
        if (backgroundMusic) backgroundMusic.checked = settings.backgroundMusic;
        
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        if (volumeSlider && volumeValue) {
            volumeSlider.value = settings.volume;
            volumeValue.textContent = settings.volume + '%';
        }
    }

    setupResourceDescriptions() {
        Object.keys(this.resourceDescriptions).forEach(resource => {
            const element = document.querySelector(`[data-resource="${resource}"]`);
            if (element) {
                element.addEventListener('mouseenter', (e) => {
                    this.showResourceDescription(resource, e.target.getBoundingClientRect());
                });
                
                element.addEventListener('mouseleave', () => {
                    this.hideResourceDescription();
                });
            }
        });
    }

    showResourceDescription(resourceType, rect) {
        const descriptionElement = document.getElementById('resourceDescription');
        if (descriptionElement) {
            descriptionElement.textContent = this.resourceDescriptions[resourceType] || 'No description available';
            descriptionElement.style.opacity = '1';
        }
    }

    hideResourceDescription() {
        const descriptionElement = document.getElementById('resourceDescription');
        if (descriptionElement) {
            descriptionElement.textContent = 'Hover over a resource to see its description';
            descriptionElement.style.opacity = '0.7';
        }
    }

    updateUI() {
        // Update counters
        const state = this.gameState.getState();
        if (!state) return; // Guard against undefined state
        
        document.getElementById('worldsCreated').textContent = state.worldsCreated;
        document.getElementById('machineComplexity').textContent = state.machineComplexity;
        
        // Update unlock status
        this.updateUnlockStatus();
        
        // Update worlds page if we're on it
        if (this.currentPage === 'worlds') {
            this.updateWorldsPageUI();
        }
        
        // Update resources
        document.getElementById('heatAmount').textContent = Math.floor(state.resources.heat);
        document.getElementById('fuelAmount').textContent = Math.floor(state.resources.fuel);
        document.getElementById('pressureAmount').textContent = Math.floor(state.resources.pressure);
        document.getElementById('energyAmount').textContent = Math.floor(state.resources.energy);
        document.getElementById('stabilityAmount').textContent = Math.floor(state.resources.stability);
        
        // Update passive income display
        this.updatePassiveIncomeDisplay();
        
        // Update world display
        this.updateWorldDisplay();
        
        // Update world tier UI
        this.updateWorldTierUI();
        
        // Update upgrades
        this.updateUpgradeDisplay('heatGenerator', 'heat');
        this.updateUpgradeDisplay('fuelEfficiency', 'fuel');
        this.updateCrossUpgradeDisplay('thermalAccelerator', ['heat']);
        this.updateCrossUpgradeDisplay('fuelSynchronizer', ['fuel']);
        this.updateCrossUpgradeDisplay('pressureValve', ['stability']);
        this.updateCrossUpgradeDisplay('energyMatrix', ['heat', 'fuel']);
        
        // Update energy button
        this.updateEnergyButton();
        
        // Update active events display
        this.updateActiveEventsDisplay();
        
        // Update tabbed interface visuals
        this.updateConversionVisuals();
        this.updateSynergyVisuals();
    }

    updateWorldDisplay() {
        const state = this.gameState.getState();
        const worldDisplay = document.getElementById('currentWorld');
        
        // If the element doesn't exist (e.g., on main page after moving world status), skip update
        if (!worldDisplay) {
            return;
        }
        
        if (state.currentWorld) {
            const world = state.currentWorld;
            const specialEffectsDesc = world.specialEffects && world.specialEffects.description ? 
                `<div class="world-special-effects">${world.specialEffects.description}</div>` : '';
            
            worldDisplay.innerHTML = `
                <div class="world-info world-tier-${world.tier || 1}">
                    <div class="world-property">
                        <span class="property-name">Type:</span>
                        <span class="property-value">${world.type}</span>
                    </div>
                    ${specialEffectsDesc}
                    <div class="world-property">
                        <span class="property-name">Gravity:</span>
                        <span class="property-value">${world.gravity}x</span>
                    </div>
                    <div class="world-property">
                        <span class="property-name">Time Speed:</span>
                        <span class="property-value">${world.timeSpeed}x</span>
                    </div>
                    <div class="world-property">
                        <span class="property-name">Weather:</span>
                        <span class="property-value">${world.weather} (${world.weatherDuration || 0} turns)</span>
                    </div>
                    <div class="world-property">
                        <span class="property-name">Temperature:</span>
                        <span class="property-value">${world.temperature}°C</span>
                    </div>
                    <div class="world-property">
                        <span class="property-name">Atmosphere:</span>
                        <span class="property-value">${world.atmosphere}%</span>
                    </div>
                </div>
            `;
        } else {
            worldDisplay.innerHTML = '<p>No world generated yet</p>';
        }
        
        this.updateWeatherWidget();
    }

    updateWeatherWidget() {
        // Temporarily disabled to prevent errors
        return;
        
        const widget = document.getElementById('weatherWidget');
        if (!widget) {
            return;
        }
        
        const state = this.gameState.getState();
        const world = state ? state.currentWorld : null;
        if (!world) {
            widget.style.display = 'none';
            return;
        }
        
        // Additional check: make sure we have all required child elements
        const iconEl = document.getElementById('weatherIcon');
        const nameEl = document.getElementById('weatherName');
        const fillEl = document.getElementById('weatherDurationFill');
        const turnsEl = document.getElementById('weatherDuration');
        const effectsEl = document.getElementById('weatherEffects');

        // Check if all elements exist before trying to update them
        if (!iconEl || !nameEl || !fillEl || !turnsEl || !effectsEl) {
            console.warn('Weather widget elements not found, skipping update');
            widget.style.display = 'none';
            return;
        }
        
        widget.style.display = 'block';

        const maxDuration = world.originalWeatherDuration || (world.weatherDuration || 10);
        if (!world.originalWeatherDuration) world.originalWeatherDuration = maxDuration; // cache baseline
        const remaining = world.weatherDuration || 0;
        const pct = Math.max(0, Math.min(100, (remaining / maxDuration) * 100));
        fillEl.style.width = pct + '%';
        turnsEl.textContent = `${remaining} turn${remaining === 1 ? '' : 's'}`;

        // Icon mapping
        const iconMap = {
            Calm: '🌤️',
            Stormy: '⛈️',
            Chaotic: '⚡',
            Serene: '✨',
            Turbulent: '🌪️'
        };
        iconEl.textContent = iconMap[world.weather] || '☁️';
        nameEl.textContent = world.weather;

        // Badge effects summary
        const effectBadges = [];
        switch (world.weather) {
            case 'Stormy':
                effectBadges.push('+50% Fuel', '+25% Heat', 'Stability -2');
                break;
            case 'Calm':
                effectBadges.push('+15% All', 'Stability +1');
                break;
            case 'Chaotic':
                effectBadges.push('±25-75% Output', 'Stability -3');
                break;
            case 'Serene':
                effectBadges.push('+30% Fuel', 'Stability +2');
                break;
            case 'Turbulent':
                effectBadges.push('Pressure +100%', 'Heat -20%', 'Stability -1');
                break;
        }
        effectsEl.innerHTML = effectBadges.map(b => `<span class="weather-effect-badge">${b}</span>`).join('');

        // Class coloring
        widget.classList.remove('weather-calm','weather-stormy','weather-chaotic','weather-serene','weather-turbulent');
        widget.classList.add('weather-' + world.weather.toLowerCase());
    }

    updateWorldTierUI() {
        // Temporarily disabled to prevent errors
        return;
        
        // Update Tier 2 status
        const state = this.gameState.getState();
        if (!state || !state.upgrades) return;
        
        const basicUpgradesMaxed = Object.keys(state.upgrades)
            .filter(key => ['heatGenerator', 'fuelEfficiency'].includes(key))
            .filter(key => state.upgrades[key].level >= state.upgrades[key].maxLevel)
            .length;
            
        document.getElementById('tier2WorldsProgress').textContent = 
            `${state.worldsCreated}/25`;
        document.getElementById('tier2UpgradesProgress').textContent = 
            `${basicUpgradesMaxed}/2`;
        
        const tier2Item = document.getElementById('tier2Item');
        const tier2Status = document.getElementById('tier2Status');
        
        if (state.worldTiers && state.worldTiers.tier2Unlocked) {
            tier2Item.classList.add('tier-unlocked');
            tier2Status.textContent = '✅ Tier 2: Enhanced';
        } else {
            tier2Item.classList.remove('tier-unlocked');
            tier2Status.textContent = '🔒 Tier 2: Enhanced';
        }
        
        // Update Tier 3 status
        const crossUpgradesLevel5 = Object.keys(state.upgrades)
            .filter(key => ['thermalAccelerator', 'fuelSynchronizer', 'pressureValve', 'energyMatrix'].includes(key))
            .filter(key => state.upgrades[key].level >= 5)
            .length;
            
        document.getElementById('tier3WorldsProgress').textContent = 
            `${state.worldsCreated}/100`;
        document.getElementById('tier3CrossProgress').textContent = 
            `${crossUpgradesLevel5}/1`;
        
        const tier3Item = document.getElementById('tier3Item');
        const tier3Status = document.getElementById('tier3Status');
        
        if (state.worldTiers && state.worldTiers.tier3Unlocked) {
            tier3Item.classList.add('tier-unlocked');
            tier3Status.textContent = '✅ Tier 3: Exotic';
        } else {
            tier3Item.classList.remove('tier-unlocked');
            tier3Status.textContent = '🔒 Tier 3: Exotic';
        }
    }

    updateUpgradeDisplay(upgradeType, resourceType) {
        const state = this.gameState.getState();
        if (!state || !state.upgrades) return;
        
        const upgrade = state.upgrades[upgradeType];
        const cost = Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.level));
        
        // Map upgrade types to their HTML element IDs
        let elementPrefix = '';
        if (upgradeType === 'heatGenerator') {
            elementPrefix = 'heat';
        } else if (upgradeType === 'fuelEfficiency') {
            elementPrefix = 'fuel';
        } else {
            elementPrefix = upgradeType; // For cross-resource upgrades
        }
        
        // Update level display with null check
        const levelElement = document.getElementById(`${elementPrefix}UpgradeLevel`);
        if (levelElement) {
            levelElement.textContent = upgrade.level;
        }
        
        // Update cost display with null check
        const costElement = document.getElementById(`${elementPrefix}UpgradeCost`);
        if (costElement) {
            costElement.textContent = cost;
        }
        
        const progressElement = document.getElementById(`${elementPrefix}UpgradeProgress`);
        if (progressElement) {
            const progress = (upgrade.level / upgrade.maxLevel) * 100;
            progressElement.style.width = `${progress}%`;
        }
        
        const button = document.getElementById(`upgrade${elementPrefix.charAt(0).toUpperCase() + elementPrefix.slice(1)}Btn`);
        if (button) {
            const canAfford = state.resources[resourceType] >= cost;
            const isMaxed = upgrade.level >= upgrade.maxLevel;
            
            button.disabled = !canAfford || isMaxed;
            button.textContent = isMaxed ? 'MAX LEVEL' : `Upgrade (Cost: ${cost} ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)})`;
        }
    }

    updateCrossUpgradeDisplay(upgradeType, resourceTypes) {
        const state = this.gameState.getState();
        if (!state || !state.upgrades) return;
        
        const upgrade = state.upgrades[upgradeType];
        
        if (!upgrade.unlocked) {
            const upgradeElement = document.getElementById(`${upgradeType}Upgrade`);
            if (upgradeElement) {
                upgradeElement.style.display = 'none';
            }
            return;
        }
        
        const upgradeElement = document.getElementById(`${upgradeType}Upgrade`);
        if (upgradeElement) {
            upgradeElement.style.display = 'block';
        }
        
        const cost = Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.level));
        
        // Add null checks for cross-resource upgrade elements
        const levelElement = document.getElementById(`${upgradeType}Level`);
        if (levelElement) {
            levelElement.textContent = upgrade.level;
        }
        
        const costElement = document.getElementById(`${upgradeType}UpgradeCost`);
        if (costElement) {
            costElement.textContent = cost;
        }
        
        const progressElement = document.getElementById(`${upgradeType}UpgradeProgress`);
        if (progressElement) {
            const progress = (upgrade.level / upgrade.maxLevel) * 100;
            progressElement.style.width = `${progress}%`;
        }
        
        const button = document.getElementById(`upgrade${upgradeType.charAt(0).toUpperCase() + upgradeType.slice(1)}Btn`);
        if (button) {
            const primaryResource = resourceTypes[0];
            const canAfford = state.resources[primaryResource] >= cost;
            const isMaxed = upgrade.level >= upgrade.maxLevel;
            
            button.disabled = !canAfford || isMaxed;
            button.textContent = isMaxed ? 'MAX LEVEL' : `Upgrade (Cost: ${cost} ${primaryResource.charAt(0).toUpperCase() + primaryResource.slice(1)})`;
        }
    }

    updateEnergyButton() {
        const state = this.gameState.getState();
        if (!state) return;
        
        const button = document.getElementById('createWorldBtn');
        if (button) {
            // Exponential cost scaling: starts at 10, doubles every 5 worlds, then gets progressively more expensive
            const baseMultiplier = Math.floor(state.worldsCreated / 5);
            const exponentialCost = Math.floor(10 * Math.pow(2, baseMultiplier) * (1 + (state.worldsCreated % 5) * 0.4));
            
            const heatCost = exponentialCost;
            const fuelCost = exponentialCost;
            const canAfford = state.resources.heat >= heatCost && state.resources.fuel >= fuelCost;
            
            button.disabled = !canAfford;
            button.textContent = canAfford ? 
                `Create World (${heatCost} Heat + ${fuelCost} Fuel)` : 
                `Need ${heatCost} Heat + ${fuelCost} Fuel`;
        }
    }

    updateActiveEventsDisplay() {
        const eventsContainer = document.getElementById('activeEventsContainer');
        if (!eventsContainer) return;
        
        const state = this.gameState.getState();
        if (!state.activeEvents || state.activeEvents.length === 0) {
            eventsContainer.innerHTML = '';
            return;
        }
        
        const eventsHTML = state.activeEvents.map(event => `
            <div class="active-event-item">
                <strong>${event.name}</strong> - ${event.duration} turns left
            </div>
        `).join('');
        
        eventsContainer.innerHTML = `
            <div class="active-events-display">
                <h4>Active Effects</h4>
                ${eventsHTML}
            </div>
        `;
    }

    showEventModal(event) {
        let modal = document.getElementById('eventModal');
        if (!modal) {
            modal = this.createEventModal();
        }
        
        // Populate modal content
        document.getElementById('eventTitle').textContent = event.name;
        document.getElementById('eventDescription').textContent = event.description;
        document.getElementById('eventEffect').textContent = event.effect;
        
        // Create choice buttons
        const choicesContainer = document.getElementById('eventChoices');
        choicesContainer.innerHTML = '';
        
        event.choices.forEach(choice => {
            const button = document.createElement('button');
            button.textContent = choice.text;
            button.className = 'event-choice-btn';
            button.onclick = () => {
                this.selectEventChoice(event, choice);
            };
            choicesContainer.appendChild(button);
        });
        
        // Show modal
        modal.style.display = 'flex';
    }

    createEventModal() {
        const modal = document.createElement('div');
        modal.id = 'eventModal';
        modal.className = 'event-modal';
        modal.innerHTML = `
            <div class="event-modal-content">
                <h2 id="eventTitle" class="event-title"></h2>
                <p id="eventDescription" class="event-description"></p>
                <p id="eventEffect" class="event-effect"></p>
                <div id="eventChoices" class="event-choices"></div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    hideEventModal() {
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    selectEventChoice(event, choice) {
        // This will be handled by passing the callback from Game.js
        if (this.eventChoiceCallback) {
            this.eventChoiceCallback(event, choice);
        }
        this.hideEventModal();
    }

    setEventChoiceCallback(callback) {
        this.eventChoiceCallback = callback;
    }

    showNotification(message) {
        // Only show achievement notifications
        if (!message.startsWith('Achievement Unlocked:')) {
            return;
        }
        
        // Announce to screen readers
        this.announceToScreenReader(message);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.textContent = message;
        
        // Style the notification (grey boxy style to match game theme)
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background-color: #2a2a2a;
            color: #e0e0e0;
            padding: 8px 12px;
            border: 1px solid #444444;
            z-index: 1000;
            font-weight: bold;
            font-size: 0.85em;
            max-width: 250px;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in from left
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    showResourceGain() {
        // Add visual feedback for resource gain
        ['heat', 'fuel', 'pressure', 'energy', 'stability'].forEach(resource => {
            const element = document.getElementById(`${resource}Amount`);
            if (element) {
                element.style.transform = 'scale(1.1)';
                element.style.color = 'var(--highlight-color)';
                
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                    element.style.color = '';
                }, 200);
            }
        });
    }

    animateResource(type) {
        const element = document.getElementById(`${type}Amount`);
        if (element) {
            element.style.transform = 'scale(1.2)';
            element.style.color = 'var(--highlight-color)';
            element.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                element.style.transform = 'scale(1)';
                element.style.color = '';
            }, 300);
        }
    }
    
    updateConversionVisuals() {
        // Update Pressure > 80 conversion to Heat
        const state = this.gameState.getState();
        const pressure = state.resources.pressure;
        const isActive = pressure > 80;
        
        // Update pressure conversion status
        const conversionItem = document.getElementById('pressureConversion');
        const statusEl = document.getElementById('pressureConversionStatus');
        const arrowEl = document.getElementById('pressureArrow');
        const pressureBarEl = document.getElementById('pressureBar');
        const pressureValueEl = document.getElementById('pressureConvValue');
        const heatGainEl = document.getElementById('pressureToHeatGain');
        
        if (conversionItem && statusEl && arrowEl && pressureBarEl && pressureValueEl && heatGainEl) {
            // Update status
            statusEl.textContent = isActive ? 'Active' : 'Inactive';
            statusEl.className = `conversion-status ${isActive ? 'active' : 'inactive'}`;
            
            // Update visual state
            if (isActive) {
                conversionItem.classList.add('active');
                arrowEl.classList.add('active');
            } else {
                conversionItem.classList.remove('active');
                arrowEl.classList.remove('active');
            }
            
            // Update pressure bar
            const pressurePercent = Math.min(100, (pressure / 100) * 100);
            pressureBarEl.style.width = pressurePercent + '%';
            pressureValueEl.textContent = Math.floor(pressure);
            
            // Calculate heat gain (based on pressure valve upgrade)
            let heatGain = 0;
            if (isActive && state.upgrades && state.upgrades.pressureValve && state.upgrades.pressureValve.level > 0) {
                heatGain = state.upgrades.pressureValve.level * 3;
            }
            heatGainEl.textContent = heatGain;
        }
    }
    
    updateSynergyVisuals() {
        // Update Surface Heat + Pressure synergy visualization
        const state = this.gameState.getState();
        const pressure = state.resources.pressure;
        const isActive = pressure > 40;
        
        // Update heat+pressure synergy
        const synergyItem = document.getElementById('heatPressureSynergy');
        const statusEl = document.getElementById('heatPressureStatus');
        const checkEl = document.getElementById('pressureThresholdCheck');
        const bonusEl = document.getElementById('heatBonus');
        const progressEl = document.getElementById('heatPressureProgress');
        const progressTextEl = document.getElementById('currentPressureForSynergy');
        
        if (synergyItem && statusEl && checkEl && bonusEl && progressEl && progressTextEl) {
            // Update status
            statusEl.textContent = isActive ? 'Active' : 'Inactive';
            statusEl.className = `synergy-status ${isActive ? 'active' : 'inactive'}`;
            
            // Update visual state
            if (isActive) {
                synergyItem.classList.add('active');
                checkEl.textContent = '✓';
                checkEl.classList.add('passed');
                bonusEl.textContent = '+30% Heat Bonus';
            } else {
                synergyItem.classList.remove('active');
                checkEl.textContent = '✗';
                checkEl.classList.remove('passed');
                bonusEl.textContent = 'No Bonus';
            }
            
            // Update progress bar (show progress toward 40 threshold)
            const progressPercent = Math.min(100, (pressure / 40) * 100);
            progressEl.style.width = progressPercent + '%';
            progressTextEl.textContent = Math.floor(pressure);
        }
    }

    bindEventListeners(callbacks) {
        
        // Create World button
        const createWorldBtn = document.getElementById('createWorldBtn');
        if (createWorldBtn) {
            createWorldBtn.addEventListener('click', callbacks.createWorld);
        }
        
        // Generate actions
        const generateHeatBtn = document.getElementById('generateHeatBtn');
        const generateFuelBtn = document.getElementById('generateFuelBtn');
        const generateEnergyBtn = document.getElementById('generateEnergyBtn');
        
        if (generateHeatBtn) generateHeatBtn.addEventListener('click', () => callbacks.generateResource('heat'));
        if (generateFuelBtn) generateFuelBtn.addEventListener('click', () => callbacks.generateResource('fuel'));
        if (generateEnergyBtn) generateEnergyBtn.addEventListener('click', callbacks.generateEnergy);
        
        // Upgrade buttons
        const upgradeHeatBtn = document.getElementById('upgradeHeatBtn');
        const upgradeFuelBtn = document.getElementById('upgradeFuelBtn');
        
        if (upgradeHeatBtn) upgradeHeatBtn.addEventListener('click', 
            () => callbacks.upgradeResource('heatGenerator', 'heat'));
        if (upgradeFuelBtn) upgradeFuelBtn.addEventListener('click', 
            () => callbacks.upgradeResource('fuelEfficiency', 'fuel'));
        
        // Cross-resource upgrade buttons
        const upgradeThermalBtn = document.getElementById('upgradeThermalAcceleratorBtn');
        const upgradeFuelSyncBtn = document.getElementById('upgradeFuelSynchronizerBtn');
        const upgradePressureBtn = document.getElementById('upgradePressureValveBtn');
        const upgradeEnergyBtn = document.getElementById('upgradeEnergyMatrixBtn');
        
        if (upgradeThermalBtn) upgradeThermalBtn.addEventListener('click', 
            () => callbacks.upgradeCrossResource('thermalAccelerator', 'heat'));
        if (upgradeFuelSyncBtn) upgradeFuelSyncBtn.addEventListener('click', 
            () => callbacks.upgradeCrossResource('fuelSynchronizer', 'fuel'));
        if (upgradePressureBtn) upgradePressureBtn.addEventListener('click', 
            () => callbacks.upgradeCrossResource('pressureValve', 'stability'));
        if (upgradeEnergyBtn) upgradeEnergyBtn.addEventListener('click', 
            () => callbacks.upgradeCrossResource('energyMatrix', 'heat'));
        
        // Save/Load/Reset buttons
        const saveBtn = document.getElementById('saveBtn') || document.getElementById('saveGameBtn');
        const loadBtn = document.getElementById('loadBtn') || document.getElementById('loadGameBtn');
        const resetBtn = document.getElementById('resetBtn') || document.getElementById('resetGameBtn');
        
        if (saveBtn) saveBtn.addEventListener('click', callbacks.saveGame);
        if (loadBtn) loadBtn.addEventListener('click', callbacks.loadGame);
        if (resetBtn) resetBtn.addEventListener('click', callbacks.resetGame);
        
        // Unlock button
        const unlockWorldsBtn = document.getElementById('unlockWorldsBtn');
        if (unlockWorldsBtn) {
            unlockWorldsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                callbacks.unlockWorldGenerator();
            });
        }
        
        // Options page event listeners
        this.bindOptionsEventListeners(callbacks);
        
        // Export/Import save buttons
        const exportSaveBtn = document.getElementById('exportSaveBtn');
        const importSaveBtn = document.getElementById('importSaveBtn');
        const importSaveFile = document.getElementById('importSaveFile');
        
        if (exportSaveBtn) exportSaveBtn.addEventListener('click', callbacks.exportSave);
        if (importSaveBtn) importSaveBtn.addEventListener('click', () => importSaveFile.click());
        if (importSaveFile) importSaveFile.addEventListener('change', () => callbacks.importSave(importSaveFile));
    }

    bindOptionsEventListeners(callbacks) {
        // Theme select
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                callbacks.updateSetting('theme', e.target.value);
            });
        }
        
        // Checkboxes
        const checkboxSettings = [
            'showResourceDescriptions', 'animateProgressBars', 'showDetailedTooltips',
            'showEfficiencyNumbers', 'confirmDangerousActions', 'showTutorialMessages',
            'soundEffects', 'backgroundMusic'
        ];
        
        checkboxSettings.forEach(setting => {
            const element = document.getElementById(setting);
            if (element) {
                element.addEventListener('change', (e) => {
                    callbacks.updateSetting(setting, e.target.checked);
                });
            }
        });
        
        // Select options
        const autoSaveInterval = document.getElementById('autoSaveInterval');
        if (autoSaveInterval) {
            autoSaveInterval.addEventListener('change', (e) => {
                callbacks.updateSetting('autoSaveInterval', parseInt(e.target.value));
            });
        }
        
        // Volume slider
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                callbacks.updateSetting('volume', parseInt(e.target.value));
            });
        }
        
        // Reset settings button
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                if (confirm('Reset all settings to default? This cannot be undone.')) {
                    const defaultSettings = {
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
                    };
                    
                    Object.keys(defaultSettings).forEach(setting => {
                        callbacks.updateSetting(setting, defaultSettings[setting]);
                    });
                    
                    // Update the UI
                    this.updateOptionsUI();
                }
            });
        }
    }

    updatePassiveIncomeDisplay() {
        const state = this.gameState.getState();
        if (!state) return;
        
        const passiveDisplay = document.getElementById('passiveIncomeDisplay');
        const worldsOwnedCount = document.getElementById('worldsOwnedCount');
        const passiveHeatRate = document.getElementById('passiveHeatRate');
        const passiveFuelRate = document.getElementById('passiveFuelRate');
        
        if (state.worldsCreated > 0) {
            // Show passive income display
            if (passiveDisplay) passiveDisplay.style.display = 'block';
            
            // Calculate passive rates
            const baseIncome = 0.5;
            const worldBonus = Math.sqrt(state.worldsCreated) * baseIncome;
            
            let heatMultiplier = 1;
            let fuelMultiplier = 1;
            
            if (state.upgrades && state.upgrades.heatGenerator) {
                heatMultiplier += state.upgrades.heatGenerator.level * 0.1;
            }
            if (state.upgrades && state.upgrades.fuelEfficiency) {
                fuelMultiplier += state.upgrades.fuelEfficiency.level * 0.1;
            }
            
            const heatRate = worldBonus * heatMultiplier;
            const fuelRate = worldBonus * fuelMultiplier;
            
            // Update display
            if (worldsOwnedCount) worldsOwnedCount.textContent = state.worldsCreated;
            if (passiveHeatRate) passiveHeatRate.textContent = heatRate.toFixed(1);
            if (passiveFuelRate) passiveFuelRate.textContent = fuelRate.toFixed(1);
        } else {
            // Hide passive income display
            if (passiveDisplay) passiveDisplay.style.display = 'none';
        }
    }
}
