/**
 * Looking Time Recorder - Type Definitions
 */

/**
 * Represents a single interval when the child was looking at the stimulus
 */
export interface LookingInterval {
  /** Milliseconds from recording start when child started looking */
  startTime: number;
  /** Milliseconds from recording start when child stopped looking */
  endTime: number;
}

/**
 * Represents a complete recorded trial
 */
export interface Trial {
  /** Unique identifier for the trial */
  id: string;
  /** User-defined name for the trial (must be unique) */
  name: string;
  /** ISO date string when the trial was created */
  createdAt: string;
  /** Total duration of the recording in milliseconds */
  totalDuration: number;
  /** Array of looking intervals recorded during the trial */
  intervals: LookingInterval[];
}

/**
 * The current state of the recording session
 */
export type RecordingStatus = 'idle' | 'recording';

/**
 * The current looking state during an active recording
 * - 'neutral': Initial state before recording starts
 * - 'looking': Child is looking at the stimulus (spacebar held)
 * - 'lookingAway': Child is looking away from the stimulus (spacebar released)
 */
export type LookingState = 'neutral' | 'looking' | 'lookingAway';

/**
 * Complete state for the recording hook
 */
export interface RecordingState {
  /** Whether we're currently recording or idle */
  status: RecordingStatus;
  /** Current looking state (only relevant when recording) */
  lookingState: LookingState;
  /** Timestamp when recording started (ms since epoch) */
  startTime: number | null;
  /** Current elapsed time in milliseconds */
  elapsedTime: number;
  /** The trial currently being recorded */
  currentTrial: Partial<Trial> | null;
  /** Temporary storage for intervals being built during recording */
  currentIntervalStart: number | null;
}

/**
 * Actions that can be dispatched to the recording reducer
 */
export type RecordingAction =
  | { type: 'START_RECORDING'; payload: { trialName: string } }
  | { type: 'END_RECORDING' }
  | { type: 'CANCEL_RECORDING' }
  | { type: 'START_LOOKING' }
  | { type: 'STOP_LOOKING' }
  | { type: 'TICK'; payload: { elapsed: number } };
