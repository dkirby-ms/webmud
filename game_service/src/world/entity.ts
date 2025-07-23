// import { isConstructorDeclaration } from "typescript";

// Baseline data interface - represents static/persistent entity properties
export interface BaseEntityData {
    id?: string;
    name: string;
    description: string;
    baseInventory: string[];
    baseEquipped: string[];
    startingRoom: string;
    baseHealth: number;
    maxHealth: number;
    defaultLocation: string;
    defaultMovementType: string;
    availableMovementTypes: string[];
    type: string; // e.g., "player", "npc", "item", etc.
    form: string; // e.g., "humanoid", "beast", "undead", etc.
    size: string; // e.g., "xsmall", "small", "medium", "large", "xlarge"
    // Other baseline properties that don't change frequently
}

// Runtime state interface - only contains dynamic state that changes during gameplay
export interface EntityState {
    currentRoom: string;
    currentHealth: number;
    currentInventory: string[];
    currentEquipped: string[];
    currentLocation: string;
    currentMovementType: string;
    
    // Map-related data
    visitedRooms?: Set<string>;
    mapData?: {
        rooms: Record<string, {
            id: string;
            name: string;
            exits: Record<string, string>;
        }>;
    };

    // Player-specific runtime state
    roomDescription?: string;
    roomExits?: string[];
    roomItems?: string[];
    roomEntityStates?: EntityState[]; // state of entities in the room other than the player
    roomEffects?: string[]; // Effects or conditions in the room
    gameMessages?: string[];
    
    // Track temporary effects/modifiers that affect the entity
    activeEffects?: Array<{
        name: string;
        duration: number;
        modifiers: Record<string, any>;
    }>;

    // Updated to include complete entity data
    roomEntityViews?: EntityClientView[]; // complete entity data for client rendering
}

// Client-side view of an entity - combines essential data from both BaseEntityData and EntityState
export interface EntityClientView {
    // Core identity
    id: string;
    name: string;
    description: string;
    type: string; // player, npc, item, etc.
    form: string;
    size: string;
    
    // Health and status
    currentHealth: number;
    maxHealth: number;
    
    // Equipment and inventory
    inventory: string[];
    equipped: string[];
    
    // Position and movement
    currentRoom: string;
    currentLocation: string;
    currentMovementType: string;
    availableMovementTypes: string[];
    
    // Visual indicators
    activeEffects: Array<{
        name: string;
        duration: number;
        modifiers: Record<string, any>;
    }>;

    // Room context information
    roomDescription?: string;
    roomExits?: any[]; // Using any to match the structure in the original code
    roomItems?: string[];
    gameMessages?: string[];
    roomEffects?: string[];
    roomEntityViews?: EntityClientView[]; // Add explicit type for room entities
    
    // Map data - only include what's needed for client rendering
    visitedRooms?: string[];
    mapData?: {
        rooms: Record<string, {
            id: string;
            name: string;
            exits: Record<string, string>;
        }>;
    };
}

export interface Entity {
    id?: string;
    dbRecord: Object;
    pkid: string;
    userId?: string;
    type: string; // e.g., "player", "npc", etc.
    lastUpdate: number;
    baseData: BaseEntityData; // Static/persistent data
    state: EntityState;      // Dynamic/runtime data
    
    // Methods
    updateState(partialState: Partial<EntityState>): void;
    getMovementTypeDescription(): string;
    setMovementType(movementType: string): boolean;
    canUseMovementType(movementType: string): boolean;
    
    // New methods for getting effective values (baseline + modifiers)
    getCurrentHealth(): number;
    getMaxHealth(): number;
    getName(): string;
    getDescription(): string;
    
    // New method to generate a client view of this entity
    toClientView(): EntityClientView;
}

// Abstract base class that implements the Entity interface
export abstract class BaseEntity implements Entity {
    id?: string;
    dbRecord: Object;
    pkid: string;
    userId?: string;
    type: string;
    lastUpdate: number;
    baseData: BaseEntityData;
    state: EntityState;

    constructor(dbRecord: any) {
        this.dbRecord = dbRecord;
        this.pkid = dbRecord._id?.toString() || dbRecord.entity_pk || '';
        this.type = dbRecord.entity_type || '';
        this.lastUpdate = Date.now();
        this.userId = dbRecord.userId;
        
        // Extract base data from DB record
        this.baseData = this.extractBaseData(dbRecord);
        
        // Initialize runtime state based on base data
        this.state = this.initializeState(this.baseData);
    }

    protected extractBaseData(dbRecord: any): BaseEntityData {
        // For mob entities, try to get a proper name
        let name = dbRecord.name || 'Unknown';
        if (dbRecord.entity_type === 'mob' && (!dbRecord.name || dbRecord.name === 'Unknown')) {
            // Try to derive name from mob_id or entity_pk if available
            if (dbRecord.mob_id) {
                name = `Mob ${dbRecord.mob_id}`;
            } else if (dbRecord.entity_pk) {
                name = `Entity ${dbRecord.entity_pk.slice(-6)}`; // Use last 6 chars
            } else {
                name = 'Unknown Creature';
            }
        }

        return {
            id: dbRecord._id?.toString() || dbRecord.entity_pk || '',
            name: name,
            description: dbRecord.description || 'No description available',
            baseInventory: dbRecord.inventory || [],
            baseEquipped: dbRecord.equipped || [],
            startingRoom: dbRecord.startingRoom || dbRecord.room_id || '',
            baseHealth: dbRecord.health || dbRecord.state?.health || 100,
            maxHealth: dbRecord.maxHealth || dbRecord.state?.health || 100,
            defaultLocation: dbRecord.location || dbRecord.room_id || '',
            defaultMovementType: dbRecord.movementType || 'walk',
            availableMovementTypes: dbRecord.movementTypes || ['walk'],
            type: dbRecord.entity_type || '',
            form: dbRecord.form || 'humanoid',
            size: dbRecord.size || dbRecord.state?.size || 'medium'
        };
    }

