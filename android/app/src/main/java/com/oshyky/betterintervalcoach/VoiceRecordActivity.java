package com.oshyky.betterintervalcoach;

import android.app.Activity;import android.os.Bundle;import android.media.MediaRecorder;import android.view.Gravity;import android.widget.*;import java.io.File;

public class VoiceRecordActivity extends Activity{
 private MediaRecorder recorder;private Button button;private TextView status;private File file;
 @Override public void onCreate(Bundle b){super.onCreate(b);LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);l.setGravity(Gravity.CENTER);l.setPadding(32,32,32,32);TextView t=new TextView(this);t.setText("Record your cue\nSay: “Interval start”");t.setTextSize(24);t.setGravity(Gravity.CENTER);l.addView(t,new LinearLayout.LayoutParams(-1,-2));status=new TextView(this);status.setText("Stored locally on this phone");l.addView(status,new LinearLayout.LayoutParams(-1,-2));button=new Button(this);button.setText("Record");button.setOnClickListener(v->toggle());l.addView(button,new LinearLayout.LayoutParams(-1,-2));setContentView(l);file=new File(getFilesDir(),"voice.3gp");}
 private void toggle(){if(recorder==null){try{recorder=new MediaRecorder();recorder.setAudioSource(MediaRecorder.AudioSource.MIC);recorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP);recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);recorder.setOutputFile(file.getAbsolutePath());recorder.prepare();recorder.start();button.setText("Stop");status.setText("Recording…");}catch(Exception e){status.setText("Could not start recording");recorder=null;}}else{try{recorder.stop();recorder.release();}catch(Exception ignored){}recorder=null;button.setText("Record again");status.setText("Saved. The background timer will use your voice.");}}
 @Override protected void onDestroy(){if(recorder!=null){try{recorder.stop();recorder.release();}catch(Exception ignored){}}super.onDestroy();}
}
