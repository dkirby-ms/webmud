import React from 'react';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';
import { CharacterSpeciesCard } from './CharacterSpeciesCard';

interface SpeciesSelectorProps {
  onSelect: (speciesId: string) => void;
  selectedSpecies?: string;
}

export const SpeciesSelector: React.FC<SpeciesSelectorProps> = ({
  onSelect,
  selectedSpecies,
}) => {
  const { useCharacterSpecies } = useAuthenticatedApi();
  const { data: species, loading, error } = useCharacterSpecies();

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-gray-600 dark:text-gray-300">Loading species...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!species || species.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-gray-600 dark:text-gray-300">No species available</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Species</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {species.map((speciesItem) => (
          <CharacterSpeciesCard
            key={speciesItem._id}
            species={speciesItem}
            isSelected={selectedSpecies === speciesItem._id}
            onClick={() => onSelect(speciesItem._id)}
          />
        ))}
      </div>
    </div>
  );
};
