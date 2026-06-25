# Legacy Release System — Test Checklist

This document proves the safety of the posthumous legacy release system.

## 1. Trusted Contact Verification

- [x] **New trusted contact starts pending** — `addTrustedContact` creates with `verification_status: "pending"`, never verified
- [x] **Pending contact cannot confirm death** — `confirmLegacy` checks `verification_status === 'verified'` before allowing any action
- [x] **Pending contact does not count toward quorum** — only verified contacts are fetched in `getVerifiedContacts`
- [x] **Pending contact does not receive death confirmation requests** — `checkLegacyStatus` only emails `getVerifiedContacts` (verified only)
- [x] **Pending contact does not receive released content** — `releaseMemories` only sends to `getVerifiedContacts` (verified only)
- [x] **Verification token is hashed** — `hashToken` uses SHA-256 via Web Crypto API, raw token never stored
- [x] **Verification token expires after 7 days** — `TOKEN_EXPIRY_DAYS = 7`, checked in `verifyTrustedContact`
- [x] **Verification token is single-use** — token hash cleared after verification in `verifyTrustedContact`

## 2. Executor Verification

- [x] **New executor starts pending** — `addExecutor` creates with `verification_status: "pending"`
- [x] **Executor must verify by email** — `verifyExecutor` checks token hash and expiry
- [x] **Executor token is hashed and single-use** — same SHA-256 hashing, cleared after use
- [x] **Executor token expires after 7 days** — `TOKEN_EXPIRY_DAYS = 7`

## 3. Release Rule (Critical Safety)

- [x] **Two contacts alone cannot release memories** — `checkLegacyStatus` requires executor approval after quorum
- [x] **Executor is required** — if no verified executor, protocol pauses at `executor_required` status, never releases
- [x] **No executor means no release** — `executor_required` status blocks release indefinitely
- [x] **Cooling-off is 14 days** — `COOLING_OFF_DAYS = 14` in both `checkLegacyStatus` and `confirmLegacy`
- [x] **Release requires ALL conditions**:
  - `contact_confirmation_count >= 2` (quorum)
  - `executor_approved = true`
  - `cooling_off_expired = true`
  - `protocol_status = approved_for_release`
  - No cancellation exists
  - No pause exists
  - No recent user activity
- [x] **If any condition fails, do not release** — `checkLegacyStatus` checks all conditions before calling `releaseMemories`

## 4. Auto Check-In (Critical Safety)

- [x] **User login cancels active protocol** — `autoCheckIn` called on every authenticated page load via `AuthContext`
- [x] **"I'm alive" cancels active protocol** — `checkIn` (manual) does full cancel
- [x] **Auto check-in fully cancels**:
  - Sets `legacy_triggered = false`
  - Clears `legacy_confirmations`
  - Clears `legacy_confirmed_by_ids`
  - Clears `legacy_cooling_off_until`
  - Invalidates all pending confirmation tokens
  - Sets protocol status to `cancelled_by_user_activity`
  - Logs the cancellation
  - Emails trusted contacts and executor

## 5. Token Security

- [x] **Tokens expire after 7 days** — `TOKEN_EXPIRY_DAYS = 7`
- [x] **Tokens are single-use** — token hash cleared after use in `confirmLegacy`, `verifyTrustedContact`, `verifyExecutor`
- [x] **Tokens are hashed** — SHA-256 via Web Crypto API, raw tokens never stored in database
- [x] **Confirmation links include multiple options** — alive, passed, not sure, report mistake, pause

## 6. Scheduled Delivery

- [x] **Scheduled message delivers while user is alive** — `scheduledDeliveryProcessor` checks for active protocol before delivering
- [x] **Scheduled future message becomes legacy content if user dies before delivery** — if active protocol exists, memory converted to `legacy_pending` and `delivery_type: legacy`
- [x] **Delivered memories are never re-sent** — `delivery_status: 'delivered'` excluded from release

## 7. Recipient-Based Release

- [x] **All undelivered content for each person releases after approval** — `releaseMemories` groups by `recipient_ids` and `loved_one_id`
- [x] **Recipient A does not receive recipient B content** — each recipient only gets memories where their ID is in `recipient_ids` or their name matches `loved_one_name`
- [x] **Includes normal memories, legacy memories, scheduled future messages, photos, videos, voice recordings, private notes** — all undelivered content with a recipient is released
- [x] **User does not need to manually mark items as posthumous** — all undelivered content automatically becomes legacy eligible

## 8. Audit Logging

- [x] **All events logged** — `LegacyAuditLog` entity with 40+ event types including:
  - `contact_added`, `contact_verification_sent`, `contact_verified`
  - `auto_check_in`, `manual_check_in`
  - `protocol_triggered`, `warning_email_sent`, `welfare_check_sent`
  - `death_confirmation_requested`, `death_confirmation_submitted`
  - `confirmation_received_alive`, `confirmation_received_passed`
  - `unsure_response`, `mistake_report`
  - `executor_added`, `executor_verification_sent`, `executor_verified`
  - `executor_approved`, `executor_paused`, `executor_cancelled`
  - `cooling_off_started`, `cooling_off_expired`
  - `protocol_cancelled`, `protocol_paused`, `protocol_released`
  - `memory_delivered`, `memory_legacy_released`, `failed_delivery`

## 9. Protocol Stages

Full stage progression:
1. `idle` → No activity issues
2. `warning_stage_1` → First warning email to user
3. `warning_stage_2` → Second warning
4. `final_user_warning` → Final warning
5. `welfare_check` → Welfare check initiated
6. `death_verification` → Contacts asked to verify
7. `cooling_off` → 14-day cooling-off after quorum
8. `executor_required` → No executor, paused (NEVER releases)
9. `executor_review` → Executor asked to approve
10. `approved_for_release` → Executor approved, release imminent
11. `released` → Content released to recipients
12. `paused` → Paused by contact or executor
13. `cancelled` → Cancelled by executor
14. `cancelled_by_user_activity` → User was active, process cancelled

## 10. Daily Automations

- [x] **Legacy Status Check** — runs daily at 9am, advances protocols through stages
- [x] **Scheduled Memory Delivery** — runs daily at 8am, delivers scheduled memories to alive users