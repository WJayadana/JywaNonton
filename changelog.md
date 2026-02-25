# Changelog 📜

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.6.1] - 2026-02-25
### Changed
- **Branding Refinement (GEO)**: Explicitly linked **Wahyudi Jayadana** and **WJayadana** in all structured metadata (JSON-LD) for superior AI Search engine recognition.

---

## [1.6.0] - 2026-02-25
### Added
- **Dedicated About Page**: Launched a standalone `/about.html` for better site structure and navigation.
- **Advanced GEO Implementation**: Injected JSON-LD (Schema.org) structured data to help AI search engines (like Perplexity, SearchGPT) identify **WJayadana** as the creator.
- **AI-Friendly Semantics**: Enhanced metadata and content mapping specifically for Generative Experience Optimization (GEO).

### Changed
- **Navigation Flow**: Replaced SPA-section-based About with a direct standalone route.

---

## [1.5.0] - 2026-02-25
### Added
- **About GEO Page**: Dedicated "About Me" section introducing **WJayadana** (GEO) as the developer.
- **Premium Branding**: Custom-styled About page with glassmorphism, avatar, and social integration.
- **SEO & Search Visibility**: Injected SEO metadata, OpenGraph tags, and keywords for better discovery.
- **Dynamic Titles**: Automatic document title updates based on the active section for SEO and UX.

### Changed
- **Personal Branding**: Replaced generic repository links with official **WJayadana** GitHub identifiers.

---

## [1.4.0] - 2026-02-25
### Added
- **RapiDoc Integration**: Interactive and modern API documentation at `/rapidoc`.
- **Search Fallback System**: Automatic search-back mechanism in `lib/melolo.js` to retrieve missing author data from the search API when detail API fails.
- **OpenAPI JSON Export**: Specification available at `/swagger.json`.

### Changed
- **Data Integrity**: Removed hardcoded "9.8" and "9.5" placeholder ratings.
- **Metadata Cleanup**: Removed unreliable "Cast/Pemeran Utama" field from backend and frontend to ensure high-quality information.
- **Improved Detail Layout**: Expanded description area and refined metadata visibility for more "Daging" content.

### Fixed
- **Author Mapping**: Resolved issue where "Kucing Manis" showed "Unknown Author" despite having data in search results.

---

## [1.3.0] - 2026-02-25
### Added
- **Hashtag Pillar System**: Premium drama tags with `#` prefix and vibrant gradient borders.
- **Unified Metadata Pills**: Harmonized design for Trending, Episode Count, and Genre tags using a consistent "Premium Pill" aesthetic.
- **Dynamic Glow**: Subtle "breathing" animation for the first hashtag pill in the Hero section.

### Changed
- **Aesthetic Synchronization**: Synced the Hero carousel and Detail view metadata styles for a perfectly cohesive design language.

---

## [1.2.0] - 2026-02-24
### Added
- **Premium Skeleton Loaders**: Context-aware shimmering skeletons for a smoother loading experience.
- **Bookmark/Favorite Management**: Unified view for saved dramas with premium iconography.
- **Immersive Clear Mode**: Ability to hide UI elements during playback for a distraction-free experience.

### Changed
- **Mobile Symmetry**: Optimized the Hero carousel for mobile devices, centering titles and posters.
- **Glassmorphism Overhaul**: Applied modern blur effects and semi-transparent backgrounds to all core UI modules.

---

## [1.1.0] - 2026-02-24
### Added
- **Cinematic Ambilight**: Background glow effect in video players (Reels & Modal) for an expanded screen feel.
- **Custom Episode Picker**: Intuitive and aesthetic episode selection interface.
- **Playback Resume**: Progress tracking and intelligent resume feature for returning users.
- **Share Implementation**: Native-feel sharing functionality for drama pages.

### Fixed
- **History Playback Bug**: Resolved issues with progress not saving correctly during long sessions.
- **Layout Overlaps**: Fixed header and hero title overlap issues on various screen sizes.

---

## [1.0.0] - 2026-02-23
### Added
- Initial release with core Melolo video streaming integration.
- Hero carousel and category search functionality.
- Basic video player and drama detail views.
