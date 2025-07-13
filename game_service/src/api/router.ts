import { Router } from 'express';
import { Repositories } from '../db/index.js';

export function createApiRouter(repositories: Repositories): Router {
  const router = Router();

  // Character Species endpoints
  router.get('/characterSpecies', async (req, res) => {
    try {
      const species = await repositories.characterSpeciesRepository.listSpecies();
      res.json(species);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Character Skills endpoints
  router.get('/characterSkills', async (req, res) => {
    try {
      const skills = await repositories.characterSkillsRepository.listSkills();
      res.json(skills);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Game Worlds endpoints
  router.get('/gameWorlds', async (req, res) => {
    try {
      const worlds = await repositories.worldRepository.listActiveWorlds();
      res.json(worlds);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Player Characters endpoints
  router.get('/playerCharacters/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const characters = await repositories.playerCharacterRepository.listCharactersForUserWithDetails(userId);
      res.json(characters);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/playerCharacters', async (req, res) => {
    try {
      const characterData = req.body;
      const result = await repositories.playerCharacterRepository.createCharacter(characterData);
      res.json({ insertedId: result._id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}