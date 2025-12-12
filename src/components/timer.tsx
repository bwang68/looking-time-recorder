'use client';

import { formatTimestamp } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TimerProps {
  elapsedTime: number;
  isRecording: boolean;
}

export function Timer({ elapsedTime, isRecording }: TimerProps) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={cn(
          'font-mono text-4xl font-bold tabular-nums',
          isRecording ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {formatTimestamp(elapsedTime)}
      </span>
      {isRecording && (
        <span className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Recording
        </span>
      )}
    </div>
  );
}
