import { logger } from '../../util.js';
import { MessageTypes } from '../../taxonomy.js';

/**
 * Represents a combat action queued by a player
 */

export type CombatActionType = 'attack' | 'defend' | 'special';

export interface CombatAction {
    playerId: string;
    actionType: CombatActionType;
    target?: string; // Target entity ID for attacks
    description?: string;
}

export interface RoundState {
    isActive: boolean;
    windowOpen: boolean;
    roundNumber: number;
    windowStartTime: number;
    queuedActions: CombatAction[];
}

export interface RoundConfig {
    windowDurationMs: number; // How long players have to input actions
    roundDurationMs: number;  // Total time for one complete round
}

export interface CombatResult {
    attacker: string;
    target: string;
    damage: number;
    targetHealthRemaining: number;
    defeated: boolean;
}

export type CombatEndCallback = (results: CombatResult[]) => void;
export type CombatResultsCallback = (results: CombatResult[]) => void;
export type GetCombatantsCallback = () => { players: any[], npcs: any[] };
export type AutoActionCallback = (playerId: string, targetId: string, isPlayer: boolean) => void;

/**
 * Manages combat rounds with timer-based action processing.
 * 
 * Provides a system where:
 * - Combat rounds trigger every X seconds
 * - Players can queue actions during the open window
 * - Queued actions lock in at window close
 */
export class RoundManager {
    private config: RoundConfig;
    private state: RoundState;
    private roundTimer?: NodeJS.Timeout;
    private onCombatEnd?: CombatEndCallback;
    private onCombatResults?: CombatResultsCallback;
    private onAutoAction?: AutoActionCallback;
    private getEntitiesCallback?: () => Map<string, any>;
    private getCombatantsCallback?: GetCombatantsCallback;

    constructor(
        config: RoundConfig, 
        onCombatEnd?: CombatEndCallback,
        onCombatResults?: CombatResultsCallback,
        onAutoAction?: AutoActionCallback,
        getEntitiesCallback?: () => Map<string, any>,
        getCombatantsCallback?: GetCombatantsCallback
    ) {
        this.config = config;
        this.onCombatEnd = onCombatEnd;
        this.onCombatResults = onCombatResults;
        this.onAutoAction = onAutoAction;
        this.getEntitiesCallback = getEntitiesCallback;
        this.getCombatantsCallback = getCombatantsCallback;
        this.state = {
            isActive: false,
            roundNumber: 0,
            windowOpen: false,
            windowStartTime: 0,
            queuedActions: []
        };
    }

    /**
     * Starts the combat round system
     */
    public start(): void {
        if (this.state.isActive) {
            logger.warn('Combat round manager is already active');
            return;
        }

        this.state.isActive = true;
        this.startNewRound();
        logger.info('Combat round manager started');
    }

