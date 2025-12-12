'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface KeyboardShortcutsProps {
  variant?: 'button' | 'icon';
}

export function KeyboardShortcuts({ variant = 'button' }: KeyboardShortcutsProps) {
  const shortcuts = [
    {
      key: 'Space',
      description: 'Toggle looking state',
      context: 'During recording',
    },
    {
      key: 'Enter',
      description: 'Start new recording',
      context: 'When not recording',
    },
    {
      key: 'Escape',
      description: 'Cancel recording',
      context: 'During recording',
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon" title="Keyboard Shortcuts">
            ⌨️
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            Shortcuts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{shortcut.description}</p>
                <p className="text-sm text-muted-foreground">
                  {shortcut.context}
                </p>
              </div>
              <kbd className="px-3 py-1.5 bg-muted rounded text-sm font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
