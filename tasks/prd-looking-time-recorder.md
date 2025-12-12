# Product Requirements Document: Looking Time Recorder

## 1. Introduction/Overview

**Looking Time Recorder** is a web application designed for child psychology researchers conducting in-person experiments. The app allows researchers to precisely track and record when a child is looking at a stimulus versus looking away during an experiment.

The application mimics a voice recorder interface but instead of recording audio, it records "looking time" data. Researchers toggle between "Looking" and "Looking Away" states using the spacebar while observing the child, then export the timing data as a CSV file for analysis.

**Problem Solved:** Currently, researchers may use stopwatches, paper-based tracking, or complex software to record looking times. This app provides a simple, purpose-built solution that is easy to use during live experiments and produces clean, analyzable data.

---

## 2. Goals

1. **Simplify data collection** - Provide an intuitive, distraction-free interface for recording looking time during live experiments
2. **Ensure data accuracy** - Capture precise timestamps (to milliseconds) for each state transition
3. **Enable easy data export** - Generate properly formatted CSV files ready for statistical analysis
4. **Support multiple trials** - Allow researchers to manage multiple trials in a single session
5. **Persist data locally** - Store trial data in browser local storage so researchers don't lose work if they accidentally close the tab
6. **Deploy to Vercel** - Host the application for easy access from any device with a browser

---

## 3. User Stories

### US-1: Start a New Trial
> As a researcher, I want to start a new recording trial with a custom name, so that I can identify this trial later when reviewing my data.

### US-2: Record Looking Time
> As a researcher, I want to press the spacebar to toggle between "Looking" and "Looking Away" states, so that I can accurately capture when the child's attention shifts during the experiment.

### US-3: See Visual Feedback
> As a researcher, I want to see clear visual feedback (color changes, state display) when I toggle states, so that I know my input was registered without looking away from the child.

### US-4: Hear Audio Feedback
> As a researcher, I want to hear a subtle audio cue when I toggle states, so that I have confirmation without needing to look at the screen.

### US-5: End Recording
> As a researcher, I want to stop the recording and see a summary of the trial, so that I can verify the data before saving.

### US-6: View Timeline Visualization
> As a researcher, I want to see a visual timeline/graph showing the looking periods, so that I can quickly verify the recorded data is accurate before downloading.

### US-7: Manage Multiple Trials
> As a researcher, I want to view a list of all my trials in the current session, so that I can manage, review, or download any of them.

### US-8: Download Trial Data
> As a researcher, I want to download a CSV file containing the trial name, total duration, and all looking intervals, so that I can analyze the data in statistical software.

### US-9: Cancel Recording
> As a researcher, I want to be able to cancel a recording in progress (using Escape key), so that I can abort if something goes wrong during the experiment.

### US-10: Data Persistence
> As a researcher, I want my trial data to persist in the browser even if I accidentally close the tab, so that I don't lose my work.

---

## 4. Functional Requirements

### 4.1 Trial Management

| ID | Requirement |
|----|-------------|
| FR-1 | The system must allow users to create a new trial with a custom name |
| FR-2 | The system must display a list of all trials stored in the current browser (local storage) |
| FR-3 | The system must allow users to delete individual trials from the list |
| FR-4 | The system must persist all trial data to browser local storage |
| FR-5 | The system must load existing trials from local storage on app initialization |

### 4.2 Recording Functionality

| ID | Requirement |
|----|-------------|
| FR-6 | The system must display a "Start Recording" button to begin a new trial |
| FR-7 | The system must display an "End Recording" button to stop the current trial |
| FR-8 | The system must start in a "Neutral" state (no looking state) when recording begins |
| FR-9 | The system must toggle to "Looking" state on the first spacebar press |
| FR-10 | The system must toggle between "Looking" and "Looking Away" states on subsequent spacebar presses |
| FR-11 | The system must record the timestamp of each state transition with millisecond precision |
| FR-12 | The system must display a running timer showing elapsed time since recording started |
| FR-13 | The system must display the current state prominently (Neutral / Looking / Looking Away) |

### 4.3 Visual & Audio Feedback

| ID | Requirement |
|----|-------------|
| FR-14 | The system must change the background/accent color based on current state (e.g., green for Looking, red/orange for Looking Away, gray for Neutral) |
| FR-15 | The system must play a subtle, distinct audio cue when toggling to "Looking" |
| FR-16 | The system must play a different subtle audio cue when toggling to "Looking Away" |
| FR-17 | The system should allow users to mute/unmute audio feedback |

### 4.4 Keyboard Shortcuts

