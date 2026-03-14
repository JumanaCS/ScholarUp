# ScholarUp Premium One-Time Purchase Implementation Plan

## Context

ScholarUp is currently fully free with no usage limits. The goal is to add a **one-time $4.99 "ScholarUp+" purchase** using RevenueCat for payment processing. Free users get limited access; premium users get unlimited everything forever. No existing data is deleted — free users just can't create beyond limits. Since this is a one-time purchase (not a subscription), there is no expiration.

### Free Tier Limits
| Feature | Free Limit |
|---------|-----------|
| Flashcard Sets | 1 |
| Flashcards per Set | 5 |
| Lists | 1 |
| Tasks (total) | 5 |
| Focus Sessions (lifetime) | 5 |
| Flashcard Images | Disabled |

---

## Step 1: Install RevenueCat & Configure

**Files:** `package.json`, `app.json`, `.env`

- Run `npx expo install react-native-purchases`
- Add `"plugins": ["react-native-purchases"]` to `app.json`
- Add `bundleIdentifier` (iOS) and `package` (Android) to `app.json` if missing
- Add `EXPO_PUBLIC_REVENUECAT_APPLE_KEY` and `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY` to `.env`

## Step 2: Create Premium Constants

**New file:** `src/constants/premium.ts`

Centralize all free-tier limits and RevenueCat identifiers:
- `FREE_TIER_LIMITS` object with all limits above
- `PREMIUM_ENTITLEMENT_ID = 'premium'`
- `PREMIUM_PRODUCT_ID = 'scholarup_premium_lifetime'`
- `PREMIUM_PRICE = '$4.99'`

Export from `src/constants/index.ts`.

## Step 3: Supabase Migration

**Run in Supabase SQL Editor:**
```sql
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_purchased_at TIMESTAMP WITH TIME ZONE;
```

Update `supabase-schema.md` to document this.

## Step 4: Create PremiumContext

**New file:** `src/context/PremiumContext.tsx`

Follows the same pattern as `AuthContext.tsx`:
- Initialize RevenueCat with `Purchases.configure({ apiKey, appUserID: user.id })`
- Check entitlements on init via `Purchases.getCustomerInfo()`
- Listen for changes via `Purchases.addCustomerInfoUpdateListener`
- Expose: `isPremium`, `isLoading`, `currentOffering`, `purchasePremium()`, `restorePurchases()`
- Sync premium status to Supabase `user_stats.is_premium` for server-side checks
- Load offerings for paywall display
- Handle user logout (reset to `isPremium: false`)

Export from `src/context/index.ts`.

**Modify `App.tsx`** — add `PremiumProvider` after `AuthProvider`, before `TimerProvider`:
```
AuthProvider > PremiumProvider > TimerProvider > ListsProvider > StatsProvider > FlashCardsProvider
```

## Step 5: Create Reusable UpgradeModal Component

**New file:** `src/components/UpgradeModal.tsx`

Reusable modal matching app aesthetics (Mini/BPreplay fonts, green color scheme, rounded corners). Props: `visible`, `onClose`, `feature` (determines the limit message shown).

Shows:
- "ScholarUp+" title
- Context-specific message (e.g., "You've reached the free limit of 1 flashcard set")
- Feature list (unlimited sets, cards, lists, tasks, sessions, images)
- "Unlock Forever for $4.99" button → calls `purchasePremium()`
- "Restore Purchase" link → calls `restorePurchases()`
- Close button (X)

Export from `src/components/index.ts`.

## Step 6: Add Limit Checks to FlashCardsContext

**Modify:** `src/context/FlashCardsContext.tsx`

- Import `usePremium` and `FREE_TIER_LIMITS`
- Add `limitReached` state (`string | null`) and `clearLimitReached()` method to context
- In `createSet()`: if `!isPremium && sets.length >= 1`, set `limitReached = 'flashcard_sets'`, return null
- In `addCard()`: if `!isPremium && currentSet.flashcards.length >= 5`, set `limitReached = 'flashcards'`, return null
- In `addCard()`: if `!isPremium && imageUri`, strip the image (set to undefined) — images are premium-only

