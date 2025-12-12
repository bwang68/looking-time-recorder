'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatTimestamp, formatDurationShort } from '@/lib/utils';
import type { Trial, LookingInterval } from '@/lib/types';

interface TimelineViewProps {
  trial: Trial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimelineSegment {
  type: 'looking' | 'lookingAway' | 'neutral';
  startTime: number;
  endTime: number;
  widthPercent: number;
}

export function TimelineView({ trial, open, onOpenChange }: TimelineViewProps) {
  // Calculate timeline segments
  const segments = useMemo<TimelineSegment[]>(() => {
    if (!trial || trial.totalDuration === 0) return [];

    const result: TimelineSegment[] = [];
    const total = trial.totalDuration;
    let currentTime = 0;

    // Sort intervals by start time
    const sortedIntervals = [...trial.intervals].sort(
      (a, b) => a.startTime - b.startTime
    );

    for (const interval of sortedIntervals) {
      // Add "looking away" or "neutral" gap before this interval
      if (interval.startTime > currentTime) {
        result.push({
          type: currentTime === 0 ? 'neutral' : 'lookingAway',
          startTime: currentTime,
          endTime: interval.startTime,
          widthPercent: ((interval.startTime - currentTime) / total) * 100,
        });
      }

      // Add "looking" interval
      result.push({
        type: 'looking',
        startTime: interval.startTime,
        endTime: interval.endTime,
        widthPercent: ((interval.endTime - interval.startTime) / total) * 100,
      });

      currentTime = interval.endTime;
    }

    // Add final gap if recording ended while looking away
    if (currentTime < total) {
      result.push({
        type: 'lookingAway',
        startTime: currentTime,
        endTime: total,
        widthPercent: ((total - currentTime) / total) * 100,
      });
    }

    return result;
  }, [trial]);

  // Calculate time markers
  const timeMarkers = useMemo(() => {
    if (!trial || trial.totalDuration === 0) return [];

    const total = trial.totalDuration;
    const markers: { position: number; label: string }[] = [];

    // Determine interval based on duration
    let interval: number;
    if (total < 30000) {
      interval = 5000; // 5 seconds for short recordings
    } else if (total < 120000) {
      interval = 15000; // 15 seconds
    } else if (total < 300000) {
      interval = 30000; // 30 seconds
    } else {
      interval = 60000; // 1 minute for longer recordings
    }

    for (let time = 0; time <= total; time += interval) {
      markers.push({
        position: (time / total) * 100,
        label: formatDurationShort(time),
      });
    }

    return markers;
  }, [trial]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!trial) return null;

    const totalLookingTime = trial.intervals.reduce(
      (sum, interval) => sum + (interval.endTime - interval.startTime),
      0
    );

    const lookingPercent =
      trial.totalDuration > 0
        ? (totalLookingTime / trial.totalDuration) * 100
        : 0;

    return {
      totalLookingTime,
      lookingPercent,
      intervalCount: trial.intervals.length,
    };
  }, [trial]);

  if (!trial) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Timeline: {trial.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-2xl font-bold">
                {formatDurationShort(trial.totalDuration)}
              </p>
              <p className="text-xs text-muted-foreground">Total Duration</p>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-700">
                {stats?.lookingPercent.toFixed(1)}%
              </p>
              <p className="text-xs text-green-600">Time Looking</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-2xl font-bold">{stats?.intervalCount}</p>
              <p className="text-xs text-muted-foreground">Look Intervals</p>
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="space-y-2">
            <div className="flex h-12 rounded-lg overflow-hidden border">
              {segments.map((segment, index) => (
                <div
                  key={index}
                  className={`h-full transition-colors ${
                    segment.type === 'looking'
                      ? 'bg-green-500'
                      : segment.type === 'lookingAway'
                      ? 'bg-orange-500'
                      : 'bg-slate-300'
                  }`}
                  style={{ width: `${segment.widthPercent}%` }}
                  title={`${segment.type}: ${formatTimestamp(segment.startTime)} - ${formatTimestamp(segment.endTime)}`}
                />
              ))}
            </div>

            {/* Time Markers */}
            <div className="relative h-6">
              {timeMarkers.map((marker, index) => (
                <div
                  key={index}
                  className="absolute text-xs text-muted-foreground transform -translate-x-1/2"
                  style={{ left: `${marker.position}%` }}
                >
                  {marker.label}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Looking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span>Looking Away</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-300" />
              <span>Neutral</span>
            </div>
          </div>

          {/* Interval Details */}
          {trial.intervals.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Looking Intervals</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {trial.intervals.map((interval, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm bg-green-50 rounded px-3 py-1"
                  >
                    <span className="text-green-700">Interval {index + 1}</span>
                    <span className="text-muted-foreground">
                      {formatTimestamp(interval.startTime)} →{' '}
                      {formatTimestamp(interval.endTime)}
                    </span>
                    <span className="font-medium">
                      {formatDurationShort(interval.endTime - interval.startTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
