export interface CharacterSpecies {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface GameWorld {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  url?: string;
}

export interface PlayerCharacter {
  _id: string;
  name: string;
  species: string;
  speciesName: string;
  worldId: string;
  worldName: string;
  worldUrl: string;
  userId: string;
  level: number;
  playerLevel: number;
  createdAt: Date;
  saved_state: {
    location: string;
    health: number;
    max_health: number;
  };
}

export interface CharacterCreationData {
  species: string;
  name: string;
  worldId: string;
  userId: string;
  level: number;
  createdAt: Date;
  saved_state: {
    location: string;
    health: number;
    max_health: number;
  };
}

export interface User {
  localAccountId: string;
  username: string;
  name: string;
}
