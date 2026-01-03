# ScholarUp Security Fixes Checklist

## CRITICAL: Your API Keys Are Exposed on GitHub

Since this repo is public, your Supabase credentials have been exposed. **You MUST rotate them immediately.**

### Immediate Actions Required (Do This First!)

1. **Go to Supabase Dashboard** → Settings → API
2. **Regenerate your anon/public key** (this will invalidate the old one)
3. **Update your app** with the new key before pushing to GitHub
4. The old key in your git history is compromised - anyone who saw it can still use it until you rotate

---

## Security Fixes (One by One)

### Fix #1: Move API Keys to Environment Variables
**Priority:** CRITICAL
**File:** `src/lib/supabase.ts` (Lines 4-5)
**Status:** [x] COMPLETED

**Current Code (INSECURE):**
```typescript
const SUPABASE_URL = 'https://mlybrnxzdzlifdssdpln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';
```

**Fix:**
1. Create `.env` file (already in .gitignore)
2. Add keys to `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-rotated-key
   ```
3. Update `supabase.ts` to use environment variables:
   ```typescript
   const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
   const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
   ```

**Why This Matters:** Anyone with your current key can access your Supabase backend directly.

---

### Fix #2: Strengthen Password Requirements
**Priority:** HIGH
**File:** `src/screens/SignUpScreen.tsx` (Lines 147-149)
**Status:** [x] COMPLETED

**Current Code:**
```typescript
if (password.length < 6) {
  Alert.alert('Error', 'Password must be at least 6 characters');
  return;
}
```

**Fix:** Replace with stronger validation:
```typescript
if (password.length < 8) {
  Alert.alert('Error', 'Password must be at least 8 characters');
  return;
}
if (!/[A-Z]/.test(password)) {
  Alert.alert('Error', 'Password must contain at least one uppercase letter');
  return;
}
if (!/[0-9]/.test(password)) {
  Alert.alert('Error', 'Password must contain at least one number');
  return;
}
```

**Why This Matters:** Weak passwords (like "123456") can be easily guessed or brute-forced.

---

### Fix #3: Add Path Validation for Image Deletion
**Priority:** HIGH
**File:** `src/lib/database.ts` (Lines 40-50)
**Status:** [x] COMPLETED

**Current Code:**
```typescript
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const urlParts = imageUrl.split('/user-images/');
    if (urlParts.length < 2) return;
    const path = urlParts[1];
    await supabase.storage.from('user-images').remove([path]);
  }
}
```

**Fix:** Add path traversal protection:
```typescript
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const urlParts = imageUrl.split('/user-images/');
    if (urlParts.length < 2) return;
    const path = urlParts[1];

    // Security: Prevent path traversal attacks
    if (path.includes('..') || path.includes('//') || !path.match(/^[a-zA-Z0-9\-_\/\.]+$/)) {
      console.error('Invalid image path detected');
      return;
    }

    await supabase.storage.from('user-images').remove([path]);
  }
}
```

**Why This Matters:** Malicious URLs could potentially delete files outside intended folder.

---

### Fix #4: Validate Image URLs Before Database Storage
**Priority:** HIGH
**File:** `src/lib/database.ts` (Lines 172-182)
**Status:** [x] COMPLETED

**Current Code:**
```typescript
if (updates.imageUri.startsWith('http')) {
  updateData.image_url = updates.imageUri;
}
```

**Fix:** Whitelist only your Supabase storage domain:
```typescript
const ALLOWED_IMAGE_HOST = 'mlybrnxzdzlifdssdpln.supabase.co';

if (updates.imageUri.startsWith('http')) {
  try {
    const url = new URL(updates.imageUri);
    if (url.host !== ALLOWED_IMAGE_HOST) {
      console.error('Invalid image host');
      return;
    }
    updateData.image_url = updates.imageUri;
  } catch {
    console.error('Invalid image URL');
    return;
  }
}
```

**Why This Matters:** Prevents attackers from injecting arbitrary URLs into your database.

---

### Fix #5: Remove Debug Console.log Statements
**Priority:** MEDIUM
**Files:** Multiple
**Status:** [x] COMPLETED

**Files to clean:**
- `src/screens/TimerScreen.tsx` - Lines 491-492
- `App.tsx` - Line 31
- `src/context/ListsContext.tsx` - Multiple lines
- `src/context/FlashCardsContext.tsx` - Multiple lines
- `src/context/StatsContext.tsx` - Multiple lines
- `src/lib/database.ts` - Multiple lines

