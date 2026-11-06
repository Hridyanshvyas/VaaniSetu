package com.vaanisetumobile

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.util.Locale
import java.util.UUID

class OfflineSpeechModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isTtsReady = false
    private var pendingTtsPromise: Promise? = null
    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false
    private var currentListeningLanguage = "hi"
    private var lastRecognizedText: String? = null
    private var lastConfidence: Float = 0.92f
    private var pendingStopPromise: Promise? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    init {
        mainHandler.post {
            setupTts()
        }
    }

    override fun getName(): String = "OfflineSpeechModule"

    private fun setupTts() {
        tts = TextToSpeech(reactContext, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isTtsReady = true
            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {}
                override fun onDone(utteranceId: String?) {
                    mainHandler.post {
                        pendingTtsPromise?.resolve(true)
                        pendingTtsPromise = null
                    }
                }
                override fun onError(utteranceId: String?) {
                    mainHandler.post {
                        pendingTtsPromise?.resolve(false)
                        pendingTtsPromise = null
                    }
                }
            })
        }
    }

    private fun getLocaleForLanguage(lang: String?): Locale {
        val code = (lang ?: "hi").trim().lowercase().split("-", "_")[0]
        return when (code) {
            "hi" -> Locale.forLanguageTag("hi-IN")
            "ta" -> Locale.forLanguageTag("ta-IN")
            "te" -> Locale.forLanguageTag("te-IN")
            "en" -> Locale.forLanguageTag("en-IN")
            "gu" -> Locale.forLanguageTag("gu-IN")
            "mr" -> Locale.forLanguageTag("mr-IN")
            "kn" -> Locale.forLanguageTag("kn-IN")
            "ml" -> Locale.forLanguageTag("ml-IN")
            "bn" -> Locale.forLanguageTag("bn-IN")
            else -> Locale.forLanguageTag("hi-IN")
        }
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        mainHandler.post {
            val sttAvailable = SpeechRecognizer.isRecognitionAvailable(reactContext)
            promise.resolve(mapOf(
                "ttsReady" to isTtsReady,
                "sttAvailable" to sttAvailable
            ))
        }
    }

    @ReactMethod
    fun speak(text: String, language: String, promise: Promise) {
        mainHandler.post {
            if (!isTtsReady || tts == null) {
                tts = TextToSpeech(reactContext) { status ->
                    if (status == TextToSpeech.SUCCESS) {
                        isTtsReady = true
                        onInit(status)
                        doSpeak(text, language, promise)
                    } else {
                        promise.resolve(false)
                    }
                }
                return@post
            }
            doSpeak(text, language, promise)
        }
    }

    private fun doSpeak(text: String, language: String, promise: Promise) {
        try {
            val locale = getLocaleForLanguage(language)
            val langResult = tts?.setLanguage(locale)
            if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.language = Locale.getDefault()
            }
            tts?.setPitch(1.0f)
            tts?.setSpeechRate(0.95f)

            val utteranceId = UUID.randomUUID().toString()
            pendingTtsPromise = promise

            // Watchdog timer: resolve promise after 10s if TTS fails to trigger onDone
            mainHandler.postDelayed({
                if (pendingTtsPromise == promise) {
                    promise.resolve(true)
                    pendingTtsPromise = null
                }
            }, 10000)

            val params = Bundle()
            params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
        } catch (e: Exception) {
            promise.resolve(false)
            pendingTtsPromise = null
        }
    }

    @ReactMethod
    fun synthesizeToFile(text: String, language: String, promise: Promise) {
        mainHandler.post {
            if (!isTtsReady || tts == null) {
                promise.reject("TTS_NOT_READY", "TextToSpeech engine not initialized.")
                return@post
            }

            try {
                val locale = getLocaleForLanguage(language)
                tts?.setLanguage(locale)

                val cacheDir = reactContext.cacheDir
                val outputFile = File(cacheDir, "offline_tts_${System.currentTimeMillis()}.wav")
                val utteranceId = UUID.randomUUID().toString()

                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {}
                    override fun onDone(id: String?) {
                        if (id == utteranceId) {
                            promise.resolve(outputFile.absolutePath)
                        }
                    }
                    override fun onError(id: String?) {
                        if (id == utteranceId) {
                            promise.reject("TTS_SYNTH_FAILED", "Could not synthesize to file.")
                        }
                    }
                })

                val params = Bundle()
                params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
                tts?.synthesizeToFile(text, params, outputFile, utteranceId)
            } catch (e: Exception) {
                promise.reject("TTS_SYNTH_ERROR", e.localizedMessage, e)
            }
        }
    }

    @ReactMethod
    fun stopSpeaking(promise: Promise) {
        mainHandler.post {
            try {
                tts?.stop()
                pendingTtsPromise = null
                promise.resolve(true)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun startListening(language: String, promise: Promise) {
        mainHandler.post {
            if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
                promise.reject("STT_NOT_AVAILABLE", "Speech recognition is not available on this device.")
                return@post
            }

            try {
                currentListeningLanguage = language
                lastRecognizedText = null
                lastConfidence = 0.92f
                isListening = true

                speechRecognizer?.destroy()
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, getLocaleForLanguage(language).toLanguageTag())
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, getLocaleForLanguage(language).toLanguageTag())
                    putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra("android.speech.extra.PREFER_OFFLINE", true)
                }

                speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {}
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}
                    override fun onEndOfSpeech() {}

                    override fun onPartialResults(partialResults: Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = matches?.firstOrNull()?.trim()
                        if (!text.isNullOrEmpty()) {
                            lastRecognizedText = text
                        }
                    }

                    override fun onResults(results: Bundle?) {
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = matches?.firstOrNull()?.trim() ?: lastRecognizedText ?: ""
                        val confidences = results?.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)
                        val conf = confidences?.firstOrNull() ?: 0.92f

                        lastRecognizedText = text
                        lastConfidence = conf
                        isListening = false

                        pendingStopPromise?.let { p ->
                            p.resolve(mapOf(
                                "text" to text,
                                "confidence" to conf,
                                "language" to currentListeningLanguage,
                                "status" to "ok"
                            ))
                            pendingStopPromise = null
                        }
                    }

                    override fun onError(error: Int) {
                        val errorMsg = when (error) {
                            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                            SpeechRecognizer.ERROR_CLIENT -> "Client error"
                            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission required"
                            SpeechRecognizer.ERROR_NETWORK -> "Network required or offline pack missing"
                            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                            SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized"
                            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
                            SpeechRecognizer.ERROR_SERVER -> "Server error"
                            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech detected"
                            else -> "Recognition error ($error)"
                        }

                        isListening = false

                        pendingStopPromise?.let { p ->
                            p.resolve(mapOf(
                                "text" to (lastRecognizedText ?: ""),
                                "confidence" to (if (lastRecognizedText.isNullOrEmpty()) 0.0f else lastConfidence),
                                "language" to currentListeningLanguage,
                                "status" to "error",
                                "error" to errorMsg
                            ))
                            pendingStopPromise = null
                        }
                    }

                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })

                speechRecognizer?.startListening(intent)
                // Resolve startListening immediately so JS can continue holding the PTT button
                promise.resolve(true)
            } catch (e: Exception) {
                isListening = false
                promise.reject("STT_START_ERROR", e.localizedMessage, e)
            }
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        mainHandler.post {
            if (!isListening) {
                // Recognition already ended naturally or prior error
                promise.resolve(mapOf(
                    "text" to (lastRecognizedText ?: ""),
                    "confidence" to (if (lastRecognizedText.isNullOrEmpty()) 0.0f else lastConfidence),
                    "language" to currentListeningLanguage,
                    "status" to "ok"
                ))
                lastRecognizedText = null
                return@post
            }

            pendingStopPromise = promise

            // Watchdog timer: if engine hangs after stopListening, resolve safely within 2.5s
            mainHandler.postDelayed({
                if (pendingStopPromise == promise) {
                    promise.resolve(mapOf(
                        "text" to (lastRecognizedText ?: ""),
                        "confidence" to (if (lastRecognizedText.isNullOrEmpty()) 0.0f else lastConfidence),
                        "language" to currentListeningLanguage,
                        "status" to "timeout"
                    ))
                    pendingStopPromise = null
                    try {
                        speechRecognizer?.cancel()
                    } catch (_: Exception) {}
                    isListening = false
                }
            }, 2500)

            try {
                speechRecognizer?.stopListening()
            } catch (e: Exception) {
                if (pendingStopPromise == promise) {
                    promise.resolve(mapOf(
                        "text" to (lastRecognizedText ?: ""),
                        "confidence" to 0.0f,
                        "language" to currentListeningLanguage,
                        "status" to "error",
                        "error" to (e.localizedMessage ?: "stop error")
                    ))
                    pendingStopPromise = null
                    isListening = false
                }
            }
        }
    }

    @ReactMethod
    fun startOfflineHost(port: Int, promise: Promise) {
        try {
            val actualPort = if (port > 0) port else 8080
            OfflineCallServer.start(actualPort)
            val ip = OfflineCallServer.getLocalIp()
            promise.resolve(mapOf(
                "running" to true,
                "port" to actualPort,
                "ip" to ip,
                "hostAddress" to "$ip:$actualPort"
            ))
        } catch (e: Exception) {
            promise.reject("HOST_START_FAILED", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun stopOfflineHost(promise: Promise) {
        try {
            OfflineCallServer.stop()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getOfflineHostInfo(promise: Promise) {
        val isRunning = OfflineCallServer.isRunning()
        val ip = OfflineCallServer.getLocalIp()
        val port = OfflineCallServer.port
        promise.resolve(mapOf(
            "running" to isRunning,
            "ip" to ip,
            "port" to port,
            "hostAddress" to "$ip:$port"
        ))
    }

    override fun invalidate() {
        super.invalidate()
        OfflineCallServer.stop()
        mainHandler.post {
            try {
                tts?.stop()
                tts?.shutdown()
                speechRecognizer?.destroy()
            } catch (_: Exception) {}
        }
    }
}
