// Game.js - Main game class that coordinates all systems

import { GameState } from './GameState.js';
import { WorldSystem } from './WorldSystem.js';
import { ResourceSystem } from './ResourceSystem.js';
import { EventSystem } from './EventSystem.js';
import { UpgradeSystem } from './UpgradeSystem.js';
import { MachineSystem } from './MachineSystem.js';
import { UISystem } from './UISystem.js';
import { AchievementSystem } from './AchievementSystem.js';

export class Game {
    constructor() {
        // Initialize systems
        this.gameState = new GameState();
        this.worldSystem = new WorldSystem(this.gameState);
        this.resourceSystem = new ResourceSystem(this.gameState);
        this.eventSystem = new EventSystem(this.gameState);
        this.upgradeSystem = new UpgradeSystem(this.gameState);
        this.achievementSystem = new AchievementSystem(this.gameState);
        this.uiSystem = new UISystem(this.gameState);
        
        // Initialize canvas and machine system
        this.canvas = null;
        this.ctx = null;
        this.machineSystem = null;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.machineSystem = new MachineSystem(this.gameState, this.canvas, this.ctx);
        this.loadGame(); // Try to load saved game first
        
        // Initialize achievement tracking
        this.achievementSystem.initializeAchievementTracking(this.gameState.getState());
        
        console.log('[Game] About to call bindEvents');
        this.bindEvents();
        console.log('[Game] bindEvents completed');
        
        // Setup UI with a small delay to ensure DOM is ready
        setTimeout(() => {
            this.uiSystem.setupResourceDescriptions();
            this.uiSystem.setupTabInterface();
            this.uiSystem.setupPageNavigation();
            this.uiSystem.setEventChoiceCallback((event, choice) => this.selectEventChoice(event, choice));
            this.updateUI();
            this.renderMachine();
        }, 100);
        
        // Setup regular updates for playtime, achievements, and passive income
        setInterval(() => {
            this.achievementSystem.updatePlaytime();
            this.checkAndNotifyAchievements();
            
            // Generate passive income from worlds
            this.resourceSystem.generatePassiveIncome();
            this.updateUI();
        }, 1000); // Check every second for passive income
        
        console.log('The Machine of Worlds initialized successfully!');
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
        console.log('[Game] createWorld called');
        const state = this.gameState.getState();
        
        // Calculate exponential world cost
        const baseMultiplier = Math.floor(state.worldsCreated / 5);
        const exponentialCost = Math.floor(10 * Math.pow(2, baseMultiplier) * (1 + (state.worldsCreated % 5) * 0.4));
        
        console.log('[Game] World creation cost:', {
            worldsCreated: state.worldsCreated,
            baseMultiplier,
            exponentialCost,
            playerHeat: state.resources.heat,
            playerFuel: state.resources.fuel
        });
        
        // Check if player can afford the world
        if (state.resources.heat < exponentialCost || state.resources.fuel < exponentialCost) {
            console.log('[Game] Not enough resources for world creation');
            this.uiSystem.showNotification('Not enough resources to create a world!');
            return;
        }
        
        console.log('[Game] Creating world...');
        
        // Deduct the cost
        state.resources.heat -= exponentialCost;
        state.resources.fuel -= exponentialCost;
        
        const world = this.worldSystem.generateRandomWorld();
        state.currentWorld = world;
        state.worldsCreated++;
        
        // Add world to history
        if (!state.worldHistory) {
            state.worldHistory = [];
        }
        state.worldHistory.push({
            ...world,
            createdAt: Date.now(),
            id: state.worldsCreated
        });
        
        // Generate resources from the world
        const resourceGains = this.resourceSystem.generateResources(world);
        
        // Check for tier unlocks
        const tierUnlock = this.worldSystem.checkWorldTierUnlocks();
        if (tierUnlock) {
            this.uiSystem.showNotification(tierUnlock.message);
        }
        
        // Add machine part (only when creating worlds)
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

        // Weather duration decrement (handled per world creation action)
        if (state.currentWorld && typeof state.currentWorld.weatherDuration === 'number') {
            // On creation we've just set a fresh world; nothing to decrement here.
            // Future per-action systems (e.g. generate heat/fuel) could call a shared method.
        }
        
        // Check achievements after world creation
        this.checkAndNotifyAchievements();
        
        this.updateUI();
        this.renderMachine();
        
        // Visual feedback
        this.uiSystem.showResourceGain();
        this.machineSystem.animateResource('world');
    // Weather UI refresh - temporarily disabled
    // this.uiSystem.updateWeatherWidget();
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
            this.worldSystem.gameState = state;
            this.resourceSystem.gameState = state;
            this.eventSystem.gameState = state;
            this.upgradeSystem.gameState = state;
            this.uiSystem.gameState = this.gameState; // Pass the gameState object, not the state
            
            if (this.machineSystem) {
                this.machineSystem.gameState = state;
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
                
                // Basic validation
                if (importedData && importedData.resources && importedData.worldsCreated !== undefined) {
                    this.gameState.state = {
                        ...this.gameState.state,
                        ...importedData,
                        // Ensure new properties exist
                        unlocks: { ...this.gameState.state.unlocks, ...importedData.unlocks },
                        achievements: { ...this.gameState.state.achievements, ...importedData.achievements },
                        settings: { ...this.gameState.state.settings, ...importedData.settings }
                    };
                    
                    this.updateAllSystems();
                    this.updateUI();
                    this.renderMachine();
                    this.uiSystem.showNotification('Save data imported successfully!');
                } else {
                    throw new Error('Invalid save file format');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.uiSystem.showNotification('Error importing save data: Invalid file format');
            }
        };
        reader.readAsText(file);
    }

    updateAllSystems() {
        const state = this.gameState.getState();
        this.worldSystem.gameState = state;
        this.resourceSystem.gameState = state;
        this.eventSystem.gameState = state;
        this.upgradeSystem.gameState = state;
        this.uiSystem.gameState = this.gameState; // Pass the gameState object, not the state
        
        if (this.machineSystem) {
            this.machineSystem.gameState = state;
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
