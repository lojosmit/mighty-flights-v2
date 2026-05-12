# Mighty Flights — UI/UX Design Document

For handing to Claude in VS Code alongside DESIGN.md.

---

## 0. Design Philosophy

**Inspiration:** masters.com — the Augusta National aesthetic. Heritage. Restraint. Patience. Every pixel feels considered. Nothing shouts. The prestige is in what's *absent* as much as what's present.

**Why this fits Mighty Flights:** A darts league with a 10-month season, ceremonial elements (the "dove"), discretionary trophies, and tradition deserves a UI that respects the ritual. Not Twitch overlay. Not gamer dashboard. Tournament programme.

**Tone:** Editorial. Considered. Cinematic moments at key beats (round results, special wins, season standings).

---

## 1. Color System

### Light theme (default — "Daylight")
```
--bg-primary:        #F5F2EB   /* warm off-white, like programme paper */
--bg-secondary:      #FFFFFF   /* card surfaces */
--bg-elevated:       #FAF8F3   /* subtle elevation */

--ink-primary:       #1A2E1A   /* deep forest, near-black for text */
--ink-secondary:     #4A5A4A   /* muted body */
--ink-tertiary:      #8A9A8A   /* metadata, timestamps */

--accent-primary:    #1E4A2E   /* Augusta green — buttons, headers, key UI */
--accent-deep:       #0F2D1A   /* hover state on green */
--accent-gold:       #B8985A   /* championship gold — accents, dividers, special win flag */
--accent-gold-soft:  #D4B97E   /* hover on gold, ranking highlight */

--win:               #1E4A2E   /* green — same as accent */
--loss:              #6B6B6B   /* charcoal grey, never red */
--dove:              #B8985A   /* gold — ceremony, never alarming */
--forfeit:           #4A4A4A   /* deeper grey */

--border-hairline:   #D8D2C4   /* warm thin border */
--border-strong:     #1A2E1A   /* on-ink border for emphasis */
```

### Dark theme ("Twilight")
```
--bg-primary:        #0E1A12   /* deep forest */
--bg-secondary:      #15241A
--bg-elevated:       #1B2D20

--ink-primary:       #F0EBDC
--ink-secondary:     #B8B0A0
--ink-tertiary:      #7A7568

--accent-primary:    #3A7A4E   /* lifted green for dark bg */
--accent-deep:       #5A9A6E
--accent-gold:       #D4B97E
--accent-gold-soft:  #E8D49E

--win:               #5A9A6E
--loss:              #7A7568
--dove:              #D4B97E
--forfeit:           #5A5A5A

--border-hairline:   #2A3A30
--border-strong:     #F0EBDC
```

**No red. No bright blue. No neon.** Status is communicated by typography weight and gold accenting, not alarm colors.

---

## 2. Typography

```
--font-display:  "Cormorant Garamond", "EB Garamond", serif;
--font-body:     "Inter", "Helvetica Neue", sans-serif;
--font-mono:     "JetBrains Mono", "Courier New", monospace;
```

(If Cormorant Garamond unavailable, fall back to "Playfair Display" or "EB Garamond". The display font MUST be a high-contrast serif.)

**Scale:**
```
--text-hero:   72px  / line-height 0.95  / weight 400 / letter-spacing -0.02em
--text-h1:     48px  / line-height 1.05  / weight 400
--text-h2:     32px  / line-height 1.15  / weight 500
--text-h3:     22px  / line-height 1.25  / weight 500
--text-body:   16px  / line-height 1.55  / weight 400
--text-small:  14px  / line-height 1.45  / weight 400
--text-meta:   12px  / line-height 1.35  / weight 500 / letter-spacing 0.08em / UPPERCASE
```

- Player names, board labels, scores → display serif.
- All running text, buttons, labels → Inter.
- Numerical scores, timer → mono.
- Section labels ("ROUND 03", "BOARD A") → uppercase Inter with wide letter-spacing.

---

## 3. Layout Principles

- **Desktop dashboard primary.** Min width 1280px assumed. Phone view is read-only spectator mode (Phase 13).
- **Grid:** 12-column, 1280px max content width, 80px gutters on each side.
- **Generous vertical rhythm.** Use multiples of 8px. Sections separated by 64–96px.
- **Hairline dividers, not boxes.** Borders are `1px solid var(--border-hairline)`. No drop shadows except on modals.
- **Asymmetry is allowed.** Section headers can sit in the left column with content extending right, like editorial layouts.
- **One feature image per screen.** A scorecard, a leaderboard, a fixture board — let it breathe.

