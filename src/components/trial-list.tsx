'use client';

import { useState } from 'react';
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
  onDeleteTrial: (trialId: string) => void;
  onClearAllTrials: () => void;
  onViewTimeline: (trial: Trial) => void;
  onDownloadCSV: (trial: Trial) => void;
}

export function TrialList({
  trials,
  onDeleteTrial,
  onClearAllTrials,
  onViewTimeline,
  onDownloadCSV,
}: TrialListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
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

  if (trials.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No trials recorded yet</p>
        <p className="text-sm mt-2">
          Start a new recording to see your trials here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Trials ({trials.length})
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setClearAllDialogOpen(true)}
          className="text-destructive hover:text-destructive"
        >
          Clear All
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trial Name</TableHead>
              <TableHead className="w-[100px]">Duration</TableHead>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-[150px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trials.map((trial) => (
              <TableRow key={trial.id}>
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
                    >
                      📊
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDownloadCSV(trial)}
                      title="Download CSV"
                    >
                      ⬇️
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(trial)}
                      title="Delete Trial"
                      className="text-destructive hover:text-destructive"
                    >
                      🗑️
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
        description={`Are you sure you want to delete all ${trials.length} trials? This action cannot be undone.`}
        confirmLabel="Clear All"
        onConfirm={handleConfirmClearAll}
        variant="destructive"
      />
    </div>
  );
}
