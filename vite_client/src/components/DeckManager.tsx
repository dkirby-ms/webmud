import React, { useState, useEffect } from 'react';
import type { PlayerDeck, CardCollection } from '../types';

interface DeckManagerProps {
  playerId: string;
  onClose: () => void;
}

export const DeckManager: React.FC<DeckManagerProps> = ({ playerId, onClose }) => {
  const [selectedDeck, setSelectedDeck] = useState<PlayerDeck | null>(null);
  const [collection, setCollection] = useState<CardCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deck' | 'collection'>('deck');

  // Mock data for demonstration - in real app, this would come from API
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      const mockDecks: PlayerDeck[] = [
        {
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
            }
          ]
        }
      ];

      const mockCollection: CardCollection = {
        _id: 'collection-1',
        playerId,
        updatedAt: new Date(),
        cards: [
          {
            cardId: 'card-1',
            quantity: 5,
            acquiredAt: new Date(),
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
            quantity: 3,
            acquiredAt: new Date(),
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
            acquiredAt: new Date(),
            card: {
              _id: 'card-3',
              name: 'Lightning Strike',
              description: 'A powerful bolt of lightning that stuns the target.',
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

      setDecks(mockDecks);
      setSelectedDeck(mockDecks[0]);
      setCollection(mockCollection);
      setLoading(false);
    }, 1000);
  }, [playerId]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-50';
      case 'uncommon': return 'border-green-400 bg-green-50';
      case 'rare': return 'border-blue-400 bg-blue-50';
      case 'epic': return 'border-purple-400 bg-purple-50';
      case 'legendary': return 'border-yellow-400 bg-yellow-50';
      default: return 'border-gray-400 bg-gray-50';
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

  const addCardToDeck = (cardId: string) => {
    if (!selectedDeck) return;

    const existingCard = selectedDeck.cards.find(c => c.cardId === cardId);
    const totalCards = selectedDeck.cards.reduce((sum, card) => sum + card.quantity, 0);

    if (totalCards >= selectedDeck.maxSize) {
      alert('Deck is at maximum capacity!');
      return;
    }

    if (existingCard) {
      existingCard.quantity += 1;
    } else {
      const collectionCard = collection?.cards.find(c => c.cardId === cardId);
      if (collectionCard?.card) {
        selectedDeck.cards.push({
          cardId,
          quantity: 1,
          position: selectedDeck.cards.length,
          card: collectionCard.card
        });
      }
    }

    setSelectedDeck({ ...selectedDeck });
  };

  const removeCardFromDeck = (cardId: string) => {
    if (!selectedDeck) return;

    const cardIndex = selectedDeck.cards.findIndex(c => c.cardId === cardId);
    if (cardIndex === -1) return;

    const card = selectedDeck.cards[cardIndex];
    if (card.quantity > 1) {
      card.quantity -= 1;
    } else {
      selectedDeck.cards.splice(cardIndex, 1);
    }

    setSelectedDeck({ ...selectedDeck });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600 dark:text-gray-300">Loading deck data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Deck Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('deck')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'deck'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}
            >
              Deck Builder
            </button>
            <button
              onClick={() => setActiveTab('collection')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'collection'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}
            >
              Card Collection
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {activeTab === 'deck' ? (
            <>
              {/* Left panel: Deck selection and cards */}
              <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedDeck?.name || 'No Deck Selected'}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedDeck && (
                      <span>
                        {selectedDeck.cards.reduce((sum, card) => sum + card.quantity, 0)} / {selectedDeck.maxSize} cards
                      </span>
                    )}
                  </div>
                </div>

                {selectedDeck && (
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {selectedDeck.cards.map((deckCard, index) => (
                      <div
                        key={`${deckCard.cardId}-${index}`}
                        className={`p-3 rounded-lg border-2 ${getRarityColor(deckCard.card?.rarity || 'common')} 
                                   hover:shadow-md transition-shadow cursor-pointer group`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getTypeIcon(deckCard.card?.type || 'item')}</span>
                              <h4 className="font-semibold text-gray-900">{deckCard.card?.name}</h4>
                              <span className="text-sm bg-gray-200 px-2 py-1 rounded">{deckCard.quantity}x</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{deckCard.card?.description}</p>
                            <div className="flex gap-2 mt-2 text-xs">
                              {deckCard.card?.manaCost && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Mana: {deckCard.card.manaCost}
                                </span>
                              )}
                              {deckCard.card?.damage && (
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                                  Damage: {deckCard.card.damage}
                                </span>
                              )}
                              {deckCard.card?.healing && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Heal: {deckCard.card.healing}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeCardFromDeck(deckCard.cardId)}
                            className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-opacity"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right panel: Available cards */}
              <div className="w-1/2 p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Cards</h3>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {collection?.cards.map((collectionCard, index) => (
                    <div
                      key={`${collectionCard.cardId}-${index}`}
                      className={`p-3 rounded-lg border-2 ${getRarityColor(collectionCard.card?.rarity || 'common')} 
                                 hover:shadow-md transition-shadow cursor-pointer group`}
                      onClick={() => addCardToDeck(collectionCard.cardId)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getTypeIcon(collectionCard.card?.type || 'item')}</span>
                            <h4 className="font-semibold text-gray-900">{collectionCard.card?.name}</h4>
                            <span className="text-sm bg-gray-200 px-2 py-1 rounded">Own: {collectionCard.quantity}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{collectionCard.card?.description}</p>
                          <div className="flex gap-2 mt-2 text-xs">
                            {collectionCard.card?.manaCost && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Mana: {collectionCard.card.manaCost}
                              </span>
                            )}
                            {collectionCard.card?.damage && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                                Damage: {collectionCard.card.damage}
                              </span>
                            )}
                            {collectionCard.card?.healing && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                Heal: {collectionCard.card.healing}
                              </span>
                            )}
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 transition-opacity">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Collection view */
            <div className="w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Card Collection</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {collection?.cards.length || 0} unique cards
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                {collection?.cards.map((collectionCard, index) => (
                  <div
                    key={`${collectionCard.cardId}-${index}`}
                    className={`p-4 rounded-lg border-2 ${getRarityColor(collectionCard.card?.rarity || 'common')} 
                               hover:shadow-lg transition-shadow`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getTypeIcon(collectionCard.card?.type || 'item')}</span>
                      <h4 className="font-semibold text-gray-900">{collectionCard.card?.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{collectionCard.card?.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 text-xs">
                        {collectionCard.card?.manaCost && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Mana: {collectionCard.card.manaCost}
                          </span>
                        )}
                        {collectionCard.card?.damage && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                            Damage: {collectionCard.card.damage}
                          </span>
                        )}
                        {collectionCard.card?.healing && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            Heal: {collectionCard.card.healing}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium bg-gray-200 px-2 py-1 rounded">
                        x{collectionCard.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {activeTab === 'deck' && selectedDeck && (
                <>
                  Active deck: <span className="font-medium">{selectedDeck.name}</span>
                  {selectedDeck.isActive && <span className="ml-2 text-green-600">✓ Active</span>}
                </>
              )}
            </div>
            <div className="flex gap-2">
              {activeTab === 'deck' && (
                <>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Save Deck
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    New Deck
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
