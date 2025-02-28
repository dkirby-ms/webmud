export interface EntityState {
    room: string;
    roomDescription: string;
    health: number;
    maxHealth: number;
    location: string;
    gameMessages?: string[];
}

export interface Entity {
    id?: string;
    dbRecord: Object;
    pkid: string;
    userId?: string;
    type: string; // e.g., "player", "npc", etc.
    lastUpdate: number;
    state?: EntityState; // for players or NPCs that need additional state data
}