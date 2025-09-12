import { Db, Collection, WithId, Document, ObjectId } from "mongodb";

export interface Card {
  _id?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CardEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'utility';
  value?: number;
  target: 'self' | 'enemy' | 'ally' | 'all';
  attribute?: string;
  duration?: number;
}

export class CardRepository {
  private cards: Collection;

  constructor(db: Db) {
    this.cards = db.collection("cards");
  }

  // Helper method to convert string to ObjectId if possible
  private toObjectIdOrString(id: string): ObjectId | string {
    try {
      return new ObjectId(id);
    } catch {
      return id;
    }
  }

  // Get a single card by ID
  async getCard(cardId: string): Promise<WithId<Document> | null> {
    const id = this.toObjectIdOrString(cardId);
    return await this.cards.findOne({ _id: id } as any);
  }

  // Get multiple cards by IDs
  async getCards(cardIds: string[]): Promise<WithId<Document>[]> {
    const ids = cardIds.map(id => this.toObjectIdOrString(id));
    return await this.cards.find({ _id: { $in: ids } } as any).toArray();
  }

  // List all cards with optional filtering
  async listCards(filter: {
    type?: string;
    rarity?: string;
    minLevel?: number;
    maxLevel?: number;
  } = {}): Promise<WithId<Document>[]> {
    const query: any = {};
    
    if (filter.type) {
      query.type = filter.type;
    }
    
    if (filter.rarity) {
      query.rarity = filter.rarity;
    }
    
    if (filter.minLevel !== undefined || filter.maxLevel !== undefined) {
      query['requirements.level'] = {};
      if (filter.minLevel !== undefined) {
        query['requirements.level'].$gte = filter.minLevel;
      }
      if (filter.maxLevel !== undefined) {
        query['requirements.level'].$lte = filter.maxLevel;
      }
    }

    return await this.cards.find(query).sort({ name: 1 }).toArray();
  }

  // Create a new card
  async createCard(card: Omit<Card, '_id' | 'createdAt' | 'updatedAt'>): Promise<WithId<Document>> {
    const now = new Date();
    const cardWithTimestamps = {
      ...card,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await this.cards.insertOne(cardWithTimestamps);
    return await this.cards.findOne({ _id: result.insertedId }) as WithId<Document>;
  }

  // Update an existing card
  async updateCard(cardId: string, update: Partial<Omit<Card, '_id' | 'createdAt'>>): Promise<boolean> {
    const updateWithTimestamp = {
      ...update,
      updatedAt: new Date()
    };
    
    const id = this.toObjectIdOrString(cardId);
    const result = await this.cards.updateOne(
      { _id: id } as any,
      { $set: updateWithTimestamp }
    );
    
    return result.matchedCount > 0;
  }

  // Delete a card
  async deleteCard(cardId: string): Promise<boolean> {
    const id = this.toObjectIdOrString(cardId);
    const result = await this.cards.deleteOne({ _id: id } as any);
    return result.deletedCount > 0;
  }

  // Search cards by name or description
  async searchCards(query: string): Promise<WithId<Document>[]> {
    const searchRegex = new RegExp(query, 'i');
    return await this.cards.find({
      $or: [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ]
    }).sort({ name: 1 }).toArray();
  }
}
