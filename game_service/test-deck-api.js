// Test script for deck management API endpoints
// Run this in a browser console or Node.js environment to test the API

const API_BASE = 'http://localhost:28999/api';
const JWT_TOKEN = 'your-jwt-token-here'; // Replace with actual JWT token

// Helper function to make authenticated requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
}

// Test functions
async function testCardEndpoints() {
  console.log('\n=== Testing Card Endpoints ===');
  
  try {
    // Get all cards
    console.log('Fetching all cards...');
    const cards = await apiRequest('/cards');
    console.log(`Found ${cards.length} cards`);
    
    // Get cards by type
    console.log('Fetching spell cards...');
    const spells = await apiRequest('/cards?type=spell');
    console.log(`Found ${spells.length} spell cards`);
    
    // Search cards
    console.log('Searching for "fire" cards...');
    const fireCards = await apiRequest('/cards/search?q=fire');
    console.log(`Found ${fireCards.length} cards matching "fire"`);
    
    // Get specific card
    if (cards.length > 0) {
      const cardId = cards[0]._id;
      console.log(`Fetching card ${cardId}...`);
      const card = await apiRequest(`/cards/${cardId}`);
      console.log(`Card: ${card.name}`);
    }
    
    console.log('✅ Card endpoints working!');
  } catch (error) {
    console.error('❌ Card endpoints failed:', error.message);
  }
}

async function testPlayerCollection(playerId) {
  console.log('\n=== Testing Player Collection Endpoints ===');
  
  try {
    // Get player collection
    console.log(`Fetching collection for player ${playerId}...`);
    const collection = await apiRequest(`/players/${playerId}/collection`);
    console.log(`Collection has ${collection.cards.length} unique cards`);
    
    // Add a card to collection (for testing)
    console.log('Adding a card to collection...');
    await apiRequest(`/players/${playerId}/collection/cards`, {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-spell-001',
        quantity: 1
      })
    });
    console.log('Card added to collection');
    
    console.log('✅ Collection endpoints working!');
  } catch (error) {
    console.error('❌ Collection endpoints failed:', error.message);
  }
}

async function testPlayerDecks(playerId) {
  console.log('\n=== Testing Player Deck Endpoints ===');
  
  try {
    // Get player decks
    console.log(`Fetching decks for player ${playerId}...`);
    const decks = await apiRequest(`/players/${playerId}/decks`);
    console.log(`Player has ${decks.length} decks`);
    
    // Create a new deck
    console.log('Creating a new deck...');
    const newDeck = await apiRequest(`/players/${playerId}/decks`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Deck',
        maxSize: 20,
        isActive: false
      })
    });
    console.log(`Created deck: ${newDeck.name} (ID: ${newDeck._id})`);
    
    // Get deck with cards
    console.log(`Fetching deck ${newDeck._id} with cards...`);
    const deckWithCards = await apiRequest(`/decks/${newDeck._id}`);
    console.log(`Deck has ${deckWithCards.cards.length} cards`);
    
    // Add a card to the deck
    console.log('Adding a card to deck...');
    await apiRequest(`/decks/${newDeck._id}/cards`, {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-spell-001',
        quantity: 1
      })
    });
    console.log('Card added to deck');
    
    // Update deck
    console.log('Updating deck...');
    await apiRequest(`/decks/${newDeck._id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Test Deck',
        isActive: true
      })
    });
    console.log('Deck updated');
    
    console.log('✅ Deck endpoints working!');
  } catch (error) {
    console.error('❌ Deck endpoints failed:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Deck Management API Tests...');
  console.log(`API Base: ${API_BASE}`);
  
  // Test card endpoints (no auth required)
  await testCardEndpoints();
  
  // Test authenticated endpoints (replace with actual player ID)
  const testPlayerId = '673f2b3df1a9b3a5e8c72f4e'; // Replace with actual character ID
  
  if (JWT_TOKEN === 'your-jwt-token-here') {
    console.log('\n⚠️  Please set a valid JWT token to test authenticated endpoints');
    console.log('Update the JWT_TOKEN variable in this script');
  } else {
    await testPlayerCollection(testPlayerId);
    await testPlayerDecks(testPlayerId);
  }
  
  console.log('\n🎉 Tests completed!');
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, testCardEndpoints, testPlayerCollection, testPlayerDecks };
} else {
  // Browser environment - you can call runTests() in the console
  console.log('Deck Management API Test Suite loaded.');
  console.log('Call runTests() to start testing, or run individual test functions.');
}
