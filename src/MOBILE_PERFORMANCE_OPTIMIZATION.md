# 📱 MOBILE PERFORMANCE OPTIMIZATION GUIDE

## 🔴 **CRITICAL ISSUES IDENTIFIED**

### **1. SCROLL BLOCKING (HIGHEST PRIORITY)**
**Problem:** Touch events with `e.preventDefault()` block native scrolling
**Location:** All ceremony components
**Impact:** Users can't scroll until animation completes

**Fix Required:**
```tsx
// ❌ WRONG - Blocks scrolling
onTouchStart={(e) => {
  e.preventDefault(); // <-- REMOVES NATIVE SCROLL
  handleAction();
}}

// ✅ CORRECT - Allows scrolling
onTouchStart={(e) => {
  // Only prevent default for specific gestures, not scroll
  if (e.target === e.currentTarget) {
    e.preventDefault();
  }
  handleAction();
}}

// ✅ BETTER - Use passive listeners
useEffect(() => {
  const handler = (e: TouchEvent) => handleAction();
  element.addEventListener('touchstart', handler, { passive: true });
  return () => element.removeEventListener('touchstart', handler);
}, []);
```

---

### **2. PARTICLE OVERLOAD**
**Problem:** 100-144 particles per ceremony kills mobile GPUs
**Locations:**
- `BirthdayCakeCeremony.tsx`: 80 confetti + 20 particles = 100
- `ChampagneCeremony.tsx`: 60 spray + 50 confetti + 12 hearts + 20 petals + 2 glasses = 144
- `EternalFlameCeremony.tsx`: 52 particles

**Fix Required:**
```tsx
import { getOptimalParticleCount, isLowEndDevice } from '@/utils/performance';

// Adjust particle count based on device
const baseParticleCount = 80;
const particleCount = getOptimalParticleCount(baseParticleCount);

// Low-end devices get 30%, high-end get 100%
```

---

### **3. AUDIO CONTEXT MEMORY LEAKS**
**Problem:** New AudioContext created per ceremony, never closed
**Impact:** Memory accumulates, causes lag over time

**Fix Required:**
```tsx
// ❌ WRONG - Creates new context every time
const audioContextRef = useRef<AudioContext | null>(null);
const initAudio = () => {
  audioContextRef.current = new AudioContext(); // Memory leak!
};

// ✅ CORRECT - Use shared singleton
import { useAudioContext } from '@/hooks/useAudioContext';
const { playSound, playChord } = useAudioContext();
```

---

### **4. REACT RE-RENDER STORMS**
**Problem:** State updates during animations cause entire component tree re-renders

**Fix Required:**
```tsx
// ❌ WRONG - Causes re-render for every particle
{particles.map((p, i) => <Particle key={i} {...p} />)}

// ✅ CORRECT - Memoize particles
const MemoizedParticle = React.memo(Particle);
{particles.map((p, i) => <MemoizedParticle key={p.id} {...p} />)}

// ✅ BETTER - Use CSS animations instead of Motion
<div className="animate-float" /> // Pure CSS, no JS
```

---

### **5. MOTION LIBRARY OVERHEAD**
**Problem:** Every Motion component runs JavaScript on every frame

**Fix Required:**
```tsx
// ❌ SLOW - Motion runs JS every frame
<motion.div animate={{ y: [0, -100] }} />

// ✅ FAST - Pure CSS animation
<div className="animate-bounce" />

// Use Motion ONLY for complex interactions
// Use CSS animations for simple effects
```

---

## 🎯 **OPTIMIZATION STRATEGY**

### **PHASE 1: IMMEDIATE FIXES (Do First)**

#### **1.1 Fix Scroll Blocking**
**Priority:** 🔴 CRITICAL
**Files to update:**
- `/components/capsule-themes/ceremonies/BirthdayCakeCeremony.tsx`
- `/components/capsule-themes/ceremonies/ChampagneCeremony.tsx`
- `/components/capsule-themes/ceremonies/EternalFlameCeremony.tsx`
- All other ceremony components

**Changes:**
```tsx
// Remove e.preventDefault() from touch handlers
// Use CSS touch-action instead
<div 
  className="..."
  style={{ touchAction: 'pan-y' }} // Allow vertical scroll
  onClick={handleAction}
>
```

#### **1.2 Reduce Particle Counts on Mobile**
**Priority:** 🔴 CRITICAL

**Implementation:**
```tsx
import { getOptimalParticleCount } from '@/utils/performance';

// In each ceremony component:
const confettiCount = getOptimalParticleCount(80); // Auto-adjusts
const sprayCount = getOptimalParticleCount(60);
const heartCount = getOptimalParticleCount(12);
```

**Results:**
- High-end device: 100% particles (144 total)
- Low-end device: 30% particles (43 total) - **70% reduction!**
- Reduced motion: 0% particles (accessibility)

#### **1.3 Use Shared AudioContext**
**Priority:** 🟡 HIGH

**Replace in all ceremonies:**
```tsx
// Old code:
const audioContextRef = useRef<AudioContext | null>(null);
const initAudio = useCallback(() => { ... }, []);
const playBlowSound = useCallback(() => { ... }, [initAudio]);

// New code:
import { useAudioContext } from '@/hooks/useAudioContext';
const { playSound, playChord } = useAudioContext();

// Usage:
playSound(150, 0.3); // frequency, duration
playChord([523.25, 659.25, 783.99], 1.5, 0.1); // frequencies, duration, stagger
```

---

### **PHASE 2: REACT OPTIMIZATIONS**

#### **2.1 Memoize Heavy Components**
```tsx
// Wrap ceremony components
export const BirthdayCakeCeremony = React.memo(({ onComplete, isVisible }) => {
  // ... component code
});

// Memoize particle components
const Particle = React.memo(({ x, y, color }: ParticleProps) => (
  <motion.div style={{ x, y, backgroundColor: color }} />
));
```

#### **2.2 Use useMemo for Heavy Calculations**
```tsx
// ❌ WRONG - Recalculates every render
const particles = Array.from({ length: 100 }).map((_, i) => ({
  angle: (i / 100) * Math.PI * 2,
  velocity: 200 + Math.random() * 300
}));

// ✅ CORRECT - Memoized
const particles = useMemo(() => 
  Array.from({ length: particleCount }).map((_, i) => ({
    angle: (i / particleCount) * Math.PI * 2,
    velocity: 200 + Math.random() * 300
  }))
, [particleCount]);
```

#### **2.3 Batch State Updates**
```tsx
// ❌ WRONG - Multiple re-renders
setCandlesLit(newCandles);
setIsBlowing(true);
setPhase('anticipation');

// ✅ CORRECT - Single re-render
React.startTransition(() => {
  setCandlesLit(newCandles);
  setIsBlowing(true);
  setPhase('anticipation');
});
```

---

### **PHASE 3: CSS OPTIMIZATIONS**

#### **3.1 GPU Acceleration**
```css
/* Force GPU acceleration for animations */
.ceremony-element {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU layer */
  backface-visibility: hidden;
}
```

#### **3.2 Replace Motion with CSS Where Possible**
```tsx
// ❌ SLOW - JavaScript animation
<motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity }} />

// ✅ FAST - CSS animation
<div className="animate-spin" />

// Define in globals.css:
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
```

#### **3.3 Use CSS Containment**
```css
/* Prevent layout thrashing */
.ceremony-container {
  contain: layout style paint;
}

.particle {
  contain: strict;
}
```

---

### **PHASE 4: MODAL/OVERLAY OPTIMIZATIONS**

#### **4.1 Fix Modal Scroll Performance**

**Problem:** Modals block scrolling and cause lag

**Files to update:**
- Any component with overlays/modals
- Components using `overflow-hidden` on body

**Solution:**
```tsx
// Use proper scroll locking
useEffect(() => {
  if (isOpen) {
    // Store original overflow
    const originalOverflow = document.body.style.overflow;
    
    // Lock scroll BUT allow touch events
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = 'auto';
    };
  }
}, [isOpen]);
```

#### **4.2 Lazy Render Modal Content**
```tsx
// ❌ WRONG - Renders even when closed
{isOpen && <HeavyModalContent />}

// ✅ CORRECT - Delays render
{isOpen && (
  <Suspense fallback={<Spinner />}>
    <LazyModalContent />
  </Suspense>
)}

const LazyModalContent = lazy(() => import('./HeavyModalContent'));
```

