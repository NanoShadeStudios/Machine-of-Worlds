// Game.js - Main game class that coordinates all systems

import { GameState } from './GameState.js';
import { WorldSystem } from './WorldSystem.js';
import { ResourceSystem } from './ResourceSystem.js';
import { EventSystem } from './EventSystem.js';
import { UpgradeSystem } from './UpgradeSystem.js';
import { MachineSystem } from './MachineSystem.js';
import { UISystem } from './UISystem.js';
import { AchievementSystem } from './AchievementSystem.js';

class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingText = document.getElementById('loadingText');
        this.loadingBarFill = document.getElementById('loadingBarFill');
        this.loadingPercentage = document.getElementById('loadingPercentage');
        this.loadingDetails = document.getElementById('loadingDetails');
        this.currentProgress = 0;
        this.isVisible = true;
    }

    updateProgress(progress, message, details = '') {
        this.currentProgress = Math.min(100, Math.max(0, progress));
        
        if (this.loadingText) {
            this.loadingText.textContent = message;
        }
        
        if (this.loadingBarFill) {
            this.loadingBarFill.style.width = `${this.currentProgress}%`;
        }
        
        if (this.loadingPercentage) {
            this.loadingPercentage.textContent = `${Math.round(this.currentProgress)}%`;
        }
        
        if (this.loadingDetails && details) {
            this.loadingDetails.textContent = details;
        }
    }

    async hide() {
        if (!this.isVisible) return;
        
        this.updateProgress(100, 'Game ready!', 'Welcome to The Machine of Worlds');
        
        // Show the game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('loaded');
        }
        
        // Wait a moment to show completion
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
            this.isVisible = false;
            
            // Remove from DOM after transition
            setTimeout(() => {
                if (this.loadingScreen && this.loadingScreen.parentNode) {
                    this.loadingScreen.parentNode.removeChild(this.loadingScreen);
                }
            }, 500);
        }
    }

    show() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('hidden');
            this.isVisible = true;
        }
    }
}

export class Game {
    constructor() {
        // Initialize loading manager first
        this.loadingManager = new LoadingManager();
        this.loadingManager.updateProgress(10, 'Initializing game systems...', 'Setting up core components');
        
        // Initialize systems
        this.gameState = new GameState();
        this.loadingManager.updateProgress(20, 'Loading game state...', 'Preparing world data');
        
        this.worldSystem = new WorldSystem(this.gameState);
        this.loadingManager.updateProgress(30, 'Initializing world system...', 'Creating dimensional framework');
        
        this.achievementSystem = new AchievementSystem(this.gameState);
        this.loadingManager.updateProgress(40, 'Setting up achievements...', 'Preparing progress tracking');
        
        this.resourceSystem = new ResourceSystem(this.gameState, this.achievementSystem);
        this.loadingManager.updateProgress(50, 'Loading resource system...', 'Configuring generation mechanics');
        
        this.eventSystem = new EventSystem(this.gameState);
        this.loadingManager.updateProgress(60, 'Preparing events...', 'Loading world interactions');
        
        this.upgradeSystem = new UpgradeSystem(this.gameState);
        this.loadingManager.updateProgress(70, 'Initializing upgrades...', 'Preparing enhancement systems');
        
        this.uiSystem = new UISystem(this.gameState);
        this.loadingManager.updateProgress(80, 'Setting up interface...', 'Preparing user experience');
        
        // Initialize canvas and machine system
        this.canvas = null;
        this.ctx = null;
        this.machineSystem = null;
        
        // Start async initialization
        this.initAsync();
    }

