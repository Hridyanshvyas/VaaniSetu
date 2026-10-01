import {getBackendWsUrl} from '../config';

export type ExchangeMetadata = {
  type: 'exchange';
  bits_used: number;
  lost: boolean;
  language: string;
  confidence: number;
  transcribed_text?: string;
  translated_text?: string;
  audio_lost?: boolean;
};

type Handlers = {
  /** Called with true when the WS opens, false when it closes. */
  onConnection: (connected: boolean) => void;
  /**
   * Called when the backend confirms both participants are in the same call (or in solo mode).
   * `paired=true` means the peer is currently connected; `false` means they
   * disconnected or haven't joined yet.
   */
  onPaired: (paired: boolean) => void;
  onExchange: (metadata: ExchangeMetadata) => void;
  onAudio: (audio: ArrayBuffer) => void;
  /** Non-fatal error message to display to the user. */
  onError: (message: string) => void;
};

/** Close codes that indicate a logic error — re-registering is required; retrying won't help. */
const FATAL_CLOSE_CODES = new Set([4404]);

export class VaaniSetuSocket {
  private socket?: WebSocket;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private manuallyClosed = false;

  constructor(
    private readonly callId: string,
    private readonly userId: string,
    private readonly language: string,
    private readonly handlers: Handlers,
  ) {}

  connect() {
    this.manuallyClosed = false;
    const wsBaseUrl = getBackendWsUrl();
    const lang = encodeURIComponent(this.language || 'hi');
    const url = `${wsBaseUrl}/ws/${encodeURIComponent(this.callId)}/${encodeURIComponent(this.userId)}?language=${lang}`;
    this.socket = new WebSocket(url);

    (this.socket as any).binaryType = 'arraybuffer';

    this.socket.onopen = () => this.handlers.onConnection(true);

    this.socket.onmessage = event => {
      if (typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data) as {type: string; [key: string]: unknown};
          if (message.type === 'fatal_error') {
            this.handlers.onError(
              (message.message as string | undefined) ?? 'Fatal connection error.',
            );
            this.manuallyClosed = true;
            return;
          }
          if (message.type === 'status') {
            this.handlers.onPaired(Boolean(message.paired));
            return;
          }
          if (message.type === 'error') {
            this.handlers.onError(
              (message.message as string | undefined) ?? 'Unknown error.',
            );
            return;
          }
          if (message.type === 'exchange') {
            this.handlers.onExchange(message as unknown as ExchangeMetadata);
            return;
          }
        } catch {
          // Ignore parse errors on unusual frames
        }
      } else {
        this.handlers.onAudio(event.data as ArrayBuffer);
      }
    };

    this.socket.onerror = () =>
      this.handlers.onError('Connection to backend failed.');

    this.socket.onclose = event => {
      this.handlers.onConnection(false);
      if (this.manuallyClosed) return;
      if (typeof event?.code === 'number' && FATAL_CLOSE_CODES.has(event.code)) {
        this.handlers.onError(
          'Session expired or invalid. Go back and register again.',
        );
        return;
      }
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
  }

  sendAudio(audio: string | ArrayBuffer) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      throw new Error('Call is not connected yet.');
    }
    this.socket.send(audio);
  }

  close() {
    this.manuallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
  }
}
