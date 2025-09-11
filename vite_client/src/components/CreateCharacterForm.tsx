import React, { useState } from 'react';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';
import { SpeciesSelector } from './SpeciesSelector';
import { WorldSelector } from './WorldSelector';

interface CreateCharacterFormProps {
  onSuccess?: (character: any) => void;
  onCancel?: () => void;
}

export const CreateCharacterForm: React.FC<CreateCharacterFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { createCharacter, user } = useAuthenticatedApi();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [world, setWorld] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validateName = (name: string): string | null => {
    if (!name || name.length < 3 || name.length > 20) {
      return 'Name must be between 3 and 20 characters.';
    }
    if (!name.match(/^[A-Za-z]+$/)) {
      return 'Name must contain only letters and no spaces.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a character.');
      return;
    }

    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }

    if (!species || !world) {
      setError('Please select both a species and a world.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const characterData = {
        species,
        name,
        worldId: world,
        level: 1,
        createdAt: new Date(),
        saved_state: {
          location: 'room-002',
          health: 100,
          max_health: 100,
        },
      };

      const result = await createCharacter(characterData);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Reset form
      setName('');
      setSpecies('');
      setWorld('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Create New Character
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Character Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Character Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter character name..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={isSubmitting}
          />
        </div>

        {/* Species Selection */}
        <SpeciesSelector
          onSelect={setSpecies}
          selectedSpecies={species}
        />

        {/* World Selection */}
        <WorldSelector
          onSelect={setWorld}
          selectedWorld={world}
        />

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !name || !species || !world}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Character'}
          </button>
        </div>
      </form>
    </div>
  );
};