| ID | Requirement |
|----|-------------|
| FR-18 | Spacebar: Toggle between Looking and Looking Away states (only during active recording) |
| FR-19 | Escape: Cancel the current recording (with confirmation dialog) |
| FR-20 | Enter: Start a new recording (when not currently recording) |
| FR-21 | The system must display a keyboard shortcut reference/legend on the UI |

### 4.5 Timeline Visualization

| ID | Requirement |
|----|-------------|
| FR-22 | The system must display a horizontal timeline bar showing looking periods after recording ends |
| FR-23 | The timeline must use color coding to distinguish "Looking" periods from "Looking Away" periods |
| FR-24 | The timeline must show time markers for reference |
| FR-25 | The timeline should be viewable for any saved trial from the trial list |

### 4.6 CSV Export

| ID | Requirement |
|----|-------------|
| FR-26 | The system must provide a "Download CSV" button for each completed trial |
| FR-27 | The CSV must include the trial name |
| FR-28 | The CSV must include the total trial duration in timestamp format (HH:MM:SS.mmm) |
| FR-29 | The CSV must include each "Looking" interval with start time and end time |
| FR-30 | All times in the CSV must be in timestamp format (HH:MM:SS.mmm) |
| FR-31 | The CSV filename must include the trial name and date (e.g., `trial-name_2025-12-11.csv`) |

### 4.7 CSV Format Specification

The exported CSV should have the following structure:

```csv
Trial Name,Total Duration,Interval,Start Time,End Time,Duration
"Child_001_Session_A","00:02:34.500","1","00:00:02.100","00:00:15.300","00:00:13.200"
"Child_001_Session_A","00:02:34.500","2","00:00:22.450","00:00:45.120","00:00:22.670"
"Child_001_Session_A","00:02:34.500","3","00:01:02.000","00:01:30.800","00:00:28.800"
```

**Columns:**
- **Trial Name**: The user-defined name for the trial
- **Total Duration**: Total length of the recording session
- **Interval**: Sequential number of the looking interval (1, 2, 3...)
- **Start Time**: When the child started looking (timestamp from recording start)
- **End Time**: When the child stopped looking (timestamp from recording start)
- **Duration**: Length of this looking interval

---

## 5. Non-Goals (Out of Scope)

The following are explicitly **NOT** included in v1:

1. **User authentication / accounts** - No login system; data is stored locally only
2. **Cloud sync** - Data does not sync across devices
3. **Video recording integration** - No webcam or video capture
4. **Multiple simultaneous observers** - Only single-user recording
5. **Custom keyboard bindings** - Fixed keyboard shortcuts only
6. **Data analysis features** - No built-in statistics; export to CSV for external analysis
7. **Mobile-optimized experience** - Desktop/laptop focus (spacebar requirement)
8. **Offline PWA mode** - Requires internet connection to load app
9. **Batch export** - Download one trial at a time (no bulk export)
10. **Import existing data** - No CSV import functionality

---

## 6. Design Considerations

### 6.1 UI Framework
- **Use shadcn/ui components** throughout the application
- Leverage shadcn's Button, Card, Dialog, Input, Table, and Toast components
- Use Tailwind CSS for custom styling

### 6.2 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Looking Time Recorder"            [Shortcuts] [?] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              CURRENT STATE DISPLAY                  │   │
│  │           (Large, color-coded area)                 │   │
│  │                                                     │   │
│  │              ● LOOKING (green)                      │   │
│  │              ○ LOOKING AWAY (orange)                │   │
│  │              ◐ NEUTRAL (gray)                       │   │
│  │                                                     │   │
│  │                  00:01:23.456                       │   │
│  │                  (elapsed time)                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│     [🔊 Mute]     [Start Recording]     [End Recording]    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Trial List                                    [+ New Trial]│
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Trial Name          Duration    Date       Actions  │   │
│  │ Child_001_A         02:34.5     Dec 11     📊 ⬇️ 🗑️  │   │
│  │ Child_001_B         01:45.2     Dec 11     📊 ⬇️ 🗑️  │   │
│  │ Child_002_A         03:12.8     Dec 11     📊 ⬇️ 🗑️  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📊 = View Timeline  ⬇️ = Download CSV  🗑️ = Delete        │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Color Scheme
| State | Background Color | Text |
|-------|-----------------|------|
| Neutral | Gray (slate-200) | "Waiting..." |
| Looking | Green (green-500) | "LOOKING" |
| Looking Away | Orange (orange-500) | "LOOKING AWAY" |

