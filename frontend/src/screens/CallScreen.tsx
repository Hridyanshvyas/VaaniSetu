import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {playReceivedAudio} from '../audio/player';
import {recordedFileToBytes, startPushToTalk, stopPushToTalk} from '../audio/recorder';
import {VaaniSetuSocket, type ExchangeMetadata} from '../network/websocketClient';
import {SESSION_STORAGE_KEY, endCall} from '../network/sessionClient';
import {OFFLINE_TACTICAL_PROMPTS} from '../offline/offlineTranslator';
import {startOfflineSTT, stopOfflineSTT} from '../offline/offlineSpeech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CallHeader} from '../components/call/CallHeader';
import {AIProcessIndicator} from '../components/call/AIProcessIndicator';
import {LiveConversation, type DialogueMessage} from '../components/call/LiveConversation';
import {CallDetailsModal} from '../components/call/CallDetailsModal';
import {PushToTalkControl} from '../components/call/PushToTalkControl';
import {useTheme, spacing, borderRadius, typography} from '../theme/theme';

type Props = {
  userId: string;
  callId: string;
  language: string;
  onLogout: () => void;
};

const TARGET_LANG_OPTIONS = [
  {code: 'hi', label: 'Hindi'},
  {code: 'ta', label: 'Tamil'},
  {code: 'te', label: 'Telugu'},
  {code: 'en', label: 'English'},
] as const;