    async initAsync() {
        try {
            this.loadingManager.updateProgress(85, 'Preparing visuals...', 'Setting up machine canvas');
            
            // Small delay to ensure DOM is ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.setupCanvas();
            this.machineSystem = new MachineSystem(this.gameState, this.canvas, this.ctx);
            
            this.loadingManager.updateProgress(90, 'Loading saved data...', 'Restoring your progress');
            this.loadGame(); // Try to load saved game first
            
            // Initialize starting world if no current world is set
            this.initializeStartingWorld();
            
            // Initialize auto-save after loading game settings
            const state = this.gameState.getState();
            const autoSaveInterval = state.settings.autoSaveInterval || 30;
            this.setupAutoSave(autoSaveInterval);
            
            // Initialize achievement tracking
            this.achievementSystem.initializeAchievementTracking(this.gameState.getState());
            
            this.loadingManager.updateProgress(95, 'Finalizing setup...', 'Connecting game systems');
            
            this.bindEvents();
            
            // Setup UI with loading feedback
            this.loadingManager.updateProgress(98, 'Preparing interface...', 'Final touches');
            
            await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for smooth UX
            
            this.uiSystem.setupResourceDescriptions();
            this.uiSystem.setupPageNavigation();
            this.uiSystem.setEventChoiceCallback((event, choice) => this.selectEventChoice(event, choice));
            this.uiSystem.setMainPageReturnCallback(() => {
                this.updateUI();
                this.renderMachine();
            });
            this.uiSystem.setUnlockWorldsCallback(() => this.unlockWorldGenerator());
            this.updateUI();
            this.renderMachine();
            
            // Hide loading screen
            await this.loadingManager.hide();
            
            // Setup regular updates for playtime and achievements
            setInterval(() => {
                this.achievementSystem.updatePlaytime();
                this.checkAndNotifyAchievements();
                
                // Update UI (no more passive income generation)
                this.updateUI();
            }, 1000); // Check every second for playtime and achievements only
            
        } catch (error) {
            console.error('Error during game initialization:', error);
            this.loadingManager.updateProgress(100, 'Error occurred', 'Attempting to continue...');
            
            // Try to continue anyway after a brief delay
            setTimeout(async () => {
                await this.loadingManager.hide();
                // Minimal fallback initialization
                this.updateUI();
                this.renderMachine();
            }, 1000);
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('machineCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            
            // Set canvas size
            this.canvas.width = 600;
            this.canvas.height = 400;
        }
    }

    bindEvents() {
        const callbacks = {
            createWorld: () => this.createWorld(),
            generateResource: (type) => this.generateResource(type),
            upgradeResource: (upgradeType, resourceType) => this.upgradeResource(upgradeType, resourceType),
            upgradeCrossResource: (upgradeType, resourceType) => this.upgradeCrossResource(upgradeType, resourceType),
            generateEnergy: () => this.generateEnergy(),
            saveGame: () => this.saveGame(),
            loadGame: () => this.loadGame(),
            resetGame: () => this.resetGame(),
            unlockWorldGenerator: () => this.unlockWorldGenerator(),
            updateSetting: (setting, value) => this.updateSetting(setting, value),
            exportSave: () => this.exportSave(),
            importSave: (fileInput) => this.importSave(fileInput)
        };
        
        this.uiSystem.bindEventListeners(callbacks);
    }

    createWorld() {
        const state = this.gameState.getState();
        
        // Get the next world that can be unlocked
        const nextWorld = this.worldSystem.getNextUnlockableWorld();
        
        if (!nextWorld) {
            this.uiSystem.showNotification('All worlds have been unlocked!');
            return;
        }
        
        if (!nextWorld.canUnlock) {
            // Show what resources are needed
            const requirements = [];
            for (const [resource, amount] of Object.entries(nextWorld.requirements)) {
                const current = state.resources[resource] || 0;
                if (current < amount) {
                    requirements.push(`${resource}: ${current}/${amount}`);
                }
            }
            this.uiSystem.showNotification(`Cannot unlock ${nextWorld.world.name}. Need: ${requirements.join(', ')}`);
            return;
        }
        
        console.log('[Game] Unlocking world:', nextWorld.world.name);
        
        // Unlock and select the world
        const success = this.worldSystem.selectWorld(nextWorld.world.id);
        if (!success) {
            this.uiSystem.showNotification('Failed to unlock world!');
            return;
        }
        
        // Add world to history
        if (!state.worldHistory) {
            state.worldHistory = [];
        }
        state.worldHistory.push({
            ...nextWorld.world,
            createdAt: Date.now(),
            unlockedAt: state.worldsCreated
        });
        
        // Generate resources from the world
        const resourceGains = this.resourceSystem.generateResources(state.currentWorld);
        
        // Check for new world unlocks
        const worldUnlock = this.worldSystem.checkWorldUnlocks();
        if (worldUnlock) {
            this.uiSystem.showNotification(worldUnlock.message);
        }
        
        // Add machine part (only when unlocking worlds)
        this.machineSystem.addMachinePart('world');
        
        // Update machine complexity
        this.machineSystem.updateMachineComplexity();
        
        // Check for random events
        const randomEvent = this.eventSystem.checkForRandomEvent();
        if (randomEvent) {
            this.uiSystem.showEventModal(randomEvent);
        }
        
        // Update active events (reduce duration)
        this.eventSystem.updateActiveEvents();
        
        // Check achievements after world creation
        this.checkAndNotifyAchievements();
        
        this.updateUI();
        this.renderMachine();
        
        // Auto-save after world creation
        this.saveGame();
        
        // Visual feedback
        this.uiSystem.showResourceGain();
        this.machineSystem.animateResource('world');
        
        // Show the newly unlocked world
        this.uiSystem.showNotification(`🌍 ${nextWorld.world.name} unlocked and selected!`);
    }

    generateResource(type) {
        console.log(`[Game] generateResource called for type: ${type}`);
        const resourceGain = this.resourceSystem.generateResource(type);
        console.log(`[Game] Resource gain: ${resourceGain}`);
        
        // Update active events (reduce duration)
        this.eventSystem.updateActiveEvents();
        
        // Track click and check achievements
        this.achievementSystem.incrementClick();
        this.checkAndNotifyAchievements();
        
        console.log(`[Game] About to call updateUI`);
        this.updateUI();
        console.log(`[Game] updateUI completed`);
        
        // Visual feedback
        this.uiSystem.animateResource(type);
        this.machineSystem.animateResource(type);
    }

    // Shared per-action housekeeping (could be called after any resource action in future phase work)
    postActionUpdate() {
        const state = this.gameState.getState();
        const world = state.currentWorld;
        if (world && typeof world.weatherDuration === 'number') {
            world.weatherDuration -= 1;
            if (world.weatherDuration <= 0) {
                this.worldSystem.rollNewWeather(world);
                this.uiSystem.showNotification(`Weather changed to ${world.weather}`);
            }
        }
        this.eventSystem.updateActiveEvents();
        this.updateUI();
    }

    checkAndNotifyAchievements() {
        const newAchievements = this.achievementSystem.checkAchievements();
        
        console.log(`Checked achievements, found ${newAchievements.length} new achievements`);
        
        // Notify about new achievements
        newAchievements.forEach(achievement => {
            this.uiSystem.showNotification(`Achievement Unlocked: ${achievement.name}`);
            console.log(`Achievement unlocked: ${achievement.name} - ${achievement.description}`);
        });

        if (newAchievements.length > 0) {
            // Update UI to show new achievements
            this.uiSystem.updateAchievementsUI();
            
            // Apply achievement bonuses
            this.achievementSystem.applyAchievementBonuses(this.gameState.getState());
            
            // Save game to persist achievement progress
            this.gameState.saveGame();
        }
    }

    generateEnergy() {
        const state = this.gameState.getState();
        const heatCost = 10;
        const fuelCost = 15;
        
        if (state.resources.heat >= heatCost && state.resources.fuel >= fuelCost) {
            state.resources.heat -= heatCost;
            state.resources.fuel -= fuelCost;
            
            const energyGained = 40;
            state.resources.energy += energyGained;
            state.resources.energy = Math.min(200, state.resources.energy);
            
            // Track click and check achievements
            this.achievementSystem.incrementClick();
            this.checkAndNotifyAchievements();
            
            this.uiSystem.animateResource('energy');
            this.machineSystem.animateResource('energy');
            
            this.updateUI();
            // this.uiSystem.updateWeatherWidget(); // temporarily disabled
        }
    }

    upgradeResource(upgradeType, resourceType) {
        const success = this.upgradeSystem.upgradeResource(upgradeType, resourceType);
        if (success) {
            this.uiSystem.showNotification(`${upgradeType} upgraded!`);
            this.checkAndNotifyAchievements();
            this.updateUI();
        }
    }

    upgradeCrossResource(upgradeType, resourceType) {
        const success = this.upgradeSystem.upgradeCrossResource(upgradeType, resourceType);
        if (success) {
            this.uiSystem.showNotification(`${upgradeType} upgraded!`);
            
            // Check if this unlocks any new upgrades
            this.upgradeSystem.checkUpgradeUnlocks();
            
            this.checkAndNotifyAchievements();
            this.updateUI();
        }
    }

    updateUI() {
        // Check for upgrade unlocks before updating UI
        this.upgradeSystem.checkUpgradeUnlocks();
        this.uiSystem.updateUI();
    }

    renderMachine() {
        if (this.machineSystem) {
            this.machineSystem.renderMachine();
        }
    }

    saveGame() {
        this.gameState.saveGame();
        this.uiSystem.showNotification('Game saved!');
    }

    loadGame() {
        const loaded = this.gameState.loadGame();
        if (loaded) {
            // Systems already have correct GameState instance references from constructor
            // Don't overwrite gameState properties as systems need the GameState instance to call getState()
            console.log('[Game] Game loaded successfully, systems already have correct GameState references');
            
            this.updateUI();
            this.renderMachine();
            this.uiSystem.showNotification('Game loaded!');
        }
    }

    resetGame() {
        const reset = this.gameState.resetGame();
        if (reset) {
            // Update all systems with reset state
            const state = this.gameState.getState();
            this.worldSystem.gameState = this.gameState;
            this.resourceSystem.gameState = this.gameState;
            this.eventSystem.gameState = this.gameState;
            this.upgradeSystem.gameState = this.gameState;
            this.uiSystem.gameState = this.gameState; // Pass the gameState object, not the state
            
            if (this.machineSystem) {
                this.machineSystem.gameState = this.gameState;
                this.machineSystem.clearMachine();
            }
            
            this.updateUI();
            this.renderMachine();
            this.uiSystem.showNotification('Game reset!');
        }
    }

    // Event system integration
    selectEventChoice(event, choice) {
        this.eventSystem.selectEventChoice(event, choice);
        this.updateUI();
    }

    // New unlock system
    unlockWorldGenerator() {
        console.log('[Game] unlockWorldGenerator called');
        const state = this.gameState.getState();
        const heatRequired = 100;
        const fuelRequired = 50;
        
        console.log('[Game] Current resources:', {
            heat: state.resources.heat,
            fuel: state.resources.fuel,
            heatRequired,
            fuelRequired,
            hasEnoughHeat: state.resources.heat >= heatRequired,
            hasEnoughFuel: state.resources.fuel >= fuelRequired
        });
        
        if (state.resources.heat >= heatRequired && state.resources.fuel >= fuelRequired) {
            console.log('[Game] Unlocking world generator...');
            state.resources.heat -= heatRequired;
            state.resources.fuel -= fuelRequired;
            state.unlocks.worldGenerator = true;
            this.uiSystem.switchToPage('worlds');
            this.uiSystem.showNotification('World Generator Unlocked!', 'You now have access to the dedicated worlds page!');
            this.updateUI();
            this.checkAndNotifyAchievements();
            console.log('[Game] World generator unlocked successfully');
        } else {
            console.log('[Game] Not enough resources to unlock world generator');
        }
    }

    // Settings system
    updateSetting(setting, value) {
        const state = this.gameState.getState();
        if (!state || !state.settings) return; // Guard against undefined state
        
        if (state.settings.hasOwnProperty(setting)) {
            state.settings[setting] = value;
            this.applySetting(setting, value);
            this.saveGame(); // Auto-save settings
        }
    }

    applySetting(setting, value) {
        switch(setting) {
            case 'theme':
                this.applyTheme(value);
                break;
            case 'autoSaveInterval':
                this.setupAutoSave(value);
                break;
            case 'volume':
                // Update volume display
                const volumeValue = document.getElementById('volumeValue');
                if (volumeValue) volumeValue.textContent = value + '%';
                break;
            // Add more setting applications as needed
        }
    }

    applyTheme(theme) {
        // Theme switching logic would go here
        // For now, we'll just log it
        console.log('Theme changed to:', theme);
    }

    setupAutoSave(interval) {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        if (interval > 0) {
            this.autoSaveTimer = setInterval(() => {
                this.saveGame();
                console.log('Auto-saved game');
            }, interval * 1000);
        }
    }

    // Data management
    exportSave() {
        const state = this.gameState.getState();
        const saveData = JSON.stringify(state, null, 2);
        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `machine-of-worlds-save-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.uiSystem.showNotification('Save data exported!');
    }

    importSave(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Use the comprehensive validation from GameState
                if (!this.gameState.validateSaveData(importedData)) {
                    throw new Error('Save file validation failed');
                }
                
                // Store current state as backup in case import fails
                const backupState = JSON.parse(JSON.stringify(this.gameState.state));
                
                try {
                    // Apply imported data using the same logic as loadGame
                    this.gameState.state = {
                        ...this.gameState.state,
                        ...importedData,
                        // Ensure upgrades structure is properly merged
                        upgrades: {
                            ...this.gameState.state.upgrades,
                            ...importedData.upgrades
                        },
                        // Ensure resources structure is properly merged
                        resources: {
                            ...this.gameState.state.resources,
                            ...importedData.resources
                        },
                        // Ensure currentWorld is preserved
                        currentWorld: importedData.currentWorld || this.gameState.state.currentWorld,
                        // Ensure new properties exist even in old saves
                        permanentBonuses: {
                            ...this.gameState.state.permanentBonuses,
                            ...importedData.permanentBonuses
                        },
                        worldTiers: {
                            ...this.gameState.state.worldTiers,
                            ...importedData.worldTiers
                        },
                        unlocks: {
                            ...this.gameState.state.unlocks,
                            ...importedData.unlocks
                        },
                        achievements: {
                            ...this.gameState.state.achievements,
                            ...importedData.achievements
                        },
                        settings: {
                            ...this.gameState.state.settings,
                            ...importedData.settings
                        },
                        // Ensure worldHistory exists (for compatibility with old saves)
                        worldHistory: importedData.worldHistory || []
                    };
                    
                    // Validate and fix the imported state
                    this.gameState.validateAndFixState();
                    
                    // Update all systems and UI
                    this.updateAllSystems();
                    this.updateUI();
                    this.renderMachine();
                    
                    // Save the imported data to localStorage
                    this.gameState.saveGame();
                    
                    this.uiSystem.showNotification('Save data imported successfully!');
                    
                    // Clear the file input for future imports
                    fileInput.value = '';
                    
                } catch (applyError) {
                    // Restore backup state if import application fails
                    this.gameState.state = backupState;
                    throw applyError;
                }
                
            } catch (error) {
                console.error('Import error:', error);
                this.uiSystem.showNotification('Error importing save data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    updateAllSystems() {
        // All systems expect the GameState object (with getState() method)
        this.worldSystem.gameState = this.gameState;
        this.resourceSystem.gameState = this.gameState;
        this.eventSystem.gameState = this.gameState;
        this.upgradeSystem.gameState = this.gameState;
        this.uiSystem.gameState = this.gameState;
        
        if (this.machineSystem) {
            this.machineSystem.gameState = this.gameState;
        }
    }

    // Getter methods for accessing systems externally if needed
    getGameState() {
        return this.gameState.getState();
    }

    getWorldSystem() {
        return this.worldSystem;
    }

    getResourceSystem() {
        return this.resourceSystem;
    }

    getEventSystem() {
        return this.eventSystem;
    }

    getUpgradeSystem() {
        return this.upgradeSystem;
    }

    getMachineSystem() {
        return this.machineSystem;
    }

    getUISystem() {
        return this.uiSystem;
    }

    initializeStartingWorld() {
        const state = this.gameState.getState();
        
        // If no current world is set, initialize with Desert Planet
        if (!state.currentWorld) {
            const desertPlanet = this.worldSystem.getWorldById(0);
            if (desertPlanet) {
                state.currentWorld = {
                    ...desertPlanet,
                    id: 0,
                    type: desertPlanet.type,
                    name: desertPlanet.name,
                    description: desertPlanet.description,
                    // Flatten properties to top level for ResourceSystem compatibility
                    gravity: desertPlanet.properties.gravity,
                    timeSpeed: desertPlanet.properties.timeSpeed,
                    temperature: desertPlanet.properties.temperature,
                    atmosphere: desertPlanet.properties.atmosphere,
                    // Keep properties object for future use
                    properties: desertPlanet.properties,
                    // Add weather system for compatibility
                    weather: 'Calm',
                    weatherDuration: 10
                };
            }
        }
        
        // Ensure unlockedWorlds array exists and includes Desert Planet
        if (!state.unlockedWorlds) {
            state.unlockedWorlds = [0];
        } else if (!state.unlockedWorlds.includes(0)) {
            state.unlockedWorlds.push(0);
        }
        
        // Ensure worldProgress exists
        if (typeof state.worldProgress === 'undefined') {
            state.worldProgress = 0;
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Set dark mode as default
    document.documentElement.setAttribute('data-theme', 'dark');
    window.game = new Game();
    
    // Make selectEventChoice available globally for event modal buttons
    window.selectEventChoice = (event, choice) => {
        window.game.selectEventChoice(event, choice);
    };
    
    // Debug functions for troubleshooting
    window.debugGame = {
        clearSave: () => {
            console.log('Clearing save data...');
            window.game.gameState.forceClearAndReset();
            location.reload();
        },
        showState: () => {
            console.log('Current game state:', window.game.gameState.getState());
        },
        showUpgrades: () => {
            const state = window.game.gameState.getState();
            console.log('Upgrades:', state ? state.upgrades : 'State is null');
        }
    };
});
