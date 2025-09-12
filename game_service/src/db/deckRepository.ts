import { Db, Collection, WithId, Document, ObjectId } from "mongodb";

export interface DeckCard {
  cardId: string;
  quantity: number;
  position?: number;
}

export interface PlayerDeck {
  _id?: string;
  playerId: string;
  name: string;
  cards: DeckCard[];
  isActive: boolean;
  maxSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export class DeckRepository {
  private decks: Collection;

  constructor(db: Db) {
    this.decks = db.collection("playerDecks");
  }

  // Helper method to convert string to ObjectId if possible
  private toObjectIdOrString(id: string): ObjectId | string {
    try {
      return new ObjectId(id);
    } catch {
      return id;
    }
  }

  // Get a single deck by ID
  async getDeck(deckId: string): Promise<WithId<Document> | null> {
    const id = this.toObjectIdOrString(deckId);
    return await this.decks.findOne({ _id: id } as any);
  }

  // Get all decks for a player
  async getPlayerDecks(playerId: string): Promise<WithId<Document>[]> {
    return await this.decks.find({ playerId }).sort({ isActive: -1, updatedAt: -1 }).toArray();
  }

  // Get the active deck for a player
  async getActiveDeck(playerId: string): Promise<WithId<Document> | null> {
    return await this.decks.findOne({ playerId, isActive: true });
  }

  // Create a new deck
  async createDeck(deck: Omit<PlayerDeck, '_id' | 'createdAt' | 'updatedAt'>): Promise<WithId<Document>> {
    const now = new Date();
    const deckWithTimestamps = {
      ...deck,
      createdAt: now,
      updatedAt: now
    };
    
    // If this deck is set as active, make sure other decks for this player are not active
    if (deck.isActive) {
      await this.decks.updateMany(
        { playerId: deck.playerId, isActive: true },
        { $set: { isActive: false, updatedAt: now } }
      );
    }
    
    const result = await this.decks.insertOne(deckWithTimestamps);
    return await this.decks.findOne({ _id: result.insertedId }) as WithId<Document>;
  }

  // Update an existing deck
  async updateDeck(deckId: string, update: Partial<Omit<PlayerDeck, '_id' | 'createdAt' | 'playerId'>>): Promise<boolean> {
    const updateWithTimestamp = {
      ...update,
      updatedAt: new Date()
    };
    
    // If setting this deck as active, deactivate other decks for the same player
    if (update.isActive === true) {
      const deck = await this.getDeck(deckId);
      if (deck) {
        await this.decks.updateMany(
          { playerId: deck.playerId, isActive: true, _id: { $ne: this.toObjectIdOrString(deckId) } } as any,
          { $set: { isActive: false, updatedAt: new Date() } }
        );
      }
    }
    
    const id = this.toObjectIdOrString(deckId);
    const result = await this.decks.updateOne(
      { _id: id } as any,
      { $set: updateWithTimestamp }
    );
    
    return result.matchedCount > 0;
  }

  // Delete a deck
  async deleteDeck(deckId: string): Promise<boolean> {
    const id = this.toObjectIdOrString(deckId);
    const result = await this.decks.deleteOne({ _id: id } as any);
    return result.deletedCount > 0;
  }

  // Add a card to a deck
  async addCardToDeck(deckId: string, cardId: string, quantity: number = 1): Promise<boolean> {
    const deck = await this.getDeck(deckId);
    if (!deck) return false;

    const existingCardIndex = deck.cards.findIndex((c: DeckCard) => c.cardId === cardId);
    
    if (existingCardIndex >= 0) {
      // Update existing card quantity
      const result = await this.decks.updateOne(
        { _id: this.toObjectIdOrString(deckId) } as any,
        { 
          $set: { 
            [`cards.${existingCardIndex}.quantity`]: deck.cards[existingCardIndex].quantity + quantity,
            updatedAt: new Date()
          } 
        }
      );
      return result.matchedCount > 0;
    } else {
      // Add new card to deck
      const newCard: DeckCard = {
        cardId,
        quantity,
        position: deck.cards.length
      };
      
      const result = await this.decks.updateOne(
        { _id: this.toObjectIdOrString(deckId) } as any,
        { 
          $push: { cards: newCard } as any,
          $set: { updatedAt: new Date() }
        }
      );
      return result.matchedCount > 0;
    }
  }

  // Remove a card from a deck
  async removeCardFromDeck(deckId: string, cardId: string, quantity: number = 1): Promise<boolean> {
    const deck = await this.getDeck(deckId);
    if (!deck) return false;

    const existingCardIndex = deck.cards.findIndex((c: DeckCard) => c.cardId === cardId);
    
    if (existingCardIndex >= 0) {
      const currentQuantity = deck.cards[existingCardIndex].quantity;
      
      if (currentQuantity <= quantity) {
        // Remove card entirely
        const result = await this.decks.updateOne(
          { _id: this.toObjectIdOrString(deckId) } as any,
          { 
            $pull: { cards: { cardId } } as any,
            $set: { updatedAt: new Date() }
          }
        );
        return result.matchedCount > 0;
      } else {
        // Reduce quantity
        const result = await this.decks.updateOne(
          { _id: this.toObjectIdOrString(deckId) } as any,
          { 
            $set: { 
              [`cards.${existingCardIndex}.quantity`]: currentQuantity - quantity,
              updatedAt: new Date()
            } 
          }
        );
        return result.matchedCount > 0;
      }
    }
    
    return false;
  }

  // Set deck as active
  async setActiveDeck(deckId: string): Promise<boolean> {
    const deck = await this.getDeck(deckId);
    if (!deck) return false;

    // Deactivate all other decks for this player
    await this.decks.updateMany(
      { playerId: deck.playerId, isActive: true },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    // Activate the selected deck
    const result = await this.decks.updateOne(
      { _id: this.toObjectIdOrString(deckId) } as any,
      { $set: { isActive: true, updatedAt: new Date() } }
    );

    return result.matchedCount > 0;
  }

  // Get deck with populated card data
  async getDeckWithCards(deckId: string, cardRepository: any): Promise<WithId<Document> | null> {
    const deck = await this.getDeck(deckId);
    if (!deck) return null;

    // Get unique card IDs
    const cardIds = [...new Set(deck.cards.map((c: DeckCard) => c.cardId))];
    
    // Get card data
    const cards = await cardRepository.getCards(cardIds);
    
    // Map card data to deck cards
    const cardsMap = new Map(cards.map((card: any) => [card._id.toString(), card]));
    
    const populatedCards = deck.cards.map((deckCard: DeckCard) => ({
      ...deckCard,
      card: cardsMap.get(deckCard.cardId)
    }));

    return {
      ...deck,
      cards: populatedCards
    };
  }
}
