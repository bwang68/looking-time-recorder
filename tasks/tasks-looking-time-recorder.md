# Tasks: Looking Time Recorder

## Relevant Files

### Core Application Files
- `app/page.tsx` - Main recording interface and app entry point
- `app/layout.tsx` - Root layout with metadata and font configuration
- `app/globals.css` - Global styles and Tailwind CSS imports

### Components
- `components/recording-display.tsx` - Large state display component showing current looking state with color coding
- `components/timer.tsx` - Elapsed time display with millisecond precision
- `components/trial-list.tsx` - Table of saved trials with actions (view, download, delete)
- `components/timeline-view.tsx` - Visual horizontal timeline component showing looking intervals
- `components/keyboard-shortcuts.tsx` - Keyboard shortcuts reference/legend component
- `components/new-trial-dialog.tsx` - Dialog for naming new trials with unique name validation
- `components/confirm-dialog.tsx` - Reusable confirmation dialog for cancel/delete actions

### Custom Hooks
- `hooks/use-recording.ts` - Core recording state machine and toggle logic
- `hooks/use-local-storage.ts` - localStorage persistence for trials
- `hooks/use-keyboard.ts` - Keyboard event handling (spacebar, escape, enter)
- `hooks/use-audio.ts` - Audio feedback management with mute toggle

### Library/Utilities
- `lib/types.ts` - TypeScript interfaces (Trial, LookingInterval, RecordingState)
- `lib/utils.ts` - Utility functions (time formatting, ID generation)
- `lib/csv-export.ts` - CSV generation and download logic

### Audio Assets
- `public/sounds/look.mp3` - Audio cue for "Looking" state
- `public/sounds/away.mp3` - Audio cue for "Looking Away" state

### Documentation
- `docs/README.md` - Documentation for recording functionality, data management, timeline visualization, audio feedback system

### Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration
- `next.config.js` - Next.js configuration

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Provide documentation for the recording functionality, the data management, timeline visualization, audio feedback system, as well as any new features going forward.
- Use shadcn/ui components (Button, Card, Dialog, Input, Table, Toast) throughout the application.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (`git checkout -b feature/looking-time-recorder`)

- [x] 1.0 Project Setup & Configuration
  - [x] 1.1 Initialize a new Next.js 14+ project with App Router, TypeScript, Tailwind CSS, and ESLint (`npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false`)
  - [x] 1.2 Initialize shadcn/ui and configure with default settings (`npx shadcn@latest init`)
  - [x] 1.3 Install required shadcn/ui components: Button, Card, Dialog, Input, Table, Toast (`npx shadcn@latest add button card dialog input table toast`)
  - [x] 1.4 Create the TypeScript interfaces file (`lib/types.ts`) with Trial, LookingInterval, and RecordingState types
  - [x] 1.5 Create utility functions file (`lib/utils.ts`) with time formatting helpers (ms to HH:MM:SS.mmm) and ID generator
  - [x] 1.6 Set up the basic app layout (`app/layout.tsx`) with metadata, fonts, and Toaster provider
  - [x] 1.7 Create the `docs/README.md` file with initial documentation structure

- [ ] 2.0 Core Recording Functionality (MVP)
  - [x] 2.1 Create the `hooks/use-recording.ts` hook with state machine for recording states (idle, recording) and looking states (neutral, looking, lookingAway)
  - [x] 2.2 Implement startRecording, endRecording, and toggleLookingState functions in the recording hook
  - [x] 2.3 Add timestamp capture using `Date.now()` for each state transition with millisecond precision
  - [x] 2.4 Create the `components/recording-display.tsx` component with large color-coded state display (gray=neutral, green=looking, orange=looking away)
  - [x] 2.5 Create the `components/timer.tsx` component displaying elapsed time in HH:MM:SS.mmm format with `setInterval` updates
  - [x] 2.6 Build the main page (`app/page.tsx`) with recording display, timer, and Start/End Recording buttons
  - [x] 2.7 Add basic spacebar event listener in the main page to call toggleLookingState during active recording
  - [x] 2.8 Prevent default spacebar behavior (page scroll) when recording is active
  - [ ] 2.9 Update documentation with recording functionality details

- [x] 3.0 Data Management & Local Storage
  - [x] 3.1 Create the `hooks/use-local-storage.ts` hook with generic get/set functions for localStorage
  - [x] 3.2 Implement `saveTrials` function to persist Trial[] array to localStorage key "looking-time-recorder-trials"
  - [x] 3.3 Implement `loadTrials` function to retrieve and parse trials from localStorage on app initialization
  - [x] 3.4 Add auto-save functionality that saves trial data after each recording ends
  - [x] 3.5 Handle localStorage errors gracefully (quota exceeded, private browsing mode)
  - [ ] 3.6 Update documentation with data management details

