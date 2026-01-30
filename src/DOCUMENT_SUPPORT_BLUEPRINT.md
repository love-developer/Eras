# 📊 DOCUMENT SUPPORT IMPLEMENTATION BLUEPRINT
## Following Proven Patterns from Image/Video/Audio

---

## 🎯 CORE PRINCIPLE
**Copy exactly how images/videos/audio work. Add `'document'` to existing type unions. Only customize preview UI.**

---

## 📋 PART 1: TYPE DEFINITIONS

### **Current State (Working Media)**
```typescript
// Vault LibraryItem - ALREADY HAS 'document' ✅
interface LibraryItem {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'document'; // ✅ ALREADY SUPPORTS
  base64Data: string;
  timestamp: number;
  thumbnail?: string;
  mimeType: string;
  duration?: number;
}

// Vault MediaItem - MISSING 'document' ❌
interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'audio'; // ❌ MISSING document
  url: string;
  blob: Blob;
  file: File;
  timestamp: number;
  thumbnail?: string;
  fromVault?: boolean;
}

// Capsule MediaItem - MISSING 'document' ❌
interface MediaItem {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio'; // ❌ MISSING document
  mimeType: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  compressed?: boolean;
  originalSize?: number;
  alreadyUploaded?: boolean;
  fromVault?: boolean;
}

// Upload Queue - MISSING 'document' ❌
interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'image' | 'video' | 'audio'; // ❌ MISSING document
  status: 'queued' | 'compressing' | 'uploading' | 'completed' | 'failed' | 'paused';
  progress: number;
  compressedSize?: number;
  error?: string;
  url?: string;
  thumbnailUrl?: string;
}

// Export Utility - MISSING 'document' ❌
interface ExportableMedia {
  id: string;
  type: 'photo' | 'video' | 'audio'; // ❌ MISSING document
  url: string;
  name?: string;
  size?: number;
  timestamp: number;
}
```

### **Document Support - What to Add**
```typescript
// Pattern: Add 'document' to EVERY type union above
type: 'photo' | 'video' | 'audio' | 'document'
type: 'image' | 'video' | 'audio' | 'document'
```

---

## 📋 PART 2: FILE INPUT ACCEPTANCE

### **Current State (Working Media)**

**Vault File Input** (`LegacyVault.tsx` lines 3031, 3095):
```typescript
accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/aac"
```

**Capsule File Input** (`CreateCapsule.tsx` line 2407):
```typescript
accept="image/*,video/*,audio/*"
```

### **Document Support - What to Add**

**Document MIME Types to Add**:
```typescript
// Add to Vault accept attribute:
",application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/rtf,text/csv"

// Add to Capsule accept attribute:
",application/pdf,.pdf,.doc,.docx,.txt"
// Note: Capsule can support fewer doc types initially (just common ones)
```

---

## 📋 PART 3: FILE TYPE DETECTION & VALIDATION

### **Current State (Working Media)**

**Vault - `getMediaType()` function** (`LegacyVault.tsx` line 1045):
```typescript
const getMediaType = (mimeType: string): 'photo' | 'video' | 'audio' | null => {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return null; // ❌ DOCUMENTS RETURN NULL = SILENT FAILURE
};
```

**Upload Queue - `detectFileType()` function** (`useUploadQueue.tsx` line 31):
```typescript
const detectFileType = (file: File): 'image' | 'video' | 'audio' => {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.toLowerCase().split('.').pop() || '';
  
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(extension)) {
    return 'image';
  }
  if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(extension)) {
    return 'video';
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm'].includes(extension)) {
    return 'audio';
  }
  
  // Default to image if unclear ❌ WRONG FOR DOCUMENTS
  return 'image';
};
```

### **Document Support - What to Add**

**Vault `getMediaType()` - Add document detection**:
```typescript
const getMediaType = (mimeType: string): 'photo' | 'video' | 'audio' | 'document' | null => {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  // ADD THIS: Document detection
  if (mimeType.startsWith('application/pdf') ||
      mimeType.startsWith('application/msword') ||
      mimeType.startsWith('application/vnd.openxmlformats-officedocument') ||
      mimeType.startsWith('application/vnd.ms-') ||
      mimeType.startsWith('text/plain') ||
      mimeType.startsWith('text/csv') ||
      mimeType.startsWith('application/rtf')) {
    return 'document';
  }
  
  return null;
};
```

**Upload Queue `detectFileType()` - Add document detection**:
```typescript
const detectFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.toLowerCase().split('.').pop() || '';
  
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(extension)) {
    return 'image';
  }
  if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(extension)) {
    return 'video';
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm'].includes(extension)) {
    return 'audio';
  }
  
  // ADD THIS: Document detection
  if (mimeType.startsWith('application/pdf') ||
      mimeType.startsWith('application/msword') ||
      mimeType.startsWith('application/vnd.openxmlformats-officedocument') ||
      mimeType.startsWith('application/vnd.ms-') ||
      mimeType.startsWith('text/') ||
      mimeType.startsWith('application/rtf') ||
      ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv'].includes(extension)) {
    return 'document';
  }
  
  // Fallback to image (unchanged)
  return 'image';
};
```

---

## 📋 PART 4: BACKEND UPLOAD

### **Current State (Working Media)**

**Vault Upload Endpoint** (`/supabase/functions/server/index.tsx` line 7970):
```typescript
app.post("/make-server-f9be53a7/api/legacy-vault/upload", async (c) => {
  const file = formData.get('file') as File;
  const type = formData.get('type') as string; // 'photo' | 'video' | 'audio'
  const thumbnail = formData.get('thumbnail') as File | null;
  
  // NO TYPE VALIDATION - accepts any file ✅
  // Just stores to: `legacy-vault/${user.id}/${recordId}.${fileExtension}`
  
  const fileBuffer = await file.arrayBuffer();
  await supabase.storage
    .from('make-f9be53a7-media')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false
    });
  
  // Saves metadata to KV store
  const recordItem = {
    id: recordId,
    user_id: user.id,
    type, // ✅ Stores whatever type is passed
    storage_path: storagePath,
    thumbnail_path: thumbnailPath,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    timestamp,
    created_at: new Date().toISOString()
  };
  
  await kv.set(`legacy_vault:${user.id}:${recordId}`, recordItem);
});
```

**Capsule Upload Endpoint** (`/supabase/functions/server/index.tsx` line 993):
```typescript
app.post("/make-server-f9be53a7/api/capsules/:id/media", async (c) => {
  const file = formData.get('file') as File;
  
  // ❌ VALIDATES AGAINST DOCUMENT TYPES
  const allowedTypes = ['video/', 'audio/', 'image/'];
  const isValidMimeType = allowedTypes.some(type => file.type.startsWith(type));
  
  // Fallback extension check
  if (!isValidMimeType && file.type === 'application/octet-stream') {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mediaExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', // video
                            'mp3', 'wav', 'ogg', 'webm', 'm4a', // audio
                            'jpg', 'jpeg', 'png', 'gif', 'webp']; // image
    isValidFile = mediaExtensions.includes(ext);
  }
  
  if (!isValidFile) {
    return c.json({ error: 'Invalid file type' }, 400); // ❌ BLOCKS DOCUMENTS
  }
  
  // Rest is same as Vault - stores to storage bucket
});
```

### **Document Support - What to Add**

**Vault Upload** - ✅ Already works! No changes needed.
- Backend accepts any `type` parameter
- No validation against file types
- Just needs frontend to pass `type: 'document'`

**Capsule Upload** - Add document validation:
```typescript
// CHANGE THIS:
const allowedTypes = ['video/', 'audio/', 'image/'];

// TO THIS:
const allowedTypes = ['video/', 'audio/', 'image/', 'application/pdf', 'application/msword', 
                     'application/vnd.openxmlformats-officedocument', 'application/vnd.ms-',
                     'text/plain', 'text/csv', 'application/rtf'];

// ADD document extensions to fallback:
const mediaExtensions = [
  'mp4', 'webm', 'mov', 'avi', 'mkv', // video
  'mp3', 'wav', 'ogg', 'webm', 'm4a', // audio
  'jpg', 'jpeg', 'png', 'gif', 'webp', // image
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv' // document ✅ NEW
];
```

---

## 📋 PART 5: VAULT-TO-CAPSULE IMPORT

### **Current State (Working Media)**

**Convert LibraryItem → MediaItem** (`LegacyVault.tsx` line 727):
```typescript
const convertToMediaItems = async (items: LibraryItem[]): Promise<MediaItem[]> => {
  // Helper: Infer MIME type from media type
  const inferMimeType = (type: string, existingMime?: string): string => {
    if (existingMime && existingMime !== 'application/octet-stream') {
      return existingMime;
    }
    
    switch (type) {
      case 'video': return 'video/mp4';
      case 'audio': return 'audio/mpeg';
      case 'photo': return 'image/jpeg';
      default: return 'application/octet-stream'; // ❌ DOCUMENTS GET GENERIC TYPE
    }
  };
  
  // Helper: Get file extension
  const extension = item.type === 'video' ? 'mp4' : 
                    item.type === 'audio' ? 'mp3' : 
                    'jpg'; // ❌ DOCUMENTS GET 'jpg'
  const filename = `vault-${item.type}-${item.timestamp}.${extension}`;
  
  const file = new File([blob], filename, {
    type: mimeType,
    lastModified: item.timestamp
  });
  
  return {
    id: item.id,
    type: item.type, // ⚠️ TYPE MISMATCH: LibraryItem has 'document', MediaItem doesn't
    url,
    blob,
    file,
    timestamp: item.timestamp,
    thumbnail: item.thumbnail,
    fromVault: true
  } as MediaItem;
};
```

### **Document Support - What to Add**

**Add document case to `inferMimeType()`**:
```typescript
const inferMimeType = (type: string, existingMime?: string): string => {
  if (existingMime && existingMime !== 'application/octet-stream') {
    return existingMime;
  }
  
  switch (type) {
    case 'video': return 'video/mp4';
    case 'audio': return 'audio/mpeg';
    case 'photo': return 'image/jpeg';
    case 'document': return 'application/pdf'; // ✅ ADD THIS
    default: return 'application/octet-stream';
  }
};
```

**Add document extension logic**:
```typescript
// CHANGE THIS:
const extension = item.type === 'video' ? 'mp4' : 
                  item.type === 'audio' ? 'mp3' : 
                  'jpg';

// TO THIS:
const extension = item.type === 'video' ? 'mp4' : 
                  item.type === 'audio' ? 'mp3' :
                  item.type === 'document' ? 'pdf' : // ✅ ADD THIS
                  'jpg';
```

**Update return type** - Already done when MediaItem interface is updated ✅

---

## 📋 PART 6: UPLOAD FUNCTIONS

### **Current State (Working Media)**

**Vault `uploadToBackend()`** (`LegacyVault.tsx` line 1065):
```typescript
const uploadToBackend = async (
  file: File, 
  type: 'photo' | 'video' | 'audio', // ❌ MISSING 'document'
  thumbnail?: string
) => {
  const formData = new FormData();
  formData.append('file', file, `${type}-${Date.now()}.${getFileExtension(file.type)}`);
  formData.append('type', type);
  
  if (thumbnail) {
    const thumbnailBlob = await fetch(thumbnail).then(r => r.blob());
    formData.append('thumbnail', thumbnailBlob, `thumb-${Date.now()}.jpg`);
  }

  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault/upload`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      body: formData
    }
  );
  
  return await response.json();
};
```

**Vault File Upload Handler** (`LegacyVault.tsx` line 1106):
```typescript
const handleFileUpload = async (files: FileList | null, targetFolderId: string | null = null) => {
  filesArray.map(async (file) => {
    const mediaType = getMediaType(file.type);
    if (!mediaType) {
      console.warn(`Skipping unsupported file type: ${file.type}`);
      return { success: false }; // ❌ DOCUMENTS SKIPPED HERE
    }
    
    // ... validation ...
    
    // Upload to backend
    const uploadResult = await uploadToBackend(file, mediaType, thumbnail);
    // ⚠️ This fails for documents because uploadToBackend doesn't accept 'document'
  });
};
```

### **Document Support - What to Add**

**Update `uploadToBackend()` signature**:
```typescript
const uploadToBackend = async (
  file: File, 
  type: 'photo' | 'video' | 'audio' | 'document', // ✅ ADD 'document'
  thumbnail?: string
) => {
  // Rest is unchanged - backend already accepts any type ✅
};
```

**Add document extension to `getFileExtension()`** (`LegacyVault.tsx` line 1024):
```typescript
const getFileExtension = (mimeType: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    // ✅ ADD THESE:
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
    'application/rtf': 'rtf',
    'text/csv': 'csv',
  };
  return map[mimeType] || 'bin';
};
```

---

## 📋 PART 7: PREVIEW & DISPLAY

### **Current State (Working Media)**

**MediaPreviewModal** (`MediaPreviewModal.tsx`):
```typescript
interface MediaPreviewModalProps {
  media?: {
    id: string;
    file: File;
    type: 'image' | 'video' | 'audio'; // ❌ MISSING 'document'
    mimeType?: string;
    url: string;
    size: number;
  } | null;
}

// Inside component:
{normalizedMedia.file_type?.startsWith('image/') && (
  <img src={normalizedMedia.url} className="max-w-full max-h-full object-contain" />
)}