---

### **PHASE 5: ADVANCED OPTIMIZATIONS**

#### **5.1 Virtual Scrolling for Lists**
```tsx
// For long capsule lists, use react-window
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={capsules.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <CapsuleCard style={style} capsule={capsules[index]} />
  )}
</FixedSizeList>
```

#### **5.2 Image Lazy Loading**
```tsx
// Use ImageWithFallback with lazy loading
<ImageWithFallback
  src={imageUrl}
  alt="Capsule"
  loading="lazy" // Native lazy loading
  decoding="async"
/>
```

#### **5.3 Code Splitting Ceremonies**
```tsx
// Lazy load ceremony components
const BirthdayCakeCeremony = lazy(() => 
  import('./ceremonies/BirthdayCakeCeremony')
);

// In CeremonyOverlay:
<Suspense fallback={<CeremonyLoader />}>
  {themeId === 'birthday' && (
    <BirthdayCakeCeremony ... />
  )}
</Suspense>
```

---

## 🎨 **CSS ANIMATION LIBRARY**

Replace Motion animations with these CSS classes:

```css
/* In /styles/globals.css */

/* Particle animations - GPU accelerated */
@keyframes float-up {
  from {
    transform: translateY(0) translateZ(0);
    opacity: 1;
  }
  to {
    transform: translateY(-600px) translateZ(0);
    opacity: 0;
  }
}

.animate-float-up {
  animation: float-up 2s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes confetti-fall {
  from {
    transform: translateY(-100px) rotate(0deg) translateZ(0);
    opacity: 1;
  }
  to {
    transform: translateY(600px) rotate(720deg) translateZ(0);
    opacity: 0;
  }
}

.animate-confetti {
  animation: confetti-fall 2s ease-in forwards;
  will-change: transform, opacity;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1) translateZ(0);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) translateZ(0);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 0.5s ease-in-out infinite;
  will-change: transform, opacity;
}

/* Only animate transform and opacity (GPU accelerated) */
.animate-shake {
  animation: shake 0.6s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0) translateZ(0); }
  25% { transform: translateX(-8px) translateZ(0); }
  50% { transform: translateX(8px) translateZ(0); }
  75% { transform: translateX(-4px) translateZ(0); }
}
```

---

## 📊 **PERFORMANCE TARGETS**

### **Before Optimization:**
- ❌ Birthday ceremony: 100 particles × 60fps = **6000 updates/sec**
- ❌ Champagne ceremony: 144 particles × 60fps = **8640 updates/sec**
- ❌ New AudioContext every ceremony = **Memory leak**
- ❌ Scroll blocked during touch events = **Frozen UI**

### **After Optimization:**
- ✅ Birthday ceremony (low-end): 30 particles × 60fps = **1800 updates/sec** (70% reduction)
- ✅ Champagne ceremony (low-end): 43 particles × 60fps = **2580 updates/sec** (70% reduction)
- ✅ Shared AudioContext = **No memory leaks**
- ✅ Scroll works during animations = **Responsive UI**
- ✅ CSS animations where possible = **GPU accelerated**

---

## 🧪 **TESTING CHECKLIST**

### **Mobile Performance Tests:**
- [ ] Open ceremony on low-end device (4 cores, 4GB RAM)
- [ ] Verify particle count reduced to ~30%
- [ ] Test scrolling during ceremony - should be smooth
- [ ] Check memory usage - should stay stable
- [ ] Test 10 consecutive ceremony opens - no slowdown
- [ ] Verify audio plays without creating new contexts
- [ ] Test with "Reduce Motion" enabled - should show minimal effects

### **Touch Event Tests:**
- [ ] Scroll through modal overlay - should scroll immediately
- [ ] Scroll through capsule list - should be smooth
- [ ] Tap ceremony - should respond immediately
- [ ] Scroll during ceremony - should NOT block

### **Animation Tests:**
- [ ] 60fps during ceremonies (use Chrome DevTools)
- [ ] No layout thrashing (check Performance tab)
- [ ] GPU usage reasonable (<80%)
- [ ] No dropped frames during scroll

---

## 🔧 **IMPLEMENTATION PRIORITY**

