'use client';

import { useReducer, useCallback, useRef, useEffect } from 'react';
import type {
  RecordingState,
  RecordingAction,
  Trial,
  LookingInterval,
} from '@/lib/types';
import { generateId } from '@/lib/utils';

const initialState: RecordingState = {
  status: 'idle',
  lookingState: 'neutral',
  startTime: null,
  elapsedTime: 0,
  currentTrial: null,
  currentIntervalStart: null,
};

function recordingReducer(
  state: RecordingState,
  action: RecordingAction
): RecordingState {
  switch (action.type) {
    case 'START_RECORDING': {
      const now = Date.now();
      return {
        ...state,
        status: 'recording',
        lookingState: 'neutral',
        startTime: now,
        elapsedTime: 0,
        currentTrial: {
          id: generateId(),
          name: action.payload.trialName,
          createdAt: new Date().toISOString(),
          totalDuration: 0,
          intervals: [],
        },
        currentIntervalStart: null,
      };
    }

    case 'END_RECORDING': {
      if (state.status !== 'recording' || !state.currentTrial) {
        return state;
      }

      // If currently looking, close the interval
      let intervals = [...(state.currentTrial.intervals || [])];
      if (state.lookingState === 'looking' && state.currentIntervalStart !== null) {
        intervals.push({
          startTime: state.currentIntervalStart,
          endTime: state.elapsedTime,
        });
      }

      return {
        ...initialState,
        // Keep the completed trial data for retrieval
        currentTrial: {
          ...state.currentTrial,
          totalDuration: state.elapsedTime,
          intervals,
        },
      };
    }

    case 'CANCEL_RECORDING': {
      return initialState;
    }

    case 'TOGGLE_LOOKING': {
      if (state.status !== 'recording') {
        return state;
      }

      const now = state.elapsedTime;

      // From neutral -> looking (first toggle)
      if (state.lookingState === 'neutral') {
        return {
          ...state,
          lookingState: 'looking',
          currentIntervalStart: now,
        };
      }

      // From looking -> lookingAway (close the interval)
      if (state.lookingState === 'looking') {
        const newInterval: LookingInterval = {
          startTime: state.currentIntervalStart!,
          endTime: now,
        };
        return {
          ...state,
          lookingState: 'lookingAway',
          currentTrial: {
            ...state.currentTrial,
            intervals: [...(state.currentTrial?.intervals || []), newInterval],
          },
          currentIntervalStart: null,
        };
      }

      // From lookingAway -> looking (start new interval)
      if (state.lookingState === 'lookingAway') {
        return {
          ...state,
          lookingState: 'looking',
          currentIntervalStart: now,
        };
      }

      return state;
    }

    case 'TICK': {
      if (state.status !== 'recording') {
        return state;
      }
      return {
        ...state,
        elapsedTime: action.payload.elapsed,
      };
    }

    default:
      return state;
  }
}

export interface UseRecordingReturn {
  /** Current recording state */
  state: RecordingState;
  /** Start a new recording with a trial name */
  startRecording: (trialName: string) => void;
  /** End the current recording and return the completed trial */
  endRecording: () => Trial | null;
  /** Cancel the current recording without saving */
  cancelRecording: () => void;
  /** Toggle between looking states */
  toggleLookingState: () => void;
  /** Whether a recording is currently active */
  isRecording: boolean;
}

export function useRecording(): UseRecordingReturn {
  const [state, dispatch] = useReducer(recordingReducer, initialState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Start the timer when recording begins
  useEffect(() => {
    if (state.status === 'recording' && state.startTime) {
      startTimeRef.current = state.startTime;
      
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          dispatch({ type: 'TICK', payload: { elapsed } });
        }
      }, 10); // Update every 10ms for smooth display
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.status, state.startTime]);

  const startRecording = useCallback((trialName: string) => {
    dispatch({ type: 'START_RECORDING', payload: { trialName } });
  }, []);

  const endRecording = useCallback((): Trial | null => {
    if (state.status !== 'recording') {
      return null;
    }
    
    dispatch({ type: 'END_RECORDING' });
    
    // Calculate the final trial data
    if (!state.currentTrial) {
      return null;
    }

    let intervals = [...(state.currentTrial.intervals || [])];
    if (state.lookingState === 'looking' && state.currentIntervalStart !== null) {
      intervals.push({
        startTime: state.currentIntervalStart,
        endTime: state.elapsedTime,
      });
    }

    return {
      id: state.currentTrial.id!,
      name: state.currentTrial.name!,
      createdAt: state.currentTrial.createdAt!,
      totalDuration: state.elapsedTime,
      intervals,
    };
  }, [state]);

  const cancelRecording = useCallback(() => {
    dispatch({ type: 'CANCEL_RECORDING' });
  }, []);

  const toggleLookingState = useCallback(() => {
    dispatch({ type: 'TOGGLE_LOOKING' });
  }, []);

  return {
    state,
    startRecording,
    endRecording,
    cancelRecording,
    toggleLookingState,
    isRecording: state.status === 'recording',
  };
}