---

## 4. Components

### 4.1 Top Bar
- Full width, 72px tall, `bg-secondary`.
- Left: wordmark "Mighty Flights" in display serif, 24px.
- Center: subtle context — e.g. "Season 12 · League Night 04 · Round 03".
- Right: theme toggle (sun/moon icon, monoline), settings cog, host avatar initial in a circle.
- Bottom edge: 1px gold hairline.

### 4.2 Page Header
- Tall, 200px+.
- Tiny meta label at top ("LEAGUE NIGHT"), then enormous display serif title underneath ("04 · APRIL 2026").
- Right side: optional muted timestamp or status.

### 4.3 Card / Panel
- `bg-secondary` on `bg-primary`.
- 1px hairline border, NO shadow.
- 32px internal padding.
- Optional gold corner mark (5px gold square in top-left) to denote "active" or "featured".

### 4.4 Buttons
- **Primary:** filled green, white text, no border-radius (sharp corners) OR 2px (slight). Padding 14px 28px. Hover → darker green.
- **Secondary:** transparent, 1px ink border, ink text. Hover → fill with ink.
- **Tertiary:** text only, gold underline on hover.
- **No icon-only buttons** in primary flows. Always paired with a label.

### 4.5 Timer (Critical Component)
- Persistent, top-right of round view OR full-screen mode option.
- Massive mono numerals: 96px when prominent, 56px when docked.
- `MM:SS` format. No animations on the digits themselves except a hairline color shift in the last 60 seconds.
- Gold hairline ring beneath it when running. Ring fades to grey when paused.

### 4.6 Score Grid (Scorekeeper)
- Two columns side by side — Team A | Team B.
- 14 rows: 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, Double, Triple, Bull.
- Each cell shows 3 hit marks. Marks are slash characters: `/`, `//`, `///` in increasing gold weight, drawn by hand-style stroke.
- Numbers in display serif, marks in mono.
- A completed row (3 crosses) gets a faint gold horizontal line through it.

### 4.7 Fixture Board (League Night View)
- One large card per active board.
- Board label as huge serif numeral overlaid behind the card content (low opacity): "A", "B", "C".
- Two team blocks within: player names in display serif, current score in mono.
- Streak indicator: 1, 2, or 3 gold pips below the pair name.
- "Promote/Split" status messages in tiny uppercase meta type when applicable.

### 4.8 Bench Display
- Below the fixtures, a horizontal strip.
- Label: "BENCH" in uppercase meta.
- Each benched player as a small chip with their name and a subtle "next round: in" badge.
- Bench order shown but the visual emphasizes: "these players play next."

### 4.9 Round Result Modal / View
- Full-screen takeover on round complete.
- Black or deep forest background.
- Centered: "BOARD A" small uppercase meta, then "[WINNERS]" in enormous display serif.
- Below: score line, "SPECIAL WIN — DOVE" flag in gold if applicable.
- "CONTINUE" button at bottom, large, primary.
- Auto-dismisses after 8 seconds or on click.

### 4.10 Leaderboard
- Heavily inspired by Masters leaderboard.
- Columns: position (gold numeral), player, W, L, D (doves), D+W (special wins), win ratio.
- Position 1–3 get gold highlight on the row.
- Hairline dividers between rows. Generous row height (56px).
- No alternating zebra stripes. White space only.
- Player names in display serif, stats in mono.

### 4.11 Player Card / Profile
- Hero block: name in massive serif, rank, current season at-a-glance.
- Below: tabbed sections (Stats / Partners / Head-to-Head / History).
- Stats shown as numbers in serif with tiny uppercase meta labels underneath.
- Partner table: shows every player they've teamed with and combined win ratio.

---

## 5. Imagery & Iconography

- **No stock photography.** No people-shaking-hands graphics. No dartboard illustrations as primary art.
- **Icons:** monoline only. 1.5px stroke. Sparse. Lucide icon set acceptable as base.
- **Decorative elements:** thin gold lines, hairline rules, tiny gold square ornaments. Think tournament programme.
- **Number ornaments:** large display-serif numerals as background watermarks (board letters, round numbers). 8–15% opacity.
- **Logo:** the Mighty Flights winged dartboard emblem appears in the top bar (small), on loading states, and as a faded background motif on round result reveals. Don't recreate in CSS — use the SVG export.

