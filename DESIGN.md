---
version: alpha
name: "Helios Auth"
description: "An account and project access desk with a focused shared sign-in window."
colors:
  background: "#f6f6f7"
  foreground: "#26282c"
  primary: "#292c31"
  muted: "#f0f1f2"
  border: "#e1e3e6"
  danger: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Bahnschrift, Segoe UI, Microsoft YaHei, system-ui, sans-serif"
  interface:
    fontFamily: "Segoe UI, Microsoft YaHei, system-ui, sans-serif"
  data:
    fontFamily: "Consolas, Cascadia Code, ui-monospace, monospace"
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

Helios is a Simplified Chinese identity and project access console for internal teams. The user explicitly requested a full interface redesign on 2026-10-13 and then selected black/white/gray after rejecting the navy/teal palette. The new information architecture remains, with a deliberately monochrome presentation. The visual reference is an operations console: a light graphite navigation frame, white work surfaces and charcoal actions. The signature is the relationship between a softly shaded identity banner, a continuous metrics band and an unboxed operation timeline. Avoid unchanged template layouts, rainbow icons, oversized security ornaments, unreadable faint labels and fictional health/usage charts. No Japan-market contract is established.

Runtime ownership: `src/style.css` owns semantic Tailwind aliases, typography and shared layout classes; `src/assets/themes.css` owns the default `.theme-helios` palette, dark adaptation and persistent navigation tokens. `src/assets/index.css` owns motion definitions imported only by style.css. Color choices remain supported. `use-system-theme` owns the one-time appearance migration: the previous default zinc becomes Helios; other saved color themes are preserved, and future explicit zinc choices are respected.

## Colors

The default content palette is neutral background #f6f6f7, white card #ffffff, foreground #26282c, charcoal action #292c31, muted #f0f1f2, border #e1e3e6, and secondary text #6b6f76. Navigation and identity surfaces use --brand-ink #f0f1f3, --brand-text #26282c, --brand-caption #6b7078, --brand-soft #d4d8dd, --brand-hover #e3e6e9, --brand-border #d9dce0 and --brand-focus #747a83; those variables are owned by style.css and mapped by the sidebar theme adapter. Dark mode uses neutral charcoal surfaces with light gray text. Decorative badges/icons and the sun logo are monochrome; destructive operations and errors retain semantic red. User-selectable color themes remain available, but black/white/gray is the new default.

## Typography

Bahnschrift is the restrained display role for the Helios wordmark and numerical metrics, with Segoe UI / Microsoft YaHei fallbacks for Chinese. Interface copy uses Segoe UI / Microsoft YaHei; identifiers use Consolas / Cascadia Code. No external fonts or font swap. Page headings are 24px mobile / 28px desktop semibold, panel headings 16px semibold, body 14px with readable line-height and utility labels 12px. Avoid 8–10px business copy, excessive uppercase/letter spacing on Chinese, and default black font weight.

## Layout

Desktop sidebar width is adjustable from 220px to 360px, default 264px, and locally persisted. The edge separator supports pointer dragging, arrow keys (10px, Shift 20px), Home/End bounds and double-click/Enter reset. Dragging disables width transitions. Collapse remains 64px; mobile navigation remains 288px.

Desktop navigation defaults to 264px and is adjustable from 220px to 360px; collapsed rail is 64px and mobile Sheet 288px. There is no global top header. Appearance and collapse controls live in the sidebar footer; a compact mobile button opens the navigation drawer. Content has 16px mobile / 32px desktop gutters and a 1560px centered maximum. Keep document scrolling; tables own horizontal overflow. Summary metrics use one continuous divided strip, not independent floating cards. Work panels use 20–24px padding and 24px gaps.

Dashboard: dark account banner, metric strip, task entry links, approval list and chronological activity timeline. Users/approvals: summary strip and a unified directory/filter/table panel. Projects: responsive application-card grid with real identifiers and explicit actions. Detail: separate accessible tabs for members/roles, application integration and project metadata; long configuration forms retain natural height. Profile: account identity column and definition-list details. Administrative authentication uses AuthShell with a 45/55 desktop neutral brand/form split, an identity-to-project relationship illustration built from semantic DOM/icons, and a compact mobile form. Shared SSO popup retains its focused single-card layout.

## Elevation & Depth

A restrained tokenized panel shadow distinguishes white panels from the work surface. No decorative per-row shadows, giant ghost icons or animated scale on static information. Interactive targets use hover/focus/pressed states; motion honors reduced-motion. Loading uses a stable spinner region, error recovery uses QueryError and mutations retain confirmation context.

## Shapes

Use --radius and its shared adapters. Panels use rounded-xl; form fields and actions use rounded-md / rounded-lg. Avoid 24–28px nested cards, mixed pill button styles and one-off radius tokens.

## Components

Each project owns one sign-in configuration. Show project identity as read-only context; do not ask for an application identifier/name or expose an application list/add flow. Local and production return URLs share the same form. Legacy credentials remain compatible while project settings are managed together.

BasicPage/BasicHeader own headings; SidebarInset owns the sole main landmark. SummaryMetrics owns loaded numerical strips. AuthShell owns administrative sign-in/register composition; canonical Input, Textarea, Button, Tabs, Dialog, AlertDialog and Select continue to own interaction behavior. SearchInput owns local filters and immediate clear/focus restoration. Select poppers match their trigger width. Form validations are inline, label-associated and IME-safe. Secrets stay masked, never logged or persisted.

## Do's and Don'ts

- Do present only API-backed counts; unresolved/failed data is not an empty dataset.
- Do keep roles, account status and project access as separate concepts.
- Do preserve operation feedback, confirmation and route-context safeguards through the redesign.
- Don't imply live system health, email verification or external OA workflows without authoritative product evidence.
- Don't send credentials or secrets through redirects, logs or persistent storage.

## 内容点缀色（2026-10-14）

主体保持黑白灰，内容可用少量彩色点缀。info（蓝）用于项目与身份，success（绿）用于完成与启用，warning（琥珀）用于待处理，violet（紫）用于权限或 AI。颜色仅用于图标底、标签、细指标线、进度条和少量重点文字；不铺满卡片、不染色导航和主按钮。src/style.css owns --detail-\* and their dark adapters → data-tone → detail-icon/detail-text/detail-badge/detail-progress shared recipes. Labels/icons always carry the meaning independently of color.

点缀采用鲜明色值而非暗灰色调：蓝 #3b82f6、绿 #10b981、橙 #f59e0b、紫 #8b5cf6。它们用于图标、进度和细标记；说明与状态文字使用 foreground，避免亮色小字在白底上降低可读性。

## 无顶部栏布局（2026-10-14）

按用户要求，Helios 与 Nexus 均不使用全局顶部栏。品牌、主导航、账号、外观设置和桌面折叠控制集中到左侧；主内容直接呈现页面标题和业务区域。手机仅保留一个独立的侧栏打开按钮，保留抽屉焦点与 Escape 行为。文档标题继续跟随路由变化。