    /**
     * Stops the combat round system
     */
    public stop(): void {
        if (!this.state.isActive) {
            return;
        }

        this.state.isActive = false;
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = undefined;
        }
        this.state.windowOpen = false;
        this.state.queuedActions = [];
        logger.info('Combat round manager stopped');
    }

    /**
     * Queues a combat action if the window is open
     */
    public queueAction(action: CombatAction): boolean {
        if (!this.state.isActive) {
            logger.debug(`Combat round manager not active - action ignored for player ${action.playerId}`);
            return false;
        }

        if (!this.state.windowOpen) {
            logger.debug(`Action window closed - action ignored for player ${action.playerId}`);
            return false;
        }

        // Remove any existing action from this player for this round
        this.state.queuedActions = this.state.queuedActions.filter(
            existingAction => existingAction.playerId !== action.playerId
        );

        // Add the new action
        this.state.queuedActions.push(action);
        logger.debug(`Action queued for player ${action.playerId}: ${action.actionType}`);
        return true;
    }

    /**
     * Gets the current round state (read-only)
     */
    public getCurrentState(): Readonly<RoundState> {
        return { ...this.state };
    }

    /**
     * Checks if the action window is currently open
     */
    public isWindowOpen(): boolean {
        return this.state.isActive && this.state.windowOpen;
    }

    /**
     * Gets the time remaining in the current window (in milliseconds)
     */
    public getWindowTimeRemaining(): number {
        if (!this.state.windowOpen) {
            return 0;
        }

        const elapsed = Date.now() - this.state.windowStartTime;
        const remaining = this.config.windowDurationMs - elapsed;
        return Math.max(0, remaining);
    }

    /**
     * Starts a new combat round
     */
    private startNewRound(): void {
        if (!this.state.isActive) {
            return;
        }

        this.state.roundNumber++;
        this.state.windowOpen = true;
        this.state.windowStartTime = Date.now();
        this.state.queuedActions = [];

        logger.debug(`Combat round ${this.state.roundNumber} started - window open for ${this.config.windowDurationMs}ms`);

        // Schedule window close
        setTimeout(() => {
            this.closeWindow();
        }, this.config.windowDurationMs);

        // Schedule next round
        this.roundTimer = setTimeout(() => {
            this.startNewRound();
        }, this.config.roundDurationMs);
    }

    /**
     * Closes the action window and processes queued actions
     */
    private closeWindow(): void {
        if (!this.state.windowOpen) {
            return;
        }

        this.state.windowOpen = false;
        logger.debug(`Combat round ${this.state.roundNumber} window closed - processing ${this.state.queuedActions.length} actions`);

        // Auto-queue NPC actions before processing
        this.autoQueueNPCActions();

        // Process actions here in the future
        this.processQueuedActions();
    }

    /**
     * Automatically queue attack actions for NPCs and default attacks for players
     */
    private autoQueueNPCActions(): void {
        if (!this.getCombatantsCallback) {
            return;
        }

        const combatants = this.getCombatantsCallback();
        
        // Auto-queue default attacks for players who haven't acted this round
        const playersWhoActed = new Set(this.state.queuedActions.map(action => action.playerId));
        
        for (const player of combatants.players) {
            if (!playersWhoActed.has(player.pkid) && combatants.npcs.length > 0) {
                // Player hasn't acted - queue a default attack against a random NPC
                const randomNPC = combatants.npcs[Math.floor(Math.random() * combatants.npcs.length)];
                
                const playerDefaultAction: CombatAction = {
                    playerId: player.pkid,
                    actionType: 'attack',
                    target: randomNPC.baseData.id
                };
                
                this.state.queuedActions.push(playerDefaultAction);
                logger.debug(`Auto-queued player default attack: ${player.baseData.name} -> ${randomNPC.baseData.name}`);
                
                // Notify about auto-queued player action
                if (this.onAutoAction) {
                    this.onAutoAction(player.pkid, randomNPC.baseData.id, true);
                }
            }
        }
        
        // Auto-queue attacks for NPCs against random players
        for (const npc of combatants.npcs) {
            if (combatants.players.length > 0) {
                // Pick a random player to attack
                const randomPlayer = combatants.players[Math.floor(Math.random() * combatants.players.length)];
                
                const npcAction: CombatAction = {
                    playerId: npc.baseData.id,
                    actionType: 'attack',
                    target: randomPlayer.pkid
                };
                
                this.state.queuedActions.push(npcAction);
                logger.debug(`Auto-queued NPC attack: ${npc.baseData.name} -> ${randomPlayer.baseData.name}`);
                
                // Notify about auto-queued NPC action
                if (this.onAutoAction) {
                    this.onAutoAction(npc.baseData.id, randomPlayer.pkid, false);
                }
            }
        }
    }

    /**
     * Processes all queued actions for the current round
     * This is where combat resolution logic would go
     */
    private processQueuedActions(): void {
        const actions = [...this.state.queuedActions];
        const results: CombatResult[] = [];
        
        if (!this.getEntitiesCallback) {
            logger.debug('No entities callback set - skipping combat processing');
            this.state.queuedActions = [];
            return;
        }

        const entities = this.getEntitiesCallback();
        
        // Process attack actions
        for (const action of actions) {
            if (action.actionType === 'attack' && action.target) {
                const attacker = entities.get(action.playerId);
                const target = entities.get(action.target);
                
                if (!attacker || !target) {
                    logger.debug(`Combat action skipped - invalid entities: attacker=${!!attacker}, target=${!!target}`);
                    continue;
                }

                // Simple damage calculation (1-10 damage)
                const damage = Math.floor(Math.random() * 10) + 1;
                const currentHealth = target.state.currentHealth || target.getCurrentHealth() || 100;
                const newHealth = Math.max(0, currentHealth - damage);
                
                // Update target health using currentHealth property
                target.updateState({ currentHealth: newHealth });
                
                const result: CombatResult = {
                    attacker: action.playerId,
                    target: action.target,
                    damage: damage,
                    targetHealthRemaining: newHealth,
                    defeated: newHealth <= 0
                };
                
                results.push(result);
                
                logger.debug(`Combat: ${action.playerId} attacks ${action.target} for ${damage} damage (${newHealth} health remaining)`);
            }
        }

        // Broadcast combat results if there were any actions
        if (results.length > 0 && this.onCombatResults) {
            this.onCombatResults(results);
        }

        // Check if any entities were defeated and call callback
        const anyDefeated = results.some(result => result.defeated);
        if (anyDefeated && this.onCombatEnd) {
            logger.debug('Combat ending due to defeated entities');
            this.onCombatEnd(results);
        }

        // Clear the queue after processing
        this.state.queuedActions = [];
    }
}