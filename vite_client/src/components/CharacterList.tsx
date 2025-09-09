import React, { useState } from 'react';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';
import { PlayerCharacterCard } from './PlayerCharacterCard';
import type { PlayerCharacter } from '../types';

interface CharacterListProps {
  onCharacterSelect?: (character: PlayerCharacter) => void;
  onConnect?: (character: PlayerCharacter) => void;
  selectedCharacterId?: string;
  onCharacterDeleted?: () => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({
  onCharacterSelect,
  onConnect,
  selectedCharacterId,
  onCharacterDeleted,
}) => {
  const { usePlayerCharacters, user, deleteCharacter } = useAuthenticatedApi();
  const { data: characters, loading, error, refetch } = usePlayerCharacters();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedCharacter = characters?.find(char => char._id === selectedCharacterId);

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return;

    setIsDeleting(true);
    try {
      await deleteCharacter(selectedCharacter._id);
      await refetch(); // Refresh the character list
      setShowDeleteConfirm(false);
      // Reset selection if the deleted character was selected
      if (onCharacterSelect) {
        onCharacterSelect({} as PlayerCharacter); // Clear selection
      }
      // Notify parent component
      if (onCharacterDeleted) {
        onCharacterDeleted();
      }
    } catch (error) {
      console.error('Failed to delete character:', error);
      alert('Failed to delete character. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center p-8 text-gray-600 dark:text-gray-300">
        Please log in to view your characters.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-8 text-gray-600 dark:text-gray-300">
        Loading characters...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!characters || characters.length === 0) {
    return (
      <div className="text-center p-8 text-gray-600 dark:text-gray-300">
        No characters found. Create your first character to get started!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Characters
        </h2>
        <button
          onClick={refetch}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((character) => (
          <PlayerCharacterCard
            key={character._id}
            character={character}
            isSelected={selectedCharacterId === character._id}
            onClick={() => onCharacterSelect?.(character)}
          />
        ))}
      </div>

      {selectedCharacter && onConnect && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedCharacter.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Level {selectedCharacter.playerLevel || selectedCharacter.level} {selectedCharacter.speciesName} in {selectedCharacter.worldName}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onConnect(selectedCharacter)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Connect
              </button>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCharacter}
                    disabled={isDeleting}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
          {showDeleteConfirm && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> This will permanently delete "{selectedCharacter.name}" and all associated progress. This action cannot be undone.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
