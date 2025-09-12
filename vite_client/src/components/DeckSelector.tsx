import React from 'react';
import type { PlayerDeck } from '../types';

interface DeckSelectorProps {
  decks: PlayerDeck[];
  selectedDeck: PlayerDeck | null;
  onSelectDeck: (deck: PlayerDeck) => void;
  onCreateDeck: () => void;
  onDeleteDeck?: (deckId: string) => void;
}

export const DeckSelector: React.FC<DeckSelectorProps> = ({
  decks,
  selectedDeck,
  onSelectDeck,
  onCreateDeck,
  onDeleteDeck
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Decks</h3>
        <button
          onClick={onCreateDeck}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + New Deck
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {decks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No decks created yet</p>
            <button
              onClick={onCreateDeck}
              className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Create your first deck
            </button>
          </div>
        ) : (
          decks.map((deck) => (
            <div
              key={deck._id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                selectedDeck?._id === deck._id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              onClick={() => onSelectDeck(deck)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {deck.name}
                    </h4>
                    {deck.isActive && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>
                      {deck.cards.reduce((sum, card) => sum + card.quantity, 0)} / {deck.maxSize} cards
                    </span>
                    <span>
                      Updated: {new Date(deck.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Deck composition preview */}
                  <div className="flex gap-1 mt-2">
                    {['spell', 'item', 'ability', 'enhancement'].map(type => {
                      const count = deck.cards
                        .filter(card => card.card?.type === type)
                        .reduce((sum, card) => sum + card.quantity, 0);
                      
                      if (count === 0) return null;
                      
                      const icon = type === 'spell' ? '🔮' : 
                                  type === 'item' ? '🧪' : 
                                  type === 'ability' ? '⚡' : '✨';
                      
                      return (
                        <span key={type} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {icon} {count}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {onDeleteDeck && deck._id !== selectedDeck?._id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete deck "${deck.name}"?`)) {
                        onDeleteDeck(deck._id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
