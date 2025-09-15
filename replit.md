# The Machine of Worlds - Project Documentation

## Overview
- **Project Type**: Browser-based incremental strategy game
- **Technology Stack**: Pure HTML/CSS/JavaScript (no external dependencies)
- **Architecture**: ES6 modules with static file serving
- **Current State**: Fresh GitHub import, setting up for Replit environment

## Project Architecture
### Frontend Structure
- **Entry Point**: `index.html` loads modular JavaScript systems
- **Main Game File**: `js/Game.js` - orchestrates all game systems
- **Modular Systems**: 
  - GameState.js - core state management
  - ResourceSystem.js - resource generation mechanics
  - WorldSystem.js - world creation and properties
  - MachineSystem.js - visual machine canvas rendering
  - UISystem.js - user interface management
  - UpgradeSystem.js - upgrade mechanics
  - EventSystem.js - random events
  - AchievementSystem.js - progression tracking

### Game Features
- World generation system with procedural properties
- Resource management (Heat, Fuel, Energy, Pressure, Stability)
- Visual machine evolution using HTML5 Canvas
- Finite upgrade progression system
- Local storage save/load system
- Achievement tracking system

## Hosting Requirements
- **Type**: Static file server for HTML/CSS/JS
- **Port**: Must serve on 5000 for Replit compatibility
- **Host**: 0.0.0.0 to allow proxy access
- **No Backend**: Pure frontend application
- **Dependencies**: None (self-contained)

## Quick Start Instructions
1. **To Run Locally**: The "Game Server" workflow should start automatically
2. **Manual Start**: Run `python server.py` if needed  
3. **Access Game**: Click the web preview or visit the provided URL
4. **Port**: Game runs on port 5000 (required for Replit proxy)

## Development Notes
- **Host Configuration**: Server binds to 0.0.0.0:5000 for Replit iframe compatibility
- **CORS Headers**: Enabled for cross-origin requests in iframe environment  
- **Caching**: Disabled for immediate updates during development
- **Module Loading**: Uses ES6 imports through single entry point (js/Game.js)

## Recent Changes
- 2025-09-15: Project imported from GitHub
- 2025-09-15: Created Python static file server for Replit environment
- 2025-09-15: Simplified script loading to avoid module duplication
- 2025-09-15: Configured deployment for autoscale static hosting

## User Preferences
- None specified yet

## Deployment Notes
- **Target**: Autoscale deployment (static web app)
- **Command**: `python server.py`
- **No build process required** - all assets are self-contained
- **Production ready** with CORS and cache headers optimized for web serving