- [ ] 4.0 Trial List & Management UI
  - [x] 4.1 Create the `components/new-trial-dialog.tsx` component with Input field for trial name
  - [x] 4.2 Add unique name validation in the new trial dialog (check against existing trial names)
  - [x] 4.3 Create the `components/trial-list.tsx` component using shadcn Table to display trials (name, duration, date, actions)
  - [x] 4.4 Add delete button for individual trials with confirmation dialog
  - [x] 4.5 Create `components/confirm-dialog.tsx` reusable confirmation dialog component
  - [x] 4.6 Add "Clear All Trials" button with confirmation dialog
  - [x] 4.7 Integrate trial list into main page below the recording interface
  - [x] 4.8 Show empty state message when no trials exist

- [x] 5.0 CSV Export Functionality
  - [x] 5.1 Create the `lib/csv-export.ts` file with CSV generation logic
  - [x] 5.2 Implement `generateCSV(trial: Trial)` function that formats data per PRD specification (Trial Name, Total Duration, Interval, Start Time, End Time, Duration)
  - [x] 5.3 Implement `downloadCSV(trial: Trial)` function using Blob and URL.createObjectURL()
  - [x] 5.4 Format filename as `trial-name_YYYY-MM-DD.csv`
  - [x] 5.5 Add Download CSV button to each trial row in the trial list
  - [x] 5.6 Handle edge case: trial with no looking intervals (export with header only or show message)

- [x] 6.0 Timeline Visualization
  - [x] 6.1 Create the `components/timeline-view.tsx` component with horizontal bar visualization
  - [x] 6.2 Implement color-coded segments: green for "Looking" periods, orange for "Looking Away" periods, gray for gaps
  - [x] 6.3 Add time markers along the timeline (e.g., every 10 seconds or adaptive based on duration)
  - [x] 6.4 Add "View Timeline" button (📊) to each trial row in the trial list
  - [x] 6.5 Show timeline in a Dialog or expandable section when clicked
  - [x] 6.6 Display timeline automatically after ending a recording (before saving)
  - [ ] 6.7 Update documentation with timeline visualization details

- [x] 7.0 Audio Feedback System
  - [x] 7.1 Create or source two short audio files: `look.mp3` (higher pitch ding) and `away.mp3` (lower pitch click)
  - [x] 7.2 Add audio files to `public/sounds/` directory
  - [x] 7.3 Create the `hooks/use-audio.ts` hook with preloaded Audio elements
  - [x] 7.4 Implement `playLookSound()` and `playAwaySound()` functions
  - [x] 7.5 Add mute state and `toggleMute()` function to the audio hook
  - [x] 7.6 Integrate audio hook into recording flow - play appropriate sound on each state toggle
  - [x] 7.7 Add mute/unmute button (🔊/🔇) to the UI near recording controls
  - [x] 7.8 Persist mute preference to localStorage
  - [ ] 7.9 Update documentation with audio feedback system details

- [x] 8.0 Keyboard Shortcuts & Polish
  - [x] 8.1 Create the `hooks/use-keyboard.ts` hook to centralize all keyboard event handling
  - [x] 8.2 Implement Escape key handler to cancel recording with confirmation dialog
  - [x] 8.3 Implement Enter key handler to start a new recording (opens new trial dialog when not recording)
  - [x] 8.4 Ensure keyboard shortcuts only work in appropriate states (e.g., spacebar only during recording)
  - [x] 8.5 Create the `components/keyboard-shortcuts.tsx` component showing shortcut legend (Spacebar, Enter, Escape)
  - [x] 8.6 Add shortcuts reference button/popover to the header
  - [x] 8.7 Add `beforeunload` event listener to warn user if they try to close browser during active recording
  - [x] 8.8 Add Toast notifications for key actions (recording started, recording saved, trial deleted)
  - [x] 8.9 Ensure focus management - prevent spacebar from triggering buttons while recording

- [ ] 9.0 Final Testing & Vercel Deployment
  - [x] 9.1 Test recording accuracy: verify timestamps are captured within 50ms of keypress
  - [x] 9.2 Test localStorage persistence: refresh browser and verify trials are preserved
  - [x] 9.3 Test CSV export: verify format matches PRD specification exactly
  - [ ] 9.4 Test cross-browser compatibility (Chrome, Firefox, Safari, Edge)
  - [x] 9.5 Test unique trial name validation and error handling
  - [x] 9.6 Test all keyboard shortcuts in various states
  - [x] 9.7 Test beforeunload warning during active recording
  - [x] 9.8 Run `npm run build` to verify production build succeeds
  - [ ] 9.9 Deploy to Vercel (`vercel` or connect GitHub repo to Vercel dashboard)
  - [ ] 9.10 Verify deployed app works correctly on Vercel
  - [ ] 9.11 Update documentation with any final notes and deployment URL
