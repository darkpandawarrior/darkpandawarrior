<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:7F52FF,100:4285F4&height=180&section=header&text=Siddharth%20Pandalai&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=38" alt="Header banner" />
</p>

# Hi, I'm Siddharth Pandalai 👋

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=1000&color=7F52FF&width=650&lines=Senior+Android+Engineer+%40+Dice.tech;50k%2B+MAU+%C2%B7+Platform+Owner+%C2%B7+5%2B+years;Kotlin+%C2%B7+Jetpack+Compose+%C2%B7+KMP;GPS%3A+50%25+%E2%86%92+95%25+in+production" alt="Typing SVG" />

**Senior Android Engineer** — 5+ years building Android apps at scale. Currently SDE-2 & Android Platform Owner at [Dice.tech](https://dice.tech/), owning a platform serving **50,000+ MAU**.

🌐 Portfolio: **[darkpandawarrior.github.io](https://darkpandawarrior.github.io)** &nbsp;·&nbsp; 📄 Interactive CV: **[cv-siddharth.vercel.app](https://cv-siddharth.vercel.app)**

```kotlin
val siddharth = AndroidEngineer(
    location = "Pune, India",
    yearsOfExperience = 5, // and counting
    currentFocus = listOf("Compose Multiplatform", "Performance Engineering", "System Design"),
)
```

## What I've shipped

- 📍 **Location engineering** — predictive dead reckoning + sensor fusion (accelerometer + GPS), taking tracking accuracy from **50% → 95%** in production
- 🎨 **92% Jetpack Compose migration** of a 738k+ LOC codebase, including a custom theme engine that cut UI development friction by **60%**
- 🛡️ **80% crash reduction** — dual monitoring with Firebase Crashlytics + Sentry (programmatic init, ProGuard mapping, ANR detection), threading fixes, structured-concurrency cleanup
- 🔐 **Security hardening** — SQLCipher + Android Keystore, SSL pinning as dual build flavors (pinned/unpinned), biometric auth (VAPT/banking-compliant)
- ✈️ **Trip V2 travel platform** — mileage submission linked to Itinerary V2, approval flows, full Mixpanel analytics across the mileage ecosystem
- 🏢 **20+ white-label client apps** at Jugnoo/Jungleworks with an **80% reduction** in delivery time via build automation

## Open source

### 🗺 Mileway — Offline-first Mileage & Trip Tracker

> **Kotlin Multiplatform** · Android + iOS + Wear OS + watchOS + Desktop · 28-module clean architecture

- Five platforms from one codebase — native SwiftUI watchOS app, Glance + WidgetKit home-screen widgets, iOS Live Activity/Dynamic Island
- **149 Roborazzi screenshot tests** on JVM (no emulator, no network), detekt / ktlint / Kover, CI
- Dual `gms` / `noGms` distribution with a dependency-prefix guard (Play Store + F-Droid)
- Sensor-fusion location engine with predictive dead reckoning, ML Kit OCR for receipt scanning
- **V24 (in progress):** a plugin-composition registry driving four persona presets (Corporate Commuter, Super-App Consumer, Gig Driver, Minimal Guest), plus delegation, verification, growth and wallet/payout depth

[![Mileway on GitHub](https://github-stats-extended.vercel.app/api/pin/?username=darkpandawarrior&repo=Mileway&theme=tokyonight&hide_border=true#gh-dark-mode-only)](https://github.com/darkpandawarrior/Mileway#gh-dark-mode-only)
[![Mileway on GitHub](https://github-stats-extended.vercel.app/api/pin/?username=darkpandawarrior&repo=Mileway&theme=default&hide_border=true#gh-light-mode-only)](https://github.com/darkpandawarrior/Mileway#gh-light-mode-only)

---

### 🃏 Kursi — Bluffing Card Game

> **Compose Multiplatform** · Android + iOS + Desktop + Web (Wasm) · 14 modules · ISMCTS + LLM AI opponents · Koin

Satirical India corporate-political underworld — *Kursi ke liye kuch bhi karega*

- **Tiered AI system** — ISMCTS bots (1.5k–16k iterations by difficulty) → cloud LLM upgrade (Anthropic / OpenAI / Gemini / on-device); each of 10 personas has a personality profile driving targeting and bluff choices
- **DARBAR social layer** — bots form alliances, carry grudges, send Hinglish chat; 4 story arcs; players can manipulate the social fabric — *without breaking the engine's byte-for-byte determinism*
- **Bespoke design identity** — "License Raj Deco" (teak/brass/cream, Rozha One display font, 5 Canvas-drawn intaglio role glyphs, stamped-instrument UI language)
- Gauntlet mode (5-rung ladder), Team mode, Spectator demo, interactive tutorial; full Fastlane + CI prod pipeline

[![Kursi on GitHub](https://github-stats-extended.vercel.app/api/pin/?username=darkpandawarrior&repo=Kursi&theme=tokyonight&hide_border=true#gh-dark-mode-only)](https://github.com/darkpandawarrior/Kursi#gh-dark-mode-only)
[![Kursi on GitHub](https://github-stats-extended.vercel.app/api/pin/?username=darkpandawarrior&repo=Kursi&theme=default&hide_border=true#gh-light-mode-only)](https://github.com/darkpandawarrior/Kursi#gh-light-mode-only)

---

### 💳 PaymentsLab — Payments Integration Lab

> **Kotlin Multiplatform** · Android + iOS · Ktor backend · 35-module architecture

An Integration Lab for the Android payments ecosystem — every gateway behind one abstraction, with a live look at what actually happens on each transaction.

- **66-gateway catalog** behind one `PaymentGateway` abstraction — Razorpay, Cashfree, Stripe (+ Google Pay), Square, Omise, UPI intent, plus hosted-webview (47) and mobile-money (8) archetypes covering the rest; one Gradle module per native-SDK provider, contributed via Koin's `getAll<PaymentGateway>()`
- **Five money-movement rails beyond pay-in** — payouts, mandates & subscriptions, a card vault, marketplace Connect onboarding, and a double-entry wallet ledger, each idempotency-keyed like the pay-in path
- **Server is the source of truth** — a companion Ktor server owns order creation, HMAC-SHA256 signature verification and webhook reconciliation; the client callback is only ever treated as a hint
- **Process-death recovery + VAPT-grade security** — every in-flight payment is journaled to Room before the SDK opens; Android Keystore AES-256-GCM at rest, device-integrity checks, certificate pinning

[![PaymentsLab on GitHub](https://github-stats-extended.vercel.app/api/pin/?username=darkpandawarrior&repo=PaymentsLab&theme=tokyonight&hide_border=true#gh-dark-mode-only)](https://github.com/darkpandawarrior/PaymentsLab#gh-dark-mode-only)
[![PaymentsLab on GitHub](https://github-stats-extended.vercel.app/api/pin/?username=darkpandawarrior&repo=PaymentsLab&theme=default&hide_border=true#gh-light-mode-only)](https://github.com/darkpandawarrior/PaymentsLab#gh-light-mode-only)

---

### Side projects

| Project | What it is |
|---------|-----------|
| [**cv-siddharth**](https://github.com/darkpandawarrior/cv-siddharth) &nbsp;[![Live](https://img.shields.io/badge/Live↗-000000?style=flat-square&logo=vercel&logoColor=white)](https://cv-siddharth.vercel.app) | Interactive CV with AI assistant — React 19, multi-provider LLM chat, 3D hero, printable résumé |
| [**HireSignal**](https://github.com/darkpandawarrior/career-ops) | Local-first AI career-intelligence dashboard — resume onboarding, reverse-ATS discovery (62 providers), evidence-based fit scoring, tailored résumés, single-server multi-profile. Built on open-source career-ops |

### Open-source contributions

- **[HireSignal](https://github.com/kirklazar-android/hiresignal)** (career-ops) — **30 merged PRs**, including [HireSignal 2.0's multi-profile/scoring/onboarding fusion](https://github.com/kirklazar-android/hiresignal/pull/9), [a production-grade README refresh](https://github.com/kirklazar-android/hiresignal/pull/48), the [career-ops 1.14 System-Layer sync](https://github.com/kirklazar-android/hiresignal/pull/8), and the [dashboard tabs](https://github.com/kirklazar-android/hiresignal/pull/4)

## Tech stack

![Kotlin](https://img.shields.io/badge/Kotlin-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)
![Jetpack Compose](https://img.shields.io/badge/Jetpack%20Compose-4285F4?style=for-the-badge&logo=jetpackcompose&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Coroutines](https://img.shields.io/badge/Coroutines%20%2B%20Flow-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)
![Hilt](https://img.shields.io/badge/Hilt-2196F3?style=for-the-badge&logo=google&logoColor=white)
![Room](https://img.shields.io/badge/Room%20%2B%20SQLCipher-FF6F00?style=for-the-badge&logo=sqlite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=firebase&logoColor=white)
![Fastlane](https://img.shields.io/badge/Fastlane%20CI%2FCD-00F200?style=for-the-badge&logo=fastlane&logoColor=black)

**Architecture:** MVVM + Clean Architecture · MVI state · Repository pattern · Multi-module
**Also:** WorkManager · Foreground Services · Retrofit/OkHttp · Sentry · Agentic dev workflows (MCP)

## GitHub stats

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github-stats-extended.vercel.app/api?username=darkpandawarrior&show_icons=true&theme=tokyonight&hide_border=true&show=reviews,prs_merged,prs_merged_percentage" />
  <img align="left" src="https://github-stats-extended.vercel.app/api?username=darkpandawarrior&show_icons=true&theme=default&hide_border=true&show=reviews,prs_merged,prs_merged_percentage" alt="GitHub stats" height="165" />
</picture>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github-stats-extended.vercel.app/api/top-langs/?username=darkpandawarrior&layout=compact&theme=tokyonight&hide_border=true&hide=html,css,javascript,php,coffeescript,tsql,dart,python,c%2B%2B,jupyter%20notebook&exclude_repo=career-ops,SINC-P" />
  <img align="left" src="https://github-stats-extended.vercel.app/api/top-langs/?username=darkpandawarrior&layout=compact&theme=default&hide_border=true&hide=html,css,javascript,php,coffeescript,tsql,dart,python,c%2B%2B,jupyter%20notebook&exclude_repo=career-ops,SINC-P" alt="Top languages" height="165" />
</picture>

<br clear="left" />

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://streak-stats.demolab.com?user=darkpandawarrior&theme=tokyonight&hide_border=true" />
  <img src="https://streak-stats.demolab.com?user=darkpandawarrior&theme=default&hide_border=true" alt="GitHub streak" height="165" />
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/darkpandawarrior/darkpandawarrior/output/github-contribution-grid-snake-dark.svg" />
  <img src="https://raw.githubusercontent.com/darkpandawarrior/darkpandawarrior/output/github-contribution-grid-snake.svg" alt="Contribution snake animation" width="100%" />
</picture>

<img src="/metrics.svg" alt="Isometric contribution calendar" width="100%" />

## Connect

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/siddharth-pandalai-3712b215a)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:siddharthpandalai990@gmail.com)
[![Medium](https://img.shields.io/badge/Medium-000000?style=for-the-badge&logo=medium&logoColor=white)](https://medium.com/@siddharthpandalai990)
[![Stack Overflow](https://img.shields.io/badge/Stack%20Overflow-F58025?style=for-the-badge&logo=stackoverflow&logoColor=white)](https://stackoverflow.com/users/12678663/siddharth-pandalai)
[![LeetCode](https://img.shields.io/badge/LeetCode-FFA116?style=for-the-badge&logo=leetcode&logoColor=black)](https://leetcode.com/siddharthpandalai990)

---

⚡ *Avid reader, chess player, and connoisseur of puns & coffee.*
