<div align="center">

<img src="assets/profile-banner.gif" alt="Siddharth Pandalai, Senior Android Engineer, Kotlin, Jetpack Compose, Kotlin Multiplatform" width="1000"/>

# Siddharth Pandalai

**Senior Android Engineer** at [Dice.tech](https://dice.tech/). I own the Android platform: ~964k lines, 772k of them Kotlin, serving **50,000+ MAU** and **22,000+ DAU**.

[Portfolio](https://cv-siddharth.vercel.app) &nbsp;·&nbsp; [Interactive CV](https://cv-siddharth.vercel.app/resume) &nbsp;·&nbsp; [Hire me](https://cv-siddharth.vercel.app/hire) &nbsp;·&nbsp; [LinkedIn](https://linkedin.com/in/siddharth-pandalai)

</div>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/lanes-dark.svg" />
  <img src="assets/lanes-light.svg" alt="Four lanes of activity by month since 2019: work delivered, open source merged, writing published, chess played" width="100%" />
</picture>

> **80%** crash reduction &nbsp;·&nbsp; GPS accuracy **50% to 95%** &nbsp;·&nbsp; **~87%** of the UI layer migrated to Compose &nbsp;·&nbsp; AES-256 Keystore and SSL pinning across **9 domains**, cleared for VAPT and banking review.

## Is any of this still true?

Anyone can put numbers on a page. The harder question is whether they are still
being maintained, and this board answers it in public. It reads live from the
GitHub API and from each generated file's own timestamp. Amber is the whole
point: passing, and quietly aging out.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/board-dark.svg" />
  <img src="assets/board-light.svg" alt="Live status board of every scheduled job and generated dataset behind this profile, with state and age against its SLA" width="100%" />
</picture>

If a generator here dies, the job opens itself an issue and the badge goes red.
That is not decoration: in August 2026 this exact pipeline failed for eight days
straight while every test stayed green, which is why the board exists.

## The fleet I shipped

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/fleet-dark.svg" />
  <img src="assets/fleet-light.svg" alt="White-label client apps by the year each last shipped: 89 still live and 84 delisted, out of 173 that reached the Play Store" width="100%" />
</picture>

At Jugnoo I built the per-tenant flavour system, one build config and one set of
resource overlays, that let a client app ship without forking the codebase. The
interesting number is not the total, it is the shape: apps launched under that
system are still being updated years later. [See the fleet](https://cv-siddharth.vercel.app/shipped),
checked against the Play Store and Internet Archive crawls rather than memory.

## The KMP family, as the build file wires it

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/modules-dark.svg" />
  <img src="assets/modules-light.svg" alt="kmp-toolkit dependency graph: 39 modules and 43 internal dependencies, laid out by computed dependency depth" width="100%" />
</picture>

Parsed from `settings.gradle.kts` and each module's build file, with columns
computed by dependency depth, so it shows the architecture rather than a drawing
of it. Nothing became a library until a second consumer needed the same logic.

- [**kmp-toolkit**](https://github.com/darkpandawarrior/kmp-toolkit): 39 modules. Typed `Result`, an MVI core, an offline-first store, network, security, on-device AI behind one seam, a 19-provider payment abstraction. MIT.
- [**kmp-build-logic**](https://github.com/darkpandawarrior/kmp-build-logic): 22 authored convention plugins, vendored by `includeBuild` across five repos, so a version bump happens once.
- [**kmp-app-template**](https://github.com/darkpandawarrior/kmp-app-template): the app shape the toolkit slots into, buildable on day one.

## What I do

One platform, seen at different layers. Depth is behind the links.

| Lane | The proof | The number |
|---|---|---|
| **Android at scale** | Dice platform: GPS pipeline, Compose migration, crash and concurrency work, security hardening | 50k MAU, 80% fewer crashes |
| **Platform ownership** | Jugnoo's white-label estate and the automation that shipped it | 173 apps on Play, 80% less delivery time |
| **Libraries and build** | [kmp-toolkit](https://github.com/darkpandawarrior/kmp-toolkit), [kmp-build-logic](https://github.com/darkpandawarrior/kmp-build-logic), [kmp-app-template](https://github.com/darkpandawarrior/kmp-app-template) | 39 modules, 22 plugins |
| **Tooling** | The generators that draw this page, and the guards that fail when their data ages | every figure machine-checked |
| **Writing and games** | [The Loopdown](https://github.com/darkpandawarrior/the-loopdown), [Kursi](https://github.com/darkpandawarrior/Kursi) | one war story, four platforms |

## Everything else

| Repo | What it is | Its number |
|---|---|---|
| [Mileway](https://github.com/darkpandawarrior/Mileway) | Mileage and trip tracking, offline-first, Ktor backend | 46 modules, 5 platforms |
| [PaymentsLab](https://github.com/darkpandawarrior/PaymentsLab) | Every payment gateway behind one abstraction, each transaction's lifecycle visible | 40 modules |
| [Kursi](https://github.com/darkpandawarrior/Kursi) | Bluffing card game, ISMCTS and LLM opponents on a byte-for-byte deterministic engine | Android, iOS, Desktop, Web |
| [cv-siddharth](https://github.com/darkpandawarrior/cv-siddharth) | This portfolio: React 19, multi-provider LLM chat, and the generator farm behind every number | 83 test files |
| [cv-siddharth-kmp](https://github.com/darkpandawarrior/cv-siddharth-kmp) | The same portfolio in one Kotlin `commonMain`, rendering to Wasm, Desktop, Android, iOS | near dependency-free |
| **HireSignal** [(case study)](https://cv-siddharth.vercel.app/project/hiresignal) | Local-first AI career-intelligence dashboard: resume onboarding, reverse-ATS discovery (81 providers), evidence-based fit scoring. Built on the open-source [career-ops](https://github.com/santifer/career-ops) engine. Private while v1 lands | case study is public |
| [The Loopdown](https://github.com/darkpandawarrior/the-loopdown) | One war story from a real project, adapted to four platforms, with a linter that strips AI tells | 4 channels |
| [SINC-P](https://github.com/darkpandawarrior/SINC-P) | Statutory student grievance redressal, UGC 2023 compliant, with an SLA clock | compliance-cited |

## Open source

**24 merged PRs** to [career-ops](https://github.com/santifer/career-ops) (⭐68k+): two new ATS providers ([BambooHR](https://github.com/santifer/career-ops/pull/1141), [Breezy HR](https://github.com/santifer/career-ops/pull/1185)), a [dashboard status-cell fix](https://github.com/santifer/career-ops/pull/1186) and an [agent-inbox feature](https://github.com/santifer/career-ops/pull/1472).

Most of the rest are correctness fixes, each with a reproduction and a regression test, and each the same class of bug: code that reports success while doing the wrong thing. Non-Latin company names [collapsing into one and deleting a tracked application](https://github.com/santifer/career-ops/pull/2587). `$`-patterns in CV text [splicing the template into the resume](https://github.com/santifer/career-ops/pull/2588) at exit 0. A date filter [silently ignored in its `--flag=value` form](https://github.com/santifer/career-ops/pull/2589).

**Stack:** Kotlin · Jetpack Compose · Compose Multiplatform · Coroutines and Flow · Koin and Hilt · Room and DataStore · Ktor · WorkManager · Gradle convention plugins
**Architecture:** MVVM and Clean Architecture · MVI unidirectional state · offline-first · multi-module

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/darkpandawarrior/darkpandawarrior/output/github-contribution-grid-snake-dark.svg" />
  <img src="https://raw.githubusercontent.com/darkpandawarrior/darkpandawarrior/output/github-contribution-grid-snake.svg" alt="Contribution snake animation" width="100%" />
</picture>

## Connect

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/siddharth-pandalai)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:siddharthpandalai990@gmail.com)
[![Medium](https://img.shields.io/badge/Medium-000000?style=for-the-badge&logo=medium&logoColor=white)](https://medium.com/@siddharthpandalai990)
[![Stack Overflow](https://img.shields.io/badge/Stack%20Overflow-F58025?style=for-the-badge&logo=stackoverflow&logoColor=white)](https://stackoverflow.com/users/12678663/siddharth-pandalai)

---

<div align="center"><sub>Avid reader, chess player, and connoisseur of puns and coffee.</sub></div>
