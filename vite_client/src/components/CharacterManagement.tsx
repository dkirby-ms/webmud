import React, { useState } from 'react';
import { CharacterList } from './CharacterList';
import { CreateCharacterForm } from './CreateCharacterForm';
import type { PlayerCharacter } from '../types';

interface CharacterManagementProps {
  onGameConnect?: (character: PlayerCharacter) => void;
}

export const CharacterManagement: React.FC<CharacterManagementProps> = ({
  onGameConnect,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCharacterCreated = () => {
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1); // Force refresh of character list
  };

  const handleCharacterDeleted = () => {
    setSelectedCharacterId(undefined); // Clear selection
    setRefreshKey(prev => prev + 1); // Force refresh of character list
  };

  const handleCharacterSelect = (character: PlayerCharacter) => {
    setSelectedCharacterId(character._id);
  };

  const handleConnect = (character: PlayerCharacter) => {
    if (onGameConnect) {
      onGameConnect(character);
    } else {
      // TODO: Default connection behavior
      console.log('Connecting to game with character:', character.name);
    }
  };

  if (showCreateForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <CreateCharacterForm
          onSuccess={handleCharacterCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Character Management
        </h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Character
        </button>
      </div>

      <CharacterList
        key={refreshKey} // Force re-render when character is created
        onCharacterSelect={handleCharacterSelect}
        onConnect={handleConnect}
        selectedCharacterId={selectedCharacterId}
        onCharacterDeleted={handleCharacterDeleted}
      />
    </div>
  );
};
