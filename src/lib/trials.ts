import type { Subject, Trial } from '@/lib/types';
import { generateId } from '@/lib/utils';

export const DEFAULT_TRIAL_NAMES = ['PT01', 'PT02', 'PT03', 'IT01', 'PCPT01', 'relT01'] as const;

export function createDefaultTrial(name: string, createdAt = new Date().toISOString()): Trial {
  return {
    id: generateId(),
    name,
    createdAt,
    totalDuration: 0,
    intervals: [],
  };
}

export function createDefaultTrials(createdAt = new Date().toISOString()): Trial[] {
  return DEFAULT_TRIAL_NAMES.map((name) => createDefaultTrial(name, createdAt));
}

export function hydrateSubjectTrials(subject: Subject): Subject {
  if (subject.trials.length > 0) {
    return subject;
  }

  return {
    ...subject,
    trials: createDefaultTrials(subject.createdAt),
  };
}