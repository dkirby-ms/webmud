import { useAuth } from '../AuthContext';
import { useApi } from './useApi';
import { gameServiceApi } from '../lib/gameServiceApi';
import type { PlayerCharacter, CharacterSpecies, GameWorld } from '../types';

export function useAuthenticatedApi() {
  const { user, isAuthenticated } = useAuth();

  // Character-related hooks
  const usePlayerCharacters = () => {
    return useApi<PlayerCharacter[]>(
      () => {
        if (!user?.localAccountId || !isAuthenticated) {
          return Promise.resolve([]);
        }
        return gameServiceApi.fetchPlayerCharacters(user.localAccountId);
      },
      [user?.localAccountId, isAuthenticated]
    );
  };

  const useCharacterSpecies = () => {
    return useApi<CharacterSpecies[]>(
      () => gameServiceApi.fetchCharacterSpecies(),
      []
    );
  };

  const useGameWorlds = () => {
    return useApi<GameWorld[]>(
      () => gameServiceApi.fetchGameWorlds(),
      []
    );
  };

  const createCharacter = async (characterData: any) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to create character');
    }
    
    return gameServiceApi.createPlayerCharacter({
      ...characterData,
      userId: user.localAccountId,
    });
  };

  const deleteCharacter = async (characterId: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to delete character');
    }
    
    return gameServiceApi.deletePlayerCharacter(characterId);
  };

  return {
    usePlayerCharacters,
    useCharacterSpecies,
    useGameWorlds,
    createCharacter,
    deleteCharacter,
    isAuthenticated,
    user,
  };
}
