# 👑 Title Unlock Preview - Quick Guide

## What is this?

A testing tool that lets you preview the **Title Reward Modal** sequence with all 5 rarity tiers.

## Where to find it

**Settings → Developer Tools → Title Unlock Preview**

Look for the purple "Preview Titles" button at the bottom of the Developer Tools card.

## How it works

1. **Click "Preview Titles"** button
2. Watch the sequence automatically play through **5 different titles**:
   - **Common** - Chronicle Keeper (soft white confetti)
   - **Uncommon** - Memory Architect (blue shimmer)
   - **Rare** - Midnight Chronicler (purple glow) ⭐ **The one you unlocked!**
   - **Epic** - Time Lord (gold celebration)
   - **Legendary** - Legacy Guardian (rainbow explosion)

3. Each modal shows:
   - ✨ Rarity-specific confetti effects
   - 👑 Title display with proper styling
   - 🎯 Achievement name that unlocked it
   - ⏱️ Progress indicator (showing X of 5)

4. The sequence **auto-advances** when you close each modal

## Features

### Progress Bar
- Shows which rarity you're currently viewing
- Tracks progress through all 5 titles
- Visual progress bar fills as you advance

### Rarity Effects
Each rarity has unique visual effects:
- **Common**: Light confetti, soft fade-in
- **Uncommon**: Ripple ring expansion, cool blue shimmer
- **Rare**: Dual-side bursts, purple majesty
- **Epic**: Crown fountain, golden glory
- **Legendary**: Supernova explosion, rainbow chaos

### Auto-Play
- Automatically moves to next title when you close the current modal
- No need to click multiple times
- Smooth transitions between modals

## Testing the Full Achievement → Title Flow

Want to test the **complete unlock sequence** (Achievement modal → Title modal)?

Use the **Achievement Unlock Test** button above the Title Preview:
1. It shows the Achievement Unlock Modal first
2. Then automatically triggers the Title Reward Modal
3. Gives you the full user experience

## Customization

The preview uses these sample titles:

```typescript
'Chronicle Keeper' (common)
'Memory Architect' (uncommon)
'Midnight Chronicler' (rare)  ← Night Owl achievement
'Time Lord' (epic)
'Legacy Guardian' (legendary)
```

## Developer Notes

- Located in `/components/TitleUnlockPreview.tsx`
- Uses `TitleRewardModal` component
- Auto-advances through sequence
- Resets to start when complete
- Toast notifications for start/complete

## Tips

1. **Full screen recommended** - The confetti effects look best in full screen
2. **Sound on** - Some effects may have audio (if implemented)
3. **Close each modal** - This advances to the next title automatically
4. **Watch the progress bar** - Know where you are in the sequence

## Troubleshooting

**Modal won't close?**
- Press ESC key
- Click outside the modal (backdrop click)
- Click the X button in top-right

**Confetti not showing?**
- Check if canvas-confetti is loaded
- Try refreshing the page
- Check browser console for errors

**Sequence stuck?**
- Close the modal to advance
- Refresh page to reset
- Check console logs (look for 👑 [Preview] messages)

---

Enjoy previewing your title unlocks! 👑✨