Note: Since this is a one-time purchase (not a subscription), there is no expiration check needed. Once `isPremium` is true, it stays true forever.

## Step 7: Add Limit Checks to ListsContext

**Modify:** `src/context/ListsContext.tsx`

- Import `usePremium` and `FREE_TIER_LIMITS`
- Add `limitReached` state and `clearLimitReached()` to context
- In `createList()`: if `!isPremium && lists.length >= 1`, set `limitReached = 'lists'`, return null
- In `addTask()`: count total tasks across ALL lists; if `!isPremium && totalTasks >= 5`, set `limitReached = 'tasks'`, return null

## Step 8: Integrate UpgradeModal into Screens

**Modify each screen** to render `<UpgradeModal>` when limits are hit:

| Screen | Trigger |
|--------|---------|
| `FlashCardsScreen.tsx` | `limitReached` from `useFlashCards()` (set creation) |
| `SetDetailScreen.tsx` | `limitReached` from `useFlashCards()` (card creation); also gate image picker — show "images (premium)" button for free users that opens UpgradeModal with `feature="images"` |
| `ListsScreen.tsx` | `limitReached` from `useLists()` (list creation) |
| `ListDetailScreen.tsx` | `limitReached` from `useLists()` (task creation) |
| `TimerScreen.tsx` | Check `!isPremium && stats.focusSessions >= 5` in `handleStart()`, show UpgradeModal with `feature="timer_sessions"` |

## Step 9: Add ScholarUp+ Section to Settings

**Modify:** `src/screens/StatsScreen.tsx`

Add a "ScholarUp+" section in the Settings tab, above "Account":
- Show current plan ("Free" or "Premium")
- If free: "Unlock ScholarUp+ — $4.99" button + "Restore Purchase" link
- If premium: "You have ScholarUp+ — all features unlocked" message

---

## Verification Plan

1. **Free tier limits**: Create 1 set → success. Try creating 2nd set → UpgradeModal appears. Same for cards (5 limit), lists (1), tasks (5), timer sessions (5).
2. **Image gating**: Open card creation as free user → image picker shows "images (premium)" → tapping opens UpgradeModal.
3. **Purchase flow**: Tap unlock → RevenueCat purchase sheet → complete → `isPremium` becomes true permanently → limits removed → modal closes.
4. **Restore flow**: Tap "Restore Purchase" → checks Apple/Google → restores if found (e.g., new device or reinstall).
5. **Permanence**: Once purchased, `isPremium` stays true forever. No expiration logic needed.
6. **Settings display**: Free user sees unlock button in Settings. Premium user sees "ScholarUp+ unlocked" status.
7. **Logout/login**: Premium status resets on logout, re-checks on login with new user ID (RevenueCat ties purchase to Apple/Google account).

---

## Files Summary

### New (3)
- `src/constants/premium.ts`
- `src/context/PremiumContext.tsx`
- `src/components/UpgradeModal.tsx`

### Modified (12+)
- `package.json` — add react-native-purchases
- `app.json` — add plugin, bundleIdentifier
- `.env` — add RevenueCat keys
- `App.tsx` — add PremiumProvider to hierarchy
- `src/constants/index.ts` — export premium
- `src/context/index.ts` — export PremiumContext
- `src/context/FlashCardsContext.tsx` — limit checks + limitReached state
- `src/context/ListsContext.tsx` — limit checks + limitReached state
- `src/screens/FlashCardsScreen.tsx` — UpgradeModal integration
- `src/screens/SetDetailScreen.tsx` — UpgradeModal + image gating
- `src/screens/ListsScreen.tsx` — UpgradeModal integration
- `src/screens/ListDetailScreen.tsx` — UpgradeModal integration
- `src/screens/TimerScreen.tsx` — session limit + UpgradeModal
- `src/screens/StatsScreen.tsx` — ScholarUp+ settings section
- `supabase-schema.md` — document migration