### 6.4 Audio Cues
- **Looking**: Short, pleasant "ding" sound (higher pitch)
- **Looking Away**: Short, distinct "click" sound (lower pitch)
- Sounds should be subtle and non-intrusive (< 0.3 seconds)

---

## 7. Technical Considerations

### 7.1 Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: React useState/useReducer (no external library needed)
- **Storage**: Browser localStorage API
- **Deployment**: Vercel

### 7.2 Key Technical Notes

1. **Keyboard Event Handling**
   - Use `useEffect` to attach/detach keydown listeners
   - Prevent default spacebar behavior (page scroll)
   - Ensure keyboard events only fire when recording is active

2. **Timestamp Precision**
   - Use `performance.now()` or `Date.now()` for millisecond precision
   - Store timestamps as milliseconds internally, format for display/export

3. **Local Storage Schema**
   ```typescript
   interface Trial {
     id: string;
     name: string;
     createdAt: string; // ISO date string
     totalDuration: number; // milliseconds
     intervals: LookingInterval[];
   }

   interface LookingInterval {
     startTime: number; // ms from recording start
     endTime: number;   // ms from recording start
   }

   // localStorage key: "looking-time-recorder-trials"
   // Value: JSON.stringify(Trial[])
   ```

4. **Audio Implementation**
   - Use Web Audio API or simple `<audio>` elements
   - Preload sounds on app initialization to avoid delay

5. **CSV Generation**
   - Generate CSV client-side using JavaScript
   - Use `Blob` and `URL.createObjectURL()` for download

### 7.3 File Structure (Suggested)
```
/app
  /page.tsx              # Main recording interface
  /layout.tsx            # Root layout with metadata
  /globals.css           # Global styles
/components
  /recording-display.tsx # Large state display component
  /timer.tsx             # Elapsed time display
  /trial-list.tsx        # Table of saved trials
  /timeline-view.tsx     # Visual timeline component
  /keyboard-shortcuts.tsx # Shortcuts reference
  /new-trial-dialog.tsx  # Dialog for naming new trial
/hooks
  /use-recording.ts      # Recording state & logic
  /use-local-storage.ts  # localStorage persistence
  /use-keyboard.ts       # Keyboard event handling
  /use-audio.ts          # Audio feedback
/lib
  /utils.ts              # Utility functions
  /csv-export.ts         # CSV generation logic
  /types.ts              # TypeScript interfaces
/public
  /sounds
    /look.mp3            # Looking sound
    /away.mp3            # Looking away sound
```

---

## 8. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| App loads successfully | 100% | Vercel deployment status |
| Recording accuracy | < 50ms latency from keypress to timestamp | Manual testing |
| CSV export works | 100% of trials exportable | Manual testing |
| Local storage persistence | Data survives browser refresh | Manual testing |
| Usability | Researcher can complete a trial without instructions | User testing with 2-3 researchers |

---

## 9. Open Questions

1. **Maximum trial length?** - Should there be a limit on how long a single trial can be? (Currently no limit planned)

A: No limit.

2. **Trial naming conventions** - Should we enforce any naming format, or allow free-form text?

A: free form text.

3. **Duplicate trial names** - Allow duplicates, or require unique names?

A: require unique names

4. **Clear all data** - Should there be a "Clear all trials" button, or only individual delete?

A: clear all trials button AND individual delete buttons

5. **Confirmation before leaving** - Show warning if user tries to close browser with unsaved (in-progress) recording?

A: Yes, show warning.

6. **Accessibility** - Any specific accessibility requirements beyond standard practices?

A: No specific requirements beyond standard practices.

7. **Cross-browser compatibility** - Should the app work across all major browsers?

A: Yes, cross-browser compatibility.

8. **Performance optimization** - Should the app be optimized for performance?

A: Yes, performance optimization.

---

## 10. Implementation Phases

### Phase 1: Core Recording (MVP)
- Basic UI with recording controls
- Spacebar toggle functionality
- State display with colors
- Timer display
- Single trial recording and completion

### Phase 2: Data Management
- Local storage persistence
- Trial list view
- Delete trial functionality
- Trial naming

### Phase 3: Export & Visualization
- CSV export functionality
- Timeline visualization
- View timeline for past trials

### Phase 4: Polish & Feedback
- Audio feedback
- Keyboard shortcuts (Escape, Enter)
- Shortcuts reference display
- Mute toggle

### Phase 5: Deployment
- Vercel deployment
- Final testing and bug fixes

---

*Document created: December 11, 2025*
*Last updated: December 11, 2025*
