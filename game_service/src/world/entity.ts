export interface EntityState {
    name: string;
    description: string;
    inventory: string[];
    equipped: string[];
    room: string;
    roomDescription: string;
    roomExits: string[];
    roomItems: string[];
    roomEntities: string[];
    health: number;
    maxHealth: number;
    location: string;
    gameMessages?: string[];
    movementType?: string; // Default movement type for this entity
    movementTypes?: string[]; // Movement types this entity can use
    currentMovementType?: string; // Currently active movement type
}

export interface Entity {
    id?: string;
    dbRecord: Object;
    pkid: string;
    userId?: string;
    type: string; // e.g., "player", "npc", etc.
    lastUpdate: number;
    state?: EntityState; // for players or NPCs that need additional state data
    updateState(partialState: Partial<EntityState>): void;
    getMovementTypeDescription(): string;
    setMovementType(movementType: string): boolean;
    canUseMovementType(movementType: string): boolean;
}

// Abstract base class that implements the Entity interface
export abstract class BaseEntity implements Entity {
    id?: string;
    dbRecord: Object;
    pkid: string;
    userId?: string;
    type: string;
    lastUpdate: number;
    state?: EntityState;

    constructor(dbRecord: any) {
        this.dbRecord = dbRecord;
        this.pkid = dbRecord._id?.toString() || dbRecord.entity_pk || '';
        this.type = dbRecord.entity_type || '';
        this.lastUpdate = Date.now();
        this.userId = dbRecord.userId;
        
        // Initialize with default state if none provided
        this.state = this.createDefaultState(dbRecord);
    }

    protected createDefaultState(dbRecord: any): EntityState {
        const state: EntityState = {
            name: dbRecord.name || 'Unknown',
            description: dbRecord.description || 'No description available',
            inventory: dbRecord.inventory || [],
            equipped: dbRecord.equipped || [],
            room: '',
            roomDescription: '',
            roomExits: [],
            roomItems: [],
            roomEntities: [],
            health: dbRecord.health || 100,
            maxHealth: dbRecord.maxHealth || 100,
            location: dbRecord.location || '',
            gameMessages: [],
            movementType: 'walk', // Default movement type
            movementTypes: ['walk'], // Default available movement types
            currentMovementType: 'walk', // Currently using this movement type
        };

        // If there's a saved state in the DB record, merge it
        if (dbRecord.saved_state) {
            for (const [key, value] of Object.entries(dbRecord.saved_state)) {
                if (key in state) {
                    (state as any)[key] = value;
                }
            }
        }

        return state;
    }

    // Method to update entity state
    public updateState(partialState: Partial<EntityState>): void {
        if (this.state) {
            this.state = { ...this.state, ...partialState };
        }
        this.lastUpdate = Date.now();
    }

    // Get the current movement type description
    public getMovementTypeDescription(): string {
        if (!this.state) return 'move';
        
        return this.state.currentMovementType || this.state.movementType || 'move';
    }
    
    // Set the current movement type if it's available to this entity
    public setMovementType(movementType: string): boolean {
        if (!this.state || !this.state.movementTypes) return false;
        
        if (this.state.movementTypes.includes(movementType)) {
            this.state.currentMovementType = movementType;
            return true;
        }
        return false;
    }
    
    // Check if entity can use a specific movement type
    public canUseMovementType(movementType: string): boolean {
        if (!this.state || !this.state.movementTypes) return false;
        return this.state.movementTypes.includes(movementType);
    }
}

// Player entity class
export class PlayerEntity extends BaseEntity {
    constructor(dbRecord: any) {
        super(dbRecord);
        this.type = 'player';
        
        // Player-specific initialization
        if (this.state) {
            this.state.gameMessages = this.state.gameMessages || [];
            
            // Players can walk and run by default
            this.state.movementTypes = ['walk', 'run'];
            
            // Additional movement types based on character class or abilities could be added here
            if (dbRecord.class === 'ranger' || dbRecord.skills?.includes('sprint')) {
                this.state.movementTypes.push('sprint');
            }
            
            if (dbRecord.race === 'avian' || dbRecord.skills?.includes('fly')) {
                this.state.movementTypes.push('fly');
            }
        }
    }
}

// NPC entity class
export class NPCEntity extends BaseEntity {
    constructor(dbRecord: any) {
        super(dbRecord);
        this.type = 'npc';
        
        // NPC-specific movement initialization
        if (this.state) {
            // Set movement types based on NPC type
            switch (dbRecord.npcType?.toLowerCase()) {
                case 'animal':
                    if (dbRecord.animalType === 'bird') {
                        this.state.movementTypes = ['walk', 'fly'];
                        this.state.movementType = 'fly';
                    } else if (dbRecord.animalType === 'snake') {
                        this.state.movementTypes = ['slither'];
                        this.state.movementType = 'slither';
                    } else {
                        this.state.movementTypes = ['walk', 'run'];
                    }
                    break;
                case 'undead':
                    this.state.movementTypes = ['shamble'];
                    this.state.movementType = 'shamble';
                    break;
                case 'spirit':
                    this.state.movementTypes = ['float'];
                    this.state.movementType = 'float';
                    break;
                default:
                    this.state.movementTypes = ['walk'];
            }
            
            // Set current movement type to default
            this.state.currentMovementType = this.state.movementType;
        }
    }
}

// Item entity class
export class ItemEntity extends BaseEntity {
    constructor(dbRecord: any) {
        super(dbRecord);
        this.type = 'item';
        
        // Item-specific initialization can go here
    }
}

// Factory class for creating entities
export class EntityFactory {
    static createEntity(dbRecord: any): Entity {
        const entityType = dbRecord.entity_type || '';
        
        switch (entityType.toLowerCase()) {
            case 'player':
                return new PlayerEntity(dbRecord);
            case 'npc':
                return new NPCEntity(dbRecord);
            case 'item':
                return new ItemEntity(dbRecord);
            default:
                // For unknown types, return a base entity
                const entity = new class extends BaseEntity {} (dbRecord);
                return entity;
        }
    }
    
    static createPlayerEntity(playerCharacter: any): PlayerEntity {
        return new PlayerEntity(playerCharacter);
    }
    
    static createNPCEntity(npcRecord: any): NPCEntity {
        return new NPCEntity(npcRecord);
    }
    
    static createItemEntity(itemRecord: any): ItemEntity {
        return new ItemEntity(itemRecord);
    }
}

