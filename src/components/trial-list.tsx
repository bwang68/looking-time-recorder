'use client';

import { useState } from 'react';
import { BarChart3, Download, Trash2, UserX } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { formatDurationShort, formatDate } from '@/lib/utils';
import type { Trial } from '@/lib/types';

interface TrialListProps {
  trials: Trial[];
  subjectName?: string;
  onDeleteTrial: (trialId: string) => void;
  onClearAllTrials: () => void;
  onViewTimeline: (trial: Trial) => void;
  onDownloadCSV: () => void;
  onDeleteSubject?: () => void;
}

export function TrialList({
  trials,
  subjectName,
  onDeleteTrial,
  onClearAllTrials,
  onViewTimeline,
  onDownloadCSV,
  onDeleteSubject,
}: TrialListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [deleteSubjectDialogOpen, setDeleteSubjectDialogOpen] = useState(false);
  const [trialToDelete, setTrialToDelete] = useState<Trial | null>(null);

  const handleDeleteClick = (trial: Trial) => {
    setTrialToDelete(trial);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (trialToDelete) {
      onDeleteTrial(trialToDelete.id);
      setTrialToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleConfirmClearAll = () => {
    onClearAllTrials();
    setClearAllDialogOpen(false);
  };

  const handleConfirmDeleteSubject = () => {
    if (onDeleteSubject) {
      onDeleteSubject();
    }
    setDeleteSubjectDialogOpen(false);
  };

  if (!subjectName) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No subject selected</p>
        <p className="text-sm mt-2">
          Create a new subject to start recording trials
        </p>
      </div>
    );
  }

  if (trials.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Trials for {subjectName}
          </h2>
          {onDeleteSubject && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteSubjectDialogOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <UserX className="h-4 w-4 mr-2" />
              Delete Subject
            </Button>
          )}
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No trials recorded yet</p>
          <p className="text-sm mt-2">
            Start a new recording to see your trials here
          </p>
        </div>
        
        {/* Delete Subject Confirmation */}
        <ConfirmDialog
          open={deleteSubjectDialogOpen}
          onOpenChange={setDeleteSubjectDialogOpen}
          title="Delete Subject"
          description={`Are you sure you want to delete "${subjectName}" and all its trials? This action cannot be undone.`}
          confirmLabel="Delete Subject"
          onConfirm={handleConfirmDeleteSubject}
          variant="destructive"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Trials for {subjectName} ({trials.length})
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadCSV}
            className="text-primary hover:text-primary"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearAllDialogOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            Clear All Trials
          </Button>
          {onDeleteSubject && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteSubjectDialogOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <UserX className="h-4 w-4 mr-2" />
              Delete Subject
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Trial Name</TableHead>
              <TableHead className="w-[100px]">Duration</TableHead>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trials.map((trial, index) => (
              <TableRow key={trial.id}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-medium">{trial.name}</TableCell>
                <TableCell>{formatDurationShort(trial.totalDuration)}</TableCell>
                <TableCell>{formatDate(trial.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewTimeline(trial)}
                      title="View Timeline"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(trial)}
                      title="Delete Trial"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Single Trial Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Trial"
        description={`Are you sure you want to delete "${trialToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />

      {/* Clear All Trials Confirmation */}
      <ConfirmDialog
        open={clearAllDialogOpen}
        onOpenChange={setClearAllDialogOpen}
        title="Clear All Trials"
        description={`Are you sure you want to delete all ${trials.length} trials for ${subjectName}? This action cannot be undone.`}
        confirmLabel="Clear All"
        onConfirm={handleConfirmClearAll}
        variant="destructive"
      />

      {/* Delete Subject Confirmation */}
      <ConfirmDialog
        open={deleteSubjectDialogOpen}
        onOpenChange={setDeleteSubjectDialogOpen}
        title="Delete Subject"
        description={`Are you sure you want to delete "${subjectName}" and all its trials? This action cannot be undone.`}
        confirmLabel="Delete Subject"
        onConfirm={handleConfirmDeleteSubject}
        variant="destructive"
      />
    </div>
  );
}
