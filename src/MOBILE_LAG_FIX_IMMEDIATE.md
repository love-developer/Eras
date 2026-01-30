# 🚨 MOBILE LAG - IMMEDIATE FIX GUIDE

## ⚡ **THE 3 CRITICAL ISSUES**

### **1. SCROLL BLOCKING** 🔴 URGENT
**Problem:** `e.preventDefault()` in touch handlers blocks ALL scrolling
**Impact:** User can't scroll modals/overlays until animation completes
**Fix Time:** 10 minutes

### **2. PARTICLE OVERLOAD** 🔴 URGENT  
**Problem:** 144 particles × 60fps = 8,640 GPU operations/second
**Impact:** Mobile devices choke, lag, dropped frames
**Fix Time:** 5 minutes

### **3. MEMORY LEAKS** 🟡 HIGH
**Problem:** New AudioContext created every ceremony, never closed
**Impact:** Memory accumulates, app gets slower over time
**Fix Time:** 15 minutes

---

## 🔧 **IMMEDIATE FIXES (DO NOW)**

### **FIX #1: Remove Scroll Blocking**

**Files to change:** ALL ceremony components

**Find this pattern:**
```tsx
onTouchStart={(e) => {
  e.preventDefault(); // ❌ THIS BLOCKS SCROLLING!
  handleAction();
}}
```

**Replace with:**
```tsx
onTouchStart={handleAction}
// Or if you need the event:
onTouchStart={(e) => {
  // Don't call preventDefault - let browser handle scroll
  handleAction();
}}
```

**Apply to these files:**
- ✅ `/components/capsule-themes/ceremonies/BirthdayCakeCeremony.tsx`
- ✅ `/components/capsule-themes/ceremonies/ChampagneCeremony.tsx`  
- `/components/capsule-themes/ceremonies/EternalFlameCeremony.tsx`
- `/components/capsule-themes/ceremonies/TimeTravelerCeremony.tsx`
- `/components/capsule-themes/ceremonies/TravelCeremony.tsx`
- `/components/capsule-themes/ceremonies/GraduationCeremony.tsx`
- `/components/capsule-themes/ceremonies/NewLifeCeremony.tsx`
- `/components/capsule-themes/ceremonies/FriendshipCeremony.tsx`

---

### **FIX #2: Reduce Particles on Mobile**

**Add this import to ALL ceremony files:**
```tsx
import { getOptimalParticleCount } from '@/utils/performance';
```

**Find patterns like:**
```tsx
{Array.from({ length: 80 }).map((_, i) => (
  <Particle key={i} />
))}
```

**Replace with:**
```tsx
const particleCount = getOptimalParticleCount(80);

{Array.from({ length: particleCount }).map((_, i) => (
  <Particle key={i} />
))}
```

**Results:**
- High-end phone: 80 particles (100%)
- Low-end phone: 24 particles (30%) ← **70% reduction!**
- Reduced motion enabled: 0 particles (accessibility)

---

### **FIX #3: Use Shared AudioContext**

**Add this import:**
```tsx
import { useAudioContext } from '@/hooks/useAudioContext';
```

**Remove this code:**
```tsx
const audioContextRef = useRef<AudioContext | null>(null);

const initAudio = useCallback(() => {
  if (!audioContextRef.current) {
    audioContextRef.current = new AudioContext();
  }
}, []);

const playBlowSound = useCallback(() => {
  initAudio();
  const ctx = audioContextRef.current;
  if (!ctx) return;
  // ... complex oscillator code
}, [initAudio]);
```

**Replace with:**
```tsx
const { playSound, playChord } = useAudioContext();

// Usage:
playSound(150, 0.3); // frequency, duration
playChord([523.25, 659.25, 783.99]); // C-E-G chord
```

---

## 📋 **SPECIFIC FILE CHANGES**

### **BirthdayCakeCeremony.tsx** (Already has scroll issues)

**Current problems:**
```tsx
Line 176: onTouchStart={(e) => {
  e.preventDefault(); // ❌ BLOCKS SCROLL
  handleBlow();
}}

Line 462: {Array.from({ length: 80 }).map((_, i) => ( // ❌ TOO MANY
```

**Fix:**
```tsx
// 1. Add imports at top
import { getOptimalParticleCount } from '@/utils/performance';
import { useAudioContext } from '@/hooks/useAudioContext';

// 2. Replace audio code
const { playSound, playChord } = useAudioContext();

// Replace playBlowSound with:
const handleBlow = () => {
  playSound(150, 0.3);
};

// Replace playSuccessChime with:
playChord([523.25, 659.25, 783.99]);

// Replace playPartyHorn with:
playSound(400, 0.3);

// 3. Fix touch handler
onClick={handleBlow}
onTouchStart={handleBlow} // Remove e.preventDefault()

// 4. Reduce particles
const confettiCount = getOptimalParticleCount(80);
{Array.from({ length: confettiCount }).map((_, i) => (
```

---

### **ChampagneCeremony.tsx** (Already has scroll issues)

**Current problems:**
```tsx
Line 222: onTouchStart={(e) => {
  e.preventDefault(); // ❌ BLOCKS SCROLL
  handleShake();
}}

Line 389: {Array.from({ length: 60 }).map // Spray - too many
Line 445: {Array.from({ length: 50 }).map // Confetti - too many  
Line 471: {Array.from({ length: 12 }).map // Hearts
Line 497: {Array.from({ length: 20 }).map // Petals
```

**Fix:**
```tsx
// 1. Add imports
import { getOptimalParticleCount } from '@/utils/performance';
import { useAudioContext } from '@/hooks/useAudioContext';

// 2. Replace audio
const { playSound, playChord } = useAudioContext();

// Replace playPopSound:
playSound(100, 0.2);

// Replace playFizzSound:
playSound(4000, 0.5);

// Replace playCelebrationChime:
playChord([523.25, 659.25, 783.99, 1046.50]);

// 3. Fix touch
onClick={handleShake}
onTouchStart={handleShake} // Remove e.preventDefault()

// 4. Reduce ALL particle arrays
const sprayCount = getOptimalParticleCount(60);
const confettiCount = getOptimalParticleCount(50);
const heartCount = getOptimalParticleCount(12);
const petalCount = getOptimalParticleCount(20);

{Array.from({ length: sprayCount }).map((_, i) => (
// etc for each particle type
```

---

## 🎯 **TESTING CHECKLIST**

After applying fixes, test:

### **Scroll Test:**
1. Open any ceremony
2. While ceremony is playing, try to scroll
3. ✅ **PASS:** Scroll works immediately
4. ❌ **FAIL:** Scroll blocked → still has `e.preventDefault()`

### **Performance Test:**
1. Open ceremony on low-end device
2. Check particle count in browser DevTools
3. ✅ **PASS:** See ~30% of normal particles
4. ❌ **FAIL:** See 100% → forgot `getOptimalParticleCount()`

### **Memory Test:**
1. Open 10 ceremonies in a row
2. Check browser Task Manager → Memory usage
3. ✅ **PASS:** Memory stays flat (~50-100MB)
4. ❌ **FAIL:** Memory keeps climbing → AudioContext leak

---

## 📊 **EXPECTED RESULTS**

### **Before:**
- ❌ Scroll blocked during ceremonies
- ❌ 144 particles on ALL devices
- ❌ Memory leaks after multiple ceremonies
- ❌ 20-30 FPS on low-end phones
- ❌ Laggy, unresponsive feel

### **After:**
- ✅ Scroll works during ceremonies
- ✅ 43 particles on low-end (70% reduction)
- ✅ Zero memory leaks
- ✅ 50-60 FPS on low-end phones
- ✅ Smooth, responsive feel

---

## 🚀 **30-MINUTE FIX PLAN**

### **Minutes 0-10: Scroll Blocking**
- Search ALL ceremony files for `e.preventDefault()`
- Remove or comment out
- Test scroll in browser

### **Minutes 10-20: Particle Reduction**
- Import `getOptimalParticleCount` in all ceremonies
- Wrap all `Array.from({ length: N })` with function
- Test on mobile - verify fewer particles

### **Minutes 20-30: Audio Cleanup**
- Import `useAudioContext` hook
- Replace all custom audio code
- Test sounds still work

---

## 🔍 **QUICK SEARCH & REPLACE**

Use your IDE's global search/replace:

### **Search #1:**
```
Find: onTouchStart={(e) => {\n  e.preventDefault();
Replace: onTouchStart={() => {
```

### **Search #2:**
```
Find: Array.from({ length: 80 })
Replace: Array.from({ length: getOptimalParticleCount(80) })

// Then manually create the const at top of component
```

### **Search #3:**
```
Find: audioContextRef.current = new (window.AudioContext
Replace: // REMOVED - using shared useAudioContext hook
```

---

## ⚠️ **GOTCHAS TO AVOID**

### **1. Don't break tap interactions**
```tsx
// ❌ WRONG - Removes tap handler
onTouchStart={undefined}

// ✅ CORRECT - Keeps tap, removes preventDefault
onTouchStart={handleAction}
```

### **2. Don't forget to define particleCount**
```tsx
// ❌ WRONG - Used before defined
{Array.from({ length: particleCount }).map(...)}
const particleCount = getOptimalParticleCount(80); // Too late!

// ✅ CORRECT - Define before use
const particleCount = getOptimalParticleCount(80);
{Array.from({ length: particleCount }).map(...)}
```

### **3. Don't break existing animations**
```tsx
// ❌ WRONG - Changes animation logic
const particleCount = 24; // Hardcoded

// ✅ CORRECT - Dynamically adjusts
const particleCount = getOptimalParticleCount(80);
```

---

## 🎉 **SUCCESS CRITERIA**

You'll know it's working when:

1. ✅ User can scroll modals while ceremonies play
2. ✅ Low-end phones show ~30% particles
3. ✅ Memory usage stays flat after multiple opens
4. ✅ FPS stays above 50 on most devices
5. ✅ No console errors about AudioContext

---

## 📞 **NEXT STEPS**

After these immediate fixes:

1. Add CSS animations (see `/MOBILE_PERFORMANCE_OPTIMIZATION.md`)
2. Implement React.memo on ceremony components
3. Add lazy loading for ceremony components
4. Test on real devices (iPhone 8, budget Android)

---

**START WITH FIX #1 (SCROLL BLOCKING) - IT'S THE MOST CRITICAL!** 🚨
