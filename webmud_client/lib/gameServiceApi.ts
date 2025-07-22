const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL || 'http://localhost:28999';

class GameServiceApi {
  private baseUrl: string;

  private async handleFetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`Request to ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  }

  constructor(baseUrl: string = GAME_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  async fetchCharacterSpecies() {
    return this.handleFetch('/api/characterSpecies');
  }

  async fetchCharacterSkills() {
    return this.handleFetch('/api/characterSkills');
  }

  async fetchGameWorlds() {
    return this.handleFetch('/api/gameWorlds');
  }

  async fetchPlayerCharacters(userId: string) {
    return this.handleFetch(`/api/playerCharacters/${userId}`);
  }

  async createPlayerCharacter(characterData: any) {
    return this.handleFetch('/api/playerCharacters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(characterData),
    });
  }
}

export const gameServiceApi = new GameServiceApi();
