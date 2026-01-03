import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ImageBackground,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { Colors } from '../constants';
import { useTimer, useStats } from '../context';

const { width, height } = Dimensions.get('window');
const shortSide = Math.min(width, height);
const isTablet = shortSide >= 600;
const isSmallTablet = shortSide >= 600 && shortSide < 700;

const phoneBackground = require('../assets/images/Phone2.png');
const tabletBackground = require('../assets/images/Tablet.png');
const tabletLandscapeBackground = require('../assets/images/Tablet2.png');

type TimerState = 'idle' | 'focus' | 'focusComplete' | 'break' | 'breakComplete' | 'completed';

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatTimeDisplay = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Time Picker Component
const TimePicker = ({
  visible,
  onClose,
  onSelect,
  initialSeconds
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (seconds: number) => void;
  initialSeconds: number;
}) => {
  const hours = Math.floor(initialSeconds / 3600);
  const minutes = Math.floor((initialSeconds % 3600) / 60);
  const seconds = initialSeconds % 60;

  const [selectedHour, setSelectedHour] = useState(hours);
  const [selectedMinute, setSelectedMinute] = useState(minutes);
  const [selectedSecond, setSelectedSecond] = useState(seconds);

  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);
  const secondRef = useRef<ScrollView>(null);

  const itemHeight = 50;

  useEffect(() => {
    if (visible) {
      setSelectedHour(hours);
      setSelectedMinute(minutes);
      setSelectedSecond(seconds);
      setTimeout(() => {
        hourRef.current?.scrollTo({ y: hours * itemHeight, animated: false });
        minuteRef.current?.scrollTo({ y: minutes * itemHeight, animated: false });
        secondRef.current?.scrollTo({ y: seconds * itemHeight, animated: false });
      }, 100);
    }
  }, [visible]);

  const handleConfirm = () => {
    const totalSeconds = selectedHour * 3600 + selectedMinute * 60 + selectedSecond;
    onSelect(totalSeconds > 0 ? totalSeconds : 60);
    onClose();
  };

  const renderPickerColumn = (
    ref: React.RefObject<ScrollView>,
    values: number[],
    selected: number,
    onSelectValue: (val: number) => void
  ) => (
    <View style={pickerStyles.column}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
          const val = values[Math.max(0, Math.min(index, values.length - 1))];
          onSelectValue(val);
        }}
        contentContainerStyle={{ paddingVertical: itemHeight }}
      >
        {values.map((val) => (
          <View key={val} style={pickerStyles.item}>
            <Text style={[
              pickerStyles.itemText,
              selected === val && pickerStyles.selectedText
            ]}>
              {val.toString().padStart(2, '0')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);
  const secondsArray = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.container}>
          <View style={pickerStyles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={pickerStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={pickerStyles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
          <View style={pickerStyles.pickerRow}>
            {renderPickerColumn(hourRef, hoursArray, selectedHour, setSelectedHour)}
            <Text style={pickerStyles.separator}>:</Text>
            {renderPickerColumn(minuteRef, minutesArray, selectedMinute, setSelectedMinute)}
            <Text style={pickerStyles.separator}>:</Text>
            {renderPickerColumn(secondRef, secondsArray, selectedSecond, setSelectedSecond)}
          </View>
          <View style={pickerStyles.labels}>
            <Text style={pickerStyles.labelText}>hours</Text>
            <Text style={pickerStyles.labelText}>min</Text>
            <Text style={pickerStyles.labelText}>sec</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Drawing Modal Component
const DrawingModal = ({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (imageUri: string) => void;
}) => {
  const canvasSize = isTablet ? 350 : 250;
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isErasing, setIsErasing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  const colors = ['#000000', '#667E52', '#E88B8B', '#F7E96C', '#8BBFEA'];

  const handleTouchStart = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    // Validate coordinates are valid numbers
    if (typeof locationX === 'number' && typeof locationY === 'number' && !isNaN(locationX) && !isNaN(locationY)) {
      setCurrentPath(`M${locationX},${locationY}`);
    }
  };

  const handleTouchMove = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    // Validate coordinates are valid numbers
    if (typeof locationX === 'number' && typeof locationY === 'number' && !isNaN(locationX) && !isNaN(locationY)) {
      setCurrentPath(prev => {
        // Only add to path if we have a valid starting point
        if (prev && prev.startsWith('M')) {
          return `${prev} L${locationX},${locationY}`;
        }
        return prev;
      });
    }
  };

  const handleTouchEnd = () => {
    if (currentPath && currentPath.startsWith('M') && !currentPath.includes('undefined')) {
      // Use white color when erasing, otherwise use selected color
      // Format: path|color|strokeWidth
      const strokeColor = isErasing ? '#FFFFFF' : selectedColor;
      const strokeWidth = isErasing ? 7 : 3;
      setPaths(prev => [...prev, `${currentPath}|${strokeColor}|${strokeWidth}`]);
      setCurrentPath('');
    } else {
      setCurrentPath('');
    }
  };


  const handleClose = () => {
    setPaths([]);
    setCurrentPath('');
    setIsErasing(false);
    onClose();
  };

  const handleSave = async () => {
    if (paths.length === 0) {
      handleClose();
      return;
    }

    setIsSaving(true);
    try {
      // Capture the canvas as an image
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        onSave(uri);
      }
    } catch (error) {
      if (__DEV__) console.error('Error capturing drawing:', error);
    } finally {
      setIsSaving(false);
      setPaths([]);
      setCurrentPath('');
      setIsErasing(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={drawStyles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={drawStyles.container}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <TouchableOpacity style={drawStyles.closeButton} onPress={handleClose}>
            <Text style={drawStyles.closeText}>✕</Text>
          </TouchableOpacity>

          <Text style={drawStyles.title}>Add a drawing to your gallery!</Text>

          <View style={drawStyles.canvasRow}>
            <View style={drawStyles.colorPicker}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    drawStyles.colorButton,
                    { backgroundColor: color },
                    selectedColor === color && !isErasing && drawStyles.colorButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedColor(color);
                    setIsErasing(false);
                  }}
                />
              ))}
            </View>

            <View
              style={[drawStyles.canvas, { width: canvasSize, height: canvasSize }]}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <ViewShot
                ref={viewShotRef}
                options={{ format: 'jpg', quality: 0.9 }}
                style={[StyleSheet.absoluteFill, { backgroundColor: '#fff' }]}
              >
                <Svg
                  style={StyleSheet.absoluteFill}
                  viewBox={`0 0 ${canvasSize} ${canvasSize}`}
                >
                  {paths.map((pathData, index) => {
                    const [path, color, width] = pathData.split('|');
                    // Skip invalid paths
                    if (!path || path.includes('undefined') || !path.startsWith('M')) {
                      return null;
                    }
                    return (
                      <Path
                        key={index}
                        d={path}
                        stroke={color || selectedColor}
                        strokeWidth={width ? parseInt(width) : 3}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                  {currentPath && currentPath.startsWith('M') && !currentPath.includes('undefined') && (
                    <Path
                      d={currentPath}
                      stroke={isErasing ? '#FFFFFF' : selectedColor}
                      strokeWidth={isErasing ? 7 : 3}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </Svg>
              </ViewShot>
              <TouchableOpacity
                style={[drawStyles.eraserButton, isErasing && drawStyles.eraserButtonActive]}
                onPress={() => setIsErasing(!isErasing)}
              >
                <View style={drawStyles.eraserIcon}>
                  <View style={drawStyles.eraserTop} />
                  <View style={drawStyles.eraserBottom} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[drawStyles.saveButton, isSaving && drawStyles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={drawStyles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default function TimerScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  // Use the shorter dimension to detect tablet - phones have shorter side < 500
  const shortSide = Math.min(windowWidth, windowHeight);
  const isTabletDevice = shortSide >= 600;

  const { timerState: contextTimerState, setTimerState: setContextTimerState } = useTimer();
  const { settings } = useStats();
  const [timerState, setLocalTimerState] = useState<TimerState>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [focusTime, setFocusTime] = useState(settings.defaultFocusTime);
  const [breakTime, setBreakTime] = useState(settings.defaultBreakTime);
  const [currentTime, setCurrentTime] = useState(0);
  const [showFocusPicker, setShowFocusPicker] = useState(false);
  const [showBreakPicker, setShowBreakPicker] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [completedFocusTime, setCompletedFocusTime] = useState(0);
  const [completedBreakTime, setCompletedBreakTime] = useState(0);
  const [focusReached, setFocusReached] = useState(false);
  const [breakReached, setBreakReached] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local timer state with context (for user-initiated changes)
  const setTimerState = (state: TimerState) => {
    setLocalTimerState(state);
    setContextTimerState(state);
  };

  // Sync context whenever local timer state changes
  useEffect(() => {
    setContextTimerState(timerState);
  }, [timerState]);

  // Listen for context reset (when user confirms leaving)
  useEffect(() => {
    if (contextTimerState === 'idle' && timerState !== 'idle') {
      setLocalTimerState('idle');
      setIsPaused(false);
      setCurrentTime(0);
      setFocusReached(false);
      setBreakReached(false);
    }
  }, [contextTimerState]);

  // Update default times when settings change and timer is idle
  useEffect(() => {
    if (timerState === 'idle') {
      setFocusTime(settings.defaultFocusTime);
      setBreakTime(settings.defaultBreakTime);
    }
  }, [settings.defaultFocusTime, settings.defaultBreakTime, timerState]);

  // Determine background based on device and orientation
  const getBackground = () => {
    if (isTabletDevice && isLandscape) {
      return tabletLandscapeBackground;
    } else if (isTabletDevice) {
      return tabletBackground;
    }
    return phoneBackground;
  };

  useEffect(() => {
    if ((timerState === 'focus' || timerState === 'focusComplete' || timerState === 'break' || timerState === 'breakComplete') && !isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (timerState === 'focus' || timerState === 'focusComplete') {
            // Focus counts UP
            const newTime = prev + 1;
            if (newTime >= focusTime && !focusReached) {
              setFocusReached(true);
              setLocalTimerState('focusComplete');
            }
            return newTime;
          } else if (timerState === 'break' || timerState === 'breakComplete') {
            // Break counts UP
            const newTime = prev + 1;
            if (newTime >= breakTime && !breakReached) {
              setBreakReached(true);
              setLocalTimerState('breakComplete');
            }
            return newTime;
          }
          return prev;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState, isPaused, focusTime, breakTime, focusReached, breakReached]);

  const handleStart = () => {
    setTimerState('focus');
    setCurrentTime(0);
    setIsPaused(false);
    setFocusReached(false);
  };

  const handleStartBreak = () => {
    setCompletedFocusTime(currentTime);
    // Track focus time stats
    addFocusTime(currentTime);
    incrementFocusSessions();
    setTimerState('break');
    setCurrentTime(0);
    setIsPaused(false);
    setBreakReached(false);
  };

  const handleEndBreak = () => {
    setCompletedBreakTime(currentTime);
    // Track break time stats
    addBreakTime(currentTime);
    incrementBreakSessions();
    setTimerState('completed');
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleDone = () => {
    // Reset everything
    setTimerState('idle');
    setIsPaused(false);
    setCurrentTime(0);
    setCompletedFocusTime(0);
    setCompletedBreakTime(0);
    setFocusReached(false);
    setBreakReached(false);
  };

  const { addToGallery, addFocusTime, addBreakTime, incrementFocusSessions, incrementBreakSessions } = useStats();

  const handleSaveDrawing = async (imageUri: string) => {
    if (imageUri) {
      // Upload the captured drawing image to Supabase storage
      await addToGallery(imageUri);
    }
  };

  return (
    <ImageBackground
      source={getBackground()}
      style={styles.container}
      imageStyle={{ width: '100%', height: '100%' }}
    >
      <View style={[styles.content, isTabletDevice && { paddingTop: 100 }]}>
        {timerState === 'idle' && (
          <>
            <View style={styles.timersRow}>
              {/* Focus Timer */}
              <View style={styles.timerBlock}>
                <Text style={[styles.timerLabel, isTabletDevice && isLandscape && { fontSize: 22 }]}>Focus</Text>
                <TouchableOpacity
                  style={styles.timeDisplay}
                  onPress={() => setShowFocusPicker(true)}
                >
                  <Text style={[styles.timeText, isTabletDevice && isLandscape && { fontSize: 38 }]}>{formatTimeDisplay(focusTime)}</Text>
                  <Text style={[styles.dropdownArrow, isTabletDevice && isLandscape && { fontSize: 12 }]}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Break Timer */}
              <View style={styles.timerBlock}>
                <Text style={[styles.timerLabel, isTabletDevice && isLandscape && { fontSize: 22 }]}>Break</Text>
                <TouchableOpacity
                  style={styles.timeDisplay}
                  onPress={() => setShowBreakPicker(true)}
                >
                  <Text style={[styles.timeText, isTabletDevice && isLandscape && { fontSize: 38 }]}>{formatTimeDisplay(breakTime)}</Text>
                  <Text style={[styles.dropdownArrow, isTabletDevice && isLandscape && { fontSize: 12 }]}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.startButton, isTabletDevice && isLandscape && { paddingVertical: 8, paddingHorizontal: 35 }]} onPress={handleStart}>
              <Text style={[styles.startButtonText, isTabletDevice && isLandscape && { fontSize: 18 }]}>start</Text>
            </TouchableOpacity>
          </>
        )}

        {(timerState === 'focus' || timerState === 'focusComplete' || timerState === 'break' || timerState === 'breakComplete') && (
          <>
            <View style={styles.activeTimerContainer}>
              <Text style={styles.activeTimerLabel}>
                {(timerState === 'break' || timerState === 'breakComplete') ? 'Break' : 'Focus'}
              </Text>
              <Text style={styles.activeTimeText}>{formatTime(currentTime)}</Text>
              {timerState === 'focusComplete' && (
                <Text style={styles.focusCompleteText}>
                  Focus time completed! Would you like to start break?
                </Text>
              )}
              {timerState === 'breakComplete' && (
                <Text style={styles.breakCompleteText}>
                  Your break time is over!
                </Text>
              )}
            </View>

            <View style={styles.buttonsRow}>
              {timerState === 'focusComplete' ? (
                <TouchableOpacity
                  style={styles.startBreakButton}
                  onPress={handleStartBreak}
                >
                  <Text style={styles.startBreakButtonText}>start break</Text>
                </TouchableOpacity>
              ) : timerState === 'breakComplete' ? (
                <TouchableOpacity
                  style={styles.endBreakButton}
                  onPress={handleEndBreak}
                >
                  <Text style={styles.endBreakButtonText}>end break</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.pauseButton,
                      isPaused && styles.resumeButton
                    ]}
                    onPress={handlePause}
                  >
                    <Text style={styles.pauseButtonText}>
                      {isPaused ? 'resume' : 'pause'}
                    </Text>
                  </TouchableOpacity>

                  {timerState === 'focus' && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => {
                        setTimerState('idle');
                        setIsPaused(false);
                        setCurrentTime(0);
                        setFocusReached(false);
                      }}
                    >
                      <Text style={styles.backButtonText}>back</Text>
                    </TouchableOpacity>
                  )}

                  {timerState === 'break' && !isPaused && (
                    <TouchableOpacity
                      style={styles.drawButton}
                      onPress={() => setShowDrawing(true)}
                    >
                      <Text style={styles.drawButtonText}>Draw</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </>
        )}

        {timerState === 'completed' && (
          <>
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>
                Great work! You completed your focus session.
              </Text>
            </View>

            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TimePicker
        visible={showFocusPicker}
        onClose={() => setShowFocusPicker(false)}
        onSelect={(seconds) => {
          setFocusTime(seconds);
        }}
        initialSeconds={focusTime}
      />

      <TimePicker
        visible={showBreakPicker}
        onClose={() => setShowBreakPicker(false)}
        onSelect={(seconds) => {
          setBreakTime(seconds);
        }}
        initialSeconds={breakTime}
      />

      <DrawingModal
        visible={showDrawing}
        onClose={() => setShowDrawing(false)}
        onSave={handleSaveDrawing}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: isTablet ? 80 : 40,
  },
  timerBlock: {
    alignItems: 'center',
  },
  timerLabel: {
    fontFamily: 'Mini',
    fontSize: isSmallTablet ? 26 : isTablet ? 32 : 24,
    color: '#6B6B6B',
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: 'Mini',
    fontSize: isSmallTablet ? 46 : isTablet ? 56 : 40,
    color: '#6B6B6B',
  },
  dropdownArrow: {
    fontSize: isTablet ? 20 : 14,
    color: '#6B6B6B',
    marginLeft: 5,
    marginTop: isTablet ? 5 : 0,
  },
  startButton: {
    backgroundColor: '#93A9AC',
    paddingVertical: isSmallTablet ? 10 : isTablet ? 12 : 8,
    paddingHorizontal: isSmallTablet ? 45 : isTablet ? 55 : 40,
    borderRadius: 25,
    marginTop: isTablet ? 40 : 30,
  },
  startButtonText: {
    fontFamily: 'Mini',
    fontSize: isSmallTablet ? 22 : isTablet ? 26 : 20,
    color: '#fff',
  },
  activeTimerContainer: {
    alignItems: 'center',
  },
  focusCompleteText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 22 : 16,
    color: Colors.darkGreen,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 30,
  },
  breakCompleteText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 22 : 16,
    color: Colors.darkGreen,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 30,
  },
  activeTimerLabel: {
    fontFamily: 'Mini',
    fontSize: isSmallTablet ? 26 : isTablet ? 32 : 24,
    color: '#6B6B6B',
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  activeTimeText: {
    fontFamily: 'Mini',
    fontSize: isSmallTablet ? 46 : isTablet ? 56 : 40,
    color: '#6B6B6B',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: isTablet ? 40 : 30,
  },
  pauseButton: {
    backgroundColor: '#99AD8C',
    paddingVertical: isTablet ? 10 : 7,
    paddingHorizontal: isTablet ? 50 : 35,
    borderRadius: 25,
  },
  resumeButton: {
    backgroundColor: '#93A9AC',
  },
  pauseButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 24 : 18,
    color: '#fff',
  },
  backButton: {
    backgroundColor: '#93A9AC',
    paddingVertical: isTablet ? 10 : 7,
    paddingHorizontal: isTablet ? 50 : 35,
    borderRadius: 25,
  },
  backButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 24 : 18,
    color: '#fff',
  },
  startBreakButton: {
    backgroundColor: '#93A9AC',
    paddingVertical: isTablet ? 10 : 7,
    paddingHorizontal: isTablet ? 50 : 35,
    borderRadius: 25,
  },
  startBreakButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 24 : 18,
    color: '#fff',
  },
  endBreakButton: {
    backgroundColor: '#93A9AC',
    paddingVertical: isTablet ? 10 : 7,
    paddingHorizontal: isTablet ? 50 : 35,
    borderRadius: 25,
  },
  endBreakButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 24 : 18,
    color: '#fff',
  },
  drawButton: {
    backgroundColor: '#93A9AC',
    paddingVertical: isTablet ? 10 : 7,
    paddingHorizontal: isTablet ? 50 : 35,
    borderRadius: 25,
  },
  drawButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 24 : 18,
    color: '#fff',
  },
  completedContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completedText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 28 : 20,
    color: Colors.darkGreen,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: '#E88B8B',
    paddingVertical: isTablet ? 10 : 7,
    paddingHorizontal: isTablet ? 50 : 35,
    borderRadius: 25,
    marginTop: isTablet ? 40 : 30,
  },
  doneButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 24 : 18,
    color: '#fff',
  },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: isTablet ? '50%' : '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cancelText: {
    fontFamily: 'Mini',
    fontSize: 18,
    color: '#E88B8B',
  },
  confirmText: {
    fontFamily: 'Mini',
    fontSize: 18,
    color: Colors.darkGreen,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
  },
  column: {
    width: 55,
    height: 150,
    overflow: 'hidden',
  },
  item: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontFamily: 'Mini',
    fontSize: 24,
    color: '#ccc',
  },
  selectedText: {
    color: '#000',
    fontSize: 28,
  },
  separator: {
    fontFamily: 'Mini',
    fontSize: 28,
    color: '#000',
    marginHorizontal: 2,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingHorizontal: 30,
  },
  labelText: {
    fontFamily: 'Mini',
    fontSize: 14,
    color: '#666',
  },
});

const drawStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    paddingTop: 60,
    width: isTablet ? '60%' : '90%',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 15,
    zIndex: 1,
  },
  closeText: {
    fontSize: 24,
    color: '#000',
  },
  title: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 24 : 18,
    color: '#000',
    marginBottom: 20,
    marginTop: 0,
  },
  canvasRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  colorPicker: {
    marginRight: 15,
    gap: 10,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: '#999',
  },
  canvas: {
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  eraserButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eraserButtonActive: {
    borderWidth: 3,
    borderColor: '#999',
  },
  eraserIcon: {
    width: 18,
    height: 20,
    alignItems: 'center',
  },
  eraserTop: {
    width: 12,
    height: 8,
    backgroundColor: '#E88B8B',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  eraserBottom: {
    width: 16,
    height: 10,
    backgroundColor: '#666',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  saveButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginTop: 20,
    minWidth: 140,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 22 : 18,
    color: '#000',
  },
});