    protected initializeState(baseData: BaseEntityData): EntityState {
        // Initialize runtime state from base data
        const state: EntityState = {
            currentRoom: baseData.startingRoom,
            currentHealth: baseData.baseHealth,
            currentInventory: [...baseData.baseInventory],
            currentEquipped: [...baseData.baseEquipped],
            currentLocation: baseData.defaultLocation,
            currentMovementType: baseData.defaultMovementType,
            roomDescription: '',
            roomExits: [],
            roomItems: [],
            roomEntityStates: [],
            roomEntityViews: [], // Initialize the new property
            gameMessages: [],
            activeEffects: []
        };

        // If there's saved state in the DB record, merge it
        if (this.dbRecord && (this.dbRecord as any).saved_state) {
            const savedState = (this.dbRecord as any).saved_state;
            for (const [key, value] of Object.entries(savedState)) {
                if (key in state) {
                    (state as any)[key] = value;
                }
            }
        }

        return state;
    }

    // Method to update entity state
    public updateState(partialState: Partial<EntityState>): void {
        this.state = { ...this.state, ...partialState };
        this.lastUpdate = Date.now();
    }

    // Get the current movement type description
    public getMovementTypeDescription(): string {
        return this.state.currentMovementType || this.baseData.defaultMovementType;
    }
    
    // Set the current movement type if it's available to this entity
    public setMovementType(movementType: string): boolean {
        if (this.canUseMovementType(movementType)) {
            this.state.currentMovementType = movementType;
            return true;
        }
        return false;
    }
    
    // Check if entity can use a specific movement type
    public canUseMovementType(movementType: string): boolean {
        return this.baseData.availableMovementTypes.includes(movementType);
    }
    
    // Methods to get effective values (considering active effects)
    public getCurrentHealth(): number {
        // Could apply modifiers from active effects
        return this.state.currentHealth;
    }
    
    public getMaxHealth(): number {
        // Could apply modifiers from active effects
        return this.baseData.maxHealth;
    }
    
    public getName(): string {
        // Could apply effects like invisibility or disguise
        return this.baseData.name;
    }
    
    public getDescription(): string {
        // Could apply effects that alter appearance
        return this.baseData.description;
    }

    // Generate a client-friendly view of this entity
    public toClientView(): EntityClientView {
        return {
            id: this.baseData.id || this.pkid,
            name: this.getName(),
            description: this.getDescription(),
            type: this.type,
            form: this.baseData.form,
            size: this.baseData.size,
            
            currentHealth: this.getCurrentHealth(),
            maxHealth: this.getMaxHealth(),
            
            inventory: [...this.state.currentInventory],
            equipped: [...this.state.currentEquipped],
            
            currentRoom: this.state.currentRoom,
            currentLocation: this.state.currentLocation,
            currentMovementType: this.state.currentMovementType,
            availableMovementTypes: [...this.baseData.availableMovementTypes],
            
            activeEffects: this.state.activeEffects || [],
            
            // Include room context information
            roomDescription: this.state.roomDescription,
            roomExits: this.state.roomExits,
            roomItems: this.state.roomItems,
            gameMessages: this.state.gameMessages,
            roomEffects: this.state.roomEffects,
            roomEntityViews: this.state.roomEntityViews || [], // Include room entity views
            
            // Include simplified map data
            visitedRooms: this.state.visitedRooms ? Array.from(this.state.visitedRooms) : [],
            mapData: this.state.mapData
        };
    }
}

// Player entity class
export class PlayerEntity extends BaseEntity {
    constructor(dbRecord: any) {
        super(dbRecord);
        this.type = 'player';
        
        // Player-specific initialization
        this.baseData.availableMovementTypes = ['walk', 'run', ...this.baseData.availableMovementTypes];
        this.state.currentMovementType = this.baseData.defaultMovementType;
        
        // Additional movement types could be added based on character class or abilities
        // if (dbRecord.class === 'ranger' || dbRecord.skills?.includes('sprint')) {
        //     this.baseData.availableMovementTypes.push('sprint');
        // }
    }

    // Override or add player-specific methods as needed
}

// NPC entity class
export class NPCEntity extends BaseEntity {
    constructor(dbRecord: any) {
        super(dbRecord);
        this.type = 'npc';
        
        // NPC-specific movement initialization
        const npcType = dbRecord.npcType?.toLowerCase();
        switch (npcType) {
            case 'animal':
                if (dbRecord.animalType === 'bird') {
                    this.baseData.availableMovementTypes = ['walk', 'fly'];
                    this.baseData.defaultMovementType = 'fly';
                } else if (dbRecord.animalType === 'snake') {
                    this.baseData.availableMovementTypes = ['slither'];
                    this.baseData.defaultMovementType = 'slither';
                } else {
                    this.baseData.availableMovementTypes = ['walk', 'run'];
                }
                break;
            case 'undead':
                this.baseData.availableMovementTypes = ['shamble'];
                this.baseData.defaultMovementType = 'shamble';
                break;
            case 'spirit':
                this.baseData.availableMovementTypes = ['float'];
                this.baseData.defaultMovementType = 'float';
                break;
        }
        
        this.state.currentMovementType = this.baseData.defaultMovementType;
    }
}

// Item entity class
export class ItemEntity extends BaseEntity {
    constructor(dbRecord: any) {
        super(dbRecord);
        this.type = 'item';
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
            case 'mob':  // Handle both 'npc' and 'mob' types
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

