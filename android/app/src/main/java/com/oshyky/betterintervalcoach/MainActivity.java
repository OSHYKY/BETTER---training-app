package com.oshyky.betterintervalcoach;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private SeekBar workBar, restBar, countBar;
    private TextView workValue, restValue, countValue;
    private int work=240, rest=180, count=4;
    @Override public void onCreate(Bundle b){super.onCreate(b);buildUi();requestPermissionsIfNeeded();}
    private void buildUi(){
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(32,24,32,24);root.setGravity(Gravity.CENTER_HORIZONTAL);
        TextView title=new TextView(this);title.setText("BETTER\nInterval Coach");title.setTextSize(28);title.setGravity(Gravity.CENTER);root.addView(title,lp());
        workValue=label(root);workBar=bar(root,15,900,240,15);workBar.setOnSeekBarChangeListener(listener(0));
        restValue=label(root);restBar=bar(root,0,600,180,15);restBar.setOnSeekBarChangeListener(listener(1));
        countValue=label(root);countBar=bar(root,1,20,4,1);countBar.setOnSeekBarChangeListener(listener(2));updateLabels();
        Button record=new Button(this);record.setText("Record my voice cue");record.setOnClickListener(v->{if(Build.VERSION.SDK_INT>=23&&checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED){requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},11);}else startActivity(new Intent(this,VoiceRecordActivity.class));});root.addView(record,lp());
        Button start=new Button(this);start.setText("START WORKOUT");start.setTextSize(20);start.setOnClickListener(v->startWorkout());root.addView(start,lp());
        TextView info=new TextView(this);info.setText("Native timer. Works offline and keeps running with the screen off.\nDisable battery optimisation for BETTER for maximum reliability.");info.setPadding(0,24,0,0);root.addView(info,lp());setContentView(root);
    }
    private LinearLayout.LayoutParams lp(){return new LinearLayout.LayoutParams(-1,-2);} private TextView label(LinearLayout r){TextView x=new TextView(this);x.setTextSize(18);x.setPadding(0,14,0,2);r.addView(x,lp());return x;}
    private SeekBar bar(LinearLayout r,int min,int max,int val,int step){SeekBar b=new SeekBar(this);b.setMax((max-min)/step);b.setProgress((val-min)/step);b.setTag(new int[]{min,step});r.addView(b,lp());return b;}
    private SeekBar.OnSeekBarChangeListener listener(int which){return new SeekBar.OnSeekBarChangeListener(){public void onProgressChanged(SeekBar b,int p,boolean f){int[] x=(int[])b.getTag();int v=x[0]+p*x[1];if(which==0)work=v;else if(which==1)rest=v;else count=v;updateLabels();}public void onStartTrackingTouch(SeekBar b){}public void onStopTrackingTouch(SeekBar b){}};}
    private void updateLabels(){workValue.setText("Interval "+fmt(work));restValue.setText("Rest "+fmt(rest));countValue.setText("Intervals "+count);}private String fmt(int s){return String.format(java.util.Locale.UK,"%02d:%02d",s/60,s%60);} 
    private void requestPermissionsIfNeeded(){if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},10);}
    private void startWorkout(){Intent i=new Intent(this,IntervalService.class).setAction(IntervalService.ACTION_START);i.putExtra("work",work);i.putExtra("rest",rest);i.putExtra("count",count);if(Build.VERSION.SDK_INT>=26)startForegroundService(i);else startService(i);Toast.makeText(this,"Workout started — screen can be turned off.",Toast.LENGTH_SHORT).show();}
}
