# 🔧 Production Logger Migration Guide

## Quick Start

### Import the Logger
```typescript
import { logger, log } from './utils/logger';
```

### Basic Usage
```typescript
// Instead of console.log
logger.info('Capsule created successfully');

// Instead of console.error
logger.error('Failed to upload media:', error);

// Debug logs (only show in development)
logger.debug('Component re-rendered', renderCount);

// Warnings
logger.warn('Rate limit approaching');
```

## 📝 Migration Patterns

### Pattern 1: Console.log → Logger
```typescript
// ❌ Before
console.log('✅ App.tsx loaded successfully');
console.log('🔐 [Auth] Verifying JWT token...');
console.log('🏆 [Achievement] Checking unlock conditions');

// ✅ After
logger.info('App.tsx loaded successfully');
logger.auth('Verifying JWT token...');
logger.achievement('Checking unlock conditions');
```

### Pattern 2: Debug Statements
```typescript
// ❌ Before
console.log('🔍 [DEBUG] Component render count:', count);
console.log('📦 App function created (ID:', id, ')');

// ✅ After
logger.debug('Component render count:', count);
logger.debug('App function created (ID:', id, ')');
// These automatically hide in production!
```

### Pattern 3: Contextual Logging
```typescript
// ❌ Before
console.log('📦 Capsule created:', capsuleId);
console.log('🎬 Media uploaded:', mediaId);
console.log('💫 Echo received:', echoData);

// ✅ After  
logger.capsule('Capsule created:', capsuleId);
logger.media('Media uploaded:', mediaId);
logger.echo('Echo received:', echoData);
```

### Pattern 4: Error Handling
```typescript
// ❌ Before
console.error('❌ Failed to create capsule:', error);
console.error('💥 [Global Error]', event.error);

// ✅ After
logger.error('Failed to create capsule:', error);
logger.error('[Global Error]', event.error);
```

## 🎯 Contextual Methods

Use these for auto-categorized logs:

```typescript
log.auth(...)         // 🔐 Authentication & authorization
log.achievement(...)  // 🏆 Achievement system
log.capsule(...)      // 📦 Capsule operations
log.echo(...)         // 💫 Echo system
log.media(...)        // 🎬 Media upload/processing
log.delivery(...)     // 📨 Email/SMS delivery
log.performance(...)  // ⚡ Performance metrics
log.database(...)     // 💾 Database operations
```

## 🔧 Configuration

### Set Log Level Dynamically
```typescript
// Show only warnings and errors
logger.setLevel('warn');

// Show everything (useful for debugging)
logger.setLevel('debug');

// Production default
logger.setLevel('info');
```

### Customize Output
```typescript
logger.setConfig({
  level: 'info',
  enableTimestamps: true,
  enableEmojis: false  // Clean logs without emojis
});
```

## 📊 Default Behavior

### Development (localhost)
- **Level**: `debug` (shows everything)
- **Emojis**: Enabled ✅
- **Timestamps**: Enabled
- **Output**: `🔍 [DEBUG] [2024-11-27T...] Message here`

### Production
- **Level**: `info` (hides debug logs)
- **Emojis**: Disabled (cleaner logs)
- **Timestamps**: Enabled
- **Output**: `[INFO] [2024-11-27T...] Message here`

## 🚀 Migration Priority

### High Priority (Migrate First)
1. **Error logs** - `console.error` → `logger.error`
2. **Production info** - Important events users/ops need to see
3. **Auth flows** - Security-critical logging

### Medium Priority
4. **Feature logging** - Achievements, capsules, media
5. **API calls** - Backend request/response logging
6. **State changes** - Major app state transitions

### Low Priority (Gradual)
7. **Debug logs** - Component renders, HMR, diagnostics
8. **Verbose logs** - Detailed tracing, step-by-step flows

## ✨ Benefits

### For Development
- ✅ **All logs visible** - Nothing hidden
- ✅ **Emojis for quick scanning** - Visual categorization
- ✅ **Contextual categories** - Easy filtering in console
- ✅ **Timestamps** - Track timing issues

### For Production
- ✅ **Clean logs** - No debug noise
- ✅ **Performance** - Fewer console operations
- ✅ **Categorized** - Easy to grep/filter
- ✅ **Professional** - No random emojis in prod logs

## 📝 Example Migration

### Before (Verbose)
```typescript
// App.tsx
console.log('✅ App.tsx loaded successfully');
console.log(`📦 App function created/loaded (Function ID: ${id})`);
console.log(`🔄 [HMR] Hot module reload detected`);
console.log(`🔍 React execution count: ${count}`);
console.log('📋 [DND] Using batch move dropdown');

// Auth.tsx
console.log('📧 Attempting sign-in for:', email);
console.log('🔐 [Auth] Verifying JWT token...');
console.log('🔐 [Auth] Token preview:', token.substring(0, 30));
console.log('✅ [Auth] User verified from JWT:', email);

// CreateCapsule.tsx
console.log('🔍 [DRAFT RESTORE] Raw localStorage value:', draft);
console.log('✅ Restored media:', mediaItem.name);
console.warn('⚠️ Media file too large to restore');
```

### After (Clean)
```typescript
// App.tsx
logger.info('App.tsx loaded successfully');
logger.debug('App function created (Function ID:', id, ')');
logger.debug('[HMR] Hot module reload detected');
logger.debug('React execution count:', count);
// Removed "Using batch move dropdown" - not needed

// Auth.tsx  
logger.auth('Attempting sign-in for:', email);
logger.auth('Verifying JWT token...');
logger.debug('Token preview:', token.substring(0, 30));
logger.auth('User verified from JWT:', email);

// CreateCapsule.tsx
logger.debug('Draft restore - localStorage value:', draft);
logger.media('Restored media:', mediaItem.name);
logger.warn('Media file too large to restore:', size);
```

## 🎯 Result

- **Development**: Rich, verbose logging with visual cues
- **Production**: Clean, professional logs at appropriate levels
- **Performance**: Reduced console overhead in production
- **Maintainability**: Consistent logging patterns across codebase

---

**Status**: Logger utility ready! Start migrating high-priority logs first. 🚀
