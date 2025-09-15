// MachineSystem.js - Handles machine parts, visualization, and rendering

export class MachineSystem {
    constructor(gameState, canvas, ctx) {
        this.gameState = gameState;
        this.canvas = canvas;
        this.ctx = ctx;
    }

    addMachinePart(type = 'world') {
        const state = this.gameState.getState();
        if (!state.machineParts) state.machineParts = [];
        
        // Create structured machine components based on world count
        const worldCount = state.worldsCreated;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Different machine parts for different world milestones
        let partType, x, y, width, height;
        
        if (worldCount === 1) {
            // First world: Core reactor
            partType = 'reactor';
            x = centerX - 40;
            y = centerY - 40;
            width = 80;
            height = 80;
        } else if (worldCount <= 5) {
            // Early worlds: Generators around the core
            partType = 'generator';
            const angle = ((worldCount - 2) * Math.PI * 2) / 4; // 4 generators max
            const radius = 110;
            x = centerX + Math.cos(angle) * radius - 30;
            y = centerY + Math.sin(angle) * radius - 30;
            width = 60;
            height = 60;
        } else if (worldCount <= 15) {
            // Mid game: Processing units
            partType = 'processor';
            const angle = ((worldCount - 6) * Math.PI * 2) / 10;
            const radius = 180;
            x = centerX + Math.cos(angle) * radius - 25;
            y = centerY + Math.sin(angle) * radius - 15;
            width = 50;
            height = 30;
        } else {
            // Late game: Expansion modules
            partType = 'module';
            const layer = Math.floor((worldCount - 16) / 8) + 1;
            const posInLayer = (worldCount - 16) % 8;
            const angle = (posInLayer * Math.PI * 2) / 8;
            const radius = 220 + (layer * 50);
            x = centerX + Math.cos(angle) * radius - 20;
            y = centerY + Math.sin(angle) * radius - 20;
            width = 40;
            height = 40;
        }
        
        const part = {
            id: Date.now(),
            type: partType,
            x: x,
            y: y,
            width: width,
            height: height,
            angle: 0,
            worldIndex: worldCount,
            color: this.getMachinePartColor(partType),
            opacity: 0.9
        };
        
        state.machineParts.push(part);
        
        // Keep only the latest 50 parts for performance
        if (state.machineParts.length > 50) {
            state.machineParts = state.machineParts.slice(-50);
        }
        
        return part;
    }

    getMachinePartColor(type) {
        const colors = {
            reactor: '#ff6b6b',      // Red for core reactor
            generator: '#4ecdc4',    // Teal for generators  
            processor: '#45b7d1',    // Blue for processors
            module: '#f9ca24',       // Yellow for expansion modules
            world: this.getCSSColor('--accent-color'),
            heat: this.getCSSColor('--error-color'),
            fuel: this.getCSSColor('--primary-color'),
            pressure: '#FFD700', // Gold
            energy: '#9B59B6', // Purple
            stability: this.getCSSColor('--success-color')
        };
        
        return colors[type] || colors.world;
    }

    getCSSColor(variableName) {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || '#3498db';
    }

    updateMachineComplexity() {
        const state = this.gameState.getState();
        if (!state) return;
        
        state.machineComplexity = Math.floor(
            state.worldsCreated * 0.5 +
            state.resources.heat * 0.01 +
            state.resources.fuel * 0.01 +
            state.resources.pressure * 0.02 +
            state.resources.energy * 0.03 +
            state.resources.stability * 0.05
        );
    }

