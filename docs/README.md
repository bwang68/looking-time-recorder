# Looking Time Recorder - Documentation

A web application for child psychology researchers to record and track children's looking time during in-person experiments.

## Overview

Looking Time Recorder allows researchers to precisely track when a child is looking at a stimulus versus looking away during an experiment. The app uses a simple spacebar toggle interface and exports data as CSV files for analysis.

## Features

- **Recording Functionality**: Start/stop recording with visual timer display
- **Spacebar Toggle**: Toggle between "Looking" and "Looking Away" states
- **Data Persistence**: Trials saved to browser localStorage
- **CSV Export**: Download trial data in analysis-ready format
- **Timeline Visualization**: Visual representation of looking intervals
- **Audio Feedback**: Optional sound cues for state changes

## Getting Started

### Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Recording a Trial

1. Click "Start Recording" or press **Enter**
2. Enter a name for the trial
3. **Hold Spacebar** when the child is looking at the stimulus
4. **Release Spacebar** when the child looks away
5. Continue holding/releasing as needed
6. Click "End Recording" to save the trial
7. Download the CSV file for analysis

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Spacebar (Hold)** | Hold down = Looking, Release = Not Looking |
| **Enter** | Start new recording |
| **Escape** | Cancel current recording |

---

## Technical Documentation

### Recording Functionality

The recording system uses a state machine with the following states:

#### Recording Status
- `idle`: No active recording
- `recording`: Currently recording a trial

#### Looking States (during recording)
- `neutral`: Recording started but no spacebar pressed yet
- `looking`: Child is looking at stimulus (green)
- `lookingAway`: Child is looking away (orange)

### State Transitions

```
idle → START_RECORDING → recording (lookingAway)
recording (lookingAway) → HOLD_SPACE → recording (looking)
recording (looking) → RELEASE_SPACE → recording (lookingAway)
recording → END_RECORDING → idle
recording → CANCEL_RECORDING → idle
```

### Timestamp Precision

- All timestamps are captured using `Date.now()` for millisecond precision
- Elapsed time is calculated relative to the recording start time
- Timer updates every 10ms for smooth display

---

## Data Management

### Local Storage

Trial data is persisted to browser localStorage under the key `looking-time-recorder-trials`.

#### Data Schema

```typescript
interface Trial {
  id: string;           // Unique identifier
  name: string;         // User-defined trial name
  createdAt: string;    // ISO date string
  totalDuration: number; // Duration in milliseconds
  intervals: LookingInterval[];
}

interface LookingInterval {
  startTime: number;    // ms from recording start
  endTime: number;      // ms from recording start
}
```

### CSV Export Format

Exported CSV files contain the following columns:

| Column | Description |
|--------|-------------|
| Trial Name | User-defined name |
| Total Duration | HH:MM:SS.mmm format |
| Interval | Sequential number (1, 2, 3...) |
| Start Time | When looking started |
| End Time | When looking ended |
| Duration | Length of interval |

---

## Timeline Visualization

The timeline component displays a horizontal bar representation of the trial:

- **Green segments**: "Looking" periods
- **Orange segments**: "Looking Away" periods
- **Time markers**: Displayed at regular intervals

---

## Audio Feedback System

### Sound Cues

- **Looking**: Higher-pitched "ding" sound
- **Looking Away**: Lower-pitched "click" sound

### Mute Control

Audio can be toggled on/off using the mute button. The preference is saved to localStorage.

---

## Deployment

The application is deployed on Vercel.

### Build Commands

```bash
npm run build    # Production build
npm run start    # Start production server
```

---

*Last updated: December 11, 2025*
