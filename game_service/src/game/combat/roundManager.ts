// Simple logger for combat round manager
const logger = {
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    warn: (msg: string) => console.warn(`[WARN] ${msg}`),
    debug: (msg: string) => console.log(`[DEBUG] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`)
};

/**
 * Represents a combat action queued by a player
 */
export interface CombatAction {
    playerId: string;
    actionType: 'attack' | 'defend' | 'other';
    target?: string;
    timestamp: number;
}

/**
 * Represents the state of a combat round
 */
export interface RoundState {
    isActive: boolean;
    roundNumber: number;
    windowOpen: boolean;
    windowStartTime: number;
    queuedActions: CombatAction[];
}

/**
 * Configuration for combat rounds
 */
export interface RoundConfig {
    roundDurationMs: number;  // How long each round lasts
    windowDurationMs: number; // How long the action window stays open
}

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

    constructor(config: RoundConfig) {
        this.config = config;
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

        // Process actions here in the future
        this.processQueuedActions();
    }

    /**
     * Processes all queued actions for the current round
     * This is where combat resolution logic would go
     */
    private processQueuedActions(): void {
        const actions = [...this.state.queuedActions];
        
        // For now, just log the actions that would be processed
        for (const action of actions) {
            logger.debug(`Processing action: ${action.playerId} ${action.actionType} ${action.target || ''}`);
        }

        // Clear the queue after processing
        this.state.queuedActions = [];
    }
}