# WebMUD Card Game System Implementation Task List

## Overview
Transform the existing crude combat system into a sophisticated round-based card game system where players and entities use cards during encounters. This system will enable strategic gameplay through deck building and tactical card play.

## Phase 1: Remove Existing Combat System ✅ COMPLETED
### Task 1.1: Remove Combat Round Manager ✅
- [x] Delete `/game_service/src/game/combat/roundManager.ts`
- [x] Remove combat-related imports from world.ts
- [x] Remove `combatRoundManager` property from World class
- [x] Remove combat initialization from World constructor

### Task 1.2: Remove Combat Commands ✅
- [x] Remove `COMBAT` and `FLEE` command types from `CommandType` enum in `commandParser.ts`
- [x] Remove combat command parsing logic from `parseCommand` function
- [x] Remove combat command handlers from `socketHandlers.ts`
- [x] Remove `handleCombatCommand`, `handleFleeCommand`, `displayCombatStatus` methods from World class

### Task 1.3: Clean Combat-Related Methods ✅
- [x] Remove `handleCombatEnd`, `endCombat` methods from World class
- [x] Remove combat message sending logic
- [x] Remove combat-related entity state properties if any
- [x] Update entity health management to remove combat damage handling
- [x] Remove entire `/game_service/src/game/combat/` directory

## Phase 2: Design Card Game System Architecture
### Task 2.1: Define Card Game Core Interfaces
- [ ] Create `/game_service/src/game/cards/interfaces.ts` with:
  - `GameSession` interface for active card game sessions
  - `PlayerHand` interface for cards currently in player's hand
  - `PlayedCard` interface for cards played during a round
  - `GameTurn` interface for turn-based gameplay
  - `EncounterType` enum (PvP, PvE, Environmental)

### Task 2.2: Create Card Game Engine
- [ ] Create `/game_service/src/game/cards/gameEngine.ts`:
  - Core game logic for card resolution
  - Turn management system
  - Card effect processing
  - Victory/defeat conditions
  - Round progression logic

### Task 2.3: Design Card Game Session Management
- [ ] Create `/game_service/src/game/cards/gameSessionManager.ts`:
  - Active card game session tracking (separate from HTTP sessions)
  - Player matchmaking for PvP card games
  - Card game state persistence
  - Cleanup for abandoned card game sessions
  - Integration with existing user session system

## Phase 3: Extend Existing Card System
### Task 3.1: Enhance Card Repository
- [ ] Add game-specific card properties to Card interface:
  - `playConditions` (when card can be played)
  - `targetType` (self, enemy, ally, area)
  - `cardCategory` (attack, defense, utility, special)
  - `energyCost` (replace/extend manaCost concept)
- [ ] Add methods for retrieving cards by category and energy cost
- [ ] Add card validation methods

### Task 3.2: Extend Deck System
- [ ] Add active deck validation for game sessions
- [ ] Create deck shuffling and drawing mechanics
- [ ] Add hand size limits and management
- [ ] Create deck exhaustion handling (what happens when deck runs out)

### Task 3.3: Enhance Card Collection
- [ ] Add card acquisition mechanics (rewards from encounters)
- [ ] Create card trading/exchange system between players
- [ ] Add card rarity drops and reward pools
- [ ] Create collection statistics and tracking

## Phase 4: Game Session Implementation
### Task 4.1: Create Card Game Session Controller
- [ ] Create `/game_service/src/game/cards/gameSessionController.ts`:
  - Initialize new card game sessions
  - Handle player joining/leaving card games
  - Manage card game session lifecycle
  - Distribute rewards/penalties
  - Integrate with existing user session infrastructure

### Task 4.2: Implement Turn System
- [ ] Create turn-based round management:
  - Player turn order determination
  - Turn time limits and timeouts
  - Turn skip/forfeit handling
  - Round completion detection

### Task 4.3: Create Card Play Mechanics
- [ ] Implement card playing validation
- [ ] Create energy/mana management system
- [ ] Add card effect resolution
- [ ] Create chain effects and combos
- [ ] Add counter-play mechanics

## Phase 5: Entity Integration
### Task 5.1: Update Entity System for Card Games
- [ ] Add card game related properties to EntityState:
  - `activeGameSession` (current game session ID)
  - `currentHand` (cards currently in hand)
  - `energy` (available energy for playing cards)
  - `gameStatus` (in-game, waiting, defeated)

### Task 5.2: Create NPC Card AI
- [ ] Create `/game_service/src/game/cards/npcAI.ts`:
  - Basic AI for NPC card selection
  - Difficulty scaling based on encounter type
  - Adaptive AI based on player performance
  - Card priority algorithms

### Task 5.3: Update Player Entity
- [ ] Add card game methods to PlayerEntity:
  - `drawCards()` method
  - `playCard()` method
  - `endTurn()` method
  - `forfeitGame()` method

