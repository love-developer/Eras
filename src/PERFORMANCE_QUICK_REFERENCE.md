# ⚡ PERFORMANCE QUICK REFERENCE

## 🎯 **3 CRITICAL RULES**

### **1. NEVER block scrolling**
```tsx
❌ onTouchStart={(e) => { e.preventDefault(); }}
✅ onTouchStart={handleAction}
```

### **2. ALWAYS optimize particle counts**
```tsx
❌ Array.from({ length: 100 })
✅ Array.from({ length: getOptimalParticleCount(100) })
```

### **3. ALWAYS use shared AudioContext**
```tsx
❌ const ctx = new AudioContext();
✅ const { playSound } = useAudioContext();
```

---

## 📦 **UTILITY IMPORTS**

```tsx
// Performance utilities
import { 
  getOptimalParticleCount,
  isLowEndDevice,
  isMobileDevice,
  prefersReducedMotion
} from '@/utils/performance';

// Shared audio
import { useAudioContext } from '@/hooks/useAudioContext';

// Performance monitoring (dev only)
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
```

---

## 🎨 **ANIMATION BEST PRACTICES**

### **Use CSS for simple animations:**
```tsx
// ❌ SLOW - JavaScript every frame
<motion.div animate={{ rotate: 360 }} />

// ✅ FAST - Pure CSS
<div className="animate-spin" />
```

### **Use Motion for complex interactions:**
```tsx
// ✅ Good use of Motion - complex gesture
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  onDragEnd={handleDrop}
/>
```

### **GPU Acceleration:**
```tsx
// Always use transform and opacity
style={{
  transform: 'translateX(100px)', // ✅ GPU
  opacity: 0.5, // ✅ GPU
  willChange: 'transform, opacity' // ✅ Hint to browser
}}

// Avoid triggering layout
style={{
  left: '100px', // ❌ Triggers layout
  width: '500px', // ❌ Triggers layout
  marginTop: '20px' // ❌ Triggers layout
}}
```

---

## 🎵 **AUDIO PATTERNS**

### **Simple Sound:**
```tsx
const { playSound } = useAudioContext();

// Play a single note
playSound(440, 0.3); // A4 note, 300ms
```

### **Chord:**
```tsx
const { playChord } = useAudioContext();

// Play C major chord
playChord([261.63, 329.63, 392.00]); // C-E-G
```

### **Common Frequencies:**
```tsx
const NOTES = {
  C4: 261.63,
  E4: 329.63,
  G4: 392.00,
  C5: 523.25,
  
  // Effects
  BLOW: 150,
  POP: 100,
  FIZZ: 4000,
  WHOOSH: 200
};

playSound(NOTES.POP, 0.2);
```

---

## 🔢 **PARTICLE PATTERNS**

### **Standard Confetti:**
```tsx
const confettiCount = getOptimalParticleCount(80);

{Array.from({ length: confettiCount }).map((_, i) => (
  <motion.div
    key={`confetti-${i}`}
    className="absolute w-3 h-3"
    style={{ backgroundColor: COLORS[i % 5] }}
    initial={{ x: 0, y: 0 }}
    animate={{
      x: Math.cos(angle) * velocity,
      y: Math.sin(angle) * velocity,
      rotate: Math.random() * 720
    }}
  />
))}
```

### **Explosion Pattern:**
```tsx
const particles = useMemo(() => 
  Array.from({ length: getOptimalParticleCount(50) }).map((_, i) => ({
    angle: (i / 50) * Math.PI * 2,
    velocity: 200 + Math.random() * 300,
    color: COLORS[i % COLORS.length]
  }))
, []);

{particles.map((p, i) => (
  <Particle key={i} {...p} />
))}
```

### **Fountain/Spray:**
```tsx
const sprayCount = getOptimalParticleCount(60);

{Array.from({ length: sprayCount }).map((_, i) => {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8; // Upward
  return <SprayParticle key={i} angle={angle} />;
})}
```

---

## 📱 **DEVICE DETECTION**

### **Check device capabilities:**
```tsx
import { isLowEndDevice, isMobileDevice } from '@/utils/performance';

function MyComponent() {
  const particleCount = isLowEndDevice() 
    ? 30  // Low-end
    : 100; // High-end
    
  const enableBlur = !isLowEndDevice(); // Skip expensive blur
  
  return (
    <div className={enableBlur ? 'backdrop-blur-xl' : ''}>
      {/* Content */}
    </div>
  );
}
```

---

## 🎭 **REACT OPTIMIZATION**

### **Memoize heavy components:**
```tsx
export const HeavyCeremony = React.memo(({ onComplete }) => {
  // Component code
});
```

### **Memoize calculations:**
```tsx
const particles = useMemo(() => 
  generateParticles(count)
, [count]); // Only recalculate when count changes
```

