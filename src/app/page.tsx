'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRecording } from '@/hooks/use-recording';
import { useAudio } from '@/hooks/use-audio';
import { RecordingDisplay } from '@/components/recording-display';
import { Timer } from '@/components/timer';
import { TrialList } from '@/components/trial-list';
import { TimelineView } from '@/components/timeline-view';
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csv-export';
import type { Trial } from '@/lib/types';

export default function Home() {
  const {
    state,
    startRecording,
    endRecording,
    cancelRecording,
    toggleLookingState,
    isRecording,
  } = useRecording();

  const { playLookSound, playAwaySound, isMuted, toggleMute } = useAudio();

  const [trials, setTrials] = useState<Trial[]>([]);
  const [newTrialDialogOpen, setNewTrialDialogOpen] = useState(false);
  const [trialName, setTrialName] = useState('');
  const [trialNameError, setTrialNameError] = useState('');
  const [timelineTrialOpen, setTimelineTrialOpen] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);

  // Track previous looking state for audio
  const prevLookingStateRef = useRef(state.lookingState);

  // Load trials from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('looking-time-recorder-trials');
    if (saved) {
      try {
        setTrials(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load trials:', e);
      }
    }
  }, []);

  // Play audio on state changes
  useEffect(() => {
    if (state.status === 'recording') {
      if (prevLookingStateRef.current !== state.lookingState) {
        if (state.lookingState === 'looking') {
          playLookSound();
        } else if (state.lookingState === 'lookingAway') {
          playAwaySound();
        }
      }
    }
    prevLookingStateRef.current = state.lookingState;
  }, [state.lookingState, state.status, playLookSound, playAwaySound]);

  // Warn before closing during recording
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecording) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRecording]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Spacebar - toggle looking state during recording
      if (e.code === 'Space' && isRecording) {
        e.preventDefault(); // Prevent page scroll
        toggleLookingState();
      }

      // Enter - open new trial dialog when not recording
      if (e.code === 'Enter' && !isRecording && !newTrialDialogOpen) {
        e.preventDefault();
        setNewTrialDialogOpen(true);
      }

      // Escape - cancel recording with confirmation
      if (e.code === 'Escape' && isRecording) {
        e.preventDefault();
        if (window.confirm('Are you sure you want to cancel this recording? All data will be lost.')) {
          cancelRecording();
          toast.info('Recording cancelled');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, toggleLookingState, cancelRecording, newTrialDialogOpen]);

  // Handle starting a new recording
  const handleStartRecording = useCallback(() => {
    if (!trialName.trim()) {
      setTrialNameError('Please enter a trial name');
      return;
    }

    // Check for unique name
    if (trials.some((t) => t.name.toLowerCase() === trialName.trim().toLowerCase())) {
      setTrialNameError('A trial with this name already exists');
      return;
    }

    startRecording(trialName.trim());
    setNewTrialDialogOpen(false);
    setTrialName('');
    setTrialNameError('');
    toast.success('Recording started');
  }, [trialName, trials, startRecording]);

  // Handle ending recording
  const handleEndRecording = useCallback(() => {
    const completedTrial = endRecording();
    if (completedTrial) {
      const updatedTrials = [...trials, completedTrial];
      setTrials(updatedTrials);
      localStorage.setItem(
        'looking-time-recorder-trials',
        JSON.stringify(updatedTrials)
      );
      toast.success(`Trial "${completedTrial.name}" saved!`);
      
      // Show timeline for the completed trial
      setSelectedTrial(completedTrial);
      setTimelineTrialOpen(true);
    }
  }, [endRecording, trials]);

  // Handle deleting a trial
  const handleDeleteTrial = useCallback((trialId: string) => {
    const updatedTrials = trials.filter((t) => t.id !== trialId);
    setTrials(updatedTrials);
    localStorage.setItem(
      'looking-time-recorder-trials',
      JSON.stringify(updatedTrials)
    );
    toast.success('Trial deleted');
  }, [trials]);

  // Handle clearing all trials
  const handleClearAllTrials = useCallback(() => {
    setTrials([]);
    localStorage.removeItem('looking-time-recorder-trials');
    toast.success('All trials cleared');
  }, []);

  // Handle viewing timeline
  const handleViewTimeline = useCallback((trial: Trial) => {
    setSelectedTrial(trial);
    setTimelineTrialOpen(true);
  }, []);

  // Handle downloading CSV
  const handleDownloadCSV = useCallback((trial: Trial) => {
    downloadCSV(trial);
    toast.success(`Downloaded ${trial.name}.csv`);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Looking Time Recorder</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🔊'}
            </Button>
            <KeyboardShortcuts variant="icon" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Recording Display */}
            <RecordingDisplay
              status={state.status}
              lookingState={state.lookingState}
            />

            {/* Timer */}
            <div className="flex justify-center py-4">
              <Timer elapsedTime={state.elapsedTime} isRecording={isRecording} />
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <Button
                  size="lg"
                  onClick={() => setNewTrialDialogOpen(true)}
                  className="min-w-[180px]"
                >
                  Start Recording
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleEndRecording}
                  className="min-w-[180px]"
                >
                  End Recording
                </Button>
              )}
            </div>

            {/* Keyboard Hints */}
            <div className="text-center text-sm text-muted-foreground">
              {isRecording ? (
                <p>
                  Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Space</kbd> to toggle looking state
                  {' • '}
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd> to cancel
                </p>
              ) : (
                <p>
                  Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Enter</kbd> to start recording
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trial List */}
        <Card>
          <CardContent className="pt-6">
            <TrialList
              trials={trials}
              onDeleteTrial={handleDeleteTrial}
              onClearAllTrials={handleClearAllTrials}
              onViewTimeline={handleViewTimeline}
              onDownloadCSV={handleDownloadCSV}
            />
          </CardContent>
        </Card>
      </main>

      {/* New Trial Dialog */}
      <Dialog open={newTrialDialogOpen} onOpenChange={setNewTrialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Trial</DialogTitle>
            <DialogDescription>
              Enter a name for this trial. Names must be unique.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Child_001_Session_A"
              value={trialName}
              onChange={(e) => {
                setTrialName(e.target.value);
                setTrialNameError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleStartRecording();
                }
              }}
              autoFocus
            />
            {trialNameError && (
              <p className="text-sm text-destructive mt-2">{trialNameError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTrialDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartRecording}>Start Recording</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timeline View Dialog */}
      <TimelineView
        trial={selectedTrial}
        open={timelineTrialOpen}
        onOpenChange={setTimelineTrialOpen}
      />
    </div>
  );
}

