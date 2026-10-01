import React, {useEffect, useState} from 'react';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import {CallScreen} from './src/screens/CallScreen';
import {OnboardingScreen} from './src/screens/OnboardingScreen';
import {loadSavedServerHost, type LanguageCode} from './src/config';
import {loadSavedSession} from './src/network/sessionClient';
import {ThemeProvider, useTheme} from './src/theme/theme';

type Session = {userId: string; callId: string; language: LanguageCode};

function MainApp() {
  const {isDark, colors} = useTheme();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    void (async () => {
      await loadSavedServerHost();
      const saved = await loadSavedSession();
      if (saved) {
        setSession({
          userId: saved.userId,
          callId: saved.callId,
          language: saved.nativeLanguage as LanguageCode,
        });
      }
    })();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: colors.background}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {session ? (
        <CallScreen
          {...session}
          onLogout={() => setSession(null)}
        />
      ) : (
        <OnboardingScreen
          onRegistered={newSession => setSession(newSession)}
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
