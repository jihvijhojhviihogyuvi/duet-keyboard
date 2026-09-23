package com.lilt.duet;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.inputmethodservice.InputMethodService;
import android.os.SystemClock;
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
        private static final int INK = 0xFF262E38;
        private static final int PAPER = 0xFFF7F8FA;
        private static final int BLUE = 0xFF315D8C;
        private static final int MUTED = 0xFF7A8490;
        private static final int CHIP = 0xFFE8EEF4;

        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final RectF rect = new RectF();
        private final int[] pointers = {-1, -1};
        private final float[] startX = {0, 0};
        private final float[] startY = {0, 0};
        private final int[] dirs = {-1, -1};
        private boolean waitingRelease;
        private int layer;
        private int shift; // 0 lower, 1 once, 2 upper
        private String last = "";
        private String pending = "";
        private float density;

        DuetView(DuetInputMethodService service) {
            super(service);
            setBackgroundColor(PAPER);
            setClickable(true);
            density = getResources().getDisplayMetrics().density;
        }

        void resetPointers() {
            pointers[0] = pointers[1] = -1;
            dirs[0] = dirs[1] = -1;
            waitingRelease = false;
            pending = "";
            invalidate();
        }

        @Override
        protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
            int width = MeasureSpec.getSize(widthMeasureSpec);
            int screen = getResources().getDisplayMetrics().heightPixels;
            int height = Math.max((int) (320 * density), Math.min((int) (screen * 0.42f), (int) (420 * density)));
            setMeasuredDimension(width, height);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float w = getWidth();
            float h = getHeight();
            float p = 16 * density;

            paint.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
            paint.setColor(BLUE);
            paint.setTextSize(13 * density);
            canvas.drawText("DUET", p, 22 * density, paint);

            paint.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
            paint.setColor(MUTED);
            paint.setTextSize(11 * density);
            String hint = pending.isEmpty() ? "both thumbs · flick · lift to write" : "will write  " + DuetEngine.display(pending);
            canvas.drawText(hint, p + 64 * density, 22 * density, paint);

            float chipY = 34 * density;
            float chipH = 28 * density;
            float x = p;
            for (int i = 0; i < DuetEngine.LAYER_IDS.length; i++) {
                float cw = 52 * density;
                drawChip(canvas, x, chipY, cw, chipH, DuetEngine.LAYER_IDS[i], layer == i);
                x += cw + 6 * density;
            }
            String shiftLabel = shift == 2 ? "ABC" : shift == 1 ? "Abc" : "abc";
            drawChip(canvas, w - p - 52 * density, chipY, 52 * density, chipH, shiftLabel, shift > 0);

            float padTop = 74 * density;
            float padBottom = h - 36 * density;
            drawPad(canvas, 0, p, padTop, w / 2f - 8 * density, padBottom, "LEFT");
            drawPad(canvas, 1, w / 2f + 8 * density, padTop, w - p, padBottom, "RIGHT");

            paint.setColor(MUTED);
            paint.setTextSize(11 * density);
            String footer = last.isEmpty() ? "enable in Settings → Language & input → Duet" : "last  " + DuetEngine.display(last);
            canvas.drawText(footer, p, h - 14 * density, paint);
        }

        private void drawChip(Canvas canvas, float l, float t, float w, float h, String label, boolean on) {
            rect.set(l, t, l + w, t + h);
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(on ? BLUE : CHIP);
            canvas.drawRoundRect(rect, 14 * density, 14 * density, paint);
            paint.setColor(on ? Color.WHITE : INK);
            paint.setTextSize(12 * density);
            paint.setTextAlign(Paint.Align.CENTER);
            canvas.drawText(label, l + w / 2f, t + h / 2f + 4 * density, paint);
            paint.setTextAlign(Paint.Align.LEFT);
        }

        private void drawPad(Canvas canvas, int hand, float l, float t, float r, float b, String label) {
            rect.set(l, t, r, b);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(density);
            paint.setColor(dirs[hand] >= 0 ? BLUE : 0xFFD5DCE3);
            canvas.drawRoundRect(rect, 18 * density, 18 * density, paint);
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(MUTED);
            paint.setTextSize(11 * density);
            canvas.drawText(label, l + 12 * density, t + 20 * density, paint);

            float cx = (l + r) / 2f;
            float cy = (t + b) / 2f;
            float rx = (r - l) * 0.31f;
            float ry = (b - t) * 0.31f;
            // Match web engine: 0=up-left, 1=up, 2=up-right, 3=down-right, 4=down, 5=down-left
            float[] dx = {-0.866f, 0f, 0.866f, 0.866f, 0f, -0.866f};
            float[] dy = {-0.5f, -1f, -0.5f, 0.5f, 1f, 0.5f};
            for (int i = 0; i < 6; i++) {
                float x = cx + dx[i] * rx;
                float y = cy + dy[i] * ry;
                paint.setColor(dirs[hand] == i ? BLUE : INK);
                paint.setTextSize((dirs[hand] == i ? 26 : 20) * density);
                paint.setTextAlign(Paint.Align.CENTER);
                canvas.drawText(DuetEngine.GLYPHS[i], x, y + 7 * density, paint);
            }
            paint.setTextSize(12 * density);
            paint.setColor(INK);
            String mid = dirs[hand] >= 0 ? DuetEngine.GLYPHS[dirs[hand]] : "flick";
            canvas.drawText(mid, cx, cy + 8 * density, paint);
            paint.setTextAlign(Paint.Align.LEFT);
        }

        @Override
        public boolean onTouchEvent(MotionEvent event) {
            int action = event.getActionMasked();
            int index = event.getActionIndex();
            float headerBottom = 66 * density;
            if (action == MotionEvent.ACTION_DOWN && event.getY(index) < headerBottom) {
                handleHeaderTap(event.getX(index), event.getY(index));
                return true;
            }
            if (action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_POINTER_DOWN) {
                if (event.getY(index) < headerBottom) return true;
                int hand = event.getX(index) < getWidth() / 2f ? 0 : 1;
                int id = event.getPointerId(index);
                if (pointers[hand] < 0) {
                    pointers[hand] = id;
                    startX[hand] = event.getX(index);
                    startY[hand] = event.getY(index);
                    dirs[hand] = -1;
                    if (!waitingRelease) pending = "";
                    invalidate();
                }
                return true;
            }
            if (action == MotionEvent.ACTION_MOVE) {
                for (int hand = 0; hand < 2; hand++) {
                    int pointer = pointers[hand];
                    int i = event.findPointerIndex(pointer);
                    if (i < 0) continue;
                    float dx = event.getX(i) - startX[hand];
                    float dy = event.getY(i) - startY[hand];
                    dirs[hand] = DuetEngine.directionFromVector(dx, dy, dirs[hand]);
                }
                updatePending();
                invalidate();
                return true;
            }
            if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_POINTER_UP || action == MotionEvent.ACTION_CANCEL) {
                int id = event.getPointerId(index);
                int hand = pointers[0] == id ? 0 : pointers[1] == id ? 1 : -1;
                if (hand >= 0) {
                    if (!waitingRelease && dirs[0] >= 0 && dirs[1] >= 0) {
                        commit(dirs[0], dirs[1]);
                        waitingRelease = pointers[1 - hand] >= 0;
                        dirs[0] = dirs[1] = -1;
                        pending = "";
                    } else if (waitingRelease) {
                        if (pointers[1 - hand] < 0) waitingRelease = false;
                    }
                    pointers[hand] = -1;
                    if (pointers[0] < 0 && pointers[1] < 0) {
                        waitingRelease = false;
                        dirs[0] = dirs[1] = -1;
                    }
                    invalidate();
                }
                return true;
            }
            return true;
        }

        private void handleHeaderTap(float x, float y) {
            float p = 16 * density;
            float chipY = 34 * density;
            float chipH = 28 * density;
            if (y < chipY || y > chipY + chipH) return;
            float cx = p;
            for (int i = 0; i < DuetEngine.LAYER_IDS.length; i++) {
                float cw = 52 * density;
                if (x >= cx && x <= cx + cw) {
                    layer = i;
                    invalidate();
                    return;
                }
                cx += cw + 6 * density;
            }
            float shiftLeft = getWidth() - p - 52 * density;
            if (x >= shiftLeft) {
                shift = (shift + 1) % 3;
                invalidate();
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
