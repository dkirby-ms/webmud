import { Db, Collection, WithId, Document } from "mongodb";

export interface CollectionCard {
  cardId: string;
  quantity: number;
  acquiredAt: Date;
}

export interface CardCollection {
  _id?: string;
  playerId: string;
  cards: CollectionCard[];
  updatedAt: Date;
}

export class CardCollectionRepository {
  private collections: Collection;

  constructor(db: Db) {
    this.collections = db.collection("cardCollections");
  }

  // Helper method to convert string to ObjectId if possible
  // private toObjectIdOrString(id: string): ObjectId | string {
  //   try {
  //     return new ObjectId(id);
  //   } catch {
  //     return id;
  //   }
  // }

  // Get a player's card collection
  async getPlayerCollection(playerId: string): Promise<WithId<Document> | null> {
    return await this.collections.findOne({ playerId });
  }

  // Create a new collection for a player
  async createCollection(playerId: string): Promise<WithId<Document>> {
    const now = new Date();
    const collection = {
      playerId,
      cards: [],
      updatedAt: now
    };
    
    const result = await this.collections.insertOne(collection);
    return await this.collections.findOne({ _id: result.insertedId }) as WithId<Document>;
  }

  // Add cards to a player's collection
  async addCardToCollection(playerId: string, cardId: string, quantity: number = 1): Promise<boolean> {
    let collection = await this.getPlayerCollection(playerId);
    
    // Create collection if it doesn't exist
    if (!collection) {
      collection = await this.createCollection(playerId);
    }

    const existingCardIndex = collection.cards.findIndex((c: CollectionCard) => c.cardId === cardId);
    
    if (existingCardIndex >= 0) {
      // Update existing card quantity
      const result = await this.collections.updateOne(
        { playerId },
        { 
          $set: { 
            [`cards.${existingCardIndex}.quantity`]: collection.cards[existingCardIndex].quantity + quantity,
            updatedAt: new Date()
          } 
        }
      );
      return result.matchedCount > 0;
    } else {
      // Add new card to collection
      const newCard: CollectionCard = {
        cardId,
        quantity,
        acquiredAt: new Date()
      };
      
      const result = await this.collections.updateOne(
        { playerId },
        { 
          $push: { cards: newCard } as any,
          $set: { updatedAt: new Date() }
        }
      );
      return result.matchedCount > 0;
    }
  }

  // Remove cards from a player's collection
  async removeCardFromCollection(playerId: string, cardId: string, quantity: number = 1): Promise<boolean> {
    const collection = await this.getPlayerCollection(playerId);
    if (!collection) return false;

    const existingCardIndex = collection.cards.findIndex((c: CollectionCard) => c.cardId === cardId);
    
    if (existingCardIndex >= 0) {
      const currentQuantity = collection.cards[existingCardIndex].quantity;
      
      if (currentQuantity <= quantity) {
        // Remove card entirely
        const result = await this.collections.updateOne(
          { playerId },
          { 
            $pull: { cards: { cardId } } as any,
            $set: { updatedAt: new Date() }
          }
        );
        return result.matchedCount > 0;
      } else {
        // Reduce quantity
        const result = await this.collections.updateOne(
          { playerId },
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

  // Get collection with populated card data
  async getCollectionWithCards(playerId: string, cardRepository: any): Promise<WithId<Document> | null> {
    const collection = await this.getPlayerCollection(playerId);
    if (!collection) return null;

    // Get unique card IDs
    const cardIds = [...new Set(collection.cards.map((c: CollectionCard) => c.cardId))];
    
    // Get card data
    const cards = await cardRepository.getCards(cardIds);
    
    // Map card data to collection cards
    const cardsMap = new Map(cards.map((card: any) => [card._id.toString(), card]));
    
    const populatedCards = collection.cards.map((collectionCard: CollectionCard) => ({
      ...collectionCard,
      card: cardsMap.get(collectionCard.cardId)
    }));

    return {
      ...collection,
      cards: populatedCards
    };
  }

  // Check if player has enough of a card
  async hasCard(playerId: string, cardId: string, requiredQuantity: number = 1): Promise<boolean> {
    const collection = await this.getPlayerCollection(playerId);
    if (!collection) return false;

    const card = collection.cards.find((c: CollectionCard) => c.cardId === cardId);
    return card ? card.quantity >= requiredQuantity : false;
  }

  // Get total number of unique cards in collection
  async getCollectionStats(playerId: string): Promise<{
    totalUniqueCards: number;
    totalCards: number;
    cardsByRarity: Record<string, number>;
    cardsByType: Record<string, number>;
  }> {
    const collection = await this.getPlayerCollection(playerId);
    if (!collection) {
      return {
        totalUniqueCards: 0,
        totalCards: 0,
        cardsByRarity: {},
        cardsByType: {}
      };
    }

    const totalUniqueCards = collection.cards.length;
    const totalCards = collection.cards.reduce((sum: number, card: CollectionCard) => sum + card.quantity, 0);

    // For rarity and type stats, we'd need to join with the cards collection
    // This is a simplified version
    return {
      totalUniqueCards,
      totalCards,
      cardsByRarity: {},
      cardsByType: {}
    };
  }
}
