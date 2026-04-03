'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRecording } from '@/hooks/use-recording';
import { useAudio } from '@/hooks/use-audio';
import { RecordingDisplay } from '@/components/recording-display';
import { Timer } from '@/components/timer';
import { TrialList } from '@/components/trial-list';
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
import { downloadSubjectCSV } from '@/lib/csv-export';
import type { Subject, Trial } from '@/lib/types';
import { formatDurationShort, generateId } from '@/lib/utils';
import { DEFAULT_TRIAL_NAMES, createDefaultTrial, createDefaultTrials, hydrateSubjectTrials } from '@/lib/trials';

export default function Home() {
  const {
    state,
    startRecording,
    endRecording,
    startLooking,
    stopLooking,
    isRecording,
  } = useRecording();

  const { playLookSound, playAwaySound, isMuted, toggleMute } = useAudio();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [trialTimeLimitMs, setTrialTimeLimitMs] = useState(120000); // default 2 minutes
  const [timeLimitDialogOpen, setTimeLimitDialogOpen] = useState(false);
  const [timeLimitInput, setTimeLimitInput] = useState('120'); // seconds
  const [timeLimitError, setTimeLimitError] = useState('');
  const [selectedTrialIndex, setSelectedTrialIndex] = useState<number | null>(null);
  const [pendingTrial, setPendingTrial] = useState<Trial | null>(null);
  const [pendingTrialIndex, setPendingTrialIndex] = useState<number | null>(null);
  const [trialCompleted, setTrialCompleted] = useState(false);
  const [bearFound, setBearFound] = useState(false);
  const [trialNotes, setTrialNotes] = useState('');
  const activeTrialIndexRef = useRef<number | null>(null);
  
  // Dialog states
  const [newSubjectDialogOpen, setNewSubjectDialogOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectNameError, setSubjectNameError] = useState('');
  // Timeline view removed per feedback

  // Track previous looking state for audio
  const prevLookingStateRef = useRef(state.lookingState);
  // Prevent duplicate auto-end firing
  const autoEndTriggeredRef = useRef(false);

  // Load subjects from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('looking-time-recorder-subjects');
    if (saved) {
      try {
        const loadedSubjects = JSON.parse(saved).map(hydrateSubjectTrials);
        setSubjects(loadedSubjects);
        // Find the most recent subject and set as current
        if (loadedSubjects.length > 0) {
          setCurrentSubject(loadedSubjects[loadedSubjects.length - 1]);
          setSelectedTrialIndex(0);
        }
      } catch (e) {
        console.error('Failed to load subjects:', e);
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

  // Reset auto-end guard when recording stops
  useEffect(() => {
    if (!isRecording) {
      autoEndTriggeredRef.current = false;
    }
  }, [isRecording]);

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

  // Helper to save subjects to localStorage
  const saveSubjects = useCallback((updatedSubjects: Subject[]) => {
    setSubjects(updatedSubjects);
    localStorage.setItem('looking-time-recorder-subjects', JSON.stringify(updatedSubjects));
  }, []);

  // Generate next trial name
  const getNextTrialName = useCallback(() => {
    if (!currentSubject || currentSubject.trials.length === 0) {
      return 'PT01';
    }

    const trialIndex = selectedTrialIndex ?? 0;
    return currentSubject.trials[trialIndex]?.name ?? currentSubject.trials[0].name;
  }, [currentSubject, selectedTrialIndex]);

  // Handle starting a new recording
  const handleStartRecording = useCallback(() => {
    if (!currentSubject) {
      toast.error('Please create or select a subject first');
      return;
    }

    if (pendingTrial) {
      toast.error('Save the current trial before starting a new one');
      return;
    }

    const trialIndex = selectedTrialIndex ?? 0;
    const trial = currentSubject.trials[trialIndex] ?? currentSubject.trials[0];
    if (!trial) {
      toast.error('No trial slot is available for this subject');
      return;
    }

    const trialName = trial.name;
    setTrialCompleted(false);
    setBearFound(false);
    setTrialNotes('');
    startRecording(trialName);
    activeTrialIndexRef.current = trialIndex;
    autoEndTriggeredRef.current = false;
    toast.success(`Recording ${trialName} started`);
  }, [currentSubject, pendingTrial, selectedTrialIndex, startRecording]);

  // Handle ending recording
  const handleEndRecording = useCallback(() => {
    if (!currentSubject) return;

    const completedTrial = endRecording();
    if (completedTrial) {
      setPendingTrial(completedTrial);
      setPendingTrialIndex(activeTrialIndexRef.current ?? selectedTrialIndex ?? 0);
      setTrialCompleted(false);
      setBearFound(false);
      setTrialNotes('');
      toast.info(`Recording ended for ${completedTrial.name}. Add annotations, then save.`);
    }
  }, [endRecording, currentSubject]);

  // Save a pending trial after annotations are entered
  const handleSavePendingTrial = useCallback(() => {
    if (!currentSubject || !pendingTrial) return;

    const trialIndex = pendingTrialIndex ?? selectedTrialIndex ?? 0;
    const currentTrialName = currentSubject.trials[trialIndex]?.name ?? pendingTrial.name;

    const annotatedTrial: Trial = {
      ...pendingTrial,
      name: currentTrialName,
      trialCompleted,
      bearFound,
      notes: trialNotes.trim(),
    };

    const updatedSubject = {
      ...currentSubject,
      trials: currentSubject.trials.map((trial, index) =>
        index === trialIndex ? annotatedTrial : trial
      ),
    };

    const updatedSubjects = subjects.map((s) =>
      s.id === currentSubject.id ? updatedSubject : s
    );

    saveSubjects(updatedSubjects);
    setCurrentSubject(updatedSubject);
    setPendingTrial(null);
    setPendingTrialIndex(null);
    activeTrialIndexRef.current = null;
    setTrialCompleted(false);
    setBearFound(false);
    setTrialNotes('');
    setSelectedTrialIndex(trialIndex < updatedSubject.trials.length - 1 ? trialIndex + 1 : trialIndex);
    toast.success(`Trial "${annotatedTrial.name}" saved!`);
  }, [
    currentSubject,
    pendingTrial,
    pendingTrialIndex,
    trialCompleted,
    bearFound,
    trialNotes,
    subjects,
    saveSubjects,
  ]);

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

      // Spacebar - start recording if idle; otherwise control looking state
      if (e.code === 'Space') {
        // Always block scroll
        e.preventDefault();

        if (!isRecording) {
          if (currentSubject) {
            handleStartRecording();

          } else if (!newSubjectDialogOpen) {
            setNewSubjectDialogOpen(true);
          }
          return;
        }

        // If already recording, treat space as looking toggle (no repeats)
        if (!e.repeat) {
          startLooking();
        }
      }

      // Enter - move to next trial in list
      if (e.code === 'Enter' && !isRecording && !newSubjectDialogOpen && currentSubject) {
        e.preventDefault();
        const numTrials = currentSubject.trials.length;
        if (numTrials > 0) {
          const nextIndex = selectedTrialIndex === null || selectedTrialIndex >= numTrials - 1 ? 0 : selectedTrialIndex + 1;
          setSelectedTrialIndex(nextIndex);
          toast.info(`Selected ${currentSubject.trials[nextIndex].name}`);
        }
        return;
      }

      // Escape - end and save recording
      if (e.code === 'Escape' && isRecording) {
        e.preventDefault();
        handleEndRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Spacebar released - stop looking
      if (e.code === 'Space' && isRecording) {
        e.preventDefault();
        stopLooking();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, startLooking, stopLooking, newSubjectDialogOpen, currentSubject, handleStartRecording, handleEndRecording]);

  // Handle creating a new subject
  const handleCreateSubject = useCallback(() => {
    if (!subjectName.trim()) {
      setSubjectNameError('Please enter a Subject ID');
      return;
    }

    // Check for unique name
    if (subjects.some((s) => s.name.toLowerCase() === subjectName.trim().toLowerCase())) {
      setSubjectNameError('A subject with this ID already exists');
      return;
    }

    const newSubject: Subject = {
      id: generateId(),
      name: subjectName.trim(),
      createdAt: new Date().toISOString(),
      trials: createDefaultTrials(),
    };

    const updatedSubjects = [...subjects, newSubject];
    saveSubjects(updatedSubjects);
    setCurrentSubject(newSubject);
    setSelectedTrialIndex(0);
    setPendingTrial(null);
    setPendingTrialIndex(null);
    activeTrialIndexRef.current = null;
    setNewSubjectDialogOpen(false);
    setSubjectName('');
    setSubjectNameError('');
    toast.success(`Subject "${newSubject.name}" created!`);
  }, [subjectName, subjects, saveSubjects]);

  // Handle saving time limit (seconds -> ms)
  const handleSaveTimeLimit = useCallback(() => {
    const seconds = Number.parseInt(timeLimitInput, 10);
    if (Number.isNaN(seconds) || seconds <= 0) {
      setTimeLimitError('Enter a valid number of seconds greater than 0');
      return;
    }

    const ms = seconds * 1000;
    setTrialTimeLimitMs(ms);
    setTimeLimitDialogOpen(false);
    setTimeLimitError('');
    toast.success(`Trial time limit set to ${formatDurationShort(ms)}`);
  }, [timeLimitInput]);

  // Auto-end recording when time limit reached
  useEffect(() => {
    if (!isRecording) return;
    if (autoEndTriggeredRef.current) return;

    if (state.elapsedTime >= trialTimeLimitMs) {
      autoEndTriggeredRef.current = true;
      handleEndRecording();
      toast.info(`Trial auto-ended at ${formatDurationShort(trialTimeLimitMs)} limit`);
    }
  }, [isRecording, state.elapsedTime, trialTimeLimitMs, handleEndRecording]);

  // Handle deleting a trial
  const handleDeleteTrial = useCallback((trialId: string) => {
    if (!currentSubject) return;

    const trialIndex = currentSubject.trials.findIndex((trial) => trial.id === trialId);
    if (trialIndex < 0) return;

    const updatedSubject = {
      ...currentSubject,
      trials: currentSubject.trials.map((trial, index) =>
        index === trialIndex
          ? createDefaultTrial(DEFAULT_TRIAL_NAMES[trialIndex] ?? trial.name)
          : trial
      ),
    };

    const updatedSubjects = subjects.map((s) =>
      s.id === currentSubject.id ? updatedSubject : s
    );

    saveSubjects(updatedSubjects);
    setCurrentSubject(updatedSubject);
    setPendingTrialIndex(null);
    activeTrialIndexRef.current = null;
    setSelectedTrialIndex((currentIndex) => currentIndex ?? 0);
    toast.success('Trial deleted');
  }, [currentSubject, subjects, saveSubjects]);

  // Handle updating a trial name
  const handleUpdateTrialName = useCallback(
    (trialId: string, name: string) => {
      if (!currentSubject) return;

      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.error('Trial name cannot be empty');
        return;
      }

      const isDuplicate = currentSubject.trials.some(
        (trial) => trial.id !== trialId && trial.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (isDuplicate) {
        toast.error('Trial names must be unique within a subject');
        return;
      }

      const updatedSubject = {
        ...currentSubject,
        trials: currentSubject.trials.map((trial) =>
          trial.id === trialId
            ? {
                ...trial,
                name: trimmedName,
              }
            : trial
        ),
      };

      const updatedSubjects = subjects.map((s) =>
        s.id === currentSubject.id ? updatedSubject : s
      );

      saveSubjects(updatedSubjects);
      setCurrentSubject(updatedSubject);
    },
    [currentSubject, subjects, saveSubjects]
  );

  // Handle updating annotations for a saved trial
  const handleUpdateTrialAnnotations = useCallback(
    (trialId: string, updates: { trialCompleted?: boolean; bearFound?: boolean; notes?: string }) => {
      if (!currentSubject) return;

      const updatedSubject = {
        ...currentSubject,
        trials: currentSubject.trials.map((trial) =>
          trial.id === trialId
            ? {
                ...trial,
                ...updates,
              }
            : trial
        ),
      };

      const updatedSubjects = subjects.map((s) =>
        s.id === currentSubject.id ? updatedSubject : s
      );

      saveSubjects(updatedSubjects);
      setCurrentSubject(updatedSubject);
    },
    [currentSubject, subjects, saveSubjects]
  );

  // Handle clearing all trials for current subject
  const handleClearAllTrials = useCallback(() => {
    if (!currentSubject) return;

    const updatedSubject = {
      ...currentSubject,
      trials: createDefaultTrials(),
    };

    const updatedSubjects = subjects.map((s) =>
      s.id === currentSubject.id ? updatedSubject : s
    );

    saveSubjects(updatedSubjects);
    setCurrentSubject(updatedSubject);
    setPendingTrial(null);
    setPendingTrialIndex(null);
    activeTrialIndexRef.current = null;
    setSelectedTrialIndex(0);
    toast.success('All trials cleared');
  }, [currentSubject, subjects, saveSubjects]);

  // Handle downloading CSV for current subject
  const handleDownloadCSV = useCallback(() => {
    if (!currentSubject || currentSubject.trials.length === 0) {
      toast.error('No trials to download');
      return;
    }
    downloadSubjectCSV(currentSubject);
    toast.success(`Downloaded ${currentSubject.name}.csv`);
  }, [currentSubject]);

  // Handle switching subjects
  const handleSelectSubject = useCallback((subject: Subject) => {
    setCurrentSubject(subject);
    setSelectedTrialIndex(0);
    setPendingTrial(null);
    setPendingTrialIndex(null);
    activeTrialIndexRef.current = null;
    toast.info(`Switched to subject "${subject.name}"`);
  }, []);

  // Handle deleting a subject
  const handleDeleteSubject = useCallback((subjectId: string) => {
    const updatedSubjects = subjects.filter((s) => s.id !== subjectId);
    saveSubjects(updatedSubjects);
    
    // If we deleted the current subject, select another or null
    if (currentSubject?.id === subjectId) {
      setCurrentSubject(updatedSubjects.length > 0 ? updatedSubjects[updatedSubjects.length - 1] : null);
      setSelectedTrialIndex(0);
      setPendingTrial(null);
      setPendingTrialIndex(null);
      activeTrialIndexRef.current = null;
    }
    toast.success('Subject deleted');
  }, [subjects, currentSubject, saveSubjects]);

  const pendingTrialLabel =
    pendingTrial && currentSubject
      ? currentSubject.trials[pendingTrialIndex ?? selectedTrialIndex ?? 0]?.name ?? pendingTrial.name
      : pendingTrial?.name;

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
      <main className="container mx-auto px-6 py-8 max-w-4xl space-y-8">
        {/* Subject Selection Bar */}
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                {currentSubject ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Current Subject:</span>
                    <span className="font-semibold text-lg">{currentSubject.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({currentSubject.trials.length} trial{currentSubject.trials.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No subject selected</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setNewSubjectDialogOpen(true)}
                  disabled={isRecording}
                >
                  New Subject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTimeLimitInput(String(Math.round(trialTimeLimitMs / 1000)));
                    setTimeLimitDialogOpen(true);
                    setTimeLimitError('');
                  }}
                  disabled={isRecording}
                >
                  Set Trial Time Limit
                </Button>
                <select
                  className="h-10 min-w-[160px] rounded-md border bg-background px-3 py-2 text-center text-sm leading-none"
                  value={selectedTrialIndex === null ? '' : String(selectedTrialIndex)}
                  onChange={(e) => setSelectedTrialIndex(Number(e.target.value))}
                  disabled={isRecording || !currentSubject}
                >
                  <option value="">
                    Select trial
                  </option>
                  {currentSubject?.trials.map((trial, index) => (
                    <option key={trial.id} value={index}>
                      {trial.name}
                    </option>
                  ))}
                </select>
                {subjects.length > 1 && (
                  <select
                    className="h-10 px-3 py-2 border rounded-md bg-background text-sm"
                    value={currentSubject?.id || ''}
                    onChange={(e) => {
                      const subject = subjects.find((s) => s.id === e.target.value);
                      if (subject) handleSelectSubject(subject);
                    }}
                    disabled={isRecording}
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
            <p className="text-center text-xs text-muted-foreground">Time limit: {formatDurationShort(trialTimeLimitMs)}</p>

            {/* Trial annotations */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Trial annotations</p>
                <p className="text-xs text-muted-foreground">
                  {pendingTrialLabel
                    ? `Add outcomes and notes for ${pendingTrialLabel}, then save the trial.`
                    : 'End a recording to annotate and save that trial.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={trialCompleted}
                    onChange={(e) => setTrialCompleted(e.target.checked)}
                    disabled={!pendingTrial}
                  />
                  Trial completed
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={bearFound}
                    onChange={(e) => setBearFound(e.target.checked)}
                    disabled={!pendingTrial}
                  />
                  Bear found
                </label>
              </div>
              <div className="space-y-1">
                <label htmlFor="trial-notes" className="text-sm font-medium">Experimenter notes</label>
                <textarea
                  id="trial-notes"
                  className="w-full min-h-20 rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Optional notes about behavior, interruptions, or trial context"
                  value={trialNotes}
                  onChange={(e) => setTrialNotes(e.target.value)}
                  disabled={!pendingTrial}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {isRecording ? (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleEndRecording}
                  className="min-w-[180px]"
                >
                  End Recording
                </Button>
              ) : pendingTrial ? (
                <Button
                  size="lg"
                  onClick={handleSavePendingTrial}
                  className="min-w-[180px]"
                >
                  Save {pendingTrialLabel}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => {
                    if (!currentSubject) {
                      setNewSubjectDialogOpen(true);
                    } else {
                      handleStartRecording();
                    }
                  }}
                  className="min-w-[180px]"
                >
                  {currentSubject ? `Start ${getNextTrialName()}` : 'New Subject'}
                  <span className="text-xs ml-2 opacity-75">(Space)</span>
                </Button>
              )}
            </div>

            {/* Keyboard Hints */}
            <div className="text-center text-sm text-muted-foreground space-y-1">
              {isRecording ? (
                <p>
                  Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Space</kbd> to toggle looking state
                  {' • '}
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd> to save & end
                </p>
              ) : (
                <p>
                  End recording first, then add annotations and press Save Trial
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trial List */}
        <Card>
          <CardContent className="pt-6">
            <TrialList
              trials={currentSubject?.trials || []}
              subjectName={currentSubject?.name}
              selectedTrialIndex={selectedTrialIndex}
              onDeleteTrial={handleDeleteTrial}
              onUpdateTrialName={handleUpdateTrialName}
              onUpdateTrialAnnotations={handleUpdateTrialAnnotations}
              onClearAllTrials={handleClearAllTrials}
              onDownloadCSV={handleDownloadCSV}
              onDeleteSubject={currentSubject ? () => handleDeleteSubject(currentSubject.id) : undefined}
            />
          </CardContent>
        </Card>
      </main>

      {/* New Subject Dialog */}
      <Dialog open={newSubjectDialogOpen} onOpenChange={setNewSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Subject</DialogTitle>
            <DialogDescription>
              Enter a Subject ID. This will group all trials for this subject together.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Subject_001"
              value={subjectName}
              onChange={(e) => {
                setSubjectName(e.target.value);
                setSubjectNameError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateSubject();
                }
              }}
              autoFocus
            />
            {subjectNameError && (
              <p className="text-sm text-destructive mt-2">{subjectNameError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSubjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubject}>Create Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Limit Dialog */}
      <Dialog
        open={timeLimitDialogOpen}
        onOpenChange={(open) => {
          setTimeLimitDialogOpen(open);
          if (!open) setTimeLimitError('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Trial Time Limit</DialogTitle>
            <DialogDescription>
              Configure the maximum duration for each trial. Recording will auto-stop and save at this limit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <label className="text-sm font-medium">Time limit (seconds)</label>
            <Input
              type="number"
              min={1}
              value={timeLimitInput}
              onChange={(e) => {
                setTimeLimitInput(e.target.value);
                setTimeLimitError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTimeLimit();
              }}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Current: {formatDurationShort(trialTimeLimitMs)}
            </p>
            {timeLimitError && (
              <p className="text-sm text-destructive">{timeLimitError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeLimitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTimeLimit}>Save Limit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

