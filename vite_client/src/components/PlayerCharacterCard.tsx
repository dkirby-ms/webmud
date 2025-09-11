import React from 'react';
import type { PlayerCharacter } from '../types';

interface PlayerCharacterCardProps {
  character: PlayerCharacter;
  isSelected?: boolean;
  onClick?: () => void;
}

export const PlayerCharacterCard: React.FC<PlayerCharacterCardProps> = ({
  character,
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
      <div className="space-y-2">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
          {character.name}
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p>Level {character.playerLevel || character.level} {character.speciesName}</p>
          <p className="text-xs">{character.worldName}</p>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>Health: {character.saved_state?.health || 100}/{character.saved_state?.max_health || 100}</span>
          <span>Created: {new Date(character.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
