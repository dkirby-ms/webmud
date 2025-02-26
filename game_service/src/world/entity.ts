export interface EntityState {
    room: string;
    roomDescription: string;
    health: number;
    maxHealth: number;
}

export interface Entity {
    id?: string;
    dbRecord: Object;
    pkid: string;
    type: string; // e.g., "player", "npc", etc.
    lastUpdate: number;
    location: string; // room id
    state?: EntityState; // for players or NPCs that need additional state data
}