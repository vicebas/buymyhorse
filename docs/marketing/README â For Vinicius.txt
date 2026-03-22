Hi Vinicius,

Here is the complete brand and development package for HorseRoster.
Everything you need to implement the platform is in this folder.

─────────────────────────────────────────────────────────────
  THE MOST IMPORTANT THING — READ THIS FIRST
─────────────────────────────────────────────────────────────

The EquiTag QR system is the core feature of the platform.

Each HorseRoster account receives ONE permanent QR code at signup.
This code never changes.

  Example:  horseroster.com/u/12345

The backend uses a redirect table so the user can point
that QR code at different destinations:

  horseroster.com/u/12345  →  horseroster.com/h/bolt-action-z
  horseroster.com/u/12345  →  horseroster.com/barn/oaklane
  horseroster.com/u/12345  →  horseroster.com/trainer/sarah-v

The user controls this from a dashboard section called EquiTag Manager.

When someone scans the QR, they should land on a clean mobile page
at  horseroster.com/s/12345  (the scan landing page), NOT the raw
redirect. This page shows a preview of the horse or barn with a
"View Full Profile" button. It must be public — no login required.

The full database schema, URL routes, and server logic are in:
  04_Reference_Docs/horseroster-dev-handoff.html


─────────────────────────────────────────────────────────────
  WHAT'S IN THIS FOLDER
─────────────────────────────────────────────────────────────

01_Logos/wordmarks/
  All wordmark and lockup SVGs.
  Use horseroster-logo-primary.svg as the default logo everywhere.
  The wordmark weight rule: "Horse" = weight 300, "Roster" = weight 800.

01_Logos/icons/
  The H icon mark at all sizes (64 through 1024).
  Use horseroster-icon.svg as the scalable default.
  The circle variant is for social media avatars.

01_Logos/app-icons/
  App store icon (1024px) and favicons (16px, 32px).

02_Brand_System/
  brand-tokens.css   — paste the :root block into your global CSS.
  brand-tokens.json  — for Figma or Storybook if needed.
  Primary font: DM Sans (Google Fonts, free).
  Mono font: IBM Plex Mono (for IDs, QR codes, metadata).

03_EquiTag/
  EquiTag icon and wordmark SVGs (green variant).
  EquiVault icon and wordmark SVGs (navy-mid variant).

04_Reference_Docs/
  horseroster-dev-handoff.html   — the full spec: components, DB
                                    schema, URL routes, QR generation
                                    code, and file naming. START HERE.
  horseroster-brand-package.html — full brand system visual reference.
  equitag-system.html            — full EquiTag system design doc.


─────────────────────────────────────────────────────────────
  KEY IMPLEMENTATION NOTES
─────────────────────────────────────────────────────────────

1.  QR code must encode the /u/ URL, not the destination URL.
    The destination changes. The QR never does.

2.  Generate the QR code at account creation using the qrcode
    npm package. Use error correction Level H (the QR lives on
    saddle pads — it will get dirty and worn).

3.  The scan landing page (/s/:id) must be SSR and public.
    No login gate before viewing. Fast load on mobile.

4.  Font weight for the wordmark:
      "Horse"  → font-weight: 300
      "Roster" → font-weight: 800
    Both at letter-spacing: -0.04em.

5.  Hunter green (#2D5438) is used sparingly — only for CTAs,
    the crossbar in the H icon, and EquiTag branding.
    Do not use it decoratively.

6.  All SVGs use the DM Sans font-family stack. For fully
    self-contained files (print production), open in Illustrator
    and do Type > Create Outlines before sending to a printer.


─────────────────────────────────────────────────────────────
  COLOUR QUICK REFERENCE
─────────────────────────────────────────────────────────────

  Navy       #0F2A44   Primary brand, headings, UI
  Sand       #E9E3D8   Reversed text, card backgrounds
  Hunter     #2D5438   Accent only — CTAs, H crossbar
  Charcoal   #2B2B2B   Body copy
  Off-White  #F8F6F2   Page background


─────────────────────────────────────────────────────────────
  QUESTIONS
─────────────────────────────────────────────────────────────

If anything needs clarification before you start, just reach out.
The full specs are in the dev-handoff document.

Thank you,
Tyler
