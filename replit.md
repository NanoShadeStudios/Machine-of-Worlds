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

## Recent Changes
- 2025-09-15: Project imported from GitHub
- 2025-09-15: Setting up Replit environment configuration

## User Preferences
- None specified yet

## Deployment Notes
- Static website deployment target
- No build process required
- All assets are self-contained