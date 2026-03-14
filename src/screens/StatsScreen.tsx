import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '../constants';
import { useStats, useAuth } from '../context';
import { Star, User, BookHeart, FileHeart } from 'lucide-react-native';

const displayLogo = require('../assets/images/displayLogo.png');

type TabType = 'stats' | 'settings';

const formatTime = (totalSeconds: number): string => {
  if (totalSeconds === 0) {
    return '00:00';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    const hoursStr = hours >= 100 ? hours.toString() : hours.toString().padStart(2, '0');
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  return `${minutesStr}:${secondsStr}`;
};

const formatTimeMinSec = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let result = '';
  if (hours > 0) result += `${hours} hr `;
  if (minutes > 0) result += `${minutes} min `;
  if (seconds > 0 && hours === 0) result += `${seconds} sec`;
  return result.trim() || '0 min';
};

// Security: Properly mask email to hide user info while keeping it recognizable
const maskEmail = (email: string | undefined | null): string => {
  if (!email || typeof email !== 'string') return 'Not logged in';

  const parts = email.split('@');
  if (parts.length !== 2) return 'Invalid email';

  const [localPart, domain] = parts;
  if (!localPart || !domain) return 'Invalid email';

  // For very short local parts, show first char + asterisks
  if (localPart.length <= 2) {
    return `${localPart[0]}${'*'.repeat(localPart.length)}@${domain}`;
  }

  // Show first 2 chars + asterisks for the rest
  return `${localPart.slice(0, 2)}${'*'.repeat(localPart.length - 2)}@${domain}`;
};

// Time Picker Component
const TimePicker = ({
  visible,
  onClose,
  onSelect,
  initialSeconds,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (seconds: number) => void;
  initialSeconds: number;
  title: string;
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
          <Text style={pickerStyles.title}>{title}</Text>
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
    width: '80%',
    maxWidth: 300,
  },
  title: {
    fontFamily: 'Mini',
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  cancelText: {
    fontFamily: 'Mini',
    fontSize: 16,
    color: '#E88B8B',
  },
  confirmText: {
    fontFamily: 'Mini',
    fontSize: 16,
    color: Colors.darkGreen,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
  },
  column: {
    width: 60,
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
    color: Colors.darkGreen,
    fontSize: 28,
  },
  separator: {
    fontFamily: 'Mini',
    fontSize: 28,
    color: Colors.darkGreen,
    marginHorizontal: 5,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 50,
    marginTop: 10,
  },
  labelText: {
    fontFamily: 'Mini',
    fontSize: 14,
    color: Colors.textDark,
  },
});

