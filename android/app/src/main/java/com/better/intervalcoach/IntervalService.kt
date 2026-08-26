package com.better.intervalcoach

import android.app.*
import android.content.Intent
import android.os.*
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.media.AudioAttributes
import android.media.ToneGenerator
import android.speech.tts.TextToSpeech
import java.util.Locale

class IntervalService : Service(), TextToSpeech.OnInitListener {
    private val handler = Handler(Looper.getMainLooper())
    private var tts: TextToSpeech? = null
    private var tone: ToneGenerator? = null
    private var running = false
    private var phase = "Interval"
    private var interval = 1
    private var total = 4
    private var phaseEnd = 0L
    private var workMs = 240_000L
    private var restMs = 180_000L

    private val tick = object : Runnable {
        override fun run() {
            if (!running) return
            val left = phaseEnd - SystemClock.elapsedRealtime()
            if (left <= 0) {
                advance()
            } else {
                handler.postDelayed(this, 200)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        tone = ToneGenerator(android.media.AudioManager.STREAM_MUSIC, 90)
        tts = TextToSpeech(this, this)
        createChannel()
        startForeground(42, notification("Ready"))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "STOP") { stopSelf(); return START_NOT_STICKY }
        workMs = intent?.getLongExtra("workMs", workMs) ?: workMs
        restMs = intent?.getLongExtra("restMs", restMs) ?: restMs
        total = intent?.getIntExtra("count", total) ?: total
        interval = 1; phase = "Interval"; running = true
        phaseEnd = SystemClock.elapsedRealtime() + workMs
        cue("Interval start", true)
        handler.removeCallbacks(tick); handler.post(tick)
        return START_STICKY
    }

    private fun advance() {
        if (phase == "Interval") {
            if (interval >= total) { finish(); return }
            phase = "Rest"; phaseEnd = SystemClock.elapsedRealtime() + restMs
            cue("Rest", false)
        } else {
            interval++; phase = "Interval"; phaseEnd = SystemClock.elapsedRealtime() + workMs
            cue("Interval start", true)
        }
        updateNotification()
        handler.post(tick)
    }

    private fun cue(text: String, longVibration: Boolean) {
        tone?.startTone(ToneGenerator.TONE_PROP_BEEP2, if (longVibration) 900 else 450)
        val vibrator = if (Build.VERSION.SDK_INT >= 31) getSystemService(VibratorManager::class.java).defaultVibrator else getSystemService(VIBRATOR_SERVICE) as Vibrator
        val pattern = if (longVibration) longArrayOf(0, 500, 150, 500) else longArrayOf(0, 350, 150, 350)
        vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "BETTER_${SystemClock.elapsedRealtime()}")
    }

    private fun finish() {
        running = false; tone?.startTone(ToneGenerator.TONE_PROP_BEEP2, 1200)
        val vibrator = if (Build.VERSION.SDK_INT >= 31) getSystemService(VibratorManager::class.java).defaultVibrator else getSystemService(VIBRATOR_SERVICE) as Vibrator
        vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0,700,200,500,200,900), -1))
        tts?.speak("Workout complete", TextToSpeech.QUEUE_FLUSH, null, "BETTER_FINISH")
        stopForeground(STOP_FOREGROUND_REMOVE); stopSelf()
    }

    private fun createChannel() { if (Build.VERSION.SDK_INT >= 26) getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel("intervals", "Interval Coach", NotificationManager.IMPORTANCE_LOW)) }
    private fun notification(text: String) = Notification.Builder(this, "intervals").setContentTitle("BETTER Interval Coach").setContentText(text).setSmallIcon(android.R.drawable.ic_media_play).setOngoing(true).build()
    private fun updateNotification() { val left = ((phaseEnd-SystemClock.elapsedRealtime()).coerceAtLeast(0))/1000; startForeground(42, notification("$phase $interval/$total • ${left/60}:${String.format("%02d",left%60)}")) }
    override fun onInit(status: Int) { if(status==TextToSpeech.SUCCESS) tts?.language=Locale.UK }
    override fun onDestroy(){ running=false;handler.removeCallbacks(tick);tts?.shutdown();tone?.release();super.onDestroy() }
    override fun onBind(intent: Intent?)=null
}
