package com.lilt.duet;

import java.util.Locale;

final class DuetEngine {
    static final String REPEAT = "↻";
    static final String BACKSPACE = "⌫";
    static final String[] LAYER_IDS = {"abc", "pairs", "123", "àé", "#+"};
    static final String[][] KEYS = {
            {"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "'", "-", ",", ".", " ", REPEAT, "?", "!", "\n", BACKSPACE},
            {"th", "he", "in", "er", "an", "re", "on", "at", "en", "nd", "ti", "es", "or", "te", "of", "ed", "is", "it", "al", "ar", "st", "to", "nt", "ng", "se", "ha", "as", "ou", "io", "le", "ve", "co", "ch", "sh", "qu", "ll"},
            {"1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ":", ";", "!", "?", "@", "#", "&", "%", "(", ")", "[", "]", "{", "}", "+", "-", "=", "_", "/", "\\", ".", ",", "'", "\"", "$", "€"},
            {"á", "à", "â", "ä", "ã", "å", "æ", "é", "è", "ê", "ë", "í", "ì", "î", "ï", "ó", "ò", "ô", "ö", "õ", "ø", "œ", "ú", "ù", "û", "ü", "ý", "ÿ", "ñ", "ç", "ğ", "ş", "č", "š", "ž", "ß"},
            {"£", "¥", "¢", "€", "$", "%", "*", "+", "−", "÷", "×", "=", "<", ">", "≤", "≥", "≠", "≈", "_", "~", "`", "^", "|", "\\", "@", "#", "&", "§", "©", "®", "°", "•", "…", "\"", "'", ":"}
    };
    static final float[] DIR_X = {-0.866f, 0f, 0.866f, 0.866f, 0f, -0.866f};
    static final float[] DIR_Y = {-0.5f, -1f, -0.5f, 0.5f, 1f, 0.5f};

    static int directionFromVector(float x, float y, int previous) {
        double length = Math.hypot(x, y);
        if (length < 22) return previous;
        double angle = Math.atan2(x, -y) * 180.0 / Math.PI;
        if (previous >= 0) {
            double difference = ((angle - (previous * 60 - 60) + 540) % 360) - 180;
            if (Math.abs(difference) <= 32) return previous;
        }
        int wrapped = (int) Math.round(((angle + 420) % 360) / 60.0) % 6;
        if (wrapped < 0) wrapped += 6;
        return wrapped;
    }

    static String token(int layer, int left, int right) {
        if (layer < 0 || layer >= KEYS.length || left < 0 || left > 5 || right < 0 || right > 5) return null;
        return KEYS[layer][left * 6 + right];
    }

    static void fillRow(int layer, int left, String[] out) {
        for (int right = 0; right < 6; right++) out[right] = token(layer, left, right);
    }

    static void fillCol(int layer, int right, String[] out) {
        for (int left = 0; left < 6; left++) out[left] = token(layer, left, right);
    }

    static String applyCase(String token, int mode) {
        if (token == null || token.isEmpty()) return token;
        if (token.equals(REPEAT) || token.equals(BACKSPACE) || token.equals(" ") || token.equals("\n")) return token;
        if (mode == 0) return token;
        if (mode == 2) return token.toUpperCase(Locale.getDefault());
        StringBuilder out = new StringBuilder(token.length());
        boolean done = false;
        for (int i = 0; i < token.length(); ) {
            int cp = token.codePointAt(i);
            int count = Character.charCount(cp);
            if (!done && Character.isLetter(cp)) {
                out.appendCodePoint(Character.toUpperCase(cp));
                done = true;
            } else {
                out.appendCodePoint(cp);
            }
            i += count;
        }
        return out.toString();
    }

    static String display(String token) {
        if (token == null) return "";
        if (" ".equals(token)) return "␣";
        if ("\n".equals(token)) return "↵";
        return token;
    }

    private DuetEngine() {}
}