export default function StatsScreen() {
  const { width, height } = useWindowDimensions();
  // Use the shorter dimension to detect tablet - phones have shorter side < 500
  const shortSide = Math.min(width, height);
  const isTablet = shortSide >= 600;

  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [showAccountDetail, setShowAccountDetail] = useState(false);
  const [showPremiumDetail, setShowPremiumDetail] = useState(false);
  const { stats, settings, updateSettings } = useStats();
  const { user, signOut, deleteAccount } = useAuth();

  // Time picker state
  const [showFocusPicker, setShowFocusPicker] = useState(false);
  const [showBreakPicker, setShowBreakPicker] = useState(false);

  // Account action state
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            await signOut();
            setIsLoggingOut(false);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently delete all your data including flashcards, tasks, and stats. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This is your last chance. Delete your account permanently?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeletingAccount(true);
                    const result = await deleteAccount();
                    setIsDeletingAccount(false);
                    if (!result.success) {
                      Alert.alert('Error', result.error || 'Failed to delete account');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const dynamicStyles = {
    container: {
      paddingTop: isTablet ? 90 : 75,
    },
    title: {
      fontSize: isTablet ? 42 : 28,
    },
    tabButton: {
      paddingVertical: isTablet ? 14 : 10,
      paddingHorizontal: isTablet ? 32 : 18,
    },
    tabText: {
      fontSize: isTablet ? 18 : 14,
    },
    statCard: {
      padding: isTablet ? 28 : 18,
      minHeight: isTablet ? 160 : 120,
      borderRadius: isTablet ? 20 : 15,
    },
    statTitle: {
      fontSize: isTablet ? 16 : 14,
    },
    statValue: {
      fontSize: isTablet ? 38 : 26,
    },
    statSubtext: {
      fontSize: isTablet ? 14 : 10,
    },
    sectionTitle: {
      fontSize: isTablet ? 24 : 17,
      paddingHorizontal: isTablet ? 0 : 10,
    },
    settingText: {
      fontSize: isTablet ? 18 : 15,
    },
    logoSize: {
      width: isTablet ? 140 : 100,
      height: isTablet ? 140 : 100,
    },
    appDescription: {
      fontSize: isTablet ? 16 : 13,
    },
    scrollContent: {
      paddingHorizontal: isTablet ? 40 : 15,
    },
    statsRow: {
      gap: isTablet ? 20 : 12,
    },
    settingsCard: {
      padding: isTablet ? 10 : 5,
    },
    settingRow: {
      paddingVertical: isTablet ? 18 : 14,
      paddingHorizontal: isTablet ? 20 : 16,
    },
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['stats', 'settings'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            dynamicStyles.tabButton,
            activeTab === tab && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[
            styles.tabText,
            dynamicStyles.tabText,
            activeTab === tab && styles.tabTextActive,
          ]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatCard = (title: string, value: string | number, subtext?: string, bgColor?: string) => (
    <View style={[styles.statCard, dynamicStyles.statCard, { backgroundColor: bgColor || Colors.white }]}>
      <Text style={[styles.statValue, dynamicStyles.statValue]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[styles.statTitle, dynamicStyles.statTitle]}>{title}</Text>
      {subtext && <Text style={[styles.statSubtext, dynamicStyles.statSubtext]}>{subtext}</Text>}
    </View>
  );

  const renderStatsTab = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, dynamicStyles.scrollContent]}
      showsVerticalScrollIndicator={false}
    >
      {/* Timer Stats */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Timer</Text>
      <View style={[styles.statsRow, dynamicStyles.statsRow]}>
        {renderStatCard('Focus Time', formatTime(stats.totalFocusTime), `${stats.focusSessions} sessions`, Colors.white)}
        {renderStatCard('Break Time', formatTime(stats.totalBreakTime), `${stats.breakSessions} breaks`, Colors.white)}
      </View>

      {/* Flashcard Stats */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Flashcards</Text>
      <View style={[styles.statsRow, dynamicStyles.statsRow]}>
        {renderStatCard('Cards Created', stats.cardsCreated, undefined, Colors.white)}
        {renderStatCard('Cards Learned', stats.cardsLearned, undefined, Colors.white)}
      </View>
      <View style={[styles.statsRowSingle, dynamicStyles.statsRow]}>
        {renderStatCard('Quizzes Taken', stats.quizzesTaken, `${stats.quizzesPassed} perfect scores`, Colors.white)}
      </View>

      {/* Task Stats */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Tasks</Text>
      <View style={[styles.statsRow, dynamicStyles.statsRow]}>
        {renderStatCard('Tasks Created', stats.tasksCreated, undefined, Colors.white)}
        {renderStatCard('Tasks Completed', stats.tasksCompleted,
          stats.tasksCreated > 0 ? `${Math.round((stats.tasksCompleted / stats.tasksCreated) * 100)}%` : undefined,
          Colors.white
        )}
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, dynamicStyles.scrollContent]}
      showsVerticalScrollIndicator={false}
    >
      {/* Premium Section */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Premium</Text>
      <View style={[styles.settingsCard, dynamicStyles.settingsCard]}>
        <TouchableOpacity
          style={[styles.settingRow, dynamicStyles.settingRow, { borderBottomWidth: 0 }]}
          onPress={() => setShowPremiumDetail(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.mediumGreen }]}>
              <Star size={isTablet ? 16 : 14} color={Colors.white} fill={Colors.white} />
            </View>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>Unlock Pro Features</Text>
          </View>
          <Text style={[styles.settingValue, dynamicStyles.settingText, { opacity: 0.5 }]}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle, { marginTop: 25 }]}>Account</Text>
      <View style={[styles.settingsCard, dynamicStyles.settingsCard]}>
        <TouchableOpacity
          style={[styles.settingRow, dynamicStyles.settingRow, { borderBottomWidth: 0 }]}
          onPress={() => setShowAccountDetail(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.mediumGreen }]}>
              <View style={styles.settingIconInner}>
                <User size={isTablet ? 14 : 12} color={Colors.mediumGreen} fill={Colors.mediumGreen} />
              </View>
            </View>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>Email and password</Text>
          </View>
          <Text style={[styles.settingValue, dynamicStyles.settingText, { opacity: 0.5 }]}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle, { marginTop: 25 }]}>Timer Defaults</Text>
      <View style={[styles.settingsCard, dynamicStyles.settingsCard]}>
        <TouchableOpacity style={[styles.settingRow, dynamicStyles.settingRow]} onPress={() => setShowFocusPicker(true)}>
          <Text style={[styles.settingText, dynamicStyles.settingText]}>Default Focus Time</Text>
          <Text style={[styles.settingValue, dynamicStyles.settingText]}>{formatTimeMinSec(settings.defaultFocusTime)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, dynamicStyles.settingRow, { borderBottomWidth: 0 }]} onPress={() => setShowBreakPicker(true)}>
          <Text style={[styles.settingText, dynamicStyles.settingText]}>Default Break Time</Text>
          <Text style={[styles.settingValue, dynamicStyles.settingText]}>{formatTimeMinSec(settings.defaultBreakTime)}</Text>
        </TouchableOpacity>
      </View>

      <TimePicker
        visible={showFocusPicker}
        onClose={() => setShowFocusPicker(false)}
        onSelect={(seconds) => updateSettings({ defaultFocusTime: seconds })}
        initialSeconds={settings.defaultFocusTime}
        title="Default Focus Time"
      />
      <TimePicker
        visible={showBreakPicker}
        onClose={() => setShowBreakPicker(false)}
        onSelect={(seconds) => updateSettings({ defaultBreakTime: seconds })}
        initialSeconds={settings.defaultBreakTime}
        title="Default Break Time"
      />

      {/* App Description */}
      <View style={[styles.appInfoContainer, { paddingVertical: isTablet ? 20 : 15, paddingHorizontal: isTablet ? 20 : 15 }]}>
        <Text style={[styles.appName, { fontSize: isTablet ? 28 : 20, marginBottom: 12, textAlign: 'center' }]}>ScholarUp</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={displayLogo} style={[dynamicStyles.logoSize, { marginRight: isTablet ? 2 : -3 }]} resizeMode="contain" />
          <Text style={[styles.appDescription, dynamicStyles.appDescription, { flex: 1, lineHeight: isTablet ? 22 : 18, textAlign: 'left', letterSpacing: 0.5 }]}>
            Your cozy study companion. Focus timers, flashcards, task lists, and creative drawing breaks - all in one place. Level up your learning!
          </Text>
        </View>
        <Text style={[styles.versionText, { fontSize: isTablet ? 14 : 12, marginTop: 15, textAlign: 'center' }]}>Version 1.0.0</Text>
      </View>

      {/* Legal Section */}
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle, { marginTop: 25 }]}>Legal</Text>
      <View style={[styles.settingsCard, dynamicStyles.settingsCard]}>
        <TouchableOpacity style={[styles.settingRow, dynamicStyles.settingRow]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.mediumGreen }]}>
              <BookHeart size={isTablet ? 20 : 18} color={Colors.mediumGreen} fill={Colors.white} />
            </View>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>Privacy Policy</Text>
          </View>
          <Text style={[styles.settingValue, dynamicStyles.settingText, { opacity: 0.5 }]}>{'>'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, dynamicStyles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.mediumGreen }]}>
              <FileHeart size={isTablet ? 20 : 18} color={Colors.mediumGreen} fill={Colors.white} />
            </View>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>Terms of Service</Text>
          </View>
          <Text style={[styles.settingValue, dynamicStyles.settingText, { opacity: 0.5 }]}>{'>'}</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );

  const renderAccountDetail = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, dynamicStyles.scrollContent]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Email</Text>
      <View style={[styles.settingsCard, dynamicStyles.settingsCard]}>
        <View style={[styles.settingRow, dynamicStyles.settingRow, { borderBottomWidth: 0 }]}>
          <Text style={[styles.settingText, dynamicStyles.settingText]}>Email</Text>
          <Text style={[styles.settingValue, dynamicStyles.settingText, { opacity: 0.7 }]} numberOfLines={1}>
            {maskEmail(user?.email)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { paddingVertical: isTablet ? 16 : 14, marginTop: 30 }]}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={[styles.logoutButtonText, { fontSize: isTablet ? 18 : 16 }]}>Log Out</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteAccountButton, { paddingVertical: isTablet ? 16 : 14 }]}
        onPress={handleDeleteAccount}
        disabled={isDeletingAccount}
      >
        {isDeletingAccount ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={[styles.deleteAccountText, { fontSize: isTablet ? 18 : 16 }]}>Delete Account</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderPremiumDetail = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, dynamicStyles.scrollContent]}
      showsVerticalScrollIndicator={false}
    >
    </ScrollView>
  );

  const isDetailView = showAccountDetail || showPremiumDetail;

  const getTitle = () => {
    if (showAccountDetail) return 'Account';
    if (showPremiumDetail) return 'Premium';
    switch (activeTab) {
      case 'stats': return 'Stats';
      case 'settings': return 'Settings';
      default: return 'Stats';
    }
  };

  const handleBackFromDetail = () => {
    setShowAccountDetail(false);
    setShowPremiumDetail(false);
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={styles.titleRow}>
        {isDetailView && (
          <TouchableOpacity
            style={[styles.backArrow, { left: isTablet ? 40 : 15 }]}
            onPress={handleBackFromDetail}
          >
            <Text style={[styles.backArrowText, { fontSize: isTablet ? 28 : 22 }]}>{'<'}</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, dynamicStyles.title]}>{getTitle()}</Text>
      </View>
      {!isDetailView && renderTabs()}

      {showAccountDetail ? (
        renderAccountDetail()
      ) : showPremiumDetail ? (
        renderPremiumDetail()
      ) : (
        <>
          {activeTab === 'stats' && renderStatsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.tan,
  },
  titleRow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backArrow: {
    position: 'absolute',
    zIndex: 1,
  },
  backArrowText: {
    fontFamily: 'Mini',
    color: Colors.darkGreen,
  },
  title: {
    fontFamily: 'Mini',
    color: Colors.darkGreen,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 10,
    paddingHorizontal: 20,
  },
  tabButton: {
    backgroundColor: Colors.mediumGreen,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: Colors.darkGreen,
  },
  tabText: {
    fontFamily: 'Mini',
    color: Colors.white,
    opacity: 0.8,
  },
  tabTextActive: {
    opacity: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  sectionTitle: {
    fontFamily: 'Mini',
    color: Colors.lightBrown,
    marginBottom: 8,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statsRowSingle: {
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontFamily: 'Mini',
    color: Colors.textDark,
    opacity: 0.7,
    textAlign: 'center',
  },
  statValue: {
    fontFamily: 'Mini',
    color: Colors.darkGreen,
    marginBottom: 4,
  },
  statSubtext: {
    fontFamily: 'Mini',
    color: Colors.textDark,
    opacity: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 5,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tan,
  },
  settingText: {
    fontFamily: 'Mini',
    color: Colors.textDark,
  },
  settingIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIconInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingValue: {
    fontFamily: 'Mini',
    color: Colors.darkGreen,
  },
  logoutButton: {
    backgroundColor: Colors.mediumGreen,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    fontFamily: 'Mini',
    color: Colors.white,
  },
  deleteAccountButton: {
    backgroundColor: '#E88B8B',
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  deleteAccountText: {
    fontFamily: 'Mini',
    color: Colors.white,
  },
  appInfoContainer: {
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 25,
    backgroundColor: Colors.white,
    borderRadius: 20,
  },
  appLogo: {
    marginBottom: 15,
  },
  appName: {
    fontFamily: 'Mini',
    color: Colors.darkGreen,
    marginBottom: 12,
  },
  appDescription: {
    fontFamily: 'Mini',
    color: Colors.textDark,
    textAlign: 'center',
    paddingHorizontal: 25,
    lineHeight: 20,
    opacity: 0.8,
  },
  versionText: {
    fontFamily: 'Mini',
    fontSize: 12,
    color: Colors.textDark,
    opacity: 0.5,
    marginTop: 15,
  },
});