{normalizedMedia.file_type?.startsWith('video/') && (
  <video ref={videoRef} src={normalizedMedia.url} className="max-w-full max-h-full" />
)}

{normalizedMedia.file_type?.startsWith('audio/') && (
  <audio ref={audioRef} src={normalizedMedia.url} />
)}
```

**Vault Grid Item Display** (`LegacyVault.tsx`):
```typescript
// Images show thumbnail or placeholder
{item.type === 'photo' && (
  <img src={item.thumbnail || item.url} />
)}

// Videos show play button overlay
{item.type === 'video' && (
  <div className="relative">
    <img src={item.thumbnail} />
    <PlayCircle className="absolute inset-0" />
  </div>
)}

// Audio shows waveform visualization
{item.type === 'audio' && (
  <div className="audio-bars">
    {audioBarHeights[item.id]?.map((height, i) => (
      <div key={i} style={{ height: `${height}%` }} />
    ))}
  </div>
)}
```

### **Document Support - What to Add**

**MediaPreviewModal - Add document case**:
```typescript
interface MediaPreviewModalProps {
  media?: {
    id: string;
    file: File;
    type: 'image' | 'video' | 'audio' | 'document'; // ✅ ADD 'document'
    mimeType?: string;
    url: string;
    size: number;
  } | null;
}

// ✅ ADD THIS SECTION (after audio):
{normalizedMedia.file_type?.startsWith('application/') || 
 normalizedMedia.file_type?.startsWith('text/') && (
  <div className="flex flex-col items-center justify-center gap-6 p-8">
    <FileText className="w-24 h-24 text-slate-400" />
    <div className="text-center">
      <h3 className="text-lg font-semibold text-white mb-2">
        {normalizedMedia.file_name}
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        {formatBytes(normalizedMedia.file_size)}
      </p>
    </div>
    <Button 
      onClick={() => {
        const a = document.createElement('a');
        a.href = normalizedMedia.url;
        a.download = normalizedMedia.file_name;
        a.click();
      }}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      Download to View
    </Button>
  </div>
)}
```

**Vault Grid - Add document display**:
```typescript
// ✅ ADD THIS (after audio visualization):
{item.type === 'document' && (
  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
    <FileText className="w-12 h-12 text-slate-400" />
  </div>
)}
```

**Capsule Media Thumbnail** (`MediaThumbnail.tsx`):
```typescript
// ADD document case to existing switch/if:
{media.type === 'document' && (
  <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
    <FileText className="w-8 h-8 text-slate-400" />
  </div>
)}
```

---

## 📋 PART 8: DOWNLOAD & EXPORT

### **Current State (Working Media)**

**Export Utilities** (`/utils/vault-export.tsx`):
```typescript
export interface ExportableMedia {
  id: string;
  type: 'photo' | 'video' | 'audio'; // ❌ MISSING 'document'
  url: string;
  name?: string;
  size?: number;
  timestamp: number;
}

// Get file extension
const getFileExtension = (type: string, mimeType: string): string => {
  // Check MIME type first
  const mimeMap: Record<string, string> = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    // ❌ NO DOCUMENT TYPES
  };
  
  if (mimeMap[mimeType]) return mimeMap[mimeType];
  
  // Fallback based on type
  if (type === 'video') return '.mp4';
  if (type === 'audio') return '.mp3';
  if (type === 'photo') return '.jpg';
  // ❌ NO DOCUMENT FALLBACK
  
  return '';
};

// ZIP folder structure
const subfolder = mediaFolder.folder(media.type + 's');
// Creates: photos/, videos/, audios/
// ❌ Would create 'documents/' but missing extension handling
```

### **Document Support - What to Add**

**Update ExportableMedia interface**:
```typescript
export interface ExportableMedia {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'document'; // ✅ ADD 'document'
  url: string;
  name?: string;
  size?: number;
  timestamp: number;
}
```

**Add document extensions to `getFileExtension()`**:
```typescript
const mimeMap: Record<string, string> = {
  // ... existing ...
  // ✅ ADD THESE:
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt',
  'application/rtf': '.rtf',
  'text/csv': '.csv',
};

