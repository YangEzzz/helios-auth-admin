---
version: alpha
name: "Helios Auth"
description: "An account and project access desk with a focused shared sign-in window."
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  primary: "oklch(0.205 0 0)"
  muted: "oklch(0.97 0 0)"
  border: "oklch(0.922 0 0)"
  danger: "oklch(0.577 0.245 27.325)"
typography:
  interface:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
  data:
    fontFamily: "ui-monospace, monospace"
rounded:
  DEFAULT: "0.625rem"
  md: "0.5rem"
  lg: "0.625rem"
spacing:
  panel: "1.5rem"
  control: "0.75rem"
components:
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
---

# Helios design context

## Overview

Helios is a Simplified Chinese account and project access desk for internal teams. The existing sun icon and a compact application identity establish ownership of the shared login window. Authentication is a product flow: keep account, destination application, and the next action legible. Avoid marketing illustrations, decorative security jargon, and a dashboard inside the login popup. No Japan-specific market contract is established.

Runtime tokens remain canonical: `src/style.css` owns CSS variables and Tailwind semantic aliases; `src/assets/themes.css` remaps user themes. This file mirrors those values. Authentication and application configuration reuse Input, Button, Card, Textarea and AlertDialog from `src/components/ui`.

## Colors

Surfaces, borders, text and actions use background, foreground, muted, border and primary utilities. Errors use destructive with text. Themes change palette, not meaning. No new authentication palette is introduced.

## Typography

Use the existing system sans stack for Chinese copy and account names. Application identifiers may use monospace. Headings use restrained semibold weight; wrapping email addresses must remain readable in narrow popups.

## Layout

Shared login uses a single card up to 384px wide, natural document scrolling, and 24px outer spacing. Destination application and account appear above one primary action. Reserve space for inline errors and keep button height fixed while busy. Project access configuration is a natural-height card within project detail.

## Elevation & Depth

Use borders and the existing Card elevation. The login window has no decorative gradient or floating controls. Confirmation overlays reuse AlertDialog.

## Shapes

Reuse shared component radii from `--radius`; do not define local radius tokens.

## Components

Login forms own validation with `novalidate`, labeled inputs, inline errors, correct autocomplete and an accessible password visibility button. Loading and submission are distinct states. Failed authentication preserves email. Network errors offer retry. Application secrets are masked, shown only on creation/rotation, and never persisted in the browser.

## Do's and Don'ts

- Do name the destination application and signed-in account before continuing.
- Do let a user switch account or cancel without managing their project roles.
- Don't send credentials or secrets through redirects or popup messages.
- Don't treat a frontend login flag as proof of a valid server session.