## Phase 6: Command System Integration
### Task 6.1: Create Card Game Commands
- [ ] Add new CommandType enum values:
  - `CHALLENGE` (challenge another player/entity)
  - `PLAY_CARD` (play a card from hand)
  - `VIEW_HAND` (see current hand)
  - `END_TURN` (end current turn)
  - `FORFEIT` (surrender current game)

### Task 6.2: Implement Command Parsing
- [ ] Add card game command parsing to `commandParser.ts`:
  - `challenge <target>` command
  - `play <card_name/number>` command
  - `hand` command for viewing cards
  - `end` command for ending turn
  - `forfeit` command for surrendering

### Task 6.3: Create Command Handlers
- [ ] Add card game command handlers to `socketHandlers.ts`
- [ ] Add corresponding methods to World class:
  - `handleChallengeCommand()`
  - `handlePlayCardCommand()`
  - `handleViewHandCommand()`
  - `handleEndTurnCommand()`
  - `handleForfeitCommand()`

## Phase 7: World Integration
### Task 7.1: Update World Class
- [ ] Add card game session management to World class:
  - `activeCardGameSessions` Map for tracking ongoing card games
  - `challengePlayer()` method
  - `acceptChallenge()` method
  - `startCardGame()` method
  - `endCardGame()` method
- [ ] Integrate with existing player session management

### Task 7.2: Create Encounter System
- [ ] Implement environmental encounters:
  - Random encounters in specific rooms
  - Puzzle rooms requiring card solutions
  - Boss encounters with special rules
- [ ] Create encounter triggers and conditions

### Task 7.3: Integrate with Room System
- [ ] Add card game areas/rooms
- [ ] Create tournament rooms for organized play
- [ ] Add practice areas for AI opponents
- [ ] Create spectator modes for ongoing games

## Phase 8: Client Integration
### Task 8.1: Update Client Interfaces
- [ ] Create card game UI components:
  - Game board display
  - Hand viewer
  - Energy/health displays
  - Turn indicator
  - Game log/history

### Task 8.2: Enhance Existing Components
- [ ] Update DeckOverview component for in-game use
- [ ] Modify DeckManager for quick deck switching
- [ ] Add game session status to player overview

### Task 8.3: Create Game Client Logic
- [ ] Add card game state management
- [ ] Create real-time game updates
- [ ] Add visual card play effects
- [ ] Implement game audio/sound effects

## Phase 9: Database Enhancements
### Task 9.1: Add Card Game Session Storage
- [ ] Create `cardGameSessions` collection schema (separate from HTTP sessions)
- [ ] Add card game session history tracking
- [ ] Create card game statistics collection
- [ ] Add leaderboards and rankings

### Task 9.2: Update Player Statistics
- [ ] Add card game statistics to player profiles:
  - Games played/won/lost
  - Favorite cards/strategies
  - Tournament rankings
  - Achievement tracking

### Task 9.3: Create Game History
- [ ] Store game replays for review
- [ ] Add game analysis data
- [ ] Create detailed match statistics
- [ ] Add performance analytics

## Phase 10: Advanced Features
### Task 10.1: Tournament System
- [ ] Create tournament brackets
- [ ] Add automated tournament scheduling
- [ ] Implement prize distribution
- [ ] Create tournament spectator mode

### Task 10.2: Guild/Team System
- [ ] Add team-based card games
- [ ] Create guild tournaments
- [ ] Add team card sharing
- [ ] Implement collaborative strategies

### Task 10.3: Card Crafting System
- [ ] Add card creation mechanics
- [ ] Create resource gathering for crafting
- [ ] Add custom card approval system
- [ ] Implement card balancing tools

## Testing & Quality Assurance
### Task QA.1: Unit Testing
- [ ] Write tests for card game engine
- [ ] Test session management
- [ ] Test AI behavior
- [ ] Test command parsing

### Task QA.2: Integration Testing
- [ ] Test multiplayer card game sessions
- [ ] Test database operations
- [ ] Test client-server communication
- [ ] Test performance under load

### Task QA.3: Balance Testing
- [ ] Test card balance and power levels
- [ ] Test game length and pacing
- [ ] Test reward systems
- [ ] Test progression curves

## Documentation
### Task DOC.1: Technical Documentation
- [ ] Document card game API
- [ ] Create architecture diagrams
- [ ] Document database schemas
- [ ] Create deployment guides

### Task DOC.2: Player Documentation
- [ ] Create card game rules
- [ ] Write strategy guides
- [ ] Create tutorial content
- [ ] Add in-game help system

## Migration Notes
- Preserve existing card and deck data during transition
- Maintain backward compatibility with existing player collections
- Gradually phase out combat system references
- Ensure smooth transition for active players

## Success Criteria
- Complete removal of old combat system
- Fully functional card-based encounter system
- Smooth multiplayer card game sessions
- Balanced and engaging gameplay
- Comprehensive testing coverage
- Complete documentation
