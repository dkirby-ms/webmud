import React, { useState } from 'react';
import { DeckManager } from './DeckManager';
import type { PlayerDeck } from '../types';

interface DeckOverviewProps {
  playerId: string;
  activeDeck?: PlayerDeck | null;
}

export const DeckOverview: React.FC<DeckOverviewProps> = ({ 
  playerId, 
  activeDeck 
}) => {
  const [showDeckManager, setShowDeckManager] = useState(false);

  // Mock active deck for demonstration
  const defaultActiveDeck: PlayerDeck = {
    _id: 'deck-1',
    playerId,
    name: 'Combat Deck',
    isActive: true,
    maxSize: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    cards: [
      {
        cardId: 'card-1',
        quantity: 2,
        position: 0,
        card: {
          _id: 'card-1',
          name: 'Fireball',
          description: 'A blazing sphere of fire that deals damage to enemies.',
          type: 'spell',
          rarity: 'common',
          manaCost: 3,
          damage: 25,
          imageUrl: '/cards/fireball.jpg',
          effects: [{ type: 'damage', value: 25, target: 'enemy' }]
        }
      },
      {
        cardId: 'card-2',
        quantity: 1,
        position: 1,
        card: {
          _id: 'card-2',
          name: 'Healing Potion',
          description: 'Restores health to the user.',
          type: 'item',
          rarity: 'common',
          healing: 20,
          imageUrl: '/cards/healing-potion.jpg',
          effects: [{ type: 'heal', value: 20, target: 'self' }]
        }
      },
      {
        cardId: 'card-3',
        quantity: 1,
        position: 2,
        card: {
          _id: 'card-3',
          name: 'Lightning Strike',
          description: 'A powerful bolt of lightning.',
          type: 'spell',
          rarity: 'rare',
          manaCost: 5,
          damage: 35,
          duration: 2,
          imageUrl: '/cards/lightning-strike.jpg',
          effects: [
            { type: 'damage', value: 35, target: 'enemy' },
            { type: 'debuff', target: 'enemy', duration: 2, attribute: 'stunned' }
          ]
        }
      }
    ]
  };

  const currentDeck = activeDeck || defaultActiveDeck;
  const totalCards = currentDeck.cards.reduce((sum, card) => sum + card.quantity, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spell': return '🔮';
      case 'item': return '🧪';
      case 'ability': return '⚡';
      case 'enhancement': return '✨';
      default: return '❓';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-l-gray-400';
      case 'uncommon': return 'border-l-green-400';
      case 'rare': return 'border-l-blue-400';
      case 'epic': return 'border-l-purple-400';
      case 'legendary': return 'border-l-yellow-400';
      default: return 'border-l-gray-400';
    }
  };

  return (
    <>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-white">Active Deck</h3>
          <button
            onClick={() => setShowDeckManager(true)}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            Manage
          </button>
        </div>

        {currentDeck ? (
          <div className="space-y-3">
            {/* Deck Info */}
            <div className="flex justify-between items-center text-xs text-gray-300">
              <span className="font-medium">{currentDeck.name}</span>
              <span>{totalCards}/{currentDeck.maxSize} cards</span>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-2 text-xs">
              {['spell', 'item', 'ability', 'enhancement'].map(type => {
                const count = currentDeck.cards
                  .filter(card => card.card?.type === type)
                  .reduce((sum, card) => sum + card.quantity, 0);
                
                if (count === 0) return null;
                
                return (
                  <span key={type} className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                    {getTypeIcon(type)} {count}
                  </span>
                );
              })}
            </div>

            {/* Card List */}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {currentDeck.cards
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .slice(0, 8) // Show first 8 cards
                .map((deckCard, index) => (
                  <div
                    key={`${deckCard.cardId}-${index}`}
                    className={`flex items-center justify-between p-2 bg-gray-700 rounded border-l-2 ${
                      getRarityColor(deckCard.card?.rarity || 'common')
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs">{getTypeIcon(deckCard.card?.type || 'item')}</span>
                      <span className="text-xs text-white truncate">{deckCard.card?.name}</span>
                      {deckCard.quantity > 1 && (
                        <span className="text-xs bg-gray-600 px-1 rounded">x{deckCard.quantity}</span>
                      )}
                    </div>
                    
                    <div className="flex gap-1 text-xs">
                      {deckCard.card?.manaCost && (
                        <span className="bg-blue-900 text-blue-200 px-1 rounded">⚡{deckCard.card.manaCost}</span>
                      )}
                      {deckCard.card?.damage && (
                        <span className="bg-red-900 text-red-200 px-1 rounded">⚔️{deckCard.card.damage}</span>
                      )}
                      {deckCard.card?.healing && (
                        <span className="bg-green-900 text-green-200 px-1 rounded">❤️{deckCard.card.healing}</span>
                      )}
                    </div>
                  </div>
                ))}
              
              {currentDeck.cards.length > 8 && (
                <div className="text-center text-xs text-gray-400 py-1">
                  ... and {currentDeck.cards.length - 8} more cards
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-700">
              <button className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
                Use Card
              </button>
              <button className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                Shuffle
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm mb-2">No active deck</p>
            <button
              onClick={() => setShowDeckManager(true)}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              Create Deck
            </button>
          </div>
        )}
      </div>

      {/* Deck Manager Modal */}
      {showDeckManager && (
        <DeckManager
          playerId={playerId}
          onClose={() => setShowDeckManager(false)}
        />
      )}
    </>
  );
};