// Fallback based on type
if (type === 'video') return '.mp4';
if (type === 'audio') return '.mp3';
if (type === 'photo') return '.jpg';
if (type === 'document') return '.pdf'; // ✅ ADD THIS
```

**ZIP folder structure** - Already works! ✅
```typescript
const subfolder = mediaFolder.folder(media.type + 's');
// Will automatically create 'documents/' folder when type is 'document'
```

---

## 📋 PART 9: THUMBNAIL GENERATION (SKIP FOR DOCUMENTS)

### **Current State (Working Media)**

**Videos** - Generate thumbnail from first frame
**Audio** - No thumbnail (uses waveform visualization)
**Images** - Use image itself as thumbnail

### **Document Support**

**Documents** - ✅ **NO THUMBNAIL** (use icon instead)
- Don't generate thumbnails for documents
- Just use FileText icon in UI
- Skip thumbnail upload in backend for document types

---

## 📊 IMPLEMENTATION CHECKLIST

### **Phase 1: Vault Document Upload (Fix Broken)**

#### Frontend (`/components/LegacyVault.tsx`)
- [ ] **Line 109**: Update `MediaItem` type → Add `'document'`
- [ ] **Line 1045**: Update `getMediaType()` return type → Add `'document'`
- [ ] **Line 1046-1049**: Add document detection logic to `getMediaType()`
- [ ] **Line 1024-1041**: Add document MIME types to `getFileExtension()`
- [ ] **Line 1065**: Update `uploadToBackend()` type param → Add `'document'`
- [ ] **Line 727**: Update `convertToMediaItems()` for document support
- [ ] **Line 734-743**: Add `case 'document'` to `inferMimeType()`
- [ ] **Line 789**: Add document extension logic
- [ ] **Line 3031, 3095**: Add document MIME types to file input `accept`
- [ ] **Grid Display**: Add document icon rendering (around line 3500+)

#### Backend (`/supabase/functions/server/index.tsx`)
- [ ] ✅ No changes needed - already accepts any type!

---

### **Phase 2: Capsule Document Support (New Feature)**

#### Frontend - Type Definitions
- [ ] **`/components/CreateCapsule.tsx` line 97**: Update `MediaItem` type → Add `'document'`
- [ ] **`/hooks/useUploadQueue.tsx` line 9**: Update `UploadFile` type → Add `'document'`
- [ ] **`/hooks/useUploadQueue.tsx` line 31**: Update `detectFileType()` return type → Add `'document'`
- [ ] **`/hooks/useUploadQueue.tsx` line 35-46**: Add document detection logic

#### Frontend - File Input
- [ ] **`/components/CreateCapsule.tsx` line 2407**: Add document MIME types to `accept`

#### Frontend - Display
- [ ] **`/components/MediaThumbnail.tsx`**: Add document icon display
- [ ] **`/components/MediaPreviewModal.tsx` line 24**: Update media type → Add `'document'`
- [ ] **`/components/MediaPreviewModal.tsx`**: Add document preview section (icon + download button)

#### Backend - Validation
- [ ] **`/supabase/functions/server/index.tsx` line 1024**: Add document MIME types to `allowedTypes`
- [ ] **`/supabase/functions/server/index.tsx` line 1031**: Add document extensions to `mediaExtensions`

#### Shared Utilities
- [ ] **`/utils/vault-export.tsx` line 9**: Update `ExportableMedia` type → Add `'document'`
- [ ] **`/utils/vault-export.tsx`**: Add document MIME types to `getFileExtension()`

---

## ✅ SUCCESS CRITERIA

After implementation, documents should:

1. **Upload to Vault** - ✅ Same as images/videos/audio
2. **Upload to Capsule** - ✅ Same as images/videos/audio
3. **Import from Vault → Capsule** - ✅ Same workflow
4. **Display in grid** - ✅ Show 📄 icon instead of thumbnail
5. **Preview modal** - ✅ Show icon + filename + download button (not inline render)
6. **Download single file** - ✅ Same as other media
7. **Export as ZIP** - ✅ Included in exports like other media
8. **Store in backend** - ✅ Same storage bucket and KV structure

**ONLY DIFFERENCE**: Preview shows icon + download instead of inline content ✅

---

## 🎯 FINAL NOTES

**What Makes This Work:**
- We're not inventing new patterns
- Just adding `'document'` to existing type unions
- Copying validation/upload/download logic exactly
- Only customizing the preview UI (1 place)

**What Could Go Wrong:**
- Missing a type definition → TypeScript errors (easy to catch)
- Missing MIME type → File rejected (test with various doc types)
- Wrong extension mapping → File downloads with wrong extension (test downloads)

**Testing Plan:**
1. Upload .pdf to Vault → Should work
2. Upload .docx to Vault → Should work
3. Import document from Vault to Capsule → Should work
4. Preview document → Should show icon + download
5. Download document → Should have correct extension
6. Export folder with documents → Should include in ZIP

---

**Ready to implement? Show me this blueprint is correct before we proceed.**
