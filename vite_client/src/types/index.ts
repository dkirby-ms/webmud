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

export interface Card {
  _id: string;
  name: string;
  description: string;
  type: 'spell' | 'item' | 'ability' | 'enhancement';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  manaCost?: number;
  damage?: number;
  healing?: number;
  duration?: number;
  cooldown?: number;
  imageUrl?: string;
  effects?: CardEffect[];
  requirements?: {
    level?: number;
    species?: string[];
    attributes?: Record<string, number>;
  };
}

export interface CardEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'utility';
  value?: number;
  target: 'self' | 'enemy' | 'ally' | 'all';
  attribute?: string;
  duration?: number;
}

export interface PlayerDeck {
  _id: string;
  playerId: string;
  name: string;
  cards: DeckCard[];
  isActive: boolean;
  maxSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeckCard {
  cardId: string;
  card?: Card; // Populated card data
  quantity: number;
  position?: number;
}

export interface CardCollection {
  _id: string;
  playerId: string;
  cards: CollectionCard[];
  updatedAt: Date;
}

export interface CollectionCard {
  cardId: string;
  card?: Card; // Populated card data
  quantity: number;
  acquiredAt: Date;
}
