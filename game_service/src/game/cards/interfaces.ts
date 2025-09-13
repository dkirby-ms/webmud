// Core card game interfaces for the WebMUD card game system
// This file defines the fundamental data structures for card-based encounters

import { Card, CardEffect } from "../../db/cardRepository.js";

// Enum for different types of encounters
export enum EncounterType {
  PvP = "pvp",           // Player vs Player
  PvE = "pve",           // Player vs Environment/NPC
  Environmental = "environmental"  // Environmental puzzles/challenges
}

// Enum for game session states
export enum GameSessionState {
  WaitingForPlayers = "waiting_for_players",
  InProgress = "in_progress",
  Paused = "paused",
  Completed = "completed",
  Abandoned = "abandoned"
}

// Enum for player game status within a session
export enum PlayerGameStatus {
  NotInGame = "not_in_game",
  WaitingToJoin = "waiting_to_join",
  InGame = "in_game",
  WaitingForTurn = "waiting_for_turn",
  ActiveTurn = "active_turn",
  Defeated = "defeated",
  Victory = "victory",
  Forfeited = "forfeited"
}

// Interface for cards currently in a player's hand during a game
export interface PlayerHand {
  playerId: string;
  cards: HandCard[];
  maxSize: number;
  currentSize: number;
}

// Interface for a card in a player's hand with game-specific properties
export interface HandCard {
  cardId: string;
  card: Card; // Full card data for quick access
  handPosition: number; // Position in hand (0-based)
  isPlayable: boolean; // Whether the card can currently be played
  energyCost: number; // Actual energy cost (may be modified by effects)
}

// Interface for cards that have been played during a round
export interface PlayedCard {
  cardId: string;
  card: Card; // Full card data
  playerId: string;
  playOrder: number; // Order in which the card was played this turn
  targetIds?: string[]; // IDs of targeted entities (if applicable)
  modifiers?: CardModifier[]; // Any modifiers applied to this card
  timestamp: Date;
}

// Interface for card modifiers (buffs/debuffs applied to cards)
export interface CardModifier {
  type: 'energy_cost' | 'damage' | 'healing' | 'duration' | 'target_count';
  value: number; // Positive or negative modifier
  source: string; // What caused this modifier
  temporary: boolean; // Whether it expires at end of turn
}

// Interface for managing turns in a card game
export interface GameTurn {
  sessionId: string;
  turnNumber: number;
  currentPlayerId: string;
  turnStartTime: Date;
  turnTimeLimit: number; // in seconds
  maxCardsPerTurn: number;
  cardsPlayedThisTurn: number;
  actionsRemaining: number;
  isCompleted: boolean;
}

// Interface for active card game sessions (separate from HTTP sessions)
export interface GameSession {
  // Session identification
  sessionId: string;
  encounterType: EncounterType;
  sessionState: GameSessionState;
  
  // Participants
  playerIds: string[];
  npcIds?: string[]; // For PvE encounters
  currentTurn: GameTurn;
  
  // Game state
  roundNumber: number;
  maxRounds?: number; // Optional round limit
  
  // Player hands and energy
  playerHands: Map<string, PlayerHand>;
  playerEnergy: Map<string, number>;
  maxEnergy: Map<string, number>;
  
  // Cards played this round
  playedCards: PlayedCard[];
  
  // Game configuration
  gameRules: GameRules;
  
  // Victory conditions
  victoryConditions: VictoryCondition[];
  
  // Timing
  sessionStartTime: Date;
  sessionEndTime?: Date;
  lastActivity: Date;
  
  // Rewards and consequences
  rewards?: GameReward[];
  penalties?: GamePenalty[];
}

// Interface for game rules and configuration
export interface GameRules {
  // Turn management
  turnTimeLimit: number; // seconds
  maxCardsPerTurn: number;
  maxActionsPerTurn: number;
  
  // Energy system
  startingEnergy: number;
  maxEnergy: number;
  energyPerTurn: number;
  
  // Hand management
  startingHandSize: number;
  maxHandSize: number;
  cardsDrawnPerTurn: number;
  
  // Special rules
  allowMultipleTargets: boolean;
  allowCounterPlay: boolean;
  enableChainEffects: boolean;
  
  // Round limits
  maxRounds?: number;
  timeLimit?: number; // Total game time limit in seconds
}

// Interface for victory conditions
export interface VictoryCondition {
  type: 'elimination' | 'objective' | 'time_limit' | 'card_count';
  description: string;
  isCompleted: boolean;
  completedBy?: string; // Player ID who completed it
  parameters?: Record<string, any>; // Flexible parameters for different conditions
}

// Interface for game rewards
export interface GameReward {
  type: 'cards' | 'experience' | 'currency' | 'items';
  recipientId: string;
  amount: number;
  specificItems?: string[]; // IDs of specific cards/items
  description: string;
}

// Interface for game penalties
export interface GamePenalty {
  type: 'card_loss' | 'energy_penalty' | 'timeout';
  targetId: string;
  amount: number;
  duration?: number; // For temporary penalties
  description: string;
}

// Interface for challenge invitations between players
export interface ChallengeInvitation {
  challengeId: string;
  challengerId: string;
  challengedId: string;
  encounterType: EncounterType;
  proposedRules: GameRules;
  message?: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
}

// Interface for spectator data
export interface SpectatorView {
  sessionId: string;
  spectatorId: string;
  joinedAt: Date;
  allowedInfo: SpectatorPermissions;
}

// Interface for spectator permissions
export interface SpectatorPermissions {
  canSeeHands: boolean;
  canSeePlayedCards: boolean;
  canSeeEnergy: boolean;
  canSeeGameLog: boolean;
  canChat: boolean;
}

// Interface for game events/log entries
export interface GameEvent {
  sessionId: string;
  eventType: 'card_played' | 'turn_ended' | 'player_joined' | 'player_left' | 'game_ended' | 'effect_triggered';
  playerId?: string;
  timestamp: Date;
  description: string;
  data?: Record<string, any>; // Additional event-specific data
}

// Interface for AI difficulty settings
export interface AIDifficulty {
  level: 'easy' | 'medium' | 'hard' | 'expert';
  reactionTime: number; // Simulated thinking time in ms
  mistakeChance: number; // Probability of suboptimal plays (0-1)
  cardPriorityWeights: Record<string, number>; // Weights for different card types
  aggressiveness: number; // How likely to attack vs defend (0-1)
}

// Type definitions for commonly used unions
export type GameParticipantId = string; // Player or NPC ID
export type CardTargetType = 'self' | 'enemy' | 'ally' | 'all' | 'area' | 'none';
export type CardPlayResult = 'success' | 'insufficient_energy' | 'invalid_target' | 'not_playable' | 'game_rule_violation';

// Interface for card play validation
export interface CardPlayValidation {
  isValid: boolean;
  result: CardPlayResult;
  reason?: string;
  energyCost: number;
  validTargets?: string[];
}

// Interface for effect resolution
export interface EffectResolution {
  effectId: string;
  sourceCardId: string;
  sourcePlayerId: string;
  targetIds: string[];
  effect: CardEffect;
  success: boolean;
  actualValue?: number; // Actual value after modifiers
  description: string;
}