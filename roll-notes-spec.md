# Roll Notes — Claude Code Build Prompt (Final)

Build a responsive web app called **Roll Notes** for film photographers to log and manage their film rolls. The app should work on both desktop and mobile browsers.

---

## Core concept: camera-first organization

The top-level organizational unit is the **camera**. Each camera has its own sequential roll counter. Roll IDs are formatted as `[CameraPrefix]_[RollNumber]` — for example `H500CM_047` or `CG2_012`, zero-padded to 3 digits.

**Duplicate roll numbers** — if a user creates a roll and the Roll ID already exists for that camera, the app displays a warning: *"Roll [ID] already exists for this camera. Create anyway?"* The user can confirm and both rolls will exist with the same ID. This handles real-world logging mistakes without forcing artificial notation.

---

## Preloaded cameras

Ships with these cameras preloaded. User can add, edit, or delete cameras.

| Camera name | Prefix |
|---|---|
| Hasselblad 500cm | H500CM |
| Contax G2 | CG2 |
| Pentax 67ii | P67II |
| Pentax LX | PLX |
| Mamiya RZ | MRZ |
| Mamiya RB | MRB |
| Mamiya 645 Pro | M645PRO |
| Olympus Pen-F | OPNF |

Each camera stores: name, prefix, starting roll number (default 1, user-settable for migration from existing logs), current counter.

---

## Data model — a Roll has these fields

- **Roll ID** — auto-generated, read-only. Format: `PREFIX_NNN`
- **Camera** — selected from camera list
- **Roll Theme** — optional free text (e.g. "Amsterdam March 2026", "The Best Medicine Day 1")
- **Film stock** — selected from preloaded list, with option to add custom stock
- **Fresh or Expired** — toggle: Fresh / Expired. When Expired is selected, two dropdowns appear side by side: Month (Unknown / 01 / 02 / 03 / 04 / 05 / 06 / 07 / 08 / 09 / 10 / 11 / 12) and Year (Unknown / current year descending to 1950). Stored as "Expired 07/2005", "Expired Unknown/2003", "Expired 01/Unknown", or "Expired Unknown/Unknown".
- **Shot at ISO** — dropdown. Options: Box Speed / 6 / 8 / 12 / 16 / 20 / 25 / 32 / 40 / 50 / 64 / 80 / 100 / 125 / 160 / 200 / 250 / 320 / 400 / 500 / 640 / 800 / 1200 / 1600 / 3200 / 6400 / 12800
- **Date loaded** — date picker
- **Location** — searchable dropdown of preloaded cities, plus free text option for anything not in the list
- **Dev/Scan** — free text, optional. The lab that developed and/or scanned the roll (e.g. "Carmencita", "Film Lab Ams", "Bleeker")
- **Notes** — textarea, no character limit, supports multiline

---

## Film stock list

Preloaded and grouped by manufacturer. User can add custom stocks at any time.

### Kodak / Kodak Alaris (current)
Kodak Portra 160, Kodak Portra 400, Kodak Portra 800, Kodak Ektar 100, Kodak Gold 200, Kodak UltraMax 400, Kodak ColorPlus 200, Kodak Pro Image 100, Kodak T-Max 100, Kodak T-Max 400, Kodak Tri-X 400, Kodak Double-X (Cinestill BwXX), Kodak Ektachrome E100

### Ilford / Harman (current)
Ilford HP5 Plus 400, Ilford FP4 Plus 125, Ilford Delta 100, Ilford Delta 400, Ilford Delta 3200, Ilford Pan F Plus 50, Ilford SFX 200, Ilford Ortho Plus 80, Kentmere Pan 100, Kentmere Pan 400, Harman Phoenix 200, Harman Phoenix II, Harman Red 125, Harman Azure Switch

### Fujifilm (current)
Fujifilm 200, Fujifilm 400, Fujifilm Provia 100F, Fujifilm Velvia 50, Fujifilm Velvia 100, Fujifilm Acros II 100

### Fomapan / Foma
Fomapan 100 Classic, Fomapan 200 Creative, Fomapan 400 Action, Fomapan Retropan 320 Soft, Foma Retro 320

### Lomography
Lomography Color Negative 100, Lomography Color Negative 400, Lomography Color Negative 800, Lomography Lady Grey 400, Lomography Earl Grey 100, Lomography Berlin Kino 400, Lomography X-Pro Chrome 100, Lomography Potsdam Kino 100

### Cinestill
Cinestill 50D, Cinestill 400D, Cinestill 800T, Cinestill XX

### Palm
Palm Panchromatic 100, Palm Panchromatic 400

### Other / Specialty
Rollei Retro 80S, Rollei Infrared 400, Ferrania P30 Alpha 80, Ferrania Ortho 50, Bergger Pancro 400, Adox CHS 100 II, Orwo NC500, AgfaPhoto Vista 200, AgfaPhoto Vista 400, Aqua 400, Foto Now 100, Cinemot Amalia 100D, Cinemot Lisboa 1999 500D, Cinemot Fado Superpan 200D, Cinemot Acores 400, Cinemot Coimbra 250D, Retocolor Glow 400, Ferrari Orto 50, Atlanta Film Co. 200T, Atlanta Film Company 500T, Bulk-rolled Double-X

### Legacy / Discontinued (searchable, labeled "discontinued")
Fuji Industrial 100, Fuji Superia 200, Fuji Superia 1600, Fuji Neopan 400, Fuji Pro 400H, Fuji Acros 100, Fuji Provia 100F (legacy), Fuji Velvia 50 (legacy), Fuji Reala 100, Kodak Portra 160NC, Kodak Portra 160VC, Kodak Portra 400NC, Kodak Portra 400VC, Kodak Portra 800 (legacy), Kodak Ektachrome EPP, Kodak Ektachrome EBX, Kodak Vericolor VPS 160, Kodak Vericolor III, Kodak Plus-X Pan 125, Kodak T-Max EI 100, Kodak Gold (legacy), Kodak GB Gold 200, Kodak Farbwelt Allround 400, Ilford Delta 100 (legacy), Konica CT 400, Konica Color 160, Perutz Primera 200, AGFA Vista 200 (legacy), Kentmere Pan 100 (legacy), Cinemot Pessoa 400D

---

## City / location list

Searchable dropdown. Free text always available as fallback for specific venues or unlisted places (e.g. "Studio 13 Amsterdam", "Mimi's studio Amsterdam").

### Primary (weighted toward Wesley's locations)
Amsterdam, Berlin, Paris, Lisbon, Madrid, Oslo, Rome, Tuscany, Sicily, Kyiv, Lviv, Warsaw, Antwerpen, Maastricht, Stein, Elsloo, Durgerdam, Biesbosch, Bergen aan Zee, Berg aan de Maas, Joigny, Loivre, Bemelen, Vroenhoven, Kontiolahti, Belgium

### Secondary (global)
London, New York, Tokyo, Barcelona, Vienna, Prague, Copenhagen, Zurich, Milan, Florence, Venice, Porto, Athens, Istanbul, Marrakech, Cape Town, São Paulo, Buenos Aires, Mexico City, Los Angeles, San Francisco, Chicago, Toronto, Montreal, Sydney, Melbourne, Singapore, Hong Kong, Seoul, Shanghai

---

## App structure

### Camera view (home screen)
- All cameras as cards showing: name, prefix, total rolls logged
- Tap/click a camera to see its rolls
- Add new camera button
- Settings link

### Roll list view (per camera)
- All rolls for that camera, sorted by Roll ID descending (newest first)
- Each row shows: Roll ID, film stock, Fresh/Expired, date loaded, location
- Filter by: All / Fresh / Expired
- Button to add new roll (auto-assigns next ID for that camera)

### Roll detail / edit view
- Roll ID displayed prominently at top, read-only, monospace font
- All other fields editable inline
- Auto-saves to localStorage on every change (debounced 500ms)
- "Last saved" timestamp shown

### Camera settings
- Edit name and prefix
- Set starting roll number (for migrating existing logs)
- Delete camera (with confirmation warning that all rolls for that camera will be deleted)

### Settings page
- Process Photo Club member toggle (stored in localStorage)
- When active: small green "Member" badge appears in nav
- Download CSV import template button

---

## Import

### CSV import (free)
- Import rolls from CSV file
- User selects target camera on import, or CSV includes `camera_prefix` column to auto-route rolls to the correct camera
- Downloadable CSV template with correct column headers and two example rows (one fresh, one expired)
- Duplicate Roll IDs: flagged and skipped with a clear message
- Post-import summary: X rolls imported, Y skipped

**CSV template columns:**
`roll_id, camera_prefix, roll_theme, film_stock, fresh_expired, expiry_date, shot_at_iso, date_loaded, location, dev_scan, notes`

---

## Export

### PDF export — single roll (free)
- Clean single-page PDF of the roll detail
- Only populated fields shown
- Monochrome, field-notes aesthetic
- "Roll Notes / Process" wordmark in footer
- Generated via jsPDF (CDN)

### CSV export — all rolls (Process Photo Club members only)
- Exports all rolls across all cameras as a single CSV
- Same column format as the import template
- Non-members see the button with a lock icon and tooltip: "Process Photo Club members only — join at process.photography"

---

## Design

- Background: `#F9F7F4` (off-white)
- Text: `#1A1A1A`
- Accent: `#C8832A` (warm amber)
- Monospace font for Roll IDs, ISO values, dates, and all technical fields
- System font stack for all other text
- Mobile-first layout, works well on desktop
- Fast, no unnecessary animation
- Member badge: small, green, top-right of nav

---

## Tech stack

- Vanilla HTML, CSS, JavaScript — no framework
- Single `index.html` file or minimal file structure
- All data stored in localStorage — no backend
- PDF export via CDN-loaded jsPDF
- No build step — runs by opening the file or serving from any static host

---

## Things to get right

- Auto-save must be bulletproof — no data loss on tab close
- Roll ID counter must never produce duplicates (except when user explicitly confirms a duplicate)
- CSV import must handle messy real-world data gracefully — skip bad rows, report clearly
- Box Speed must always be the first ISO option regardless of film stock selected
- The Fresh/Expired toggle with month/year dropdowns must be fast and intuitive on mobile
- PDF output must look good when printed

---

## Out of scope for this version

- User accounts or authentication
- Cloud sync
- Per-frame notes (v2)
- Shareable public pages (v2)
- Image uploads (v2)
- Push/pull processing notes beyond the general notes field (v2)

---

## Deliverable

A working, self-contained web app ready to open in a browser and deploy to any static host (Netlify, GitHub Pages, etc.). Include setup and deploy notes in a comment at the top of the main file. Include the CSV template as a downloadable file or hardcoded download within the app.
