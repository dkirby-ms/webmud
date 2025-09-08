import React from 'react';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';

interface WorldSelectorProps {
  onSelect: (worldId: string) => void;
  selectedWorld?: string;
}

export const WorldSelector: React.FC<WorldSelectorProps> = ({
  onSelect,
  selectedWorld,
}) => {
  const { useGameWorlds } = useAuthenticatedApi();
  const { data: worlds, loading, error } = useGameWorlds();

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="text-gray-600 dark:text-gray-300">Loading worlds...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center p-4">
        <div className="text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!worlds || worlds.length === 0) {
    return (
      <div className="flex justify-center p-4">
        <div className="text-gray-600 dark:text-gray-300">No worlds available</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose World</h3>
      <select
        value={selectedWorld || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="">Select a world...</option>
        {worlds.map((world) => (
          <option key={world._id} value={world._id}>
            {world.name}
          </option>
        ))}
      </select>
      {selectedWorld && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {worlds.find(w => w._id === selectedWorld)?.description}
          </p>
        </div>
      )}
    </div>
  );
};
