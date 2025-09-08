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

  return router;
}