# SameHere — Full Project Context
> Reference this file at the start of a new chat to continue where we left off.

---

## What is SameHere?
A dark-themed social journaling app. Core premise: "We all have 24 hours. What did you do with yours?" Users post daily entries, track todos, chat, and log private truths in "The Reckoning."

---

## Deployment
- **Frontend**: `docker.io/ir7fan/samehere-web:latest` → deployed on Sealos K8s
- **Backend**: `docker.io/ir7fan/samehere:latest` → deployed on Sealos K8s
- **WebSocket**: `docker.io/ir7fan/samehere-ws:latest`
- **Cluster**: `usw-1.sealos.io:6443`, namespace `ns-ts2raneh`
- **Kubeconfig**: `C:\Users\irfan\Downloads\kubeconfig (11).yaml`
- **Live URL**: `https://www.samehere.in` (custom domain via GoDaddy → Sealos)
- **Sealos URL**: `https://samehere-web-ts2raneh.usw-1.sealos.app`
- **Docker Hub user**: `ir7fan`
- **imagePullSecret**: `dockerhub-secret` — already patched on ALL 3 deployments (web, backend, ws). No more ImagePullBackOff.

### Deploy workflow
```bash
# Frontend — USER does the docker build+push themselves, Claude only restarts the pod:
kubectl rollout restart deployment/samehere-web -n ns-ts2raneh --kubeconfig "C:\Users\irfan\Downloads\kubeconfig (11).yaml"

# Backend — Claude does BOTH docker build+push AND pod restart:
cd samehere/backend && docker build -t ir7fan/samehere:latest . && docker push ir7fan/samehere:latest
kubectl rollout restart deployment/samehere -n ns-ts2raneh --kubeconfig "C:\Users\irfan\Downloads\kubeconfig (11).yaml"

# Check pod status:
kubectl get pods -n ns-ts2raneh --kubeconfig "C:\Users\irfan\Downloads\kubeconfig (11).yaml"
```

### Testing workflow
- User runs `npm run dev` in `samehere/web` for localhost testing
- User builds + pushes frontend Docker image themselves, then asks Claude to restart the pod
- Claude handles backend Docker build + push + pod restart entirely
- imagePullSecret `dockerhub-secret` is permanently patched on all deployments — no need to re-patch

---

## Project Structure
```
MIND/samehere/
  backend/
    src/
      index.js          — Express server, mounts all routes
      db/
        index.js        — PostgreSQL pool (host: samehere-pg)
        schema.sql      — All table definitions + ALTER TABLE migrations
      middleware/
        auth.js         — JWT auth middleware
      routes/
        auth.js         — POST /register, POST /login
        entries.js      — CRUD entries, likes, comments, feed, explore
        users.js        — Profiles, follow, discover, search, pic upload, /:id/likes (excludes self-likes)
        chat.js         — DM conversations + messages
        todos.js        — Todos CRUD (has time_slot field)
        notifications.js
        truths.js       — The Reckoning private log
  web/
    app/
      page.js           — Redirects auth→feed, unauth→login
      layout.js         — Root layout + flash-free theme script (CSS vars injected before hydration)
      feed/page.js      — Main social feed + Discover icon top-right
      chat/page.js      — Chat inbox
      chat/[id]/page.js — Individual chat thread (WebSocket)
      discover/page.js  — Find users by tags
      entry/[id]/page.js — Single entry detail
      new-entry/page.js — Create entry
      profile/[id]/page.js — User profile + 3-dot menu (Edit profile, Theme, Log out)
      todos/page.js     — Todo list (Command Center) — NO debug panel
      reckoning/page.js — The Reckoning private truths log — NO debug panel
      reckoning/[id]/page.js — Truth detail (timeline, reflection prompts, seal ceremony)
      login/page.js
      register/page.js
    components/
      AppShell.js       — Layout wrapper (sidebar desktop, bottom nav mobile)
      Sidebar.js        — Desktop nav
      BottomNav.js      — Mobile nav: Feed / Chat / Post / Truth / Me (5 icons — Discover removed)
      Avatar.js
      LikeButton.js
      RightPanel.js     — Desktop right panel (heatmap, similar users, todos)
    lib/
      api.js            — Axios instance pointing to live backend
      auth.js           — getUser, setAuth, clearAuth
      theme.js          — Full theme system (OVERALL_THEMES, applyTheme, saveTheme, CSS vars)
      useIsMobile.js    — Hook for mobile detection
```

---

## Database Schema (key tables)
```sql
users       — id, username, email, password_hash, bio, tags[], user_code, profile_pic, banner_pic
entries     — id, user_id, content, mood, tags[], created_at
likes       — user_id, entry_id
comments    — user_id, entry_id, content
messages    — sender_id, receiver_id, content, read
follows     — follower_id, following_id
todos       — id, user_id, content, completed, due_date, priority, time_slot, created_at
truths      — id, user_id, content, resolution TEXT, created_at
```

---

## Key Features Built

### Todos Page — "Command Center"
- SVG ring progress, streak counter, "Up Next" focus card
- Morning / Noon / Night time blocks
- Overdue section, Carried Over block, past date recap
- All optimistic updates
- NO debug panel (removed)

### The Reckoning (`/reckoning`)
- Private mistakes log — never shared, stays forever
- Calendar with color-coded dots: red = open, green = all sealed
- Info modal: "You already know what went wrong today. Write it down before you convince yourself it didn't happen."
- Positive word detection nudge
- Optimistic add/delete
- 1-day-back write limit (today + yesterday writable, older locked)
- Truth detail page (`/reckoning/[id]`):
  - Timeline rail (red pulsing dot → line → green dot when sealed)
  - Progressive prompt reveal: 3+ words needed to unlock next prompt
  - 3 reflection prompts: "What caused this?" / "What did I do?" / "What changes next time?"
  - Resolution stored as JSON: `{ caused, did, different }`
  - Day counter badge: "X days unresolved" — pulses faster over time
  - Seal ceremony: gravity animation + stats screen (truths sealed count + rotating quote)
  - 24 seal quotes including proverbs and short punchy ones
  - Delete button (top-right trash icon, confirm before delete, optimistic)
  - Unseal / Edit reflection capability
- NO debug panel (removed)

### Theme System
- **Overall Themes** — single-click full transformation (bg + text + subtext + accent + CSS vars)
- **15 themes total:**
  - Gradient: Sunset Drift 🌅, Galaxy 🪐, Northern Lights 🌈, Midnight Rose 🌹, Ember 🔥
  - Solid: Neon Tokyo 🌆, Blood Moon 🌑, Deep Ocean 🌊, Sakura 🌸, Obsidian Gold ✨, Aurora 🌌, Volcanic 🌋, Arctic ❄️
  - Special: Dim 🌫️, Light ☀️, Default ⬛
- CSS variables injected: `--bg-base`, `--bg-card`, `--bg-elevated`, `--bg-subtle`, `--bg-border`, `--main-text-color`, `--secondary-text-color`, `--accent`
- All card/nav backgrounds use CSS vars — adapts to any theme
- Gradient themes use `background-image` + `background-attachment: fixed`
- Flash-free: theme applied in `layout.js` inline script before React hydration
- Stored in `localStorage` as `{ textColor, bgBase, overallTheme }`
- Theme modal: accessible from Profile → 3-dot menu → Theme
- Scrollable modal with sticky header

### Navigation Changes
- **Bottom nav (mobile)**: Feed / Chat / Post / Truth / Me — 5 icons
- **Discover icon**: moved to top-right of feed greeting area
- **Profile 3-dot menu**: Edit profile / Theme / Log out (replaces gear icon, now in sticky header)
- **Followers/Following**: changed from `<span>` to `<button>` — works on mobile now

### Self-likes fix
- Liking your own post no longer shows in profile Likes tab or triggers notifications
- Fixed in `users.js` `/likes` route: added `AND e.user_id != $1` to 'made' section

### Subtext color system
- Default: `#9CA3AF` (medium-light grey for readability on pure black)
- Per-theme subtext defined in `SUBTEXT_MAP`
- Custom colors auto-generate subtext via HSL (lightness pushed to 75%)
- CSS var `--secondary-text-color` used across all pages

### CSS Variable adoption
All major components use CSS vars for backgrounds:
- `Sidebar.js`, `BottomNav.js` → `var(--bg-base)`
- `feed/page.js`, `reckoning/page.js`, `todos/page.js`, `reckoning/[id]/page.js`, `profile/[id]/page.js`, `chat/[id]/page.js` → `var(--bg-card)`, `var(--bg-border)` etc.

---

## Important Notes
- **GoDaddy** owns `samehere.in` — forwarding `samehere.in` → `https://www.samehere.in`
- Backend API URL in `web/lib/api.js`: `https://samehere-ts2raneh.usw-1.sealos.app`
- WebSocket URL in `web/app/chat/[id]/page.js`: `wss://samehere-ws-ts2raneh.usw-1.sealos.app`
- `dockerhub-secret` permanently patched on all 3 samehere deployments — no more manual patching
- Chat sent bubbles: `var(--bg-elevated)` — no longer white on any theme

---

## User Preferences & Working Style
- Talks casually, types fast with typos — understand intent, don't correct
- Gets frustrated when things don't work immediately
- Says "choppy" to mean FAST/GOOD (not bad) — don't revert optimizations
- Tests everything on localhost first (`npm run dev`) before pushing
- **Frontend deploys**: User builds + pushes Docker image themselves. Claude ONLY restarts the pod.
- **Backend deploys**: Claude does everything — docker build, docker push, kubectl rollout restart
- Likes dark, minimal, aesthetic UI — hates "productivity app" feel
- Wants instant UI (optimistic updates everywhere)
- Iterates a lot on UI — expect multiple rounds of "undo" and "redo"
- Prefers to see options before implementing (e.g. show demo HTML files for animations/styles)
- Demo HTML files saved to: `C:\Users\irfan\OneDrive\Desktop\MIND\` (avatar-demo.html, seal-demo.html, todo-demo.html)

---

## Current State (as of April 2026)
- Everything deployed and live on `samehere.in`
- DEBUG panels removed from both todos and reckoning
- Theme system fully live with 15 themes
- Bottom nav has 5 icons (Discover moved to feed top-right)
- Profile uses 3-dot menu instead of gear icon
- Self-likes excluded from profile Likes tab and notifications

---

## Next Feature: Personal Diary

### Decisions made
- **Storage: server-side (Postgres)** — not localStorage. Same backend, new table + routes.
- Private by architecture — backend routes always filter by authenticated user, no social exposure
- Diary entries never appear in feed, explore, or any shared route

### Mobile app plan (future)
- Target: **Expo (React Native)** — no Android Studio needed, uses Expo Go on phone for dev, EAS cloud build for APK
- Web stays as Next.js; mobile will be a separate Expo frontend hitting the same backend API
- Timeline: build web diary first, ship it, then Expo rewrite of frontend later

### Diary schema (planned)
```sql
diary_entries — id, user_id, title, content, mood, tags[], created_at
```

### What to build
- Backend: new `diary.js` route + `diary_entries` table
- Frontend: `/diary` page + `/diary/[id]` detail page
- Separate from The Reckoning (that's mistakes log — diary is general private journaling)
