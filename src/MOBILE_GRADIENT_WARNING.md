# ⚠️ CRITICAL MOBILE WARNING: GRADIENTS DON'T WORK ⚠️

## THE RULE:
**NEVER USE CSS GRADIENTS ON MOBILE DEVICES - THEY DO NOT RENDER PROPERLY**

## What NOT to use:
```tsx
// ❌ WRONG - Gradients don't work on mobile
className="bg-gradient-to-br from-purple-500 to-pink-500"
className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
```

## What TO use instead:
```tsx
// ✅ CORRECT - Use solid colors only
className="bg-purple-500"
className="bg-indigo-600"
```

## Mobile-Responsive Pattern:
If gradients are needed for desktop, use responsive utilities:
```tsx
// ✅ CORRECT - Solid on mobile, gradient on desktop
className="bg-purple-500 sm:bg-gradient-to-br sm:from-purple-500 sm:to-pink-500"
```

## Components Already Fixed:
- ✅ `/components/UserOnboarding.tsx` - All gradients replaced with solid colors
- ✅ Tutorial modal backgrounds
- ✅ Tutorial emoji icons
- ✅ Tutorial slide indicators
- ✅ Tutorial buttons

## Always Remember:
1. Mobile first = solid colors
2. Desktop enhancement = optional gradients with `sm:` prefix
3. Test on actual mobile devices, not just browser resize
4. When in doubt, use solid colors everywhere

---

**Last Updated:** December 18, 2025
**DO NOT DELETE THIS FILE**
