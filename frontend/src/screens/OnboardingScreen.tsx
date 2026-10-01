import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  DEFAULT_BACKEND_HOST,
  checkServerHealth,
  loadSavedServerHost,
  saveServerHost,
  type LanguageCode,
} from '../config';
import {registerSession} from '../network/sessionClient';
import {Header} from '../components/Header';
import {CompactConnection} from '../components/CompactConnection';
import {HeroCallSection} from '../components/HeroCallSection';
import {LanguageSelector} from '../components/LanguageSelector';
import {AnimatedBridgeVisual} from '../components/AnimatedBridgeVisual';
import {QuickDemoCard} from '../components/QuickDemoCard';
import {LowBandwidthCard} from '../components/LowBandwidthCard';
import {ComingSoonLanguages} from '../components/ComingSoonLanguages';
import {HowItWorksCard} from '../components/HowItWorksCard';
import {AdvancedSettings} from '../components/AdvancedSettings';
import {useTheme, spacing} from '../theme/theme';

type Props = {
  onRegistered: (session: {
    userId: string;
    callId: string;
    language: LanguageCode;
  }) => void;
};

export function OnboardingScreen({onRegistered}: Props) {
  const {colors} = useTheme();
  const scrollViewRef = useRef<any>(null);

  const [serverHost, setServerHost] = useState(DEFAULT_BACKEND_HOST);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [language, setLanguage] = useState<LanguageCode>('hi');
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [userId, setUserId] = useState(`phone-${Math.floor(100 + Math.random() * 900)}`);
  const [callId, setCallId] = useState('demo-call');
  const [submitting, setSubmitting] = useState(false);
  const [checkingPing, setCheckingPing] = useState(false);

  useEffect(() => {
    void (async () => {
      const savedHost = await loadSavedServerHost();
      setServerHost(savedHost);
      const ok = await pingServer(savedHost);
      if (!ok && savedHost !== DEFAULT_BACKEND_HOST) {
        const fallbackRes = await checkServerHealth(DEFAULT_BACKEND_HOST);
        if (fallbackRes.ok) {
          setServerHost(DEFAULT_BACKEND_HOST);
          await saveServerHost(DEFAULT_BACKEND_HOST);
          setServerStatus('online');
        }
      }
    })();
  }, []);

  const pingServer = async (hostToTest: string): Promise<boolean> => {
    setCheckingPing(true);
    setServerStatus('checking');
    const result = await checkServerHealth(hostToTest);
    setCheckingPing(false);
    if (result.ok) {
      setServerStatus('online');
      return true;
    } else {
      setServerStatus('offline');
      return false;
    }
  };

  const handleSelectPreset = async (host: string) => {
    setServerHost(host);
    await saveServerHost(host);
    await pingServer(host);
  };

  const handleHostChange = async (text: string) => {
    setServerHost(text);
    await saveServerHost(text);
  };

  const handleToggleSoloMode = (solo: boolean) => {
    setIsSoloMode(solo);
    if (solo) {
      if (!callId.startsWith('solo-')) {
        setCallId('solo-test');
      }
    } else {
      if (callId.startsWith('solo-')) {
        setCallId('demo-call');
      }
    }
  };

  const handleQuickDemo = async () => {
    const demoUser = `demo-${Math.floor(100 + Math.random() * 900)}`;
    const demoCall = 'solo-demo';
    const demoLang: LanguageCode = 'hi';

    setUserId(demoUser);
    setCallId(demoCall);
    setLanguage(demoLang);
    setIsSoloMode(true);

    setSubmitting(true);
    try {
      await saveServerHost(serverHost);
      await registerSession({
        userId: demoUser,
        callId: demoCall,
        nativeLanguage: demoLang,
      });
      onRegistered({
        userId: demoUser,
        callId: demoCall,
        language: demoLang,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Registration failed.';
      Alert.alert(
        'Quick Demo Setup Failed',
        `${msg}\n\n• Target Host: ${serverHost}\n• Ensure the backend server is reachable.`,
        [
          {text: 'Retry Ping', onPress: () => void pingServer(serverHost)},
          {text: 'OK'},
        ],
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    const trimmedUser = userId.trim();
    const trimmedCall = callId.trim();

    if (!trimmedUser || !trimmedCall) {
      return Alert.alert('Missing Info', 'Please enter both a Device ID and Call Room ID.');
    }

    setSubmitting(true);
    try {
      await saveServerHost(serverHost);
      await registerSession({
        userId: trimmedUser,
        callId: trimmedCall,
        nativeLanguage: language,
      });
      onRegistered({
        userId: trimmedUser,
        callId: trimmedCall,
        language,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Registration failed.';
      Alert.alert(
        'Connection Failed',
        `${msg}\n\n• Target Host: ${serverHost}\n• Tip: Ensure backend server is running and phone is connected to the same Wi-Fi, Hotspot, or network.`,
        [
          {text: 'Retry Ping', onPress: () => void pingServer(serverHost)},
          {text: 'OK'},
        ],
      );
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToSettings = () => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.keyboardContainer, {backgroundColor: colors.background}]}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 1. Header with branding & taglines */}
        <Header />

        {/* 2. Ultra-Compact Connection Status */}
        <CompactConnection
          status={serverStatus}
          onRetry={() => void pingServer(serverHost)}
          isRetrying={checkingPing}
          onOpenAdvanced={scrollToSettings}
        />

        {/* 3. HERO SECTION — Start Voice Bridge */}
        <HeroCallSection
          selectedLanguage={language}
          isSoloMode={isSoloMode}
          onToggleSoloMode={handleToggleSoloMode}
          userId={userId}
          onChangeUserId={setUserId}
          callId={callId}
          onChangeCallId={setCallId}
          onSubmit={() => void submit()}
          submitting={submitting}
        />

        {/* 4. Available Languages (Choose Languages) */}
        <LanguageSelector
          selectedLanguage={language}
          onSelectLanguage={setLanguage}
        />

        {/* 5. AI Voice Bridge Signature Animation */}
        <AnimatedBridgeVisual selectedLanguage={language} />

        {/* 6. Quick Demo (Secondary action) */}
        <QuickDemoCard
          onStartDemo={() => void handleQuickDemo()}
          disabled={submitting}
        />

        {/* 7. Built for Low-Bandwidth Networks */}
        <LowBandwidthCard />

        {/* 8. Roadmap: More Languages */}
        <ComingSoonLanguages />

        {/* 9. How VaaniSetu Works (Collapsible) */}
        <HowItWorksCard />

        {/* 10. Advanced Connection & Settings (Collapsible) */}
        <AdvancedSettings
          serverHost={serverHost}
          onSelectPreset={handleSelectPreset}
          onChangeHost={handleHostChange}
          onTestPing={pingServer}
          isPinging={checkingPing}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.lg,
  },
});