### **Week 1: Critical Fixes**
1. ✅ Create `/utils/performance.ts`
2. ✅ Create `/hooks/useAudioContext.ts`
3. 🔲 Fix scroll blocking in ALL ceremonies
4. 🔲 Reduce particle counts with `getOptimalParticleCount()`
5. 🔲 Replace AudioContext with shared hook

### **Week 2: React Optimizations**
6. 🔲 Add React.memo to ceremony components
7. 🔲 Add useMemo for particle calculations
8. 🔲 Batch state updates with startTransition
9. 🔲 Memoize particle components

### **Week 3: CSS Optimizations**
10. 🔲 Add CSS animations to globals.css
11. 🔲 Replace simple Motion animations with CSS
12. 🔲 Add will-change and GPU hints
13. 🔲 Add CSS containment

### **Week 4: Advanced**
14. 🔲 Implement virtual scrolling for lists
15. 🔲 Lazy load ceremony components
16. 🔲 Add image lazy loading
17. 🔲 Code splitting for routes

---

## 📱 **DEVICE-SPECIFIC OPTIMIZATIONS**

### **Low-End Devices (≤4 cores, ≤4GB RAM):**
- Particle count: 30% of base
- Disable complex blur effects
- Reduce animation duration by 30%
- Use CSS animations only
- Skip non-essential particles (sparkles, background effects)

### **Mid-Range Devices (4-8 cores, 4-8GB RAM):**
- Particle count: 70% of base
- Enable all effects
- Standard animation durations
- Mix of CSS and Motion animations

### **High-End Devices (>8 cores, >8GB RAM):**
- Particle count: 100% of base
- All effects enabled
- Can use complex Motion animations
- Can add extra polish effects

---

## 🎯 **QUICK WINS (Do Today)**

### **1. Fix Scroll Blocking (10 minutes)**
Find and replace in ALL ceremony files:
```tsx
// Find:
onTouchStart={(e) => {
  e.preventDefault();
  handleAction();
}}

// Replace with:
onTouchStart={handleAction}
// Let browser handle scroll naturally
```

### **2. Reduce Particles (5 minutes)**
Add to each ceremony:
```tsx
import { getOptimalParticleCount } from '@/utils/performance';

// Change:
const confettiCount = 80;

// To:
const confettiCount = getOptimalParticleCount(80);
```

### **3. Add will-change to Ceremonies (2 minutes)**
```tsx
<motion.div 
  className="ceremony-container"
  style={{ willChange: 'transform, opacity' }}
>
```

---

## 📈 **EXPECTED RESULTS**

### **Performance Improvements:**
- **70% fewer particles** on low-end devices
- **3x faster** ceremony loading
- **Instant scroll** response (no blocking)
- **Zero memory leaks** from audio
- **50% less JavaScript** execution during animations
- **Smoother 60fps** on most devices

### **User Experience:**
- ✅ Ceremonies feel instant and responsive
- ✅ Scrolling works during all animations
- ✅ No lag when opening multiple capsules
- ✅ Battery life improved (less GPU usage)
- ✅ Works great on budget Android phones

---

## 🚨 **CRITICAL FILES TO UPDATE**

Update these files FIRST:

1. `/components/capsule-themes/ceremonies/BirthdayCakeCeremony.tsx`
2. `/components/capsule-themes/ceremonies/ChampagneCeremony.tsx`
3. `/components/capsule-themes/ceremonies/EternalFlameCeremony.tsx`
4. `/components/capsule-themes/ceremonies/TimeTravelerCeremony.tsx`
5. `/components/capsule-themes/ceremonies/TravelCeremony.tsx`
6. `/components/capsule-themes/ceremonies/GraduationCeremony.tsx`
7. `/components/capsule-themes/ceremonies/NewLifeCeremony.tsx`
8. `/components/capsule-themes/ceremonies/WeddingCeremony.tsx` (old one, if still exists)
9. `/components/capsule-themes/ceremonies/FriendshipCeremony.tsx`

**Changes for each:**
- ❌ Remove `e.preventDefault()` from touch handlers
- ✅ Add `getOptimalParticleCount()` for all particle arrays
- ✅ Replace AudioContext with `useAudioContext()` hook
- ✅ Add `will-change: transform, opacity` to container

---

**This is your roadmap to silky-smooth mobile performance! Start with the Quick Wins today.** 🚀
