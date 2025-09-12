import { Router, Request, Response, NextFunction } from 'express';
import { Repositories } from '../db/index.js';
import { validateJwt, logger } from '../util.js';

// Authentication middleware
async function authenticateJwt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = await validateJwt(token);
    
    // Add user info to request for downstream use
    (req as any).user = decoded;
    next();
  } catch (error) {
    logger.error('JWT validation failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}

export function createApiRouter(repositories: Repositories): Router {
  const router = Router();

  // Character Species endpoints (public - no auth required)
  router.get('/characterSpecies', async (req, res) => {
    try {
      const species = await repositories.characterSpeciesRepository.listSpecies();
      res.json(species);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Character Skills endpoints (public - no auth required)
  router.get('/characterSkills', async (req, res) => {
    try {
      const skills = await repositories.characterSkillsRepository.listSkills();
      res.json(skills);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Game Worlds endpoints (public - no auth required)
  router.get('/gameWorlds', async (req, res) => {
    try {
      const worlds = await repositories.worldRepository.listActiveWorlds();
      res.json(worlds);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Player Characters endpoints (require authentication)
  router.get('/playerCharacters/:userId', authenticateJwt, async (req, res): Promise<void> => {
    try {
      const { userId } = req.params;
      const authenticatedUser = (req as any).user;
      
      // Ensure user can only access their own characters
      if (authenticatedUser.sub !== userId && authenticatedUser.oid !== userId) {
        res.status(403).json({ error: 'Access denied: can only access your own characters' });
        return;
      }

      const characters = await repositories.playerCharacterRepository.listCharactersForUserWithDetails(userId);
      res.json(characters);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/playerCharacters', authenticateJwt, async (req, res): Promise<void> => {
    try {
      const characterData = req.body;
      const authenticatedUser = (req as any).user;
      
      // Ensure user can only create characters for themselves
      if (authenticatedUser.sub !== characterData.userId && authenticatedUser.oid !== characterData.userId) {
        res.status(403).json({ error: 'Access denied: can only create characters for yourself' });
        return;
      }

      const result = await repositories.playerCharacterRepository.createCharacter(characterData);
      res.json({ insertedId: result._id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/playerCharacters/:characterId', authenticateJwt, async (req, res): Promise<void> => {
    try {
      const { characterId } = req.params;
      const authenticatedUser = (req as any).user;
      
      // First, get the character to verify ownership
      const character = await repositories.playerCharacterRepository.getCharacterById(characterId);
      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }
      
      // Ensure user can only delete their own characters
      if (authenticatedUser.sub !== character.userId && authenticatedUser.oid !== character.userId) {
        res.status(403).json({ error: 'Access denied: can only delete your own characters' });
        return;
      }

      const success = await repositories.playerCharacterRepository.deleteCharacterById(characterId);
      if (success) {
        res.json({ success: true, message: 'Character deleted successfully' });
      } else {
        res.status(400).json({ error: 'Failed to delete character' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cards endpoints (public - no auth required for browsing)
  router.get('/cards', async (req, res) => {
    try {
      const { type, rarity, minLevel, maxLevel } = req.query;
      const filter: any = {};
      
      if (type) filter.type = type;
      if (rarity) filter.rarity = rarity;
      if (minLevel) filter.minLevel = parseInt(minLevel as string);
      if (maxLevel) filter.maxLevel = parseInt(maxLevel as string);
      
      const cards = await repositories.cardRepository.listCards(filter);
      res.json(cards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/cards/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }
      
      const cards = await repositories.cardRepository.searchCards(q);
      res.json(cards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/cards/:cardId', async (req, res) => {
    try {
      const { cardId } = req.params;
      const card = await repositories.cardRepository.getCard(cardId);
      
      if (!card) {
        res.status(404).json({ error: 'Card not found' });
        return;
      }
      
      res.json(card);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Player Card Collection endpoints (require authentication)
  router.get('/players/:playerId/collection', authenticateJwt, async (req, res): Promise<void> => {
    try {
      const { playerId } = req.params;
      const authenticatedUser = (req as any).user;
      
      // Get the player character to verify ownership
      const character = await repositories.playerCharacterRepository.getCharacterById(playerId);
      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }
      
      // Ensure user can only access their own collection
      if (authenticatedUser.sub !== character.userId && authenticatedUser.oid !== character.userId) {
        res.status(403).json({ error: 'Access denied: can only access your own collection' });
        return;
      }

      const collection = await repositories.cardCollectionRepository.getCollectionWithCards(
        playerId, 
        repositories.cardRepository
      );
      
      if (!collection) {
        // Create empty collection if none exists
        const newCollection = await repositories.cardCollectionRepository.createCollection(playerId);
        res.json(newCollection);
        return;
      }
      
      res.json(collection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Player Decks endpoints (require authentication)
  router.get('/players/:playerId/decks', authenticateJwt, async (req, res): Promise<void> => {
    try {
      const { playerId } = req.params;
      const authenticatedUser = (req as any).user;
      
      // Get the player character to verify ownership
      const character = await repositories.playerCharacterRepository.getCharacterById(playerId);
      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }
      
      // Ensure user can only access their own decks
      if (authenticatedUser.sub !== character.userId && authenticatedUser.oid !== character.userId) {
        res.status(403).json({ error: 'Access denied: can only access your own decks' });
        return;
      }

      const decks = await repositories.deckRepository.getPlayerDecks(playerId);
      res.json(decks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/players/:playerId/decks', authenticateJwt, async (req, res): Promise<void> => {
    try {
      const { playerId } = req.params;
      const { name, maxSize = 30, isActive = false } = req.body;
      const authenticatedUser = (req as any).user;
      
      // Get the player character to verify ownership
      const character = await repositories.playerCharacterRepository.getCharacterById(playerId);
      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }
      
      // Ensure user can only create decks for themselves
      if (authenticatedUser.sub !== character.userId && authenticatedUser.oid !== character.userId) {
        res.status(403).json({ error: 'Access denied: can only create decks for yourself' });
        return;
      }

      if (!name || name.trim().length === 0) {
        res.status(400).json({ error: 'Deck name is required' });
        return;
      }

      const deck = await repositories.deckRepository.createDeck({
        playerId,
        name: name.trim(),
        cards: [],
        isActive,
        maxSize
      });
      
      res.json(deck);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/decks/:deckId', authenticateJwt, async (req, res): Promise<void> => {
    try {
      const { deckId } = req.params;
      const authenticatedUser = (req as any).user;
      
      // Get the deck to verify ownership
      const deck = await repositories.deckRepository.getDeck(deckId);
      if (!deck) {
        res.status(404).json({ error: 'Deck not found' });
        return;
      }
      
      // Get the player character to verify ownership
      const character = await repositories.playerCharacterRepository.getCharacterById(deck.playerId);
      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }
      
      // Ensure user can only access their own decks
      if (authenticatedUser.sub !== character.userId && authenticatedUser.oid !== character.userId) {
        res.status(403).json({ error: 'Access denied: can only access your own decks' });
        return;
      }

      const deckWithCards = await repositories.deckRepository.getDeckWithCards(deckId, repositories.cardRepository);
      res.json(deckWithCards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/decks/:deckId/cards', authenticateJwt, async (req, res): Promise<void> => {
    try {
      const { deckId } = req.params;
      const { cardId, quantity = 1 } = req.body;
      const authenticatedUser = (req as any).user;
      
      // Get the deck to verify ownership
      const deck = await repositories.deckRepository.getDeck(deckId);
      if (!deck) {
        res.status(404).json({ error: 'Deck not found' });
        return;
      }
      
      // Get the player character to verify ownership
      const character = await repositories.playerCharacterRepository.getCharacterById(deck.playerId);
      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }
      
      // Ensure user can only modify their own decks
      if (authenticatedUser.sub !== character.userId && authenticatedUser.oid !== character.userId) {
        res.status(403).json({ error: 'Access denied: can only modify your own decks' });
        return;
      }

      // Verify card exists
      const card = await repositories.cardRepository.getCard(cardId);
      if (!card) {
        res.status(404).json({ error: 'Card not found' });
        return;
      }

      // Verify player has the card in their collection
      const hasCard = await repositories.cardCollectionRepository.hasCard(deck.playerId, cardId, quantity);
      if (!hasCard) {
        res.status(400).json({ error: 'Insufficient cards in collection' });
        return;
      }

      const success = await repositories.deckRepository.addCardToDeck(deckId, cardId, quantity);
      
      if (success) {
        res.json({ success: true, message: 'Card added to deck' });
      } else {
        res.status(400).json({ error: 'Failed to add card to deck' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}