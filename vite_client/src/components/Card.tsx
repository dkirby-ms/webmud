import React from 'react';
import type { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  quantity?: number;
  onClick?: () => void;
  onRemove?: () => void;
  showActions?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  quantity = 1, 
  onClick, 
  onRemove, 
  showActions = false,
  size = 'medium'
}) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-50 dark:bg-gray-700';
      case 'uncommon': return 'border-green-400 bg-green-50 dark:bg-green-900/20';
      case 'rare': return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'epic': return 'border-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'legendary': return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-gray-400 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spell': return '🔮';
      case 'item': return '🧪';
      case 'ability': return '⚡';
      case 'enhancement': return '✨';
      default: return '❓';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'p-2 text-sm';
      case 'large': return 'p-6 text-lg';
      default: return 'p-4';
    }
  };

  return (
    <div
      className={`rounded-lg border-2 ${getRarityColor(card.rarity)} ${getSizeClasses()} 
                 hover:shadow-md transition-all cursor-pointer group relative`}
      onClick={onClick}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={size === 'small' ? 'text-sm' : 'text-lg'}>
            {getTypeIcon(card.type)}
          </span>
          <h4 className={`font-semibold text-gray-900 dark:text-white ${
            size === 'small' ? 'text-sm' : size === 'large' ? 'text-xl' : 'text-base'
          }`}>
            {card.name}
          </h4>
        </div>
        
        {quantity > 1 && (
          <span className={`bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded font-medium ${
            size === 'small' ? 'text-xs' : 'text-sm'
          }`}>
            x{quantity}
          </span>
        )}
      </div>

      {/* Card Description */}
      <p className={`text-gray-600 dark:text-gray-300 mb-3 ${
        size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'
      }`}>
        {card.description}
      </p>

      {/* Card Stats */}
      <div className="flex flex-wrap gap-1 mb-2">
        {card.manaCost && (
          <span className={`bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded ${
            size === 'small' ? 'text-xs' : 'text-xs'
          }`}>
            ⚡ {card.manaCost}
          </span>
        )}
        {card.damage && (
          <span className={`bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded ${
            size === 'small' ? 'text-xs' : 'text-xs'
          }`}>
            ⚔️ {card.damage}
          </span>
        )}
        {card.healing && (
          <span className={`bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded ${
            size === 'small' ? 'text-xs' : 'text-xs'
          }`}>
            ❤️ {card.healing}
          </span>
        )}
        {card.duration && (
          <span className={`bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded ${
            size === 'small' ? 'text-xs' : 'text-xs'
          }`}>
            ⏱️ {card.duration}s
          </span>
        )}
        {card.cooldown && (
          <span className={`bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded ${
            size === 'small' ? 'text-xs' : 'text-xs'
          }`}>
            ⏳ {card.cooldown}s
          </span>
        )}
      </div>

      {/* Card Effects */}
      {card.effects && card.effects.length > 0 && size !== 'small' && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Effects:</div>
          <div className="space-y-1">
            {card.effects.map((effect, index) => (
              <div key={index} className="text-xs text-gray-600 dark:text-gray-300">
                <span className="capitalize font-medium">{effect.type}</span>
                {effect.value && <span> {effect.value}</span>}
                <span className="text-gray-500"> → {effect.target}</span>
                {effect.duration && <span className="text-gray-500"> ({effect.duration}s)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requirements */}
      {card.requirements && size === 'large' && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Requirements:</div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            {card.requirements.level && <div>Level: {card.requirements.level}</div>}
            {card.requirements.species && (
              <div>Species: {card.requirements.species.join(', ')}</div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-opacity"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Rarity indicator */}
      <div className={`absolute top-0 right-0 w-0 h-0 border-l-8 border-b-8 border-l-transparent ${
        card.rarity === 'common' ? 'border-b-gray-400' :
        card.rarity === 'uncommon' ? 'border-b-green-400' :
        card.rarity === 'rare' ? 'border-b-blue-400' :
        card.rarity === 'epic' ? 'border-b-purple-400' :
        card.rarity === 'legendary' ? 'border-b-yellow-400' : 'border-b-gray-400'
      }`}></div>
    </div>
  );
};
