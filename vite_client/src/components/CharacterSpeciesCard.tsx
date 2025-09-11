import React from 'react';
import type { CharacterSpecies } from '../types';

interface CharacterSpeciesCardProps {
  species: CharacterSpecies;
  isSelected?: boolean;
  onClick?: () => void;
}

export const CharacterSpeciesCard: React.FC<CharacterSpeciesCardProps> = ({
  species,
  isSelected = false,
  onClick,
}) => {
  const baseClasses = "p-4 border rounded-lg cursor-pointer transition-colors";
  const selectedClasses = isSelected 
    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500";

  return (
    <div
      className={`${baseClasses} ${selectedClasses}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {species.imageUrl && (
          <img
            src={species.imageUrl}
            alt={species.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {species.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {species.description}
          </p>
        </div>
      </div>
    </div>
  );
};
