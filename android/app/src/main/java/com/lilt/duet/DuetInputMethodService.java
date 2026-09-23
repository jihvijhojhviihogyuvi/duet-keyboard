package com.lilt.duet;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.inputmethodservice.InputMethodService;
import android.os.Handler;
import android.os.Looper;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;

public final class DuetInputMethodService extends InputMethodService {
    private DuetView keyboard;

    @Override
    public View onCreateInputView() {
        keyboard = new DuetView(this);
        return keyboard;
    }

    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        if (keyboard != null) keyboard.resetPointers();
    }

    final class DuetView extends View {
        private static final int INK = 0xFF1C232C;
        private static final int PAPER = 0xFFF4F1EA;
        private static final int BLUE = 0xFF315D8C;
        private static final int MUTED = 0xFF6A7380;
        private static final int CHIP = 0xFFE6E0D6;
        private static final int PAD = 0xFFFFFCF7;
        private static final int KEY = 0xFFEFE8DC;
        private static final int KIND_NONE = 0;
        private static final int KIND_PAD0 = 1;
        private static final int KIND_PAD1 = 2;
        private static final int KIND_BACK = 3;
        private static final int KIND_SPACE = 4;
        private static final int KIND_ENTER = 5;
        private static final int KIND_CHIP = 6;

        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final RectF rect = new RectF();
        private final RectF leftPad = new RectF();
        private final RectF rightPad = new RectF();
        private final RectF backRect = new RectF();
        private final RectF spaceRect = new RectF();
        private final RectF enterRect = new RectF();
        private final float[][] keyX = new float[2][6];
        private final float[][] keyY = new float[2][6];
        private final int[] pointers = {-1, -1};
        private final float[] startX = {0, 0};
        private final float[] startY = {0, 0};
        private final int[] dirs = {-1, -1};
        private final int[] kindOf = new int[20];
        private final String[] cluster = new String[6];
        private final Handler handler = new Handler(Looper.getMainLooper());
        private final Typeface medium = Typeface.create("sans-serif-medium", Typeface.NORMAL);
        private final Typeface regular = Typeface.create("sans-serif", Typeface.NORMAL);

        private boolean waitingRelease;
        private int layer;
        private int shift;
        private String last = "";
        private String pending = "";
        private float density;
        private float keyR;
        private int heldKind;
        private int heldPointer = -1;
        private int pressedBar;

        private final Runnable repeat = new Runnable() {
            @Override public void run() {
                fireHeld();
                handler.postDelayed(this, 70);
            }
        };

        DuetView(DuetInputMethodService service) {
            super(service);
            setBackgroundColor(PAPER);
            setClickable(true);
            setHapticFeedbackEnabled(true);
            density = getResources().getDisplayMetrics().density;
        }

        void resetPointers() {
            pointers[0] = pointers[1] = -1;
            dirs[0] = dirs[1] = -1;
            waitingRelease = false;
            pending = "";
            stopHold();
            invalidate();
        }

        @Override
        protected void onDetachedFromWindow() {
            handler.removeCallbacksAndMessages(null);
            super.onDetachedFromWindow();
        }

        @Override
        protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
            int width = MeasureSpec.getSize(widthMeasureSpec);
            int screen = getResources().getDisplayMetrics().heightPixels;
            int height = Math.max((int) (380 * density), Math.min((int) (screen * 0.48f), (int) (460 * density)));
            setMeasuredDimension(width, height);
        }

        @Override
        protected void onSizeChanged(int w, int h, int oldw, int oldh) {
            layoutMetrics(w, h);
        }

        private void layoutMetrics(int w, int h) {
            float p = 12 * density;
            float header = 54 * density;
            float barH = 52 * density;
            float gap = 8 * density;
            float padTop = header + 6 * density;
            float padBottom = h - barH - 16 * density;
            leftPad.set(p, padTop, w / 2f - gap / 2f, padBottom);
            rightPad.set(w / 2f + gap / 2f, padTop, w - p, padBottom);
            float barY = h - barH - 8 * density;
            backRect.set(p, barY, p + 64 * density, barY + barH);
            enterRect.set(w - p - 64 * density, barY, w - p, barY + barH);
            spaceRect.set(backRect.right + 8 * density, barY, enterRect.left - 8 * density, barY + barH);
            keyR = Math.min(leftPad.width(), leftPad.height()) * 0.155f;
            placeKeys(0, leftPad);
            placeKeys(1, rightPad);
        }

        private void placeKeys(int hand, RectF pad) {
            float cx = pad.centerX();
            float cy = pad.centerY() + 6 * density;
            float rx = pad.width() * 0.33f;
            float ry = pad.height() * 0.30f;
            for (int i = 0; i < 6; i++) {
                keyX[hand][i] = cx + DuetEngine.DIR_X[i] * rx;
                keyY[hand][i] = cy + DuetEngine.DIR_Y[i] * ry;
            }
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            if (leftPad.width() == 0) layoutMetrics(getWidth(), getHeight());
            float w = getWidth();
            float p = 12 * density;

            paint.setTypeface(medium);
            paint.setColor(BLUE);
            paint.setTextSize(12 * density);
            paint.setTextAlign(Paint.Align.LEFT);
            canvas.drawText("DUET", p, 18 * density, paint);

            paint.setTypeface(regular);
            paint.setColor(pending.isEmpty() ? MUTED : BLUE);
            paint.setTextSize(13 * density);
            String hint = pending.isEmpty() ? "tap a label or flick · then the other pad" : DuetEngine.display(pending);
            paint.setTextAlign(Paint.Align.RIGHT);
            canvas.drawText(hint, w - p, 18 * density, paint);
            paint.setTextAlign(Paint.Align.LEFT);

            float chipY = 26 * density;
            float chipH = 26 * density;
            float x = p;
            float chipW = (w - 2 * p - 52 * density - 6 * 5) / 5f;
            for (int i = 0; i < DuetEngine.LAYER_IDS.length; i++) {
                drawChip(canvas, x, chipY, chipW, chipH, DuetEngine.LAYER_IDS[i], layer == i);
                x += chipW + 6 * density;
            }
            String shiftLabel = shift == 2 ? "ABC" : shift == 1 ? "Abc" : "abc";
            drawChip(canvas, w - p - 52 * density, chipY, 52 * density, chipH, shiftLabel, shift > 0);

            drawPad(canvas, 0, leftPad, "LEFT");
            drawPad(canvas, 1, rightPad, "RIGHT");
            drawBarButton(canvas, backRect, "⌫", pressedBar == KIND_BACK);
            drawBarButton(canvas, spaceRect, "space", pressedBar == KIND_SPACE);
            drawBarButton(canvas, enterRect, "↵", pressedBar == KIND_ENTER);
        }

        private void drawChip(Canvas canvas, float l, float t, float w, float h, String label, boolean on) {
            rect.set(l, t, l + w, t + h);
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(on ? BLUE : CHIP);
            canvas.drawRoundRect(rect, 13 * density, 13 * density, paint);
            paint.setColor(on ? Color.WHITE : INK);
            paint.setTypeface(medium);
            paint.setTextSize(11 * density);
            paint.setTextAlign(Paint.Align.CENTER);
            canvas.drawText(label, l + w / 2f, t + h / 2f + 4 * density, paint);
            paint.setTextAlign(Paint.Align.LEFT);
        }

        private void drawPad(Canvas canvas, int hand, RectF pad, String label) {
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(0x14000000);
            rect.set(pad.left, pad.top + 3 * density, pad.right, pad.bottom + 3 * density);
            canvas.drawRoundRect(rect, 22 * density, 22 * density, paint);
            paint.setColor(PAD);
            canvas.drawRoundRect(pad, 22 * density, 22 * density, paint);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(density);
            paint.setColor(dirs[hand] >= 0 ? BLUE : 0xFFDDD4C6);
            canvas.drawRoundRect(pad, 22 * density, 22 * density, paint);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(MUTED);
            paint.setTextSize(10 * density);
            paint.setTypeface(medium);
            paint.setTextAlign(Paint.Align.LEFT);
            canvas.drawText(label, pad.left + 12 * density, pad.top + 18 * density, paint);

            if (pointers[hand] >= 0 && dirs[hand] >= 0) {
                paint.setColor(0x66315D8C);
                paint.setStrokeWidth(2.5f * density);
                paint.setStyle(Paint.Style.STROKE);
                canvas.drawLine(startX[hand], startY[hand], keyX[hand][dirs[hand]], keyY[hand][dirs[hand]], paint);
                paint.setStyle(Paint.Style.FILL);
                canvas.drawCircle(keyX[hand][dirs[hand]], keyY[hand][dirs[hand]], 4 * density, paint);
            }

            for (int i = 0; i < 6; i++) drawKey(canvas, hand, i);

            float cx = pad.centerX();
            float cy = pad.centerY() + 6 * density;
            paint.setStyle(Paint.Style.FILL);
            boolean both = dirs[0] >= 0 && dirs[1] >= 0;
            paint.setColor(both ? BLUE : KEY);
            canvas.drawCircle(cx, cy, keyR * 0.72f, paint);
            paint.setColor(both ? Color.WHITE : INK);
            paint.setTextAlign(Paint.Align.CENTER);
            paint.setTypeface(medium);
            if (both) {
                paint.setTextSize(16 * density);
                canvas.drawText(DuetEngine.display(pending), cx, cy + 6 * density, paint);
            } else {
                paint.setTextSize(10 * density);
                paint.setColor(MUTED);
                canvas.drawText(dirs[hand] >= 0 ? "locked" : "flick", cx, cy + 4 * density, paint);
            }
            paint.setTextAlign(Paint.Align.LEFT);
        }

        private void drawKey(Canvas canvas, int hand, int dir) {
            float x = keyX[hand][dir];
            float y = keyY[hand][dir];
            boolean snapped = dirs[hand] == dir;
            boolean otherSet = dirs[1 - hand] >= 0;
            boolean chosen = snapped && otherSet;
            float r = keyR * (snapped ? 1.14f : 1f);

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(chosen ? BLUE : snapped ? 0xFF4E77A6 : KEY);
            canvas.drawCircle(x, y, r, paint);
            if (snapped) {
                paint.setStyle(Paint.Style.STROKE);
                paint.setStrokeWidth(2 * density);
                paint.setColor(0xFF1E3F64);
                canvas.drawCircle(x, y, r, paint);
            }

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(snapped ? Color.WHITE : INK);
            paint.setTextAlign(Paint.Align.CENTER);
            paint.setTypeface(snapped ? medium : regular);

            if (otherSet) {
                int left = hand == 0 ? dir : dirs[0];
                int right = hand == 1 ? dir : dirs[1];
                String token = DuetEngine.applyCase(DuetEngine.token(layer, left, right), shift);
                paint.setTextSize((snapped ? 17 : 14) * density);
                canvas.drawText(DuetEngine.display(token), x, y + 6 * density, paint);
            } else {
                if (hand == 0) DuetEngine.fillRow(layer, dir, cluster);
                else DuetEngine.fillCol(layer, dir, cluster);
                float s = clusterFits(cluster) ? 9 * density : 8 * density;
                paint.setTextSize(s);
                for (int row = 0; row < 2; row++) {
                    for (int col = 0; col < 3; col++) {
                        int idx = row * 3 + col;
                        String label = DuetEngine.display(DuetEngine.applyCase(cluster[idx], shift));
                        float tx = x + (col - 1) * (r * 0.55f);
                        float ty = y + (row - 0.35f) * (r * 0.62f) + 3 * density;
                        canvas.drawText(label, tx, ty, paint);
                    }
                }
            }
            paint.setTextAlign(Paint.Align.LEFT);
        }

        private boolean clusterFits(String[] six) {
            for (String item : six) if (item != null && item.length() > 1) return false;
            return true;
        }

        private void drawBarButton(Canvas canvas, RectF box, String label, boolean pressed) {
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(pressed ? BLUE : PAD);
            canvas.drawRoundRect(box, 16 * density, 16 * density, paint);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(density);
            paint.setColor(pressed ? BLUE : 0xFFDDD4C6);
            canvas.drawRoundRect(box, 16 * density, 16 * density, paint);
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(pressed ? Color.WHITE : INK);
            paint.setTypeface(medium);
            paint.setTextSize(16 * density);
            paint.setTextAlign(Paint.Align.CENTER);
            canvas.drawText(label, box.centerX(), box.centerY() + 6 * density, paint);
            paint.setTextAlign(Paint.Align.LEFT);
        }

        @Override
        public boolean onTouchEvent(MotionEvent event) {
            int action = event.getActionMasked();
            int index = event.getActionIndex();
            int id = event.getPointerId(index);
            float x = event.getX(index);
            float y = event.getY(index);

            if (action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_POINTER_DOWN) {
                int kind = hitKind(x, y);
                if (id >= 0 && id < kindOf.length) kindOf[id] = kind;
                if (kind == KIND_CHIP) {
                    handleHeaderTap(x, y);
                    return true;
                }
                if (kind == KIND_PAD0 || kind == KIND_PAD1) {
                    int hand = kind - KIND_PAD0;
                    if (waitingRelease) return true;
                    if (pointers[hand] < 0) {
                        pointers[hand] = id;
                        startX[hand] = x;
                        startY[hand] = y;
                        int tapped = hitKey(hand, x, y);
                        if (tapped >= 0) {
                            dirs[hand] = tapped;
                            performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
                        } else if (hitCenter(hand, x, y)) {
                            dirs[hand] = -1;
                        }
                        maybeCommit();
                        invalidate();
                    }
                    return true;
                }
                if (kind == KIND_BACK || kind == KIND_SPACE || kind == KIND_ENTER) {
                    startHold(kind, id);
                    return true;
                }
                return true;
            }

            if (action == MotionEvent.ACTION_MOVE) {
                for (int hand = 0; hand < 2; hand++) {
                    int pointer = pointers[hand];
                    int i = event.findPointerIndex(pointer);
                    if (i < 0 || waitingRelease) continue;
                    float dx = event.getX(i) - startX[hand];
                    float dy = event.getY(i) - startY[hand];
                    int next = DuetEngine.directionFromVector(dx, dy, dirs[hand]);
                    if (next != dirs[hand] && next >= 0) {
                        dirs[hand] = next;
                        performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
                    }
                }
                maybeCommit();
                invalidate();
                return true;
            }

            if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_POINTER_UP || action == MotionEvent.ACTION_CANCEL) {
                int kind = id >= 0 && id < kindOf.length ? kindOf[id] : KIND_NONE;
                if (id >= 0 && id < kindOf.length) kindOf[id] = KIND_NONE;
                if (kind == KIND_BACK || kind == KIND_SPACE || kind == KIND_ENTER) {
                    stopHold();
                    invalidate();
                    return true;
                }
                int hand = pointers[0] == id ? 0 : pointers[1] == id ? 1 : -1;
                if (hand >= 0) {
                    pointers[hand] = -1;
                    if (waitingRelease && pointers[0] < 0 && pointers[1] < 0) waitingRelease = false;
                    invalidate();
                }
                return true;
            }
            return true;
        }

        private int hitKind(float x, float y) {
            if (y < leftPad.top - 4 * density) return KIND_CHIP;
            if (backRect.contains(x, y)) return KIND_BACK;
            if (spaceRect.contains(x, y)) return KIND_SPACE;
            if (enterRect.contains(x, y)) return KIND_ENTER;
            if (leftPad.contains(x, y)) return KIND_PAD0;
            if (rightPad.contains(x, y)) return KIND_PAD1;
            return KIND_NONE;
        }

        private int hitKey(int hand, float x, float y) {
            int best = -1;
            float bestD = keyR * 1.2f;
            for (int i = 0; i < 6; i++) {
                float d = (float) Math.hypot(x - keyX[hand][i], y - keyY[hand][i]);
                if (d < bestD) {
                    bestD = d;
                    best = i;
                }
            }
            return best;
        }

        private boolean hitCenter(int hand, float x, float y) {
            RectF pad = hand == 0 ? leftPad : rightPad;
            return Math.hypot(x - pad.centerX(), y - (pad.centerY() + 6 * density)) < keyR * 0.8f;
        }

        private void maybeCommit() {
            updatePending();
            if (waitingRelease || dirs[0] < 0 || dirs[1] < 0) return;
            commit(dirs[0], dirs[1]);
            dirs[0] = dirs[1] = -1;
            pending = "";
            waitingRelease = pointers[0] >= 0 || pointers[1] >= 0;
        }

        private void handleHeaderTap(float x, float y) {
            float p = 12 * density;
            float chipY = 26 * density;
            float chipH = 26 * density;
            if (y < chipY || y > chipY + chipH) return;
            float chipW = (getWidth() - 2 * p - 52 * density - 6 * 5) / 5f;
            float cx = p;
            for (int i = 0; i < DuetEngine.LAYER_IDS.length; i++) {
                if (x >= cx && x <= cx + chipW) {
                    layer = i;
                    updatePending();
                    invalidate();
                    return;
                }
                cx += chipW + 6 * density;
            }
            if (x >= getWidth() - p - 52 * density) {
                shift = (shift + 1) % 3;
                updatePending();
                invalidate();
            }
        }

        private void startHold(int kind, int id) {
            stopHold();
            heldKind = kind;
            heldPointer = id;
            pressedBar = kind;
            fireHeld();
            handler.postDelayed(repeat, 400);
            performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
            invalidate();
        }

        private void stopHold() {
            handler.removeCallbacks(repeat);
            heldKind = KIND_NONE;
            heldPointer = -1;
            pressedBar = 0;
        }

        private void fireHeld() {
            InputConnection ic = getCurrentInputConnection();
            if (ic == null) return;
            if (heldKind == KIND_BACK) {
                ic.deleteSurroundingText(1, 0);
                last = DuetEngine.BACKSPACE;
            } else if (heldKind == KIND_SPACE) {
                ic.commitText(" ", 1);
                last = " ";
            } else if (heldKind == KIND_ENTER) {
                ic.commitText("\n", 1);
                last = "\n";
            }
        }

        private void updatePending() {
            if (waitingRelease) return;
            String token = DuetEngine.token(layer, dirs[0], dirs[1]);
            pending = token == null ? "" : DuetEngine.applyCase(token, shift);
        }

        private void commit(int left, int right) {
            String token = DuetEngine.token(layer, left, right);
            if (token == null) return;
            InputConnection ic = getCurrentInputConnection();
            if (ic == null) return;
            performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
            if (token.equals(DuetEngine.BACKSPACE)) {
                ic.deleteSurroundingText(1, 0);
                last = DuetEngine.BACKSPACE;
                return;
            }
            if (token.equals(DuetEngine.REPEAT)) {
                if (!last.isEmpty() && !last.equals(DuetEngine.BACKSPACE) && !last.equals(DuetEngine.REPEAT)) {
                    ic.commitText(last, 1);
                }
                return;
            }
            String text = DuetEngine.applyCase(token, shift);
            ic.commitText(text, 1);
            last = text;
            if (shift == 1 && looksLikeLetter(token)) shift = 0;
        }

        private boolean looksLikeLetter(String token) {
            for (int i = 0; i < token.length(); ) {
                int cp = token.codePointAt(i);
                if (Character.isLetter(cp)) return true;
                i += Character.charCount(cp);
            }
            return false;
        }
    }
}
