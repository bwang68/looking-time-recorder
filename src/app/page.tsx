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
import { downloadSubjectCSV } from '@/lib/csv-export';
import type { Trial, Subject } from '@/lib/types';
import { generateId } from '@/lib/utils';

export default function Home() {
  const {
    state,
    startRecording,
    endRecording,
    cancelRecording,
    startLooking,
    stopLooking,
    isRecording,
  } = useRecording();

  const { playLookSound, playAwaySound, isMuted, toggleMute } = useAudio();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  
  // Dialog states
  const [newSubjectDialogOpen, setNewSubjectDialogOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectNameError, setSubjectNameError] = useState('');
  const [timelineTrialOpen, setTimelineTrialOpen] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);

  // Track previous looking state for audio
  const prevLookingStateRef = useRef(state.lookingState);

  // Load subjects from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('looking-time-recorder-subjects');
    if (saved) {
      try {
        const loadedSubjects = JSON.parse(saved);
        setSubjects(loadedSubjects);
        // Find the most recent subject and set as current
        if (loadedSubjects.length > 0) {
          setCurrentSubject(loadedSubjects[loadedSubjects.length - 1]);
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
    if (!currentSubject) return 'Trial 1';
    return `Trial ${currentSubject.trials.length + 1}`;
  }, [currentSubject]);

  // Handle starting a new recording
  const handleStartRecording = useCallback(() => {
    if (!currentSubject) {
      toast.error('Please create or select a subject first');
      return;
    }

    const trialName = getNextTrialName();
    startRecording(trialName);
    toast.success(`Recording ${trialName} started`);
  }, [currentSubject, startRecording, getNextTrialName]);

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

      // Spacebar - start looking (hold down = looking)
      if (e.code === 'Space' && isRecording) {
        e.preventDefault(); // Prevent page scroll
        // Ignore key repeat events (when holding down)
        if (!e.repeat) {
          startLooking();
        }
      }

      // Enter - start recording (if subject selected) or open new subject dialog
      if (e.code === 'Enter' && !isRecording && !newSubjectDialogOpen) {
        e.preventDefault();
        if (currentSubject) {
          handleStartRecording();
        } else {
          setNewSubjectDialogOpen(true);
        }
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
  }, [isRecording, startLooking, stopLooking, cancelRecording, newSubjectDialogOpen, currentSubject, handleStartRecording]);

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
      trials: [],
    };

    const updatedSubjects = [...subjects, newSubject];
    saveSubjects(updatedSubjects);
    setCurrentSubject(newSubject);
    setNewSubjectDialogOpen(false);
    setSubjectName('');
    setSubjectNameError('');
    toast.success(`Subject "${newSubject.name}" created!`);
  }, [subjectName, subjects, saveSubjects]);

  // Handle ending recording
  const handleEndRecording = useCallback(() => {
    if (!currentSubject) return;

    const completedTrial = endRecording();
    if (completedTrial) {
      // Add the trial to the current subject
      const updatedSubject = {
        ...currentSubject,
        trials: [...currentSubject.trials, completedTrial],
      };
      
      const updatedSubjects = subjects.map((s) =>
        s.id === currentSubject.id ? updatedSubject : s
      );
      
      saveSubjects(updatedSubjects);
      setCurrentSubject(updatedSubject);
      toast.success(`Trial "${completedTrial.name}" saved!`);
      
      // Show timeline for the completed trial
      setSelectedTrial(completedTrial);
      setTimelineTrialOpen(true);
    }
  }, [endRecording, currentSubject, subjects, saveSubjects]);

  // Handle deleting a trial
  const handleDeleteTrial = useCallback((trialId: string) => {
    if (!currentSubject) return;

    const updatedSubject = {
      ...currentSubject,
      trials: currentSubject.trials.filter((t) => t.id !== trialId),
    };

    const updatedSubjects = subjects.map((s) =>
      s.id === currentSubject.id ? updatedSubject : s
    );

    saveSubjects(updatedSubjects);
    setCurrentSubject(updatedSubject);
    toast.success('Trial deleted');
  }, [currentSubject, subjects, saveSubjects]);

  // Handle clearing all trials for current subject
  const handleClearAllTrials = useCallback(() => {
    if (!currentSubject) return;

    const updatedSubject = {
      ...currentSubject,
      trials: [],
    };

    const updatedSubjects = subjects.map((s) =>
      s.id === currentSubject.id ? updatedSubject : s
    );

    saveSubjects(updatedSubjects);
    setCurrentSubject(updatedSubject);
    toast.success('All trials cleared');
  }, [currentSubject, subjects, saveSubjects]);

  // Handle viewing timeline
  const handleViewTimeline = useCallback((trial: Trial) => {
    setSelectedTrial(trial);
    setTimelineTrialOpen(true);
  }, []);

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
    toast.info(`Switched to subject "${subject.name}"`);
  }, []);

  // Handle deleting a subject
  const handleDeleteSubject = useCallback((subjectId: string) => {
    const updatedSubjects = subjects.filter((s) => s.id !== subjectId);
    saveSubjects(updatedSubjects);
    
    // If we deleted the current subject, select another or null
    if (currentSubject?.id === subjectId) {
      setCurrentSubject(updatedSubjects.length > 0 ? updatedSubjects[updatedSubjects.length - 1] : null);
    }
    toast.success('Subject deleted');
  }, [subjects, currentSubject, saveSubjects]);

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
        {/* Subject Selection Bar */}
        <Card>
          <CardContent className="pt-6">
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

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {!isRecording ? (
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
                  Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Enter</kbd> to {currentSubject ? 'start recording' : 'create subject'}
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
              onDeleteTrial={handleDeleteTrial}
              onClearAllTrials={handleClearAllTrials}
              onViewTimeline={handleViewTimeline}
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

      {/* Timeline View Dialog */}
      <TimelineView
        trial={selectedTrial}
        open={timelineTrialOpen}
        onOpenChange={setTimelineTrialOpen}
      />
    </div>
  );
}

