import React, { createContext, useContext, useState, ReactNode } from 'react';

type TimerState = 'idle' | 'focus' | 'focusComplete' | 'break' | 'breakComplete' | 'completed';

interface TimerContextType {
  timerState: TimerState;
  setTimerState: (state: TimerState) => void;
  isTimerRunning: boolean;
  resetTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [timerState, setTimerState] = useState<TimerState>('idle');

  const isTimerRunning = timerState === 'focus' || timerState === 'focusComplete' ||
                          timerState === 'break' || timerState === 'breakComplete';

  const resetTimer = () => {
    setTimerState('idle');
  };

  return (
    <TimerContext.Provider value={{ timerState, setTimerState, isTimerRunning, resetTimer }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
