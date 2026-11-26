# SHARP CRM (React Native Mobile Application)

SHARP CRM is a cross-platform mobile customer support and ticketing application built with React Native, featuring role-based Customer and Agent workflows, INR quoting and payments, CSAT feedback, local offline caching, and responsive UI layouts.

## Project Modules
- **Auth & Access (`src/api/mockBackend.js`)**: Customer and Agent role login/registration with local session storage.
- **Ticket Creation & Queue (`src/screens/`, `src/api/mockBackend.js`)**: Ticket logging with category, priority, multi-photo attachments, and tabbed status queues (`OPEN`, `IN_PROGRESS`, `QUOTE_PENDING`, `PAID`, `CLOSED`).
- **Ticket Detail, Quotes, Payments & CSAT (`src/api/mockBackend.js`)**: Agent acceptance, INR quote generation, customer payment processing, comment threads, and post-resolution CSAT ratings.
- **Offline Support & Local Caching (`src/storage/localCache.js`, `src/components/OfflineCacheBar.js`)**: `AsyncStorage`-backed local cache allowing offline ticket viewing, offline comment persistence, and cache sync status.
- **Cross-Device UI & Responsiveness (`src/theme/theme.js`, `src/utils/responsive.js`, `src/hooks/useDeviceResponsiveness.js`, `src/components/ScreenContainer.js`, `src/components/ActionButton.js`, `src/components/ResponsiveLayoutWrapper.js`)**: Shared design tokens, keyboard-safe scrolling, accessible touch targets, and screen/orientation wrappers.

## Prerequisites
- Node.js (v18+) and npm
- Android Studio / Android SDK, JDK, and ADB (for Android APK builds)
- macOS with Xcode and Apple Developer account (required only for iOS `.ipa` / TestFlight builds)

## Setup & Local Build Instructions
1. **Install dependencies:**
   ```bash
   npm install