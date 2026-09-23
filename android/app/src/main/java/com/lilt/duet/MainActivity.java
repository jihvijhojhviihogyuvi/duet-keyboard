package com.lilt.duet;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.graphics.Color;
import android.provider.Settings;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class MainActivity extends Activity {
    private int blue = Color.rgb(49, 93, 140);
    @Override public void onCreate(Bundle state) { super.onCreate(state); build(); }
    private void build() {
        LinearLayout page = new LinearLayout(this); page.setOrientation(LinearLayout.VERTICAL); page.setPadding(28, 42, 28, 28); page.setBackgroundColor(Color.rgb(247,248,250));
        TextView eyebrow = text("DUET / ANDROID", 12, blue); page.addView(eyebrow);
        TextView title = text("Play your words.", 31, Color.rgb(28,35,44)); title.setPadding(0, 18, 0, 8); page.addView(title);
        TextView body = text("Duet is a keyless keyboard. Flick both thumbs in a direction and lift to write one exact character or letter pair.", 17, Color.DKGRAY); body.setPadding(0,0,0,26); page.addView(body);
        TextView steps = text("1  Install this APK\n\n2  Tap Enable Duet Keyboard\n\n3  Select Duet in your phone's keyboard picker\n\n4  Try it in any text field", 16, Color.DKGRAY); page.addView(steps);
        Button enable = new Button(this); enable.setText("Enable Duet Keyboard"); enable.setOnClickListener(v -> startActivity(new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS))); page.addView(enable, new LinearLayout.LayoutParams(-1, 58));
        TextView note = text("No network access. Duet only sends the characters you choose to the focused field.", 13, Color.GRAY); note.setPadding(0, 22, 0, 0); page.addView(note);
        setContentView(page);
    }
    private TextView text(String value, int size, int color) { TextView v = new TextView(this); v.setText(value); v.setTextSize(size); v.setTextColor(color); return v; }
}
