# WebMUD Card Game System Implementation

You are a NextJS and Node.js programming assistant. We are building a next-gen MUD (multi-user-dungeon) with a card-based encounter system. 

## Project Overview
- **builder_tools**: NextJS app for world-building tools
- **game_service**: Node.js/TypeScript game server with Socket.IO
- **vite_client**: React client for players
- **Database**: MongoDB with collections for worlds, rooms, cards, and card collections

## Current State
The MUD has a basic combat system implemented in `game_service/src/game/combat/roundManager.ts` that needs to be replaced with a sophisticated card game system. The foundation for cards already exists with:
- Card repository and data models
- Card collection system for players
- Seed data for various card types (spells, items, abilities, enhancements)

## Task List: Replace Combat System with Card Game System

### Phase 1: Remove Existing Combat System
- [ ] **Task 1.1**: Remove combat-related imports and references from `world.ts`
- [ ] **Task 1.2**: Remove combat command handling from `socketHandlers.ts` and `commandParser.ts`
- [ ] **Task 1.3**: Remove combat message types from `taxonomy.ts`
- [ ] **Task 1.4**: Delete the entire `game_service/src/game/combat/` directory
- [ ] **Task 1.5**: Update entity classes to remove combat-specific health/damage logic
- [ ] **Task 1.6**: Clean up any remaining combat references in the codebase

### Phase 2: Design Card Game Core Systems
- [ ] **Task 2.1**: Create `game_service/src/game/cards/` directory structure
- [ ] **Task 2.2**: Design card game state management interfaces (`GameState`, `PlayerHand`, `EncounterState`)
- [ ] **Task 2.3**: Create card effect system (`CardEffect` implementations for damage, heal, buff, debuff, utility)
- [ ] **Task 2.4**: Design encounter resolution engine (`EncounterManager` class)
- [ ] **Task 2.5**: Create player deck management system (`DeckManager` class)
- [ ] **Task 2.6**: Design mana/resource system for card costs

### Phase 3: Implement Round-Based Card Game Manager
- [ ] **Task 3.1**: Create `CardGameManager` class to replace `RoundManager`
  - Round-based turns with action windows
  - Player card selection and validation
  - AI opponent card selection
  - Simultaneous card resolution
- [ ] **Task 3.2**: Implement card validation logic (mana costs, requirements, target validity)
- [ ] **Task 3.3**: Create card effect resolution system
- [ ] **Task 3.4**: Add support for card synergies and combinations
- [ ] **Task 3.5**: Implement win/loss conditions for encounters

### Phase 4: Player Interaction & Commands
- [ ] **Task 4.1**: Create new command types for card game (`PLAY_CARD`, `VIEW_HAND`, `VIEW_DECK`, `START_ENCOUNTER`)
- [ ] **Task 4.2**: Update `commandParser.ts` with card game commands
- [ ] **Task 4.3**: Update `socketHandlers.ts` to handle card game actions
- [ ] **Task 4.4**: Create card game message types in `taxonomy.ts`
- [ ] **Task 4.5**: Implement hand management commands (draw, discard, shuffle)

### Phase 5: Entity & World Integration
- [ ] **Task 5.1**: Update entity classes to include card game stats (mana, deck composition)
- [ ] **Task 5.2**: Modify world state to track active card encounters
- [ ] **Task 5.3**: Create encounter triggers for room exploration and NPC interactions
- [ ] **Task 5.4**: Add card game state persistence to entity data
- [ ] **Task 5.5**: Implement encounter matchmaking between players and NPCs

### Phase 6: Client-Side Card Game UI
- [ ] **Task 6.1**: Create React components for card display and hand management in `vite_client`
- [ ] **Task 6.2**: Implement drag-and-drop card playing interface
- [ ] **Task 6.3**: Create encounter screen with opponent information and game state
- [ ] **Task 6.4**: Add card tooltips and effect descriptions
- [ ] **Task 6.5**: Implement real-time game state updates via Socket.IO
- [ ] **Task 6.6**: Create deck building interface for players

### Phase 7: Advanced Card Game Features
- [ ] **Task 7.1**: Implement card rarity and collection mechanics
- [ ] **Task 7.2**: Create card acquisition system (rewards, shops, random drops)
- [ ] **Task 7.3**: Add deck archetypes and build validation
- [ ] **Task 7.4**: Implement seasonal cards and limited-time events
- [ ] **Task 7.5**: Create card trading system between players
- [ ] **Task 7.6**: Add spectator mode for watching encounters

### Phase 8: Builder Tools Integration
- [ ] **Task 8.1**: Create card editor interface in `builder_tools`
- [ ] **Task 8.2**: Add encounter designer for room-specific card challenges
- [ ] **Task 8.3**: Create NPC card deck editor
- [ ] **Task 8.4**: Implement card balance testing tools
- [ ] **Task 8.5**: Add card art and visual asset management

### Phase 9: Testing & Polish
- [ ] **Task 9.1**: Create comprehensive unit tests for card game logic
- [ ] **Task 9.2**: Implement integration tests for full encounter flows
- [ ] **Task 9.3**: Add performance monitoring for real-time card games
- [ ] **Task 9.4**: Create debug tools for card game state inspection
- [ ] **Task 9.5**: Optimize network protocol for card game data

## Architecture Notes
- **Card Effects**: Use a plugin-like system where each card effect type has its own resolver
- **State Management**: Maintain immutable game state snapshots for rollback and debugging
- **Networking**: Minimize data sent over Socket.IO by using card IDs and state diffs
- **Persistence**: Save encounter results and deck changes to MongoDB
- **Scalability**: Design for multiple concurrent encounters in the same world

## Next Steps
Start with Phase 1 to clean up the existing combat system, then proceed through each phase systematically. Focus on creating a solid foundation before adding advanced features. 
