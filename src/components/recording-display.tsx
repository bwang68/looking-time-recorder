'use client';

import { cn } from '@/lib/utils';
import type { LookingState, RecordingStatus } from '@/lib/types';

interface RecordingDisplayProps {
  status: RecordingStatus;
  lookingState: LookingState;
}

const stateConfig = {
  neutral: {
    bgColor: 'bg-slate-200',
    textColor: 'text-slate-600',
    label: 'Waiting...',
    icon: '◐',
  },
  looking: {
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    label: 'LOOKING',
    icon: '●',
  },
  lookingAway: {
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    label: 'NOT LOOKING',
    icon: '○',
  },
};

export function RecordingDisplay({ status, lookingState }: RecordingDisplayProps) {
  const isRecording = status === 'recording';
  const config = stateConfig[lookingState];

  if (!isRecording) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300">
        <div className="text-4xl mb-4 text-slate-400">⏸</div>
        <p className="text-xl font-medium text-slate-500">Not Recording</p>
        <p className="text-sm text-slate-400 mt-2">
          Press &quot;Start Recording&quot; or hit Enter to begin
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-64 rounded-xl transition-colors duration-150',
        config.bgColor
      )}
    >
      <div className={cn('text-6xl mb-4', config.textColor)}>{config.icon}</div>
      <p className={cn('text-3xl font-bold tracking-wide', config.textColor)}>
        {config.label}
      </p>
      {lookingState === 'lookingAway' && (
        <p className={cn('text-sm mt-4 opacity-80', config.textColor)}>
          Hold Spacebar when child is looking
        </p>
      )}
    </div>
  );
}