### **Memoize callbacks:**
```tsx
const handleComplete = useCallback(() => {
  onComplete();
}, [onComplete]);
```

### **Batch state updates:**
```tsx
// ❌ SLOW - 3 re-renders
setPhase('anticipation');
setScale(1.2);
setOpacity(0);

// ✅ FAST - 1 re-render
React.startTransition(() => {
  setPhase('anticipation');
  setScale(1.2);
  setOpacity(0);
});
```

---

## 🎨 **CSS ANIMATIONS**

Add to `/styles/globals.css`:

```css
/* Confetti falling */
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

/* Float upward */
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

.animate-float {
  animation: float-up 2s ease-out forwards;
}

/* Pulse glow */
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

.animate-glow {
  animation: pulse-glow 0.5s ease-in-out infinite;
}

/* Screen shake */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  50% { transform: translateX(8px); }
  75% { transform: translateX(-4px); }
}

.animate-shake {
  animation: shake 0.6s ease-in-out;
}
```

---

## 🧪 **PERFORMANCE MONITORING**

### **Development mode:**
```tsx
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function BirthdayCeremony() {
  usePerformanceMonitor('BirthdayCeremony', process.env.NODE_ENV === 'development');
  
  // Component code
}

// Console output:
// 📊 [Performance] BirthdayCeremony - FPS: 58.3 fps
// ⚠️ [Performance] BirthdayCeremony - Low FPS: 24.1 fps
```

### **Measure specific operations:**
```tsx
import { perfMark, perfMeasure } from '@/utils/performance';

function heavyOperation() {
  perfMark('heavy-start');
  
  // Do expensive work
  
  perfMark('heavy-end');
  perfMeasure('Heavy Operation', 'heavy-start', 'heavy-end');
  // Console: [Performance] Heavy Operation: 45.23ms
}
```

---

## ✅ **CHECKLIST FOR NEW CEREMONIES**

When creating a new ceremony component:

- [ ] Import `getOptimalParticleCount` from performance utils
- [ ] Use `useAudioContext()` hook for all sounds
- [ ] NO `e.preventDefault()` in touch handlers
- [ ] Memoize particle arrays with `useMemo`
- [ ] Add `will-change: transform, opacity` to animated elements
- [ ] Use `transform` and `opacity` only (GPU accelerated)
- [ ] Export component with `React.memo()`
- [ ] Test on low-end device (should see 30% particles)
- [ ] Test scrolling during animation (should work)
- [ ] Check memory after 10 opens (should be stable)

---

## 🚨 **COMMON MISTAKES**

### **❌ Mistake #1: Blocking scroll**
```tsx
onTouchStart={(e) => {
  e.preventDefault(); // Blocks ALL touch events
}}
```

### **❌ Mistake #2: Too many particles**
```tsx
Array.from({ length: 200 }) // Will kill mobile
```

### **❌ Mistake #3: Memory leaks**
```tsx
useEffect(() => {
  const ctx = new AudioContext();
  // Never closed! Memory leak!
}, []);
```

### **❌ Mistake #4: Layout thrashing**
```tsx
element.style.left = '100px'; // Triggers layout
const width = element.offsetWidth; // Reads layout
element.style.top = '200px'; // Triggers layout again!
```

### **❌ Mistake #5: Inline functions**
```tsx
{particles.map((p, i) => (
  <Particle onClick={() => handleClick(i)} /> // New function every render!
))}
```

---

## 📊 **PERFORMANCE TARGETS**

### **Frame Rate:**
- Desktop: **60 FPS** consistent
- High-end mobile: **60 FPS** consistent
- Mid-range mobile: **50-60 FPS**
- Low-end mobile: **40-50 FPS** (acceptable)

### **Particle Counts:**
- Desktop: **100%** (all particles)
- High-end mobile: **100%**
- Low-end mobile: **30%** (reduced)
- Reduced motion: **0%** (accessibility)

### **Memory:**
- Baseline: **50-80 MB**
- After 1 ceremony: **+5-10 MB** (acceptable)
- After 10 ceremonies: **+10-20 MB** (should stabilize)
- Growing continuously: **🚨 Memory leak!**

### **Load Time:**
- Ceremony component: **<100ms**
- First interaction: **<50ms**
- Audio playback: **<20ms**

---

## 🔗 **RESOURCES**

- **Full guide:** `/MOBILE_PERFORMANCE_OPTIMIZATION.md`
- **Immediate fixes:** `/MOBILE_LAG_FIX_IMMEDIATE.md`
- **Performance utils:** `/utils/performance.ts`
- **Audio hook:** `/hooks/useAudioContext.ts`
- **Monitoring:** `/hooks/usePerformanceMonitor.ts`

---

**Keep this reference handy when building new features!** 🚀