    renderMachine() {
        if (!this.canvas || !this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const state = this.gameState.getState();
        const worldCount = state.worldsCreated || 0;
        
        // Draw background
        this.drawEnhancedBackground();
        
        // Draw the main machine based on world count
        this.drawMainMachine(worldCount);
        
        // Draw expansion rings based on worlds created
        this.drawExpansionRings(worldCount);
        
        // Draw resource cores
        this.drawResourceCores(state);
        
        // Draw connecting energy lines
        this.drawEnergyLines(worldCount);
        
        // Draw machine housing/frame
        this.drawMachineHousing(worldCount);
        
        // Draw central title overlay
        this.drawMachineTitle(worldCount);
    }

    drawEnhancedBackground() {
        // Create a subtle radial gradient background
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(this.canvas.width, this.canvas.height) / 2);
        gradient.addColorStop(0, 'rgba(25, 30, 35, 0.8)');
        gradient.addColorStop(1, 'rgba(15, 20, 25, 0.95)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add some subtle grid lines
        this.ctx.strokeStyle = 'rgba(184, 134, 11, 0.1)';
        this.ctx.lineWidth = 1;
        const gridSize = 40;
        
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawMainMachine(worldCount) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Base size grows with world count
        const baseSize = 60 + (worldCount * 8);
        
        // Main reactor core
        const coreGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseSize);
        coreGradient.addColorStop(0, '#FFD700'); // Bright gold center
        coreGradient.addColorStop(0.3, '#FF8C00'); // Orange
        coreGradient.addColorStop(0.7, '#B8860B'); // Dark gold
        coreGradient.addColorStop(1, '#8B4513'); // Bronze edge
        
        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, baseSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Core outline
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Inner details
        for (let i = 0; i < 3; i++) {
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 - i * 0.1})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, baseSize - (i * 15), 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawExpansionRings(worldCount) {
        if (worldCount < 2) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const baseRadius = 80;
        
        // Number of rings based on world count
        const rings = Math.min(Math.floor(worldCount / 2), 6);
        
        for (let ring = 0; ring < rings; ring++) {
            const radius = baseRadius + (ring * 45);
            const segments = 4 + ring; // More segments on outer rings
            
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2 + (ring * 0.5); // Offset each ring
                const segmentSize = 15 + (ring * 3);
                
                const x = centerX + Math.cos(angle) * radius - segmentSize/2;
                const y = centerY + Math.sin(angle) * radius - segmentSize/2;
                
                // Module gradient
                const moduleGradient = this.ctx.createRadialGradient(x + segmentSize/2, y + segmentSize/2, 0, x + segmentSize/2, y + segmentSize/2, segmentSize);
                moduleGradient.addColorStop(0, '#C0C0C0'); // Silver center
                moduleGradient.addColorStop(0.5, '#808080'); // Gray
                moduleGradient.addColorStop(1, '#404040'); // Dark edge
                
                this.ctx.fillStyle = moduleGradient;
                this.ctx.fillRect(x, y, segmentSize, segmentSize);
                
                // Module outline
                this.ctx.strokeStyle = '#2F2F2F';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, segmentSize, segmentSize);
                
                // Inner detail
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(x + 3, y + 3, segmentSize - 6, segmentSize - 6);
            }
        }
    }

    drawResourceCores(state) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const resources = state.resources || {};
        
        // Heat core (top)
        if (resources.heat > 0) {
            this.drawResourceCore(centerX, centerY - 100, 20, '#FF4500', resources.heat);
        }
        
        // Fuel core (bottom)
        if (resources.fuel > 0) {
            this.drawResourceCore(centerX, centerY + 100, 20, '#0066FF', resources.fuel);
        }
        
        // Additional cores for other resources if they exist
        if (resources.pressure > 0) {
            this.drawResourceCore(centerX - 100, centerY, 18, '#FFFF00', resources.pressure);
        }
        
        if (resources.energy > 0) {
            this.drawResourceCore(centerX + 100, centerY, 18, '#9900FF', resources.energy);
        }
        
        if (resources.stability > 0) {
            this.drawResourceCore(centerX, centerY - 150, 16, '#00FF00', resources.stability);
        }
    }

    drawResourceCore(x, y, radius, color, amount) {
        // Pulsing effect based on resource amount - ensure radius is always positive
        const pulseIntensity = Math.sin(Date.now() * 0.005) * (amount * 0.02);
        const pulseSize = Math.max(radius * 0.3, radius + pulseIntensity); // Minimum 30% of original radius
        
        // Ensure gradient radius is always positive for createRadialGradient
        const gradientRadius = Math.max(1, pulseSize);
        const coreGradient = this.ctx.createRadialGradient(x, y, 0, x, y, gradientRadius);
        coreGradient.addColorStop(0, color);
        coreGradient.addColorStop(0.5, `${color}80`); // Semi-transparent
        coreGradient.addColorStop(1, `${color}20`); // Very transparent
        
        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, Math.max(1, pulseSize), 0, Math.PI * 2);
        this.ctx.fill();
        
        // Core outline
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawEnergyLines(worldCount) {
        if (worldCount < 1) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Animated energy lines connecting cores
        const time = Date.now() * 0.003;
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.lineDashOffset = -time * 10;
        
        // Lines to resource cores
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(centerX, centerY - 100); // To heat core
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(centerX, centerY + 100); // To fuel core
        
        if (worldCount > 2) {
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(centerX - 100, centerY); // To pressure core
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(centerX + 100, centerY); // To energy core
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawMachineHousing(worldCount) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Outer housing that grows with worlds
        const housingSize = 200 + (worldCount * 15);
        
        // Housing gradient
        const housingGradient = this.ctx.createLinearGradient(centerX - housingSize/2, centerY - housingSize/2, centerX + housingSize/2, centerY + housingSize/2);
        housingGradient.addColorStop(0, 'rgba(139, 69, 19, 0.3)'); // Transparent brown
        housingGradient.addColorStop(0.5, 'rgba(160, 82, 45, 0.2)'); // Transparent saddle brown
        housingGradient.addColorStop(1, 'rgba(139, 69, 19, 0.3)');
        
        this.ctx.fillStyle = housingGradient;
        this.ctx.fillRect(centerX - housingSize/2, centerY - housingSize/2, housingSize, housingSize);
        
        // Housing outline
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(centerX - housingSize/2, centerY - housingSize/2, housingSize, housingSize);
    }

    drawMachineTitle(worldCount) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 - 30;
        
        // Machine title
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚙ MACHINE ASSEMBLY PLATFORM ⚙', centerX, centerY - 50);
        
        // Subtitle
        this.ctx.fillStyle = '#B8860B';
        this.ctx.font = '16px serif';
        this.ctx.fillText('Create worlds to build your steampunk machine', centerX, centerY - 25);
        
        // Machine level indicator
        if (worldCount > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 14px serif';
            this.ctx.fillText(`Machine Level: ${worldCount}`, centerX, centerY + 80);
        }
    }

    drawBackgroundGrid() {
        // Steampunk-style blueprint grid
        this.ctx.strokeStyle = 'rgba(184, 134, 11, 0.15)'; // Faded brass
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 8]);
        
        const gridSize = 30;
        
        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
        
        // Blueprint corner marks
        this.ctx.strokeStyle = 'rgba(184, 134, 11, 0.4)';
        this.ctx.lineWidth = 2;
        const cornerSize = 8;
        
        // Draw corner marks at intersections
        for (let x = 0; x <= this.canvas.width; x += gridSize * 3) {
            for (let y = 0; y <= this.canvas.height; y += gridSize * 3) {
                this.ctx.beginPath();
                this.ctx.moveTo(x - cornerSize/2, y);
                this.ctx.lineTo(x + cornerSize/2, y);
                this.ctx.moveTo(x, y - cornerSize/2);
                this.ctx.lineTo(x, y + cornerSize/2);
                this.ctx.stroke();
            }
        }
    }

    drawConnections() {
        const state = this.gameState.getState();
        if (!state || !state.machineParts || state.machineParts.length < 1) return;
        
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 3;
        
        // Connect all parts to the reactor (first part)
        if (state.machineParts.length > 0) {
            const reactor = state.machineParts[0]; // First part should be reactor
            
            for (let i = 1; i < state.machineParts.length; i++) {
                const part = state.machineParts[i];
                
                // Draw pipe/cable connection
                this.ctx.beginPath();
                this.ctx.moveTo(reactor.x + reactor.width/2, reactor.y + reactor.height/2);
                this.ctx.lineTo(part.x + part.width/2, part.y + part.height/2);
                this.ctx.stroke();
                
                // Add small connection nodes
                this.ctx.fillStyle = '#777';
                this.ctx.beginPath();
                this.ctx.arc(part.x + part.width/2, part.y + part.height/2, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Reactor connection hub
            this.ctx.fillStyle = '#999';
            this.ctx.beginPath();
            this.ctx.arc(reactor.x + reactor.width/2, reactor.y + reactor.height/2, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawMachinePart(part, index) {
        this.ctx.save();
        
        // Steampunk color palette
        const brass = '#B8860B';
        const copper = '#B87333';
        const bronze = '#CD7F32';
        const steel = '#4C4C4C';
        const gold = '#FFD700';
        
        // Set base colors and shadows
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        switch (part.type) {
            case 'reactor':
                this.drawSteampunkReactor(part, brass, copper, steel);
                break;
            case 'generator':
                this.drawSteampunkGenerator(part, copper, bronze, steel);
                break;
            case 'processor':
                this.drawSteampunkProcessor(part, bronze, brass, steel);
                break;
            case 'module':
                this.drawSteampunkModule(part, gold, copper, steel);
                break;
        }
        
        this.ctx.restore();
    }

    drawSteampunkReactor(part, brass, copper, steel) {
        const centerX = part.x + part.width / 2;
        const centerY = part.y + part.height / 2;
        const radius = part.width / 2;
        
        // Main reactor vessel (large cylinder)
        const gradient = this.ctx.createRadialGradient(centerX - 10, centerY - 10, 0, centerX, centerY, radius);
        gradient.addColorStop(0, brass);
        gradient.addColorStop(0.7, copper);
        gradient.addColorStop(1, steel);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Outer rim with rivets
        this.ctx.strokeStyle = steel;
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Rivets around the rim
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const rivetX = centerX + Math.cos(angle) * (radius - 8);
            const rivetY = centerY + Math.sin(angle) * (radius - 8);
            
            this.ctx.fillStyle = steel;
            this.ctx.beginPath();
            this.ctx.arc(rivetX, rivetY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Central viewing window
        this.ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Window frame
        this.ctx.strokeStyle = steel;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Pressure gauges
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI * 2) / 4 + Math.PI / 4;
            const gaugeX = centerX + Math.cos(angle) * (radius * 0.7);
            const gaugeY = centerY + Math.sin(angle) * (radius * 0.7);
            
            this.ctx.fillStyle = brass;
            this.ctx.beginPath();
            this.ctx.arc(gaugeX, gaugeY, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = steel;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }

    drawSteampunkGenerator(part, copper, bronze, steel) {
        const x = part.x;
        const y = part.y;
        const w = part.width;
        const h = part.height;
        
        // Main generator housing
        const gradient = this.ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, copper);
        gradient.addColorStop(0.5, bronze);
        gradient.addColorStop(1, steel);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, w, h);
        
        // Housing frame
        this.ctx.strokeStyle = steel;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, w, h);
        
        // Steam pipes on top
        for (let i = 0; i < 3; i++) {
            const pipeX = x + (w * (i + 1)) / 4;
            const pipeY = y - 10;
            
            this.ctx.fillStyle = bronze;
            this.ctx.fillRect(pipeX - 3, pipeY, 6, 15);
            
            // Pipe joints
            this.ctx.fillStyle = steel;
            this.ctx.fillRect(pipeX - 4, pipeY + 5, 8, 3);
        }
        
        // Control panel
        this.ctx.fillStyle = brass;
        this.ctx.fillRect(x + 5, y + 5, w - 10, 12);
        
        // Control knobs/switches
        for (let i = 0; i < 4; i++) {
            const knobX = x + 8 + (i * (w - 16)) / 3;
            const knobY = y + 11;
            
            this.ctx.fillStyle = steel;
            this.ctx.beginPath();
            this.ctx.arc(knobX, knobY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Cooling fins
        this.ctx.strokeStyle = steel;
        this.ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
            const finY = y + (h * i) / 6;
            this.ctx.beginPath();
            this.ctx.moveTo(x, finY);
            this.ctx.lineTo(x + w, finY);
            this.ctx.stroke();
        }
        
        // Side vents
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - 2, y + h * 0.3, 4, h * 0.4);
        this.ctx.fillRect(x + w - 2, y + h * 0.3, 4, h * 0.4);
    }

    drawSteampunkProcessor(part, bronze, brass, steel) {
        const x = part.x;
        const y = part.y;
        const w = part.width;
        const h = part.height;
        
        // Main processing unit (hexagonal shape)
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        
        const gradient = this.ctx.createRadialGradient(centerX - 5, centerY - 5, 0, centerX, centerY, w / 2);
        gradient.addColorStop(0, bronze);
        gradient.addColorStop(0.6, brass);
        gradient.addColorStop(1, steel);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + w * 0.3, centerY);
        this.ctx.lineTo(centerX + w * 0.15, centerY + h * 0.25);
        this.ctx.lineTo(centerX - w * 0.15, centerY + h * 0.25);
        this.ctx.lineTo(centerX - w * 0.3, centerY);
        this.ctx.lineTo(centerX - w * 0.15, centerY - h * 0.25);
        this.ctx.lineTo(centerX + w * 0.15, centerY - h * 0.25);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Hexagon frame
        this.ctx.strokeStyle = steel;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Central processing chamber
        this.ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, w * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = steel;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Processing tubes
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const tubeStartX = centerX + Math.cos(angle) * (w * 0.15);
            const tubeStartY = centerY + Math.sin(angle) * (h * 0.15);
            const tubeEndX = centerX + Math.cos(angle) * (w * 0.25);
            const tubeEndY = centerY + Math.sin(angle) * (h * 0.25);
            
            this.ctx.strokeStyle = bronze;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(tubeStartX, tubeStartY);
            this.ctx.lineTo(tubeEndX, tubeEndY);
            this.ctx.stroke();
        }
        
        // Corner reinforcement bolts
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const boltX = centerX + Math.cos(angle) * (w * 0.22);
            const boltY = centerY + Math.sin(angle) * (h * 0.22);
            
            this.ctx.fillStyle = steel;
            this.ctx.beginPath();
            this.ctx.arc(boltX, boltY, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawSteampunkModule(part, gold, copper, steel) {
        const centerX = part.x + part.width / 2;
        const centerY = part.y + part.height / 2;
        const size = part.width / 2;
        
        // Main module housing (diamond/rhombus)
        const gradient = this.ctx.createRadialGradient(centerX - 3, centerY - 3, 0, centerX, centerY, size);
        gradient.addColorStop(0, gold);
        gradient.addColorStop(0.5, copper);
        gradient.addColorStop(1, steel);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - size);
        this.ctx.lineTo(centerX + size, centerY);
        this.ctx.lineTo(centerX, centerY + size);
        this.ctx.lineTo(centerX - size, centerY);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Diamond frame
        this.ctx.strokeStyle = steel;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Central control sphere
        this.ctx.fillStyle = gold;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = steel;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Control arms extending from diamond points
        const armLength = size * 0.6;
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI * 2) / 4;
            const startX = centerX + Math.cos(angle) * (size * 0.8);
            const startY = centerY + Math.sin(angle) * (size * 0.8);
            const endX = centerX + Math.cos(angle) * (size * 1.2);
            const endY = centerY + Math.sin(angle) * (size * 1.2);
            
            // Arm
            this.ctx.strokeStyle = copper;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // Arm end fitting
            this.ctx.fillStyle = steel;
            this.ctx.beginPath();
            this.ctx.arc(endX, endY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Decorative gears
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI * 2) / 4 + Math.PI / 4;
            const gearX = centerX + Math.cos(angle) * (size * 0.5);
            const gearY = centerY + Math.sin(angle) * (size * 0.5);
            
            this.drawSmallGear(gearX, gearY, 4, copper, steel);
        }
    }

    drawSmallGear(centerX, centerY, radius, fillColor, strokeColor) {
        const teeth = 8;
        
        this.ctx.fillStyle = fillColor;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const angle1 = (i * Math.PI * 2) / teeth;
            const angle2 = ((i + 0.5) * Math.PI * 2) / teeth;
            const angle3 = ((i + 1) * Math.PI * 2) / teeth;
            
            const innerRadius = radius * 0.7;
            const outerRadius = radius;
            
            if (i === 0) {
                this.ctx.moveTo(
                    centerX + Math.cos(angle1) * innerRadius,
                    centerY + Math.sin(angle1) * innerRadius
                );
            }
            
            this.ctx.lineTo(
                centerX + Math.cos(angle1) * outerRadius,
                centerY + Math.sin(angle1) * outerRadius
            );
            this.ctx.lineTo(
                centerX + Math.cos(angle2) * outerRadius,
                centerY + Math.sin(angle2) * outerRadius
            );
            this.ctx.lineTo(
                centerX + Math.cos(angle3) * innerRadius,
                centerY + Math.sin(angle3) * innerRadius
            );
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Center hole
        this.ctx.fillStyle = strokeColor;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawResourceFlows() {
        // Resource flows disabled for cleaner steampunk aesthetic
        return;
    }

    drawResourceFlow(x, y, amount, type, color) {
        const intensity = Math.min(amount / 100, 1); // Normalize to 0-1
        
        this.ctx.strokeStyle = color + Math.floor(intensity * 255).toString(16).padStart(2, '0');
        this.ctx.lineWidth = 2 + intensity * 3;
        
        switch (type) {
            case 'heat':
                // Pulsing radiating lines
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const pulse = Math.sin(Date.now() * 0.01 + i) * 0.5 + 0.5;
                    const length = 30 + pulse * 20;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(
                        x + Math.cos(angle) * length * intensity,
                        y + Math.sin(angle) * length * intensity
                    );
                    this.ctx.stroke();
                }
                break;
                
            case 'fuel':
                // Flowing circular pattern
                const flowOffset = Date.now() * 0.005;
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2 + flowOffset;
                    const radius = 25 + Math.sin(angle * 2) * 10;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, radius * intensity, angle, angle + 0.2);
                    this.ctx.stroke();
                }
                break;
                
            case 'pressure':
                // Expanding/contracting diamond
                const pressureScale = 0.8 + Math.sin(Date.now() * 0.008) * 0.2;
                const size = 40 * intensity * pressureScale;
                
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y);
                this.ctx.lineTo(x, y + size);
                this.ctx.lineTo(x - size, y);
                this.ctx.closePath();
                this.ctx.stroke();
                break;
                
            case 'energy':
                // Crackling lightning effect
                this.ctx.lineWidth = 1 + intensity * 2;
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const startX = x + Math.cos(angle) * 20;
                    const startY = y + Math.sin(angle) * 20;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(startX, startY);
                    
                    // Create jagged lightning line
                    for (let j = 1; j <= 3; j++) {
                        const segmentX = startX + Math.cos(angle) * j * 15 + (Math.random() - 0.5) * 10;
                        const segmentY = startY + Math.sin(angle) * j * 15 + (Math.random() - 0.5) * 10;
                        this.ctx.lineTo(segmentX, segmentY);
                    }
                    this.ctx.stroke();
                }
                break;
        }
    }

    drawStabilityGlow(x, y, stability) {
        const intensity = Math.min(stability / 50, 1);
        const glowSize = 60 + intensity * 40;
        
        // Create radial gradient
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, `rgba(46, 204, 113, ${intensity * 0.3})`);
        gradient.addColorStop(0.5, `rgba(46, 204, 113, ${intensity * 0.1})`);
        gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawComplexityIndicator() {
        const complexity = this.gameState.machineComplexity;
        
        // Draw complexity bar in top-right corner
        const barX = this.canvas.width - 120;
        const barY = 20;
        const barWidth = 100;
        const barHeight = 10;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Fill based on complexity
        const fillWidth = Math.min((complexity / 100) * barWidth, barWidth);
        const hue = Math.min(complexity / 100 * 120, 120); // Green to red
        this.ctx.fillStyle = `hsl(${120 - hue}, 70%, 50%)`;
        this.ctx.fillRect(barX, barY, fillWidth, barHeight);
        
        // Text label
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Complexity: ${complexity}`, barX + barWidth, barY - 5);
    }

    animateResource(type) {
        // Visual feedback removed - no more blue dots/particles
        // Machine growth and visual improvements are handled in renderMachine()
        return;
    }

    animateParticle(particle) {
        // Particle animation disabled to remove unwanted blue effects
        return;
    }

    setCanvas(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    getMachineParts() {
        return this.gameState.machineParts;
    }

    clearMachine() {
        this.gameState.machineParts = [];
        if (this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawBaseFrame() {
        // This method is now integrated into the main renderMachine method
        // The new system always shows the machine, even with 0 worlds
        this.renderMachine();
    }

    drawSteampunkConnections() {
        const state = this.gameState.getState();
        if (!state || !state.machineParts || state.machineParts.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#B87333';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Connect components in sequence
        for (let i = 0; i < state.machineParts.length - 1; i++) {
            const from = state.machineParts[i];
            const to = state.machineParts[i + 1];
            
            const fromX = from.x + from.width / 2;
            const fromY = from.y + from.height / 2;
            const toX = to.x + to.width / 2;
            const toY = to.y + to.height / 2;
            
            // Draw curved pipe
            this.ctx.beginPath();
            this.ctx.moveTo(fromX, fromY);
            
            // Calculate control points for curved pipe
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            const offsetY = Math.abs(fromX - toX) * 0.3;
            
            this.ctx.quadraticCurveTo(midX, midY - offsetY, toX, toY);
            this.ctx.stroke();
            
            // Draw pipe joints
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#4C4C4C';
            this.ctx.beginPath();
            this.ctx.arc(fromX, fromY, 6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(toX, toY, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    drawSteamEffects() {
        const state = this.gameState.getState();
        if (!state || !state.machineParts) return;
        
        const time = Date.now() * 0.001;
        
        state.machineParts.forEach((part, index) => {
            if (part.type === 'reactor' || part.type === 'generator') {
                // Animated steam puffs
                for (let i = 0; i < 4; i++) {
                    const steamX = part.x + part.width / 2 + Math.sin(time + index + i * 0.5) * 20;
                    const steamY = part.y - 30 - (i * 25) + Math.sin(time * 1.5 + index + i) * 8;
                    const opacity = 0.5 - (i * 0.12);
                    const size = 15 - (i * 2.5);
                    
                    this.ctx.fillStyle = `rgba(220, 220, 235, ${opacity})`;
                    this.ctx.beginPath();
                    this.ctx.arc(steamX, steamY, size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        });
    }

    drawMachineFrame() {
        const state = this.gameState.getState();
        if (!state || !state.machineParts || state.machineParts.length === 0) return;
        
        // Calculate bounding box of all parts
        let minX = this.canvas.width, minY = this.canvas.height;
        let maxX = 0, maxY = 0;
        
        state.machineParts.forEach(part => {
            minX = Math.min(minX, part.x - 35);
            minY = Math.min(minY, part.y - 45);
            maxX = Math.max(maxX, part.x + part.width + 35);
            maxY = Math.max(maxY, part.y + part.height + 35);
        });
        
        // Draw outer frame with industrial styling
        this.ctx.strokeStyle = '#4C4C4C';
        this.ctx.lineWidth = 6;
        this.ctx.setLineDash([20, 10, 8, 10]);
        this.ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        this.ctx.setLineDash([]);
        
        // Frame corners with brass corners
        const cornerSize = 25;
        this.ctx.fillStyle = '#B8860B';
        
        // Corner brackets
        const corners = [
            [minX - 3, minY - 3],
            [maxX - cornerSize + 3, minY - 3],
            [minX - 3, maxY - cornerSize + 3],
            [maxX - cornerSize + 3, maxY - cornerSize + 3]
        ];
        
        corners.forEach(([x, y]) => {
            this.ctx.fillRect(x, y, cornerSize, cornerSize);
        });
        
        // Corner bolts and decorative rivets
        this.ctx.fillStyle = '#4C4C4C';
        const boltPositions = [
            [minX + 12, minY + 12],
            [maxX - 12, minY + 12],
            [minX + 12, maxY - 12],
            [maxX - 12, maxY - 12]
        ];
        
        boltPositions.forEach(([x, y]) => {
            // Main bolt
            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Bolt cross
            this.ctx.strokeStyle = '#B8860B';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x - 4, y);
            this.ctx.lineTo(x + 4, y);
            this.ctx.moveTo(x, y - 4);
            this.ctx.lineTo(x, y + 4);
            this.ctx.stroke();
        });
    }
}
