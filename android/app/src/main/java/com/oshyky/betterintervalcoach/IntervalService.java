package com.oshyky.betterintervalcoach;

import android.app.*;
import android.content.*;
import android.media.*;
import android.os.*;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.*;
import java.io.File;
import java.util.*;

public class IntervalService extends Service {
    public static final String ACTION_START="START", ACTION_PAUSE="PAUSE", ACTION_RESUME="RESUME", ACTION_SKIP="SKIP", ACTION_STOP="STOP";
    private static final String CH="better_timer"; private static final int NOTIF=42;
    private final Handler h=new Handler(Looper.getMainLooper());
    private TextToSpeech tts; private Vibrator vib; private MediaPlayer voice;
    private SharedPreferences p; private boolean running=false, paused=false; private String phase="work";
    private int work=240,rest=180,count=4,current=1; private long phaseEnd=0, pausedRemaining=0; private boolean countdown3=false,countdown2=false,countdown1=false;

    @Override public void onCreate(){super.onCreate();p=getSharedPreferences("timer",MODE_PRIVATE);vib=(Vibrator)getSystemService(VIBRATOR_SERVICE);tts=new TextToSpeech(this,s->{if(s==TextToSpeech.SUCCESS){tts.setLanguage(Locale.UK);tts.setOnUtteranceProgressListener(new UtteranceProgressListener(){public void onStart(String id){}public void onDone(String id){}public void onError(String id){}});}});restore();createChannel();}
    @Override public int onStartCommand(Intent i,int flags,int id){String a=i==null?null:i.getAction();if(a==null&&running){startForegroundNow();tick();return START_STICKY;}if(ACTION_START.equals(a))start(i.getIntExtra("work",work),i.getIntExtra("rest",rest),i.getIntExtra("count",count));else if(ACTION_PAUSE.equals(a))pause();else if(ACTION_RESUME.equals(a))resume();else if(ACTION_SKIP.equals(a))skip();else if(ACTION_STOP.equals(a))stopTimer();return START_STICKY;}
    private void start(int w,int r,int c){work=w;rest=r;count=c;current=1;phase="work";running=true;paused=false;phaseEnd=SystemClock.elapsedRealtime()+w*1000L;pausedRemaining=0;resetCountdown();save();startForegroundNow();buzz(new long[]{0,350});speakOrPlay("Interval start");tick();}
    private void tick(){if(!running){return;}long now=SystemClock.elapsedRealtime();if(!paused){long left=phaseEnd-now;if(left>0){maybeCountdown(left);updateNotification(left);h.removeCallbacksAndMessages("tick");h.postAtTime(()->tick(),SystemClock.uptimeMillis()+Math.min(250,Math.max(50,left)));return;}while(running&&!paused&&phaseEnd<=now){transition();now=SystemClock.elapsedRealtime();}}updateNotification(Math.max(0,phaseEnd-SystemClock.elapsedRealtime()));if(running&&!paused){h.removeCallbacksAndMessages("tick");h.postAtTime(()->tick(),SystemClock.uptimeMillis()+50);}}
    private void transition(){if("work".equals(phase)){if(current>=count){finish();return;}if(rest<=0){current++;phase="work";phaseEnd=SystemClock.elapsedRealtime()+work*1000L;resetCountdown();changeCue(true);return;}phase="rest";phaseEnd=SystemClock.elapsedRealtime()+rest*1000L;resetCountdown();changeCue(false);}else{current++;phase="work";phaseEnd=SystemClock.elapsedRealtime()+work*1000L;resetCountdown();changeCue(true);}}
    private void maybeCountdown(long left){if(left<=3050&&left>2500&&!countdown3){countdown3=true;speak("3");buzz(new long[]{0,170});}else if(left<=2050&&left>1500&&!countdown2){countdown2=true;speak("2");buzz(new long[]{0,170});}else if(left<=1050&&left>500&&!countdown1){countdown1=true;speak("1");buzz(new long[]{0,170});}}
    private void changeCue(boolean interval){buzz(new long[]{0,350,150,350});if(interval)speakOrPlay("Interval start");else speakOrPlay("Rest");}
    private void finish(){running=false;paused=false;clearSaved();buzz(new long[]{0,700,250,500,250,900});speak("Workout complete");stopForeground(STOP_FOREGROUND_REMOVE);h.removeCallbacksAndMessages("tick");stopSelf();}
    private void pause(){if(!running||paused)return;pausedRemaining=Math.max(0,phaseEnd-SystemClock.elapsedRealtime());paused=true;save();buzz(new long[]{0,120});updateNotification(pausedRemaining);}
    private void resume(){if(!running||!paused)return;paused=false;phaseEnd=SystemClock.elapsedRealtime()+pausedRemaining;save();buzz(new long[]{0,120});tick();}
    private void skip(){if(!running)return;phaseEnd=SystemClock.elapsedRealtime();tick();}
    private void stopTimer(){running=false;paused=false;clearSaved();h.removeCallbacksAndMessages("tick");stopForeground(STOP_FOREGROUND_REMOVE);stopSelf();}
    private void speak(String text){if(tts!=null)tts.speak(text,TextToSpeech.QUEUE_FLUSH,null,"better_"+System.nanoTime());}
    private void speakOrPlay(String text){File f=new File(getFilesDir(),"voice.3gp");if(f.exists()){try{if(voice!=null){voice.release();voice=null;}voice=new MediaPlayer();voice.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());voice.setDataSource(f.getAbsolutePath());voice.setOnPreparedListener(MediaPlayer::start);voice.prepareAsync();return;}catch(Exception ignored){}}speak(text);}
    private void buzz(long[] pattern){if(vib==null)return;try{if(Build.VERSION.SDK_INT>=26)vib.vibrate(VibrationEffect.createWaveform(pattern,-1));else vib.vibrate(pattern,-1);}catch(Exception ignored){}}
    private void createChannel(){if(Build.VERSION.SDK_INT>=26){NotificationChannel c=new NotificationChannel(CH,"BETTER Timer",NotificationManager.IMPORTANCE_LOW);c.setDescription("Workout timer running in the background");((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(c);}}
    private PendingIntent pi(String a){Intent i=new Intent(this,IntervalService.class).setAction(a);return PendingIntent.getService(this,a.hashCode(),i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
    private void startForegroundNow(){Notification n=buildNotification();if(Build.VERSION.SDK_INT>=29)startForeground(NOTIF,n);else startForeground(NOTIF,n);}
    private Notification buildNotification(){String phaseName="work".equals(phase)?"INTERVAL":"REST";String text=paused?"Paused":phaseName+" • "+fmt(Math.max(0,(phaseEnd-SystemClock.elapsedRealtime())/1000));Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,CH):new Notification.Builder(this);b.setSmallIcon(android.R.drawable.ic_media_play).setContentTitle("BETTER Interval Coach").setContentText("#"+current+" / "+count+" • "+text).setOngoing(true).setOnlyAlertOnce(true).setContentIntent(PendingIntent.getActivity(this,1,new Intent(this,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));b.addAction(new Notification.Action.Builder(android.R.drawable.ic_media_pause,paused?"Resume":"Pause",pi(paused?ACTION_RESUME:ACTION_PAUSE)).build());b.addAction(new Notification.Action.Builder(android.R.drawable.ic_media_next,"Skip",pi(ACTION_SKIP)).build());b.addAction(new Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel,"Stop",pi(ACTION_STOP)).build());return b.build();}
    private void updateNotification(long left){NotificationManager m=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);m.notify(NOTIF,buildNotification());}
    private String fmt(long s){return String.format(Locale.UK,"%02d:%02d",s/60,s%60);} private void resetCountdown(){countdown3=countdown2=countdown1=false;}
    private void save(){p.edit().putBoolean("running",running).putBoolean("paused",paused).putString("phase",phase).putInt("work",work).putInt("rest",rest).putInt("count",count).putInt("current",current).putLong("phaseEnd",phaseEnd).putLong("pausedRemaining",pausedRemaining).apply();}
    private void restore(){running=p.getBoolean("running",false);paused=p.getBoolean("paused",false);phase=p.getString("phase","work");work=p.getInt("work",240);rest=p.getInt("rest",180);count=p.getInt("count",4);current=p.getInt("current",1);phaseEnd=p.getLong("phaseEnd",0);pausedRemaining=p.getLong("pausedRemaining",0);}
    private void clearSaved(){p.edit().clear().apply();}
    @Override public void onDestroy(){if(voice!=null){voice.release();voice=null;}if(tts!=null){tts.stop();tts.shutdown();}super.onDestroy();}
    @Override public android.os.IBinder onBind(Intent i){return null;}
}
