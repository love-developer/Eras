# 🎯 Legacy Vault Drag & Drop - Quick Reference

## ✅ Phase 2 Complete

### How It Works (Desktop Only)
1. **Drag** any media item (grab cursor visible)
2. **Hover** over a folder → Emerald green glow appears
3. **Drop** → Item moves instantly with toast confirmation
4. **Or drop on "Unsorted"** → Removes item from all folders

### Visual Feedback
- **Dragging:** Item becomes 40% transparent
- **Valid drop target:** Emerald gradient + glow + scale-up
- **After drop:** Toast message "Moved to [Folder]"

### Components
| Component | Purpose |
|-----------|---------|
| `DraggableWrapper` | Makes media items draggable |
| `DroppableFolderCard` | Makes folders accept drops |
| `DroppableUnsortedZone` | Drop zone for removing from folders |

### Backend API
```typescript
POST /vault/folders
{
  "action": "move_media",
  "mediaIds": ["media_123"],
  "folderId": "folder_456" // or null for unsorted
}
```

### Key Files Modified
- ✅ `/components/LegacyVault.tsx` - Main drag-drop logic
- ✅ `/components/VaultFolder.tsx` - Added `isHovering` prop
- ✅ `/supabase/functions/server/index.tsx` - Already had move_media action

### Mobile Behavior
- Drag-drop **disabled** on mobile (touch UX)
- Phase 3 will add batch move dropdown for mobile

### Test Checklist
- [x] Drag item over folder → green glow
- [x] Drop on folder → moves + toast
- [x] Drop on "Unsorted" → removes from folder
- [x] Cursor shows "grab" on desktop
- [x] Mobile doesn't show drag cursor

---
**Status:** Production-ready ✨