export function CallScreen({userId, callId, language, onLogout}: Props) {
  const {colors} = useTheme();
  const isSolo = callId.startsWith('solo');
  const [connected, setConnected] = useState(false);
  const [paired, setPaired] = useState(isSolo);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [bitsUsed, setBitsUsed] = useState(0);
  const [status, setStatus] = useState('Connecting to backend…');
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [targetLanguage, setTargetLanguage] = useState<string>(
    language === 'hi' ? 'ta' : 'hi',
  );
  const socket = useRef<VaaniSetuSocket | undefined>(undefined);

  const pairedRef = useRef(isSolo);
  const isSoloRef = useRef(isSolo);

  useEffect(() => {
    isSoloRef.current = isSolo;
  }, [isSolo]);

  useEffect(() => {
    setFatalError(null);
    socket.current = new VaaniSetuSocket(callId, userId, language, {
      onConnection: ok => {
        setConnected(ok);
        if (ok) {
          const isOffline = socket.current?.isOfflineMode;
          setStatus(
            isOffline
              ? '⚡ On-Device Engine Active · Hold to speak'
              : isSoloRef.current
              ? 'Connected · Solo Echo Mode Ready'
              : pairedRef.current
              ? 'Connected · Ready to speak'
              : 'Connected · Waiting for partner…',
          );
        } else {
          pairedRef.current = isSoloRef.current;
          setPaired(isSoloRef.current);
          setStatus('Reconnecting to backend…');
        }
      },
      onPaired: isPaired => {
        const effectivePaired = isSoloRef.current || isPaired;
        pairedRef.current = effectivePaired;
        setPaired(effectivePaired);
        if (!isSoloRef.current) {
          setStatus(
            isPaired
              ? 'Partner connected · Ready to speak'
              : 'Partner disconnected · Waiting…',
          );
        }
      },
      onExchange: (exchange: ExchangeMetadata) => {
        setProcessing(false);
        setBitsUsed(total => total + exchange.bits_used);

        const newMsg: DialogueMessage = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          originalText: exchange.transcribed_text,
          translatedText: exchange.translated_text,
          language: exchange.language,
          bitsUsed: exchange.bits_used,
          confidence: exchange.confidence,
          lost: exchange.lost,
        };

        setMessages(prev => [newMsg, ...prev.slice(0, 19)]);

        if (exchange.lost) {
          setStatus('⚠ Packet lost on weak link — FEC could not recover.');
        } else {
          setStatus(
            `✓ Received (${exchange.language.toUpperCase()}, conf: ${Math.round(
              exchange.confidence * 100,
            )}%)`,
          );

          // Play received speech via native on-device TTS on the receiver phone
          if (!socket.current?.isOfflineMode && exchange.translated_text) {
            void speakOffline(exchange.translated_text, exchange.language);
          }

          setPlaying(true);
          setTimeout(() => {
            setPlaying(false);
            setStatus('⚡ Ready · Hold PTT to speak');
          }, 2200);
        }
      },
      onAudio: async audio => {
        setPlaying(true);
        setStatus('🔊 Playing synthesized voice…');
        try {
          await playReceivedAudio(audio);
        } catch {
          // Playback error handled gracefully
        } finally {
          setTimeout(() => {
            setPlaying(false);
            setStatus(
              pairedRef.current || isSoloRef.current
                ? 'Ready · Hold to speak'
                : 'Waiting for partner…',
            );
          }, 1800);
        }
      },
      onError: message => {
        setProcessing(false);
        if (message.includes('register') || message.includes('Session expired')) {
          setFatalError(message);
        } else {
          setStatus(message);
        }
      },
    });

    socket.current.connect();
    return () => socket.current?.close();
  }, [callId, userId, language]);

  const pressIn = async () => {
    if (!isSolo && !paired && !socket.current?.isOfflineMode) {
      Alert.alert(
        'Waiting for Partner',
        'Your partner has not joined this call room yet. Share the Call Room ID with them, or test on 1 device using Solo Echo mode.',
      );
      return;
    }
    setRecording(true);
    setStatus(
      socket.current?.isOfflineMode
        ? `🎙️ Listening… Speak in ${language.toUpperCase()}`
        : '🎙️ Recording speech…',
    );

    try {
      if (socket.current?.isOfflineMode) {
        await startOfflineSTT(language);
      } else {
        await startPushToTalk();
      }
    } catch (error) {
      setRecording(false);
      setStatus(isReadyToSpeak ? 'Ready · Hold to speak' : 'Waiting for partner…');
      Alert.alert(
        'Microphone Error',
        error instanceof Error
          ? error.message
          : 'Could not access the microphone.',
      );
    }
  };

  const pressOut = async () => {
    if (!recording) return;
    setRecording(false);
    setProcessing(true);

    if (socket.current?.isOfflineMode) {
      setStatus('⚡ Transcribing spoken voice…');
      let spokenText = '';
      try {
        const res = await stopOfflineSTT();
        spokenText = (res.text || '').trim();
      } catch (err: any) {
        console.warn('Offline STT error:', err);
      }

      if (spokenText) {
        setStatus(`⚡ Transmitting: "${spokenText}"…`);
        try {
          await socket.current?.sendOfflineExchange(spokenText, targetLanguage);
        } catch (err: any) {
          setStatus(`Error: ${err?.message || 'Transmission failed'}`);
        } finally {
          setProcessing(false);
        }
      } else {
        setProcessing(false);
        setStatus('ℹ️ No speech heard · Hold PTT & speak clearly, or tap a tactical phrase');
      }
      return;
    }

    setStatus('⚡ Compressing & Transmitting over low-bitrate link…');
    try {
      const fileUri = await stopPushToTalk();
      const bytes = await recordedFileToBytes(fileUri);
      socket.current?.sendAudio(bytes);
    } catch (error) {
      setProcessing(false);
      const msg = error instanceof Error ? error.message : 'Could not send audio.';
      if (!msg.includes('too short')) {
        Alert.alert('Transmission Note', msg);
      }
      setStatus(isReadyToSpeak ? 'Ready · Hold to speak' : 'Waiting for partner…');
    }
  };

  const handleTransmitTactical = async (prompt: typeof OFFLINE_TACTICAL_PROMPTS[0]) => {
    if (processing) return;
    const textToSend = (prompt as any)[language] || prompt.en;
    setProcessing(true);
    setStatus(`⚡ Transmitting: "${prompt.label}"…`);

    try {
      await socket.current?.sendOfflineExchange(textToSend, targetLanguage);
    } catch (err: any) {
      setStatus(`Error: ${err?.message || 'Transmission failed'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    socket.current?.close();
    await endCall(callId);
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    onLogout();
  };

  if (fatalError) {
    return (
      <View style={[styles.fatalContainer, {backgroundColor: colors.background}]}>
        <View style={[styles.fatalCard, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <Text style={styles.fatalIcon}>⚠️</Text>
          <Text style={[styles.fatalTitle, {color: colors.error}]}>Session Expired</Text>
          <Text style={[styles.fatalMessage, {color: colors.textSecondary}]}>{fatalError}</Text>
          <Pressable
            style={[styles.fatalBtn, {backgroundColor: colors.primary}]}
            onPress={handleLogout}>
            <Text style={styles.fatalBtnText}>Back to Setup</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isReadyToSpeak = (connected && (paired || isSolo)) || Boolean(socket.current?.isOfflineMode);
  const rawAudioEstimateBits = messages.length * 250000;
  const savingsPct =
    rawAudioEstimateBits > 0 && bitsUsed > 0
      ? Math.max(0, Math.min(99.9, ((rawAudioEstimateBits - bitsUsed) / rawAudioEstimateBits) * 100)).toFixed(1)
      : '99.2';

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* 1. Header: Room ID, user, language & End Call */}
      <CallHeader
        callId={callId}
        userId={userId}
        language={language}
        isReadyToSpeak={isReadyToSpeak}
        onEndCall={handleLogout}
      />

      {/* 2. 6-Stage AI Processing Lifecycle */}
      <AIProcessIndicator
        status={status}
        recording={recording}
        processing={processing}
        playing={playing}
      />

      {/* 3. Primary Center: Live Dialogue Feed */}
      <LiveConversation
        messages={messages}
        isReadyToSpeak={isReadyToSpeak}
      />

      {/* 4. Target Voice Selector (for translation voice output) */}
      <View style={styles.targetLangBar}>
        <Text style={[styles.targetLangLabel, {color: colors.textMuted}]}>
          TRANSLATE TO VOICE:
        </Text>
        <View style={styles.targetLangPills}>
          {TARGET_LANG_OPTIONS.map(opt => {
            const isSelected = targetLanguage === opt.code;
            return (
              <Pressable
                key={opt.code}
                onPress={() => setTargetLanguage(opt.code)}
                style={[
                  styles.targetLangPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.targetLangPillText,
                    {color: isSelected ? colors.white : colors.textSecondary},
                  ]}>
                  {opt.label} ({opt.code.toUpperCase()})
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 5. Tactical Emergency Phrases Quick Bar */}
      <View style={styles.tacticalContainer}>
        <Text style={[styles.tacticalTitle, {color: colors.textMuted}]}>
          ⚡ TACTICAL PHRASES (1-TAP OFFLINE TRANSMIT):
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tacticalScroll}>
          {OFFLINE_TACTICAL_PROMPTS.map(p => (
            <Pressable
              key={p.id}
              style={[styles.tacticalChip, {backgroundColor: colors.surface, borderColor: colors.border}]}
              onPress={() => void handleTransmitTactical(p)}>
              <Text style={[styles.tacticalChipText, {color: colors.textPrimary}]}>{p.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 6. Collapsible Network & AI Technical Details */}
      <CallDetailsModal
        bitsUsed={bitsUsed}
        exchangesCount={messages.length}
        savingsPct={savingsPct}
      />

      {/* 7. Circular Push-to-Talk Action Button */}
      <PushToTalkControl
        recording={recording}
        processing={processing}
        playing={playing}
        isReadyToSpeak={isReadyToSpeak}
        onPressIn={pressIn}
        onPressOut={pressOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  fatalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  fatalCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    width: '100%',
  },
  fatalIcon: {
    fontSize: 40,
  },
  fatalTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  fatalMessage: {
    fontSize: typography.fontSizes.sm,
    textAlign: 'center',
    lineHeight: typography.lineHeights.sm,
  },
  fatalBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  fatalBtnText: {
    color: '#ffffff',
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.md,
  },
  targetLangBar: {
    gap: 4,
    marginVertical: 2,
  },
  targetLangLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  targetLangPills: {
    flexDirection: 'row',
    gap: 6,
  },
  targetLangPill: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetLangPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tacticalContainer: {
    gap: 4,
    marginBottom: 4,
  },
  tacticalTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tacticalScroll: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  tacticalChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  tacticalChipText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
});
