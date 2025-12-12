'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'looking-time-recorder-muted';

export interface UseAudioReturn {
  /** Play the "looking" sound */
  playLookSound: () => void;
  /** Play the "looking away" sound */
  playAwaySound: () => void;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Toggle mute state */
  toggleMute: () => void;
}

export function useAudio(): UseAudioReturn {
  const [isMuted, setIsMuted] = useState(false);
  const lookSoundRef = useRef<HTMLAudioElement | null>(null);
  const awaySoundRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load mute preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setIsMuted(JSON.parse(saved));
    }
  }, []);

  // Initialize audio context and create sounds
  useEffect(() => {
    // Create audio context for generating tones
    const createTone = (frequency: number, duration: number): string => {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const numSamples = sampleRate * duration;
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const channelData = buffer.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Simple sine wave with envelope
        const envelope = Math.min(1, Math.min(t * 20, (duration - t) * 20));
        channelData[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
      }

      // Convert to WAV data URL
      const wavData = bufferToWave(buffer, numSamples);
      audioContext.close();
      return wavData;
    };

    // Create audio elements with generated tones
    try {
      // Higher pitch "ding" for looking (880Hz)
      const lookDataUrl = createTone(880, 0.15);
      lookSoundRef.current = new Audio(lookDataUrl);
      lookSoundRef.current.volume = 0.5;

      // Lower pitch "click" for away (440Hz)
      const awayDataUrl = createTone(440, 0.1);
      awaySoundRef.current = new Audio(awayDataUrl);
      awaySoundRef.current.volume = 0.5;
    } catch (e) {
      console.warn('Could not initialize audio:', e);
    }

    return () => {
      lookSoundRef.current = null;
      awaySoundRef.current = null;
    };
  }, []);

  const playLookSound = useCallback(() => {
    if (!isMuted && lookSoundRef.current) {
      lookSoundRef.current.currentTime = 0;
      lookSoundRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [isMuted]);

  const playAwaySound = useCallback(() => {
    if (!isMuted && awaySoundRef.current) {
      awaySoundRef.current.currentTime = 0;
      awaySoundRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  return {
    playLookSound,
    playAwaySound,
    isMuted,
    toggleMute,
  };
}

// Helper function to convert AudioBuffer to WAV data URL
function bufferToWave(abuffer: AudioBuffer, len: number): string {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels: Float32Array[] = [];
  let sample: number;
  let offset = 0;
  let pos = 0;

  // Write WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // Write interleaved data
  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return (
    'data:audio/wav;base64,' +
    btoa(String.fromCharCode(...new Uint8Array(buffer)))
  );

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
