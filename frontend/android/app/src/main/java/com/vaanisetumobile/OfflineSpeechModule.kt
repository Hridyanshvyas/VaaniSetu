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
    private var currentListeningPromise: Promise? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    init {
        mainHandler.post {
            tts = TextToSpeech(reactContext, this)
        }
    }

    override fun getName(): String = "OfflineSpeechModule"

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isTtsReady = true
            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {}
                override fun onDone(utteranceId: String?) {
                    pendingTtsPromise?.resolve(true)
                    pendingTtsPromise = null
                }
                override fun onError(utteranceId: String?) {
                    pendingTtsPromise?.reject("TTS_ERROR", "Speech playback failed")
                    pendingTtsPromise = null
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
        val sttAvailable = SpeechRecognizer.isRecognitionAvailable(reactContext)
        promise.resolve(mapOf(
            "ttsReady" to isTtsReady,
            "sttAvailable" to sttAvailable
        ))
    }

    @ReactMethod
    fun speak(text: String, language: String, promise: Promise) {
        if (!isTtsReady || tts == null) {
            // Re-init if needed
            mainHandler.post {
                tts = TextToSpeech(reactContext) { status ->
                    if (status == TextToSpeech.SUCCESS) {
                        isTtsReady = true
                        doSpeak(text, language, promise)
                    } else {
                        promise.reject("TTS_INIT_FAILED", "TextToSpeech engine could not initialize.")
                    }
                }
            }
            return
        }
        doSpeak(text, language, promise)
    }

    private fun doSpeak(text: String, language: String, promise: Promise) {
        mainHandler.post {
            try {
                val locale = getLocaleForLanguage(language)
                val langResult = tts?.setLanguage(locale)
                if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                    // Fallback to default locale
                    tts?.language = Locale.getDefault()
                }
                tts?.setPitch(1.0f)
                tts?.setSpeechRate(0.95f)

                val utteranceId = UUID.randomUUID().toString()
                pendingTtsPromise = promise

                val params = Bundle()
                params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
                tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
            } catch (e: Exception) {
                promise.reject("TTS_SPEAK_ERROR", e.localizedMessage, e)
                pendingTtsPromise = null
            }
        }
    }

    @ReactMethod
    fun synthesizeToFile(text: String, language: String, promise: Promise) {
        if (!isTtsReady || tts == null) {
            promise.reject("TTS_NOT_READY", "TextToSpeech engine not initialized.")
            return
        }

        mainHandler.post {
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
                promise.reject("TTS_STOP_ERROR", e.localizedMessage, e)
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
                speechRecognizer?.destroy()
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
                currentListeningPromise = promise

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, getLocaleForLanguage(language).toLanguageTag())
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, getLocaleForLanguage(language).toLanguageTag())
                    putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
                    putExtra("android.speech.extra.PREFER_OFFLINE", true)
                }

                speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {}
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}
                    override fun onEndOfSpeech() {}

                    override fun onError(error: Int) {
                        val errorMsg = when (error) {
                            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                            SpeechRecognizer.ERROR_CLIENT -> "Client error"
                            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission required"
                            SpeechRecognizer.ERROR_NETWORK -> "Offline recognizer needed"
                            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                            SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized"
                            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech recognizer busy"
                            SpeechRecognizer.ERROR_SERVER -> "Server error"
                            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Speech timeout (no voice heard)"
                            else -> "Recognition error: $error"
                        }
                        currentListeningPromise?.reject("STT_ERROR_$error", errorMsg)
                        currentListeningPromise = null
                    }

                    override fun onResults(results: Bundle?) {
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = matches?.firstOrNull() ?: ""
                        val confidences = results?.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)
                        val conf = confidences?.firstOrNull() ?: 0.92f

                        currentListeningPromise?.resolve(mapOf(
                            "text" to text,
                            "confidence" to conf,
                            "language" to language
                        ))
                        currentListeningPromise = null
                    }

                    override fun onPartialResults(partialResults: Bundle?) {}
                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })

                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                promise.reject("STT_START_ERROR", e.localizedMessage, e)
                currentListeningPromise = null
            }
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        mainHandler.post {
            try {
                speechRecognizer?.stopListening()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("STT_STOP_ERROR", e.localizedMessage, e)
            }
        }
    }

    override fun invalidate() {
        super.invalidate()
        mainHandler.post {
            try {
                tts?.stop()
                tts?.shutdown()
                speechRecognizer?.destroy()
            } catch (_: Exception) {}
        }
    }
}
