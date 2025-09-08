const GAME_SERVICE_URL = import.meta.env.VITE_GAME_SERVICE_URL || 'http://localhost:28999';

class GameServiceApi {
  private baseUrl: string;
  private getAccessToken?: () => Promise<string | null>;

  private async handleFetch(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add authentication header if token provider is available
    if (this.getAccessToken) {
      const token = await this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Request to ${endpoint} failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  constructor(baseUrl: string = GAME_SERVICE_URL, tokenProvider?: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.getAccessToken = tokenProvider;
  }

  // Method to update the token provider after instantiation
  setTokenProvider(tokenProvider: () => Promise<string | null>) {
    this.getAccessToken = tokenProvider;
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
      body: JSON.stringify(characterData),
    });
  }
}

export const gameServiceApi = new GameServiceApi();

// Function to initialize the API with authentication
export const initializeGameServiceApi = (tokenProvider: () => Promise<string | null>) => {
  gameServiceApi.setTokenProvider(tokenProvider);
};