**Fix:** Remove or wrap in development check:
```typescript
// Remove these entirely:
console.log('Completed Focus Time:', completedFocusTime);

// Or wrap in __DEV__ check:
if (__DEV__) {
  console.log('Debug info:', data);
}
```

**Why This Matters:** Production logs can leak sensitive information to anyone with device access.

---

### Fix #6: Sanitize Error Messages
**Priority:** MEDIUM
**File:** `src/context/AuthContext.tsx` (Lines 50, 76, 82, 147)
**Status:** [x] COMPLETED

**Current Code:**
```typescript
return { success: false, error: error.message };
```

**Fix:** Map errors to user-friendly messages:
```typescript
const getErrorMessage = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';

  if (message.includes('invalid login')) return 'Invalid email or password';
  if (message.includes('already registered')) return 'An account with this email already exists';
  if (message.includes('network')) return 'Network error. Please check your connection';
  if (message.includes('rate limit')) return 'Too many attempts. Please try again later';

  return 'An unexpected error occurred. Please try again';
};

return { success: false, error: getErrorMessage(error) };
```

**Why This Matters:** Raw error messages can reveal database structure, validation logic, etc.

---

### Fix #7: Add Input Length Validation
**Priority:** MEDIUM
**Files:** `src/context/FlashCardsContext.tsx`, `src/context/ListsContext.tsx`
**Status:** [x] COMPLETED

**Fix:** Add validation before database operations:
```typescript
const MAX_NAME_LENGTH = 100;
const MAX_TEXT_LENGTH = 1000;

// Before creating/updating
if (!name || name.trim().length === 0) {
  throw new Error('Name cannot be empty');
}
if (name.length > MAX_NAME_LENGTH) {
  throw new Error(`Name cannot exceed ${MAX_NAME_LENGTH} characters`);
}
```

**Why This Matters:** Prevents storage abuse and potential issues with extremely long inputs.

---

### Fix #8: Add Email Format Validation (Robustness)
**Priority:** LOW
**File:** `src/screens/StatsScreen.tsx` (Line 598)
**Status:** [x] COMPLETED

**Current Code:**
```typescript
{user?.email ? `${user.email.split('@')[0].slice(0, 2)}...` : 'Not logged in'}
```

**Fix:** Create safe email masking function:
```typescript
const maskEmail = (email: string | undefined): string => {
  if (!email || !email.includes('@')) return 'Not logged in';
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'Not logged in';
  const masked = local.slice(0, 2) + '*'.repeat(Math.max(0, local.length - 2));
  return `${masked}@${domain}`;
};
```

**Why This Matters:** Prevents crashes if email format is unexpected.

---

## SQL Schema Review

Your `supabase-schema.md` SQL is **SECURE**:

✅ **Row Level Security (RLS)** enabled on all tables
✅ **Proper user isolation** - `user_id = (SELECT auth.uid())`
✅ **Cascade deletes** configured for referential integrity
✅ **Storage policies** properly restrict access by user folder
✅ **Optimized RLS** with subquery pattern for performance

**No SQL changes needed.**

---

## Post-Fix Checklist

After implementing all fixes:

- [ ] Rotate Supabase API keys in dashboard
- [ ] Update `.env` with new keys
- [ ] Test all authentication flows
- [ ] Test image upload/delete
- [ ] Test flashcard CRUD operations
- [ ] Test task list CRUD operations
- [ ] Verify no console.log statements in production build
- [ ] Push updated code to GitHub (without secrets!)

---

## Progress Tracker

| # | Fix | Priority | Status |
|---|-----|----------|--------|
| 1 | Environment Variables | CRITICAL | [x] DONE |
| 2 | Password Validation | HIGH | [x] DONE |
| 3 | Path Traversal Protection | HIGH | [x] DONE |
| 4 | URL Validation | HIGH | [x] DONE |
| 5 | Remove Debug Logs | MEDIUM | [x] DONE |
| 6 | Sanitize Errors | MEDIUM | [x] DONE |
| 7 | Input Length Validation | MEDIUM | [x] DONE |
| 8 | Email Masking | LOW | [x] DONE |

---

*Last Updated: January 2026*
