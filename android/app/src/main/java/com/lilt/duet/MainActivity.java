package com.lilt.duet;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.view.inputmethod.InputMethodInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class MainActivity extends Activity {
    private static final int BLUE = 0xFF315D8C;
    private static final int INK = 0xFF1C232C;
    private static final int MUTED = 0xFF5C6670;
    private TextView status;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(22), dp(36), dp(22), dp(28));
        page.setBackgroundColor(0xFFF7F8FA);

        page.addView(text("DUET / ANDROID", 12, BLUE, true));
        TextView title = text("Play your words.", 30, INK, true);
        title.setPadding(0, dp(14), 0, dp(8));
        page.addView(title);

        TextView body = text("Duet is a keyless keyboard. Flick both thumbs in a direction, then lift to write one exact character or letter pair. No dictionary. No guessing.", 16, MUTED, false);
        body.setPadding(0, 0, 0, dp(18));
        page.addView(body);

        status = text("", 15, BLUE, true);
        status.setPadding(0, 0, 0, dp(18));
        page.addView(status);

        page.addView(action("1  Enable Duet Keyboard", v -> startActivity(new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS))));
        page.addView(action("2  Choose Duet as keyboard", v -> {
            InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
            if (imm != null) imm.showInputMethodPicker();
        }));

        TextView tryLabel = text("3  Try it here", 15, INK, true);
        tryLabel.setPadding(0, dp(18), 0, dp(8));
        page.addView(tryLabel);

        EditText field = new EditText(this);
        field.setHint("Type with Duet…");
        field.setHintTextColor(0xFF9AA3AD);
        field.setTextColor(INK);
        field.setBackgroundColor(Color.WHITE);
        field.setPadding(dp(14), dp(14), dp(14), dp(14));
        field.setMinHeight(dp(88));
        field.setGravity(android.view.Gravity.TOP);
        page.addView(field, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        TextView note = text("Android will warn that this is an input method. Duet never uses the network and only sends the characters you play into the focused field.\n\nThis is a debug-signed build. Install it, then Enable → Choose Duet.", 13, MUTED, false);
        note.setPadding(0, dp(18), 0, 0);
        page.addView(note);

        setContentView(page);
    }

    @Override
    protected void onResume() {
        super.onResume();
        status.setText(statusText());
    }

    private String statusText() {
        InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
        if (imm == null) return "Keyboard service unavailable.";
        boolean enabled = false;
        for (InputMethodInfo info : imm.getEnabledInputMethodList()) {
            if (getPackageName().equals(info.getPackageName())) enabled = true;
        }
        String current = Settings.Secure.getString(getContentResolver(), Settings.Secure.DEFAULT_INPUT_METHOD);
        boolean selected = current != null && current.startsWith(getPackageName());
        if (selected) return "Duet is on. Open any text field and play.";
        if (enabled) return "Duet is enabled. Tap Choose Duet as keyboard.";
        return "Duet is installed. Tap Enable Duet Keyboard.";
    }

    private Button action(String label, View.OnClickListener click) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextColor(Color.WHITE);
        button.setBackgroundColor(BLUE);
        button.setOnClickListener(click);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52));
        params.topMargin = dp(8);
        button.setLayoutParams(params);
        return button;
    }

    private TextView text(String value, int size, int color, boolean medium) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        view.setTypeface(Typeface.create(medium ? "sans-serif-medium" : "sans-serif", Typeface.NORMAL));
        return view;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
