const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL || 'http://localhost:28999';

class GameServiceApi {
  private baseUrl: string;

  constructor(baseUrl: string = GAME_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  async fetchCharacterSpecies() {
    const response = await fetch(`${this.baseUrl}/api/characterSpecies`);
    if (!response.ok) {
      throw new Error(`Failed to fetch character species: ${response.statusText}`);
    }
    return response.json();
  }

  async fetchCharacterSkills() {
    const response = await fetch(`${this.baseUrl}/api/characterSkills`);
    if (!response.ok) {
      throw new Error(`Failed to fetch character skills: ${response.statusText}`);
    }
    return response.json();
  }

  async fetchGameWorlds() {
    const response = await fetch(`${this.baseUrl}/api/gameWorlds`);
    if (!response.ok) {
      throw new Error(`Failed to fetch game worlds: ${response.statusText}`);
    }
    return response.json();
  }

  async fetchPlayerCharacters(userId: string) {
    const response = await fetch(`${this.baseUrl}/api/playerCharacters/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch player characters: ${response.statusText}`);
    }
    return response.json();
  }

  async createPlayerCharacter(characterData: any) {
    const response = await fetch(`${this.baseUrl}/api/playerCharacters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(characterData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create player character: ${response.statusText}`);
    }
    return response.json();
  }
}

export const gameServiceApi = new GameServiceApi();
