package com.lilt.duet;

import android.inputmethodservice.InputMethodService;
import android.view.View;
import android.view.inputmethod.InputConnection;
import android.graphics.*;
import android.graphics.drawable.ColorDrawable;
import android.content.Context;
import android.view.MotionEvent;
import java.util.Locale;

public final class DuetInputMethodService extends InputMethodService {
    @Override public View onCreateInputView() { return new DuetView(this); }
    private final class DuetView extends View {
        private final Paint p = new Paint(3); private final int blue = Color.rgb(49,93,140); private final int ink = Color.rgb(38,46,56); private final int paper = Color.rgb(247,248,250);
        private final float[][] starts = new float[2][2]; private final int[] dirs = {-1,-1}; private final int[] pointers = {-1,-1}; private int layer = 0; private String last = "";
        private final String[][] keys = {{"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","'","-",",","."," ","⌫","?","!","\n"},{"th","he","in","er","an","re","on","at","en","nd","ti","es","or","te","of","ed","is","it","al","ar","st","to","nt","ng","se","ha","as","ou","io","le","ve","co","ch","sh","qu","ll"}};
        DuetView(Context c) { super(c); setBackground(new ColorDrawable(paper)); setFocusable(true); }
        @Override protected void onDraw(Canvas c) { super.onDraw(c); float w=getWidth(), h=getHeight(); p.setTypeface(Typeface.create("sans",Typeface.NORMAL)); p.setColor(ink); p.setTextSize(28); c.drawText("DUET", 22, 34, p); p.setTextSize(13); p.setColor(Color.GRAY); c.drawText(layer==0?"abc · exact characters":"pairs · literal chunks", 22, 54, p); drawPad(c, 0, 22, 70, w/2-30, h-82, "LEFT"); drawPad(c, 1, w/2+8, 70, w-22, h-82, "RIGHT"); p.setColor(Color.GRAY); p.setTextSize(12); c.drawText("both thumbs · lift to write", 22, h-20, p); }
        private void drawPad(Canvas c, int hand, float l, float t, float r, float b, String label) { p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(1); p.setColor(dirs[hand]>=0?blue:Color.LTGRAY); c.drawRoundRect(l,t,r,b,18,18,p); p.setStyle(Paint.Style.FILL); p.setColor(Color.GRAY); p.setTextSize(12); c.drawText(label,l+12,t+22,p); String[] glyph={"↖","↑","↗","↘","↓","↙"}; float cx=(l+r)/2, cy=(t+b)/2; for(int i=0;i<6;i++){ double a=Math.PI*2*i/6-Math.PI/2; float x=cx+(float)Math.cos(a)*(r-l)*.31f, y=cy+(float)Math.sin(a)*(b-t)*.31f; p.setColor(dirs[hand]==i?blue:ink); p.setTextSize(24); c.drawText(glyph[i],x-10,y+8,p); } p.setColor(ink); p.setTextSize(14); c.drawText(dirs[hand]>=0?glyph[dirs[hand]]:"start anywhere",cx-38,cy+52,p); }
        @Override public boolean onTouchEvent(MotionEvent e) { int action=e.getActionMasked(); int index=e.getActionIndex(); if(action==MotionEvent.ACTION_DOWN||action==MotionEvent.ACTION_POINTER_DOWN){ int hand=e.getX(index)<getWidth()/2?0:1; int id=e.getPointerId(index); if(pointers[hand]<0){pointers[hand]=id; starts[hand][0]=e.getX(index); starts[hand][1]=e.getY(index); dirs[hand]=-1; invalidate();} return true; } if(action==MotionEvent.ACTION_MOVE){ for(int hand=0;hand<2;hand++){int pointer=pointers[hand], i=e.findPointerIndex(pointer); if(i>=0){float dx=e.getX(i)-starts[hand][0], dy=e.getY(i)-starts[hand][1]; if(Math.hypot(dx,dy)>18) dirs[hand]=direction(dx,dy);}} invalidate(); return true; } if(action==MotionEvent.ACTION_UP||action==MotionEvent.ACTION_POINTER_UP||action==MotionEvent.ACTION_CANCEL){ int hand=e.getX(index)<getWidth()/2?0:1; if(pointers[hand]>=0){pointers[hand]=-1; if(dirs[0]>=0&&dirs[1]>=0) commit(dirs[0],dirs[1]); invalidate();} return true;} return true; }
        private int direction(float x,float y){ double a=Math.atan2(x,-y); int d=(int)Math.round((a+Math.PI*2)/(Math.PI/3))%6; return d; }
        private void commit(int left,int right){ int index=left*6+right; String token=keys[layer][index%keys[layer].length]; InputConnection ic=getCurrentInputConnection(); if(ic==null)return; if(token.equals("⌫")){ic.deleteSurroundingText(1,0);return;} ic.commitText(token,1); last=token; }
    }
}
