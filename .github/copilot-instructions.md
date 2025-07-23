# webMUD Development Instructions

## Architecture Overview

webMUD is a real-time multiplayer web-based MUD (Multi-User Dungeon) with a modular TypeScript architecture:

- **game_service/**: Express.js + Socket.IO server that runs game world instances (port 28999)
- **webmud_client/**: Next.js client app for player authentication and game connection (port 3000)
- **builder_tools/**: Next.js world-building tools for game designers
- **infra/**: Azure deployment infrastructure using Bicep and Azure Developer CLI

## Key Architectural Patterns

### Service Communication
- Client connects to game_service via Socket.IO for real-time gameplay
- Authentication handled by webmud_client using NextAuth.js with Microsoft Entra ID
- Game state synchronization through `game:state_update` and `game:map_update` events
- Command parsing via `MessageTypes.command.SEND_COMMAND` socket events

### Data Layer Architecture
- MongoDB collections: `worlds`, `rooms`, `entities`, `playerCharacters`, `channels`, `messages`
- Repository pattern in `game_service/src/db/` - always use repositories, never direct MongoDB queries
- Entity Factory pattern in `game_service/src/world/entity.js` for type-safe entity creation
- Room-based spatial organization with 6-directional exits (n, e, s, w, up, down)
- Backend-for-frontend (BFF) pattern for client data access via `webmud_client/app/api/` routes

### World State Management
- `World` class manages game loop at 10 ticks/second in `game_service/src/world/world.ts`
- Player entities maintained in `Map<string, Entity>` for O(1) lookups
- Room entities track spatial relationships and visibility
- Client views generated via `entity.toClientView()` method

## Development Workflows

### Local Development Setup
```bash
# Start MongoDB replica set
docker-compose up mongodb

# Game service
cd game_service && npm install && npm run start

# Client
cd webmud_client && npm install && npm run dev

# Builder tools
cd builder_tools && npm install && npm run dev
```

### Database Seeding
```bash
mongosh game-data/world-assets/playground-1.mongodb.js
mongosh game-data/world-assets/playground-2.mongodb.js
```

### Azure Deployment
```bash
azd up  # Deploys to Azure Container Apps with Cosmos DB
```

## Critical Development Conventions

### Socket Event Naming
- Use `MessageTypes` constants from `game_service/src/taxonomy.ts`
- Game events: `game:state_update`, `game:map_update`, `game:player_join`
- Command events: `MessageTypes.command.SEND_COMMAND`
- Chat events: `chat:sent`, `chat:tell`

### Entity State Updates
```typescript
// Correct: Use updateState method
entity.updateState({ currentLocation: roomId });

// Incorrect: Direct property assignment
entity.state.currentLocation = roomId;
```

### Database Access
```typescript
// Correct: Use repositories
const rooms = await repositories.roomRepository.listRoomsForWorld(worldId);

// Incorrect: Direct MongoDB access
const rooms = await db.collection('rooms').find({}).toArray();
```

### Command Processing Pattern
Commands flow: Socket → `parseCommand()` → Switch statement in `socketHandlers.ts` → World methods

### Client State Management
- Use `GameServiceContext` for socket connection state
- Game state updates via `useGameService()` hook
- Authentication state via NextAuth `useSession()`

## Environment Configuration

### Required Environment Variables
- `MONGODB_URI`: MongoDB connection string (replica set required)
- `MONGODB_NAME`: Database name (default: "game-service")
- `WORLD_NAME`: Game world identifier
- `AUTH_MICROSOFT_ENTRA_ID_*`: Microsoft authentication config

### Port Conventions
- Game service: 28999
- Client: 3000
- Builder tools: 3001 (assumed)
- MongoDB: 27017

## Security Considerations

### Database Access Boundaries
- **webmud_client**: Should NOT directly connect to MongoDB (current violation - needs refactoring)
- **game_service**: Primary database access through repositories
- **builder_tools**: Direct MongoDB access acceptable for world editing

### Authentication Flow
1. Client authenticates via NextAuth.js
2. Socket connection includes `userId` and `playerCharacterId` in auth payload
3. Game service validates player ownership of character
4. Session middleware maintains connection state

## Common Debugging Commands

```bash
# View connected sockets
curl http://localhost:28999/admin/sockets

# Check game service logs
tail -f game_service/server.log

# Check client logs
tail -f webmud_client/server.log

# MongoDB queries
mongosh "mongodb://localhost:27017/?replicaSet=rs0" --eval "use('game-service'); db.worlds.find()"
```

## Integration Points

- **Socket.IO**: Real-time game communication
- **NextAuth.js**: Authentication with Microsoft Entra ID
- **MongoDB**: Primary data store with replica set
- **Azure Container Apps**: Production deployment target
- **Azure Cosmos DB**: Managed MongoDB in production
