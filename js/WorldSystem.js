// WorldSystem.js - Handles structured world progression with specific worlds and resources

export class WorldSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.worldDefinitions = this.initializeWorldDefinitions();
    }

    initializeWorldDefinitions() {
        return [
            {
                id: 0,
                name: "Desert Planet",
                type: "Desert",
                description: "A harsh, arid world with extreme heat. The starting point of your journey.",
                unlockRequirements: {}, // Always unlocked (starting world)
                introducesResources: ['heat', 'fuel'],
                resourceGeneration: {
                    heat: { base: 12, multiplier: 1.5 },
                    fuel: { base: 8, multiplier: 1.0 }
                },
                properties: {
                    temperature: 45,
                    atmosphere: 20,
                    gravity: 1.0,
                    timeSpeed: 1.0
                },
                unlocked: true
            },
            {
                id: 1,
                name: "Ocean Planet",
                type: "Ocean",
                description: "A water world with vast seas and humidity. Introduces water extraction.",
                unlockRequirements: {
                    heat: 50,
                    fuel: 25
                },
                introducesResources: ['water'],
                resourceGeneration: {
                    water: { base: 10, multiplier: 1.8 },
                    fuel: { base: 12, multiplier: 1.2 },
                    heat: { base: 6, multiplier: 0.8 }
                },
                properties: {
                    temperature: 15,
                    atmosphere: 80,
                    gravity: 0.9,
                    timeSpeed: 1.1
                },
                unlocked: false
            },
            {
                id: 2,
                name: "Forest Planet",
                type: "Forest",
                description: "A lush world covered in vegetation. Rich in oxygen and life energy.",
                unlockRequirements: {
                    heat: 25,
                    fuel: 25,
                    water: 30
                },
                introducesResources: ['oxygen'],
                resourceGeneration: {
                    oxygen: { base: 8, multiplier: 2.0 },
                    heat: { base: 10, multiplier: 1.3 },
                    water: { base: 8, multiplier: 1.4 },
                    fuel: { base: 6, multiplier: 0.9 }
                },
                properties: {
                    temperature: 22,
                    atmosphere: 95,
                    gravity: 1.1,
                    timeSpeed: 0.9
                },
                unlocked: false
            },
            {
                id: 3,
                name: "Mountain Planet",
                type: "Mountain",
                description: "A rocky world with towering peaks. Rich in mineral deposits and stone.",
                unlockRequirements: {
                    heat: 25,
                    fuel: 25,
                    water: 25,
                    oxygen: 20
                },
                introducesResources: ['stone'],
                resourceGeneration: {
                    stone: { base: 6, multiplier: 2.2 },
                    heat: { base: 8, multiplier: 1.4 },
                    fuel: { base: 5, multiplier: 1.1 },
                    oxygen: { base: 4, multiplier: 0.7 }
                },
                properties: {
                    temperature: 5,
                    atmosphere: 45,
                    gravity: 1.3,
                    timeSpeed: 0.8
                },
                unlocked: false
            },
            {
                id: 4,
                name: "Volcanic Planet",
                type: "Volcanic",
                description: "A world of fire and molten rock. Extreme heat and magma flows.",
                unlockRequirements: {
                    heat: 50,
                    fuel: 25,
                    water: 25,
                    oxygen: 20,
                    stone: 30
                },
                introducesResources: ['magma'],
                resourceGeneration: {
                    magma: { base: 5, multiplier: 2.5 },
                    heat: { base: 18, multiplier: 2.0 },
                    stone: { base: 8, multiplier: 1.3 },
                    water: { base: 2, multiplier: 0.3 }
                },
                properties: {
                    temperature: 85,
                    atmosphere: 25,
                    gravity: 1.2,
                    timeSpeed: 1.3
                },
                unlocked: false
            },
            {
                id: 5,
                name: "Ice Planet",
                type: "Ice",
                description: "A frozen world of eternal winter. Ice formations and crystalline structures.",
                unlockRequirements: {
                    heat: 25,
                    fuel: 25,
                    water: 40,
                    oxygen: 20,
                    stone: 25,
                    magma: 20
                },
                introducesResources: ['ice'],
                resourceGeneration: {
                    ice: { base: 7, multiplier: 2.3 },
                    water: { base: 12, multiplier: 1.8 },
                    oxygen: { base: 6, multiplier: 1.2 },
                    heat: { base: 3, multiplier: 0.4 },
                    magma: { base: 1, multiplier: 0.2 }
                },
                properties: {
                    temperature: -35,
                    atmosphere: 55,
                    gravity: 0.8,
                    timeSpeed: 0.7
                },
                unlocked: false
            },
            {
                id: 6,
                name: "Crystal Planet",
                type: "Crystal",
                description: "A world of living crystal formations. Resonant energy and geometric perfection.",
                unlockRequirements: {
                    heat: 30,
                    fuel: 30,
                    water: 30,
                    oxygen: 25,
                    stone: 30,
                    magma: 20,
                    ice: 25
                },
                introducesResources: ['crystal'],
                resourceGeneration: {
                    crystal: { base: 4, multiplier: 3.0 },
                    stone: { base: 10, multiplier: 1.6 },
                    ice: { base: 8, multiplier: 1.4 },
                    oxygen: { base: 6, multiplier: 1.1 }
                },
                properties: {
                    temperature: 18,
                    atmosphere: 40,
                    gravity: 1.4,
                    timeSpeed: 1.1
                },
                unlocked: false
            },
            {
                id: 7,
                name: "Void Planet",
                type: "Void",
                description: "A mysterious world at the edge of reality. Source of pure void energy.",
                unlockRequirements: {
                    heat: 40,
                    fuel: 40,
                    water: 35,
                    oxygen: 30,
                    stone: 35,
                    magma: 25,
                    ice: 30,
                    crystal: 20
                },
                introducesResources: ['voidEnergy'],
                resourceGeneration: {
                    voidEnergy: { base: 2, multiplier: 4.0 },
                    crystal: { base: 6, multiplier: 1.3 },
                    // Void energy enhances all other resources when generated
                    heat: { base: 4, multiplier: 1.2 },
                    fuel: { base: 4, multiplier: 1.2 },
                    water: { base: 4, multiplier: 1.2 },
                    oxygen: { base: 4, multiplier: 1.2 },
                    stone: { base: 4, multiplier: 1.2 },
                    magma: { base: 4, multiplier: 1.2 },
                    ice: { base: 4, multiplier: 1.2 }
                },
                properties: {
                    temperature: 0,
                    atmosphere: 0,
                    gravity: 0.5,
                    timeSpeed: 2.0
                },
                unlocked: false
            }
        ];
    }

    checkWorldUnlocks() {
        const state = this.gameState.getState();
        if (!state || !state.resources) return null;
        
        // Check each world to see if it can be unlocked
        for (let i = 0; i < this.worldDefinitions.length; i++) {
            const world = this.worldDefinitions[i];
            
            // Skip if already unlocked
            if (state.unlockedWorlds.includes(world.id)) continue;
            
            // Check if requirements are met
            const canUnlock = this.canUnlockWorld(world.id);
            if (canUnlock) {
                state.unlockedWorlds.push(world.id);
                return { 
                    worldId: world.id, 
                    message: `🌍 ${world.name} Unlocked! ${world.description}` 
                };
            }
        }
        
        return null;
    }

    canUnlockWorld(worldId) {
        const state = this.gameState.getState();
        const world = this.worldDefinitions[worldId];
        
        if (!world || !world.unlockRequirements) return false;
        
        // Check all resource requirements
        for (const [resource, required] of Object.entries(world.unlockRequirements)) {
            if (state.resources[resource] < required) {
                return false;
            }
        }
        
        return true;
    }

    getAvailableWorlds() {
        const state = this.gameState.getState();
        if (!state || !state.unlockedWorlds) return [this.worldDefinitions[0]];
        
        return this.worldDefinitions.filter(world => 
            state.unlockedWorlds.includes(world.id)
        );
    }

    getWorldById(worldId) {
        return this.worldDefinitions[worldId] || null;
    }

    selectWorld(worldId) {
        const state = this.gameState.getState();
        const world = this.getWorldById(worldId);
        
        if (!world || !state.unlockedWorlds.includes(worldId)) {
            return false;
        }
        
        // Deduct unlock cost if this is the first time selecting this world
        if (state.worldProgress < worldId) {
            const cost = world.unlockRequirements;
            for (const [resource, amount] of Object.entries(cost)) {
                state.resources[resource] -= amount;
            }
            state.worldProgress = worldId;
            state.worldsCreated++;
        }
        
        // Set as current world
        state.currentWorld = {
            ...world,
            id: worldId,
            type: world.type,
            name: world.name,
            description: world.description,
            ...world.properties
        };
        
        return true;
    }

    getNextUnlockableWorld() {
        const state = this.gameState.getState();
        
        for (let i = 0; i < this.worldDefinitions.length; i++) {
            const world = this.worldDefinitions[i];
            
            // Skip if already unlocked
            if (state.unlockedWorlds.includes(world.id)) continue;
            
            // Return the first world that can be unlocked
            return {
                world: world,
                canUnlock: this.canUnlockWorld(world.id),
                requirements: world.unlockRequirements,
                progress: this.getUnlockProgress(world.id)
            };
        }
        
        return null; // All worlds unlocked
    }

    getUnlockProgress(worldId) {
        const state = this.gameState.getState();
        const world = this.worldDefinitions[worldId];
        
        if (!world || !world.unlockRequirements) return {};
        
        const progress = {};
        for (const [resource, required] of Object.entries(world.unlockRequirements)) {
            const current = state.resources[resource] || 0;
            progress[resource] = {
                current: current,
                required: required,
                percentage: Math.min(100, Math.floor((current / required) * 100))
            };
        }
        
        return progress;
    }

    getWorldDefinitions() {
        return this.worldDefinitions;
    }
}