---

## 6. Motion

Subtle. Cinematic. Never bouncy.

- **Page transitions:** 400ms ease-out fade + 8px vertical lift.
- **Round result reveal:** 600ms — meta label fades in first, then 200ms later the winner name does a slow letter-by-letter reveal (CSS animation with staggered opacity).
- **Score updates:** 150ms scale 1.02 → 1.0 on the changed digit.
- **Timer last 60s:** numerals slowly shift from ink to gold over 60s. No flashing.
- **Streak pip appearance:** 300ms fade + slight scale-in.
- **Theme toggle:** crossfade entire palette over 400ms.

No spring physics. No bounces. No confetti. The dove ceremony is acknowledged in UI by a single quiet gold-flash card and a slow modal — the actual ceremony happens in the room.

---

## 7. Key Screens (Build in This Order)

### 7.1 Home / Season Overview
Hero: "MIGHTY FLIGHTS · SEASON 12" in giant serif. Below: next league night date, current leaderboard top 5, recent results. Generous white space.

### 7.2 Player Roster
Editorial list of all players. Each row: name (serif), rank, season stats (mono), edit icon on hover. Add player button bottom-right.

### 7.3 League Night Setup
Step 1: pick attendees (toggle list). Step 2: pick board count (segmented control showing valid options based on count). Step 3: confirm and start.

### 7.4 League Night — Live View
Most-used screen. Layout:
- Top bar with context
- Timer prominent top-right
- Fixture cards for each active board, large
- Bench strip below
- "End round" / "Override pairings" actions in a sticky footer bar
- Round number as huge watermark numeral behind everything (10% opacity)

### 7.5 Round Results
Modal/takeover. Section 4.9.

### 7.6 League Night Summary
End-of-night view. List every fixture played, all results, doves count. Big "FINALIZE" button to write to season stats.

### 7.7 Leaderboard
Section 4.10.

### 7.8 Player Profile
Section 4.11.

---

## 8. Accessibility

- All text WCAG AA on chosen backgrounds. The forest green meets contrast on cream; verify gold-on-cream for body text (likely needs darker gold variant).
- Focus rings: 2px gold offset 2px. Visible on every interactive element.
- Timer announces via aria-live="polite" every minute, and aria-live="assertive" in final 30 seconds.
- All gold/color status indicators also carry text labels (don't communicate state via color alone).
- Keyboard navigable end-to-end. Tab order matches visual flow.

---

## 9. What to AVOID (Hard Rules)

- ❌ Bright reds, oranges, neon colors
- ❌ Drop shadows on cards (except modals)
- ❌ Rounded corners larger than 4px
- ❌ Gradients (except subtle bg-elevated tonal shifts)
- ❌ Emoji in UI chrome
- ❌ Bouncy animations, spring physics
- ❌ Stock photography
- ❌ Dark mode that is just "invert the light mode" — see Section 1, dark theme is its own palette
- ❌ Inter or Roboto for headlines (use the display serif)
- ❌ Confetti, particle effects, celebratory bursts

---

## 10. What to PURSUE

- ✅ White space as a feature
- ✅ Display serif numerals as art
- ✅ Gold as a precious accent, not a fill
- ✅ Editorial rhythm — meta labels, then huge headers, then body
- ✅ Hairline borders and rules
- ✅ Cinematic, slow reveals on key moments
- ✅ Restraint above all

---

## 11. Reference Vocabulary

When in doubt, ask: "Would this fit on a printed Augusta programme?" If no, reconsider.

Words that should describe the final product:
**Considered. Patient. Heritage. Ceremonial. Quiet authority. Restrained. Crafted.**

Words that should NOT describe it:
**Punchy. Energetic. Gamified. Loud. Cyber. Fun. Casual.**

---

## 12. Brand Asset Inventory

The build will need the club's logo exported as SVG for use in the top bar and loading states:

- [ ] `logo-full.svg` — the winged dartboard + wordmark
- [ ] `logo-mark.svg` — just the winged dartboard (no text)

Have the club's designer export these from the existing poster artwork.