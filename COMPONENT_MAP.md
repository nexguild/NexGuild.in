# NexGuild Component Map

---

## 1. GLOBAL COLOR TOKENS

### CSS Variables — Defined in `src/app/globals.css`

#### Theme: `.theme-gold` (Client · Admin) — lines 35–96

```
--surface-page:    #0D0D0D
Defined in: src/app/globals.css:38
Used for: Page background in gold theme

--surface-card:    #111111
Defined in: src/app/globals.css:39
Used for: Card/panel backgrounds in gold theme

--surface-subtle:  #161616
Defined in: src/app/globals.css:40
Used for: Input backgrounds, hover backgrounds in gold theme

--surface-overlay: rgba(0,0,0,0.82)
Defined in: src/app/globals.css:41
Used for: Modal overlays in gold theme

--glass-bg:        rgba(11,11,11,0.84)
Defined in: src/app/globals.css:42
Used for: Glassmorphism nav backgrounds (.glass-nav)

--glass-border:    rgba(255,255,255,0.07)
Defined in: src/app/globals.css:43
Used for: Glassmorphism nav border

--border-default:  #222222
Defined in: src/app/globals.css:45
Used for: Default border color for cards, dividers, inputs

--border-strong:   #2e2e2e
Defined in: src/app/globals.css:46
Used for: Stronger borders on form inputs

--border-focus:    #F59E0B
Defined in: src/app/globals.css:47
Used for: Focus ring color (gold brand)

--text-primary:    #FFFFFF
Defined in: src/app/globals.css:49
Used for: Main text color

--text-secondary:  rgba(255,255,255,0.62)
Defined in: src/app/globals.css:50
Used for: Subtitles, descriptions, secondary text

--text-muted:      rgba(255,255,255,0.36)
Defined in: src/app/globals.css:51
Used for: Timestamps, placeholder text, muted labels

--text-inverse:    #0D0D0D
Defined in: src/app/globals.css:52
Used for: Text on bright backgrounds (e.g. brand-500 buttons)

--text-link:       #F59E0B
Defined in: src/app/globals.css:53
Used for: Hyperlinks in gold theme

--brand-50:        rgba(245,158,11,0.07)
Defined in: src/app/globals.css:55
Used for: Very subtle brand tints, active nav item backgrounds

--brand-100:       rgba(245,158,11,0.12)
Defined in: src/app/globals.css:56
Used for: Badge backgrounds, light brand fills

--brand-200:       rgba(245,158,11,0.22)
Defined in: src/app/globals.css:57
Used for: Text selection background

--brand-400:       #FCD34D
Defined in: src/app/globals.css:58
Used for: Light brand accent, gradient endpoints

--brand-500:       #F59E0B
Defined in: src/app/globals.css:59
Used for: Primary brand color, CTA buttons, icons, notification dots

--brand-600:       #D97706
Defined in: src/app/globals.css:60
Used for: Button hover states

--brand-700:       #B45309
Defined in: src/app/globals.css:61
Used for: Button active/pressed states

--brand-900:       #78350F
Defined in: src/app/globals.css:62
Used for: Deepest brand shade

--glow-hero: radial-gradient(ellipse 80% 50% at 50% -5%, rgba(245,158,11,0.11) 0%, transparent 70%)
Defined in: src/app/globals.css:64
Used for: Hero section glow overlay (.hero-glow)

--card-shadow:       0 0 0 1px rgba(245,158,11,0.07), 0 4px 20px rgba(0,0,0,0.5)
Defined in: src/app/globals.css:65
Used for: Default card shadow (.card-hover)

--card-shadow-hover: 0 0 0 1px rgba(245,158,11,0.30), 0 12px 36px rgba(245,158,11,0.07), 0 4px 20px rgba(0,0,0,0.6)
Defined in: src/app/globals.css:66
Used for: Card hover shadow (.card-hover:hover)

--success-text:  #4ADE80
Defined in: src/app/globals.css:68
Used for: Success/positive text color

--warning-text:  #FCD34D
Defined in: src/app/globals.css:69
Used for: Warning text

--danger-text:   #F87171
Defined in: src/app/globals.css:70
Used for: Error/danger text, required field asterisks

--info-text:     #60A5FA
Defined in: src/app/globals.css:71
Used for: Informational text

--badge-success-bg:   rgba(74,222,128,0.12) / text: #4ADE80
Defined in: src/app/globals.css:73–74
Used for: Success badge styling

--badge-warning-bg:   rgba(245,158,11,0.12) / text: #FCD34D
Defined in: src/app/globals.css:75–76
Used for: Warning badge styling

--badge-danger-bg:    rgba(239,68,68,0.12) / text: #F87171
Defined in: src/app/globals.css:77–78
Used for: Danger badge styling

--badge-info-bg:      rgba(59,130,246,0.12) / text: #93C5FD
Defined in: src/app/globals.css:79–80
Used for: Info badge styling

--badge-brand-bg:     var(--brand-100) / text: var(--brand-500)
Defined in: src/app/globals.css:81–82
Used for: Brand badge styling

--sidebar-bg:             #0D0D0D
Defined in: src/app/globals.css:84
Used for: Dashboard sidebar background in gold theme

--sidebar-item-hover:     rgba(245,158,11,0.06)
Defined in: src/app/globals.css:85
Used for: Sidebar nav item hover state

--sidebar-item-active:    rgba(245,158,11,0.12)
Defined in: src/app/globals.css:86
Used for: Active sidebar nav item background

--sidebar-text:           rgba(255,255,255,0.56)
Defined in: src/app/globals.css:87
Used for: Sidebar nav item text

--sidebar-text-muted:     rgba(255,255,255,0.28)
Defined in: src/app/globals.css:88
Used for: Sidebar section labels

--sidebar-active-text:    #F59E0B
Defined in: src/app/globals.css:89
Used for: Active sidebar item text color (gold)

--admin-sidebar-bg:       #0D0D0D
Defined in: src/app/globals.css:90
Used for: Admin sidebar background

--admin-sidebar-text:     rgba(255,255,255,0.56)
Defined in: src/app/globals.css:91
Used for: Admin sidebar nav text

--admin-sidebar-text-muted: rgba(255,255,255,0.28)
Defined in: src/app/globals.css:92
Used for: Admin sidebar muted labels

--admin-sidebar-item-hover:  rgba(245,158,11,0.06)
Defined in: src/app/globals.css:93
Used for: Admin sidebar hover background

--admin-sidebar-item-active: rgba(245,158,11,0.12)
Defined in: src/app/globals.css:94
Used for: Admin sidebar active item background

--admin-sidebar-active-text: #F59E0B
Defined in: src/app/globals.css:95
Used for: Admin sidebar active item text
```

#### Theme: `.theme-teal` (Contributor · Dashboard · Auth) — lines 99–163
**⚡ Freecash Style Rich Cyber Navy — Cyber Green accent (#10b981)**

```
--surface-page:    #0a1118
Defined in: src/app/globals.css:103
Used for: Page background — exact dark military slate

--surface-card:    #0e1720
Defined in: src/app/globals.css:104
Used for: Card/panel backgrounds — tactical control panels

--surface-subtle:  #15202c
Defined in: src/app/globals.css:105
Used for: Active panel components, input & hover backgrounds

--surface-overlay: rgba(10,17,24,0.9)
Defined in: src/app/globals.css:106
Used for: Modal overlays

--glass-bg:        rgba(14,23,32,0.85)
Defined in: src/app/globals.css:109
Used for: Glassmorphism nav backgrounds (.glass-nav)

--glass-border:    rgba(142,161,180,0.08)
Defined in: src/app/globals.css:110
Used for: Glassmorphism nav border

--border-default:  #182635
Defined in: src/app/globals.css:113
Used for: Default card/divider borders — subtle dark steel

--border-strong:   #23374d
Defined in: src/app/globals.css:114
Used for: High-contrast input dividers

--border-focus:    #97ec11
Defined in: src/app/globals.css:115
Used for: Focus ring — KGeN signature laser lime

--text-primary:    #ffffff
Defined in: src/app/globals.css:118
Used for: Heavy headlines, primary content

--text-secondary:  #8ea1b4
Defined in: src/app/globals.css:119
Used for: Descriptions, subtitles — muted tactical gray

--text-muted:      #51677d
Defined in: src/app/globals.css:120
Used for: Timestamps, metadata, placeholder text

--text-inverse:    #0a1118
Defined in: src/app/globals.css:121
Used for: Text on neon lime brand buttons

--text-link:       #97ec11
Defined in: src/app/globals.css:122
Used for: Hyperlinks — laser lime

--brand-50:        rgba(151,236,17,0.04)
Defined in: src/app/globals.css:125
Used for: Faintest brand tint backgrounds

--brand-100:       rgba(151,236,17,0.08)
Defined in: src/app/globals.css:126
Used for: Badge backgrounds, subtle neon fills

--brand-200:       rgba(151,236,17,0.15)
Defined in: src/app/globals.css:127
Used for: Text selection, stronger neon tints

--brand-400:       #bdf75c
Defined in: src/app/globals.css:128
Used for: Light lime accent, gradient endpoints

--brand-500:       #97ec11
Defined in: src/app/globals.css:129
Used for: PRIMARY brand color — laser lime CTA buttons, icons, active states

--brand-600:       #80c80e
Defined in: src/app/globals.css:130
Used for: Button hover states

--brand-700:       #6aa70c
Defined in: src/app/globals.css:131
Used for: Button active/pressed states

--brand-900:       #406505
Defined in: src/app/globals.css:132
Used for: Deepest brand shade

--glow-hero: radial-gradient(circle at 50% -20%, rgba(151,236,17,0.12) 0%, transparent 65%)
Defined in: src/app/globals.css:134
Used for: Hero section glow (.hero-glow) — circular top-center

--card-shadow: 0 4px 24px rgba(0,0,0,0.4)
Defined in: src/app/globals.css:135
Used for: Default card shadow (.card-hover) — clean depth only, no lime outline

--card-shadow-hover: 0 0 0 1px rgba(151,236,17,0.25), 0 12px 40px rgba(0,0,0,0.5)
Defined in: src/app/globals.css:136
Used for: Hovered card shadow (.card-hover:hover) — lime ring + deep shadow

--sidebar-bg:          #070d12
Defined in: src/app/globals.css:149
Used for: Dashboard sidebar — deepest tactical blackout

--sidebar-item-hover:  rgba(151,236,17,0.05)
Defined in: src/app/globals.css:150
Used for: Sidebar nav item hover state

--sidebar-item-active: rgba(151,236,17,0.1)
Defined in: src/app/globals.css:151
Used for: Active sidebar nav item background

--sidebar-text:        #8ea1b4
Defined in: src/app/globals.css:152
Used for: Sidebar nav text — tactical gray

--sidebar-text-muted:  #51677d
Defined in: src/app/globals.css:153
Used for: Sidebar section labels — low-profile

--sidebar-active-text: #97ec11
Defined in: src/app/globals.css:154
Used for: Active sidebar item text — laser lime

--admin-sidebar-bg:          #070d12
--admin-sidebar-text:        #8ea1b4
--admin-sidebar-text-muted:  #51677d
--admin-sidebar-item-hover:  rgba(151,236,17,0.05)
--admin-sidebar-item-active: rgba(151,236,17,0.1)
--admin-sidebar-active-text: #97ec11
Defined in: src/app/globals.css:155–160
Used for: Admin sidebar — same tactical palette as contributor sidebar
```

#### Legacy `:root` (legal pages · fallback) — lines 163–222

```
--brand-50:  #EEF2FF / --brand-500: #6366F1 (Indigo)
Defined in: src/app/globals.css:164–171
Used for: Fallback indigo brand colors on legal/public pages

--surface-page:    #F9FAFB  (light gray)
Defined in: src/app/globals.css:173
Used for: Page background on pages without a theme class

--surface-card:    #FFFFFF
Defined in: src/app/globals.css:174
Used for: Card backgrounds on pages without a theme class

--border-default: #E5E7EB
Defined in: src/app/globals.css:180
Used for: Light-mode borders

--text-primary:   #111827  (dark charcoal)
Defined in: src/app/globals.css:184
Used for: Main text in light mode
```

### Tailwind Custom Tokens — Defined in `tailwind.config.ts`

```
Token: brand.50 → brand.900
Value: each maps to var(--brand-50) ... var(--brand-900) respectively
Defined in: tailwind.config.ts:14–21
Used as: bg-brand-500, text-brand-400, border-brand-200, etc.

Token: surface.page / surface.card / surface.subtle / surface.overlay
Value: var(--surface-page) / var(--surface-card) / var(--surface-subtle) / var(--surface-overlay)
Defined in: tailwind.config.ts:23–27
Used as: bg-surface-card, bg-surface-subtle, bg-surface-page

Token: border.DEFAULT / border.strong / border.focus
Value: var(--border-default) / var(--border-strong) / var(--border-focus)
Defined in: tailwind.config.ts:29–33
Used as: border-border (default), border-border-strong, focus:border-border-focus

Token: text.primary / text.secondary / text.muted / text.inverse / text.link
Value: var(--text-primary) ... var(--text-link)
Defined in: tailwind.config.ts:34–40
Used as: text-text-primary, text-text-muted, text-text-secondary

Token: success.50 / success.500 / success.700
Value: #F0FDF4 / #22C55E / #15803D
Defined in: tailwind.config.ts:41–44
Used as: bg-success-50, text-success-500 (static, not CSS variable)

Token: warning.50 / warning.500 / warning.700
Value: #FFFBEB / #F59E0B / #B45309
Defined in: tailwind.config.ts:45–48

Token: danger.50 / danger.500 / danger.700
Value: #FEF2F2 / #EF4444 / #B91C1C
Defined in: tailwind.config.ts:49–52
Used as: bg-danger-500 in Button destructive variant

Token: info.50 / info.500 / info.700
Value: #EFF6FF / #3B82F6 / #1D4ED8
Defined in: tailwind.config.ts:53–56

Spacing Token: sidebar
Value: 240px
Defined in: tailwind.config.ts:102
Used as: w-sidebar, pl-sidebar, left-sidebar (via @layer utilities in globals.css:334–338)

Spacing Token: sidebar-admin
Value: 260px
Defined in: tailwind.config.ts:103
Used as: w-sidebar-admin, pl-sidebar-admin, left-sidebar-admin

Spacing Token: header
Value: 64px
Defined in: tailwind.config.ts:104
Used as: pt-16 (h-16 = 64px) for main content top padding

maxWidth Token: container → 1200px
Defined in: tailwind.config.ts:96
Used as: max-w-container in all header wrappers

maxWidth Token: content → 1100px
Defined in: tailwind.config.ts:97
Used as: max-w-content in AdminShell and DashboardShell main content divs

maxWidth Token: prose → 720px
Defined in: tailwind.config.ts:98

maxWidth Token: form → 440px
Defined in: tailwind.config.ts:99
```

### Component Utility Classes — Defined in `src/app/globals.css`

```
.card-hover (line ~226)
  Adds transition + var(--card-shadow) base, on hover: translateY(-3px) + var(--card-shadow-hover) + brand-500 border

.glass-nav (line ~237)
  background: var(--glass-bg); backdrop-filter: blur(16px); border-bottom: 1px solid var(--glass-border)
  Used by: ClientHeader, ContributorHeader, PublicHeader when scrolled > 48px

.gradient-text (line ~243)
  linear-gradient(135deg, var(--brand-400) 0%, var(--brand-500) 55%, var(--brand-600) 100%) background-clip: text

.hero-glow (line ~250)
  background-image: var(--glow-hero)

.accent-pill (line ~254)
  background: var(--brand-100); color: var(--brand-500); border: 1px solid var(--brand-200)

.animate-marquee (line ~294)
  animation: marquee 28s linear infinite; paused on hover

.fade-slide-up (line ~304)
  animation: fadeSlideUp 0.6s ease both

.section-reveal / .section-reveal.visible (line ~308)
  IntersectionObserver-driven fade+slide pattern

.pl-sidebar (line ~334)       padding-left: 240px
.pl-sidebar-admin (line ~335) padding-left: 260px
.left-sidebar (line ~336)     left: 240px
.left-sidebar-admin (line ~337) left: 260px
.w-sidebar (line ~338)        width: 240px
.w-sidebar-admin (line ~339)  width: 260px
.sidebar-bg (line ~341)       background-color: var(--sidebar-bg)
.admin-sidebar-bg (line ~342) background-color: var(--admin-sidebar-bg)

.scrollbar-thin (line ~323)
  scrollbar-width: thin; scrollbar-color: var(--border-default) transparent
```

---

## 2. COMPONENT FILES

---

```
📄 FILE: src/components/layout/admin-auth-guard.tsx
PURPOSE: Wraps admin pages — verifies admin status via /api/auth/admin-check before rendering children. Redirects non-admins to /admin/login.
EXPORTS: AdminAuthGuard
KEY STYLING:
  - Error container: className="min-h-screen flex items-center justify-center"  (line ~96)
  - Error card inner: className="text-center space-y-4"  (line ~97)
  - Error message: className="text-[var(--text-secondary)]"  (line ~98)
  - Retry button: className="px-4 py-2 rounded-lg bg-[var(--brand-500)] text-white text-sm hover:opacity-90"  (line ~101)
IMPORTS: useRouter, usePathname (next/navigation), supabase (@/lib/supabase)
USED BY: src/app/admin/layout.tsx
```

---

```
📄 FILE: src/components/layout/admin-header.tsx
PURPOSE: Fixed top header for admin section — shows breadcrumbs, search input, and admin user dropdown with logout.
EXPORTS: AdminHeader
KEY STYLING:
  - Header bar: className="h-16 fixed top-0 right-0 left-0 lg:left-sidebar-admin z-30 flex items-center justify-between px-4 sm:px-6 bg-[var(--surface-card)] border-b border-[var(--border-default)]"  (line ~79)
  - Hamburger button: className="lg:hidden h-9 w-9 flex items-center justify-center rounded-md hover:bg-[var(--surface-subtle)] transition-colors"  (line ~84)
  - Breadcrumb text (muted): className="text-[var(--text-muted)]"  (line ~92)
  - Breadcrumb text (active): className="font-semibold text-[var(--text-primary)]"  (line ~96)
  - Search container: className="hidden md:flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] w-56"  (line ~106)
  - Search input: className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"  (line ~111)
  - User dropdown button: className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-[var(--surface-subtle)] transition-colors"  (line ~119)
  - Owner badge: className="hidden sm:block text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400"  (line ~126)
  - Dropdown panel: className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xl overflow-hidden z-50"  (line ~134)
  - Dropdown identity section: className="px-4 py-3 border-b border-[var(--border-default)]"  (line ~136)
  - Dropdown link: className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors"  (line ~151)
  - Logout button: className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"  (line ~166)
IMPORTS: lucide-react (Search, ChevronDown, User, Settings, LogOut, Menu), Avatar (@/components/ui/avatar), usePathname/useRouter (next/navigation), Link (next/link), supabase (@/lib/supabase)
USED BY: src/components/layout/admin-shell.tsx
```

---

```
📄 FILE: src/components/layout/admin-shell.tsx
PURPOSE: Composes AdminSidebar + AdminHeader + main content area for the admin layout.
EXPORTS: AdminShell
KEY STYLING:
  - Main content area: className="pt-16 lg:pl-sidebar-admin"  (line ~14)
  - Inner container: className="p-6 max-w-content"  (line ~15)
IMPORTS: useState (react), AdminSidebar (@/components/layout/admin-sidebar), AdminHeader (@/components/layout/admin-header)
USED BY: src/app/admin/layout.tsx
```

---

```
📄 FILE: src/components/layout/admin-sidebar.tsx
PURPOSE: Fixed left sidebar for admin section — shows logo, nav items with live badge counts (pending submissions, withdrawals, assignments, support tickets), and logout.
EXPORTS: AdminSidebar
KEY STYLING:
  - Mobile backdrop: className="fixed inset-0 z-30 bg-black/60 transition-opacity duration-300 lg:hidden"  (line ~72)
  - Sidebar aside: className="fixed left-0 top-0 bottom-0 w-sidebar-admin flex flex-col z-40 admin-sidebar-bg border-r border-[rgba(255,255,255,0.06)] transition-transform duration-300"  (line ~81–82)
  - Sidebar open: "translate-x-0" / closed: "-translate-x-full lg:translate-x-0"  (line ~84)
  - Logo area: className="h-16 flex items-center justify-between px-4 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0"  (line ~88)
  - Nav: className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin"  (line ~100)
  - Nav item (active): className="flex items-center gap-3 h-10 px-3 rounded-md text-sm font-medium transition-colors duration-150 bg-[var(--admin-sidebar-item-active)] text-[var(--admin-sidebar-active-text)]"  (line ~112)
  - Nav item (inactive): "text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-item-hover)] hover:text-white"  (line ~114)
  - Badge counter: className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--brand-500)] text-white text-xs font-bold px-1"  (line ~120)
  - Footer area: className="px-3 py-4 border-t border-[rgba(255,255,255,0.06)]"  (line ~132)
  - Logout button: className="flex items-center gap-3 h-10 px-3 w-full rounded-md text-sm font-medium text-[var(--admin-sidebar-text)] hover:text-white hover:bg-[var(--admin-sidebar-item-hover)] transition-colors"  (line ~134)
IMPORTS: Link (next/link), usePathname (next/navigation), lucide-react (many icons), cn (@/lib/utils), NexGuildLogo (@/components/ui/nexguild-logo), supabase (@/lib/supabase)
USED BY: src/components/layout/admin-shell.tsx
```

---

```
📄 FILE: src/components/layout/auth-guard.tsx
PURPOSE: Wraps dashboard pages — checks Supabase session and profile status; redirects to /login if unauthenticated or to /earn?banned=1 if account is banned.
EXPORTS: AuthGuard
KEY STYLING: No visible DOM output (returns null or children only)
IMPORTS: useEffect, useState (react), useRouter (next/navigation), supabase (@/lib/supabase)
USED BY: src/app/dashboard/layout.tsx
```

---

```
📄 FILE: src/components/layout/client-header.tsx
PURPOSE: Fixed navigation header for the gold (client/organization) public pages. Includes logo, desktop nav, desktop CTA, and mobile drawer.
EXPORTS: ClientHeader
KEY STYLING:
  - Header (transparent → glass on scroll): className="fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300" + conditionally "glass-nav" or "bg-transparent"  (line ~38–40)
  - Max-width container: className="mx-auto max-w-container px-6 h-full flex items-center justify-between"  (line ~43)
  - Desktop nav link (active): className="px-3 py-2 rounded-md text-sm transition-colors duration-150 text-[#F59E0B] font-medium"  (line ~57)
  - Desktop nav link (inactive): className="text-white/60 hover:text-white hover:bg-white/5"  (line ~58)
  - CTA "Contact Us" button: className="h-9 px-5 inline-flex items-center rounded-lg bg-[#F59E0B] text-[#0D0D0D] text-sm font-semibold hover:bg-[#FCD34D] transition-colors"  (line ~78)
  - Mobile hamburger: className="flex lg:hidden h-9 w-9 items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/5 transition-colors"  (line ~85)
  - Mobile overlay: className="fixed inset-0 z-40 bg-black/60 lg:hidden"  (line ~97)
  - Mobile drawer: className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-full lg:hidden flex flex-col transition-transform duration-300 ease-out bg-[#111111] border-l border-[#222222]"  (line ~105–108)
  - Mobile active link: className="text-[#F59E0B] bg-[rgba(245,158,11,0.08)] font-medium"  (line ~130)
  - Mobile CTA button: className="flex items-center justify-center h-11 px-3 rounded-md text-base font-semibold mt-2 bg-[#F59E0B] text-[#0D0D0D] hover:bg-[#FCD34D] transition-colors"  (line ~148)
IMPORTS: Link (next/link), usePathname (next/navigation), Menu/X (lucide-react), cn (@/lib/utils), NexGuildLogo (@/components/ui/nexguild-logo)
USED BY: src/app/(gold)/layout.tsx
```

---

```
📄 FILE: src/components/layout/contributor-header.tsx
PURPOSE: Fixed navigation header for the teal (contributor/earn) public pages. Mirrors ClientHeader structure but with teal theme colors and different nav links.
EXPORTS: ContributorHeader
KEY STYLING:
  - Header (transparent → glass on scroll): same pattern as ClientHeader  (line ~38–40)
  - Desktop nav link (active): className="text-[#14b8a6] font-medium"  (line ~59)
  - Desktop CTA "Sign Up Free" button: className="h-9 px-5 inline-flex items-center rounded-lg bg-[#14b8a6] text-[#0A1628] text-sm font-semibold hover:bg-[#5eead4] transition-colors"  (line ~84)
  - Mobile drawer: className="bg-[#0d1f38] border-l border-[#1e3a5f]"  (line ~114)
  - Mobile drawer header: border-b border-[#1e3a5f]  (line ~118)
  - Mobile active link: className="text-[#14b8a6] bg-[rgba(20,184,166,0.08)] font-medium"  (line ~136)
  - Mobile divider: className="h-px bg-[#1e3a5f] my-4"  (line ~144)
  - Mobile Sign Up button: className="bg-[#14b8a6] text-[#0A1628] hover:bg-[#5eead4]"  (line ~160)
IMPORTS: Link (next/link), usePathname (next/navigation), Menu/X (lucide-react), cn (@/lib/utils), NexGuildLogo (@/components/ui/nexguild-logo)
USED BY: src/app/(teal)/layout.tsx
```

---

```
📄 FILE: src/components/layout/dashboard-header.tsx
PURPOSE: Fixed top header for the contributor dashboard — shows page title, notification bell with live unread count (Supabase realtime), and user menu with avatar.
EXPORTS: DashboardHeader
KEY STYLING:
  - Header bar: className="h-16 fixed top-0 right-0 left-0 lg:left-sidebar z-30 flex items-center justify-between px-4 sm:px-6 bg-[var(--surface-card)] border-b border-[var(--border-default)]"  (line ~207)
  - Hamburger button: className="lg:hidden h-9 w-9 flex items-center justify-center rounded-md hover:bg-[var(--surface-subtle)] transition-colors"  (line ~210)
  - Page title: className="text-lg font-semibold text-[var(--text-primary)]"  (line ~216)
  - Bell button: className="relative h-9 w-9 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors"  (line ~223)
  - Unread badge: className="absolute top-1 right-1 h-4 min-w-[16px] px-0.5 rounded-full bg-[var(--brand-500)] text-white text-[10px] font-bold flex items-center justify-center leading-none"  (line ~229)
  - Notification dropdown: className="absolute right-0 top-11 w-80 max-h-[480px] flex flex-col rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xl overflow-hidden"  (line ~236)
  - Notification header row: className="px-4 py-3 border-b border-[var(--border-default)] flex items-center justify-between flex-shrink-0"  (line ~237)
  - Notification item (unread): className="bg-[var(--brand-500)]/5"  (line ~267)
  - Unread dot: className="mt-1.5 h-2 w-2 rounded-full bg-[var(--brand-500)] flex-shrink-0"  (line ~270)
  - User menu dropdown: className="absolute right-0 top-11 w-48 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xl overflow-hidden z-50"  (line ~309)
  - Menu links: className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"  (line ~313)
  - Logout button: className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/5 transition-colors"  (line ~329)
  - TYPE_COLORS map: voucher_delivered/announcement/bonus_coins → "text-[var(--brand-500)]"; submission_approved → "text-green-400"; submission_rejected → "text-red-400"; support/new_task → "text-blue-400"; system → "text-[var(--text-secondary)]"
IMPORTS: lucide-react (Bell, ChevronDown, CheckCheck, User, Settings, LogOut, Menu), Avatar (@/components/ui/avatar), Link (next/link), usePathname/useRouter (next/navigation), supabase (@/lib/supabase)
USED BY: src/components/layout/dashboard-shell.tsx
```

---

```
📄 FILE: src/components/layout/dashboard-mobile-nav.tsx
PURPOSE: Fixed bottom navigation bar for mobile dashboard — shows 5 tabs (Home, Opportunities, Tasks, Store, More). Only visible on small screens (lg:hidden).
EXPORTS: DashboardMobileNav
KEY STYLING:
  - Nav bar: className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[var(--surface-card)] border-t border-[var(--border-default)]"  (line ~27)
  - Tab container: className="flex items-center justify-around h-16 px-2"  (line ~28)
  - Tab link (active): className="flex flex-col items-center gap-1 flex-1 py-2 rounded-md transition-colors text-[var(--brand-500)]"  (line ~37)
  - Tab link (inactive): "text-[var(--text-muted)]"  (line ~37)
  - Tab icon (active): strokeWidth={2.5} + fill-current  (line ~41)
  - Tab label: className="text-xs font-medium"  (line ~42)
IMPORTS: Link (next/link), usePathname (next/navigation), lucide-react icons, cn (@/lib/utils)
USED BY: Not directly imported in layouts — intended for dashboard mobile use (referenced by dashboard pattern)
```

---

```
📄 FILE: src/components/layout/dashboard-shell.tsx
PURPOSE: Composes DashboardSidebar + DashboardHeader + main content area for the contributor dashboard layout.
EXPORTS: DashboardShell
KEY STYLING:
  - Main content area: className="pt-16 lg:pl-sidebar"  (line ~14)
  - Inner container: className="p-6 max-w-content"  (line ~15)
IMPORTS: useState (react), DashboardSidebar (@/components/layout/dashboard-sidebar), DashboardHeader (@/components/layout/dashboard-header)
USED BY: src/app/dashboard/layout.tsx
```

---

```
📄 FILE: src/components/layout/dashboard-sidebar.tsx
PURPOSE: Fixed left sidebar for the contributor dashboard — shows logo, main nav items, account items, and logout button.
EXPORTS: DashboardSidebar
KEY STYLING:
  - Mobile backdrop: className="fixed inset-0 z-30 bg-black/60 transition-opacity duration-300 lg:hidden"  (line ~50)
  - Sidebar aside: className="fixed left-0 top-0 bottom-0 w-sidebar flex flex-col z-40 sidebar-bg border-r border-[var(--border-default)] transition-transform duration-300"  (line ~59–61)
  - Open: "translate-x-0" / Closed: "-translate-x-full lg:translate-x-0"  (line ~62–63)
  - Logo area: className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-default)] flex-shrink-0"  (line ~66)
  - Close button (mobile): className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md text-[var(--sidebar-text)] hover:text-white hover:bg-[var(--sidebar-item-hover)] transition-colors"  (line ~70)
  - Nav scroll area: className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin"  (line ~78)
  - Nav item (active): className="flex items-center gap-3 h-10 px-3 rounded-md text-sm font-medium transition-colors duration-150 bg-[var(--sidebar-item-active)] text-[var(--sidebar-active-text)]"  (line ~89–91)
  - Nav item (inactive): "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]"  (line ~92)
  - Section divider: className="h-px bg-[var(--border-default)] my-3"  (line ~103)
  - Logout button: className="flex items-center gap-3 h-10 px-3 w-full rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--danger-text)] hover:bg-[rgba(239,68,68,0.08)] transition-colors"  (line ~134)
IMPORTS: Link (next/link), usePathname (next/navigation), lucide-react (many icons), cn (@/lib/utils), NexGuildLogo (@/components/ui/nexguild-logo), supabase (@/lib/supabase)
USED BY: src/components/layout/dashboard-shell.tsx
```

---

```
📄 FILE: src/components/layout/gold-footer.tsx
PURPOSE: Footer for the gold/client public pages — brand column with social links, Company links, Legal links, Contact column.
EXPORTS: GoldFooter
KEY STYLING:
  - Footer: className="border-t border-[rgba(245,158,11,0.15)] shadow-xl relative overflow-hidden" + style={{ backgroundColor: "#110F0E" }}  (line ~21–23)
  - Radial glow overlay: aria-hidden, opacity-40, radial-gradient rgba(245,158,11,0.05)  (line ~26–31)
  - Content container: className="mx-auto max-w-container px-6 py-14 relative z-10"  (line ~33)
  - Grid: className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4"  (line ~34)
  - Section headings: className="text-xs font-semibold text-stone-500 mb-4 uppercase tracking-wider"  (line ~89)
  - Nav links: className="text-sm text-stone-400 hover:text-[#F59E0B] transition-colors"  (line ~97)
  - Legal links: className="text-sm text-stone-400 hover:text-stone-200 transition-colors"  (line ~118)
  - Social icons: className="h-8 w-8 rounded-md flex items-center justify-center border border-white/10 text-stone-500 hover:text-[#F59E0B] hover:border-[rgba(245,158,11,0.4)] transition-colors"  (line ~56)
  - WhatsApp icon hover: hover:text-[#25D366]
  - Telegram icon hover: hover:text-[#229ED9]
  - Bottom bar: className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"  (line ~168)
  - Copyright: className="text-sm text-stone-500"  (line ~169)
IMPORTS: Link (next/link), Image (next/image)
USED BY: src/app/(gold)/layout.tsx
```

---

```
📄 FILE: src/components/layout/public-header.tsx
PURPOSE: Fixed navigation header for top-level public/earn pages (not gold or teal dedicated). Includes logo, nav, Log In link, Sign Up button, and mobile drawer.
EXPORTS: PublicHeader
KEY STYLING:
  - Header (transparent → glass on scroll): same scroll pattern  (line ~40–42)
  - Desktop nav link (active): className="text-[var(--brand-500)] font-medium"  (line ~59)
  - Desktop nav link (inactive): className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"  (line ~60)
  - Mobile overlay: className="fixed inset-0 z-40 bg-[var(--surface-overlay)] lg:hidden"  (line ~99)
  - Mobile drawer: className="bg-[var(--surface-card)] border-l border-[var(--border-default)]"  (line ~109–110)
  - Mobile active link: className="text-[var(--brand-500)] bg-[var(--brand-50)] font-medium"  (line ~131)
  - Mobile Sign Up: className="bg-[var(--brand-500)] text-[var(--text-inverse)] hover:bg-[var(--brand-600)]"  (line ~149)
IMPORTS: Link (next/link), usePathname (next/navigation), Menu/X (lucide-react), Button (@/components/ui/button), cn (@/lib/utils), NexGuildLogo (@/components/ui/nexguild-logo)
USED BY: Not directly in a layout file (available for standalone public pages)
```

---

```
📄 FILE: src/components/layout/support-button.tsx
PURPOSE: Floating teal circular chat button fixed bottom-right — opens a modal form for contributors to submit a support ticket.
EXPORTS: SupportButton
KEY STYLING:
  - FAB button: className="fixed bottom-24 right-5 lg:bottom-8 lg:right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200" + style={{ backgroundColor: "#14b8a6" }}  (line ~72–74)
  - Modal backdrop: className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60"  (line ~81)
  - Modal card: className="w-full max-w-lg bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] shadow-xl"  (line ~82)
  - Modal header: className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]"  (line ~83)
  - Modal title: className="text-base font-semibold text-[var(--text-primary)]"  (line ~85)
  - Input class (shared): "w-full px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"  (line ~18)
  - Success icon wrapper: className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center"  (line ~96)
  - Error message: className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg"  (line ~134)
IMPORTS: useState (react), lucide-react (MessageCircle, X, Loader2, CheckCircle2), Button (@/components/ui/button), supabase (@/lib/supabase)
USED BY: src/app/dashboard/layout.tsx
```

---

```
📄 FILE: src/components/layout/teal-footer.tsx
PURPOSE: Footer for the teal/contributor public pages — brand column, Community links, Legal links, Support column.
EXPORTS: TealFooter
KEY STYLING:
  - Footer: className="border-t border-[rgba(20,184,166,0.12)] bg-[#06111f]"  (line ~21)
  - Content container: className="mx-auto max-w-container px-6 py-14"  (line ~22)
  - Grid: className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4"  (line ~23)
  - Brand description: className="text-sm text-white/40 leading-relaxed mb-5"  (line ~37)
  - Section headings: className="text-xs font-semibold text-white/25 mb-4 uppercase tracking-wider"  (line ~78)
  - Community links: className="text-sm text-white/45 hover:text-[#14b8a6] transition-colors"  (line ~86)
  - Legal links: className="text-sm text-white/45 hover:text-white/80 transition-colors"  (line ~105)
  - Social icon buttons: className="h-8 w-8 rounded-md flex items-center justify-center border border-white/10 text-white/30 hover:text-[#14b8a6] hover:border-[rgba(20,184,166,0.4)] transition-colors"  (line ~45)
  - Bottom bar divider: className="mt-10 pt-6 border-t border-[rgba(20,184,166,0.08)]"  (line ~157)
  - Copyright: className="text-sm text-white/25"  (line ~158)
IMPORTS: Link (next/link), Image (next/image)
USED BY: src/app/(teal)/layout.tsx
```

---

```
📄 FILE: src/components/ui/ad-banner.tsx
PURPOSE: Injects third-party ad iframe scripts (profitablecpmrate.com) into the DOM as a banner or social bar.
EXPORTS: AdBanner, AdSocialBar
KEY STYLING:
  - AdBanner container: style={{ width, height, overflow: "hidden" }} + optional className prop  (line ~43–45)
  - AdSocialBar: returns null (no visual output of its own)
IMPORTS: useEffect, useRef (react)
USED BY: Dashboard pages that show ads (e.g., offerwall hub)
```

---

```
📄 FILE: src/components/ui/avatar.tsx
PURPOSE: Circular avatar component — shows photo if src provided, otherwise renders initials with a deterministic background color based on name character code.
EXPORTS: Avatar
KEY STYLING:
  - Image avatar wrapper: className="rounded-full overflow-hidden flex-shrink-0 [sizeClass]"  (line ~47)
  - Initials avatar: className="rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-white [sizeClass] [bgColor]"  (line ~56–60)
  - Sizes — sm: "h-8 w-8 text-xs" / md: "h-10 w-10 text-sm" / lg: "h-20 w-20 text-2xl"  (line ~13–15)
  - bgColors pool: "bg-violet-500", "bg-indigo-500", "bg-blue-500", "bg-teal-500", "bg-emerald-500", "bg-amber-500"  (line ~18–25)
IMPORTS: cn (@/lib/utils)
USED BY: DashboardHeader, AdminHeader
```

---

```
📄 FILE: src/components/ui/badge.tsx
PURPOSE: Small inline status badge — variants map to CSS variable colors for success/warning/danger/info/brand/neutral.
EXPORTS: Badge, BadgeVariant (type)
KEY STYLING:
  - Base: className="inline-flex items-center px-2 py-0.5 text-xs font-medium uppercase tracking-wide rounded-full [variantClass]"  (line ~28–33)
  - neutral: "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"  (line ~17)
  - success: "bg-[var(--badge-success-bg)] text-[var(--badge-success-text)]"  (line ~18)
  - warning: "bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)]"  (line ~19)
  - danger:  "bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)]"  (line ~20)
  - info:    "bg-[var(--badge-info-bg)] text-[var(--badge-info-text)]"  (line ~21)
  - brand:   "bg-[var(--badge-brand-bg)] text-[var(--badge-brand-text)]"  (line ~22)
IMPORTS: cn (@/lib/utils)
USED BY: OpportunityCard, dashboard task pages, admin task pages
```

---

```
📄 FILE: src/components/ui/button.tsx
PURPOSE: Universal button component with variants (primary/secondary/ghost/destructive) and sizes (sm/md/lg). Supports asChild via Radix Slot and loading spinner.
EXPORTS: Button
KEY STYLING:
  - Base: "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1 active:scale-[0.98]"  (line ~62–67)
  - primary: "bg-[var(--brand-500)] text-white border-transparent hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] disabled:opacity-50"  (line ~18–21)
  - secondary: "bg-transparent text-[var(--brand-600)] border border-[var(--border-default)] hover:bg-[var(--brand-50)] disabled:opacity-50"  (line ~22–25)
  - ghost: "bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] disabled:opacity-50"  (line ~26–29)
  - destructive: "bg-danger-500 text-white border-transparent hover:bg-danger-700 disabled:opacity-50"  (line ~30–33)
  - sm: "h-8 px-3 text-sm rounded"  (line ~41)
  - md: "h-9 px-4 text-sm rounded-md"  (line ~42)
  - lg: "h-11 px-6 text-base rounded-md"  (line ~43)
IMPORTS: cn (@/lib/utils), Slot (@radix-ui/react-slot), Loader2 (lucide-react)
USED BY: SupportButton, ContactForm, OpportunityCard, public-header, many page components
```

---

```
📄 FILE: src/components/ui/card.tsx
PURPOSE: Card container component with optional padding variants. Also exports CardHeader, CardTitle, CardDescription sub-components.
EXPORTS: Card, CardHeader, CardTitle, CardDescription
KEY STYLING:
  - Card: className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] [paddingClass]"  (line ~18–21)
  - padding none: "" / sm: "p-4" / md: "p-6" / lg: "p-8"  (line ~8–12)
  - CardHeader: className="mb-4"  (line ~32)
  - CardTitle: className="text-xl font-semibold text-[var(--text-primary)]"  (line ~40)
  - CardDescription: className="text-sm text-[var(--text-secondary)] mt-1"  (line ~50)
IMPORTS: cn (@/lib/utils)
USED BY: Various dashboard and admin pages
```

---

```
📄 FILE: src/components/ui/contact-form.tsx
PURPOSE: Multi-field enquiry form for organizations — collects name, email, company, project type, budget, timeline, message. Posts to /api/contact.
EXPORTS: ContactForm
KEY STYLING:
  - Form: className="space-y-5"  (line ~89)
  - Input fields: className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"  (line ~101, ~114)
  - Select fields: same className as inputs  (line ~136, ~147, ~158)
  - Textarea: className="w-full px-3 py-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent resize-y min-h-[120px]"  (line ~176)
  - Label: className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"  (line ~92)
  - Required star: className="text-[var(--brand-500)]"  (line ~93)
  - Error: className="text-sm text-red-400 rounded-md bg-red-500/10 px-4 py-3"  (line ~181)
  - Success icon wrapper: className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center"  (line ~71)
IMPORTS: useState (react), Button (@/components/ui/button), lucide-react (Send, CheckCircle, Loader2)
USED BY: src/app/(gold)/contact/page.tsx
```

---

```
📄 FILE: src/components/ui/fade-in.tsx
PURPOSE: IntersectionObserver-based wrapper that fades+slides children into view when they enter the viewport.
EXPORTS: FadeIn
KEY STYLING:
  - Wrapper div style (invisible): opacity: 0, transform: "translateY(22px)", transition: 0.7s cubic-bezier(0.16,1,0.3,1) with delay prop
  - Wrapper div style (visible): opacity: 1, transform: "translateY(0)"
IMPORTS: useEffect, useRef, useState (react), cn (@/lib/utils)
USED BY: Public marketing pages for scroll animations
```

---

```
📄 FILE: src/components/ui/nexguild-logo.tsx
PURPOSE: Inline SVG NexGuild logo with three variants: "navbar" (small icon + text), "landing" (large SVG icon + text), "footer" (wide SVG with tagline). Accent color switches between gold (#F59E0B) and teal (#14b8a6) based on theme prop.
EXPORTS: NexGuildLogo
KEY STYLING:
  - navbar variant: inline-flex, gap 8px, SVG 42×40, text span: fontWeight 900, fontSize 20px, color #ffffff; "Guild" tspan: color = accent  (line ~61–75)
  - landing variant: SVG 180×95, text "NexGuild" fill #ffffff with Guild in accent  (line ~26–49)
  - footer variant: SVG 190×55, includes tagline "DIGITAL WORKFORCE"  (line ~79–113)
  - accent: gold = "#F59E0B" / teal = "#14b8a6"  (line ~16)
IMPORTS: Link (next/link)
USED BY: AdminSidebar, DashboardSidebar, AdminHeader, ClientHeader, ContributorHeader, PublicHeader, AuthLayout
```

---

```
📄 FILE: src/components/ui/opportunity-card.tsx
PURPOSE: Card displaying a single task/opportunity with type badge, payout, title, description, time estimate, skill level, and optional CTA button.
EXPORTS: OpportunityCard
KEY STYLING:
  - Card container: className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col p-5 transition-colors hover:border-[var(--border-strong)]"  (line ~60–64)
  - Payout text: className="text-base font-bold text-[var(--success-text)] whitespace-nowrap"  (line ~68)
  - Title: className="text-base font-semibold text-[var(--text-primary)] mb-1 line-clamp-1"  (line ~73)
  - Description: className="text-sm text-[var(--text-secondary)] line-clamp-2 flex-1 mb-4"  (line ~76)
  - Meta icons/text: className="flex items-center gap-3 text-xs text-[var(--text-muted)]"  (line ~81)
  - Login required text: className="text-xs text-[var(--text-muted)] italic"  (line ~99)
IMPORTS: Badge (@/components/ui/badge), Button (@/components/ui/button), lucide-react (Clock, Users), cn (@/lib/utils), Link (next/link)
USED BY: Dashboard opportunities page, public opportunities page
```

---

```
📄 FILE: src/components/ui/scroll-reset.tsx
PURPOSE: Invisible utility component — resets scroll position to top on route changes.
EXPORTS: ScrollReset
KEY STYLING: No DOM output (returns null)
IMPORTS: useEffect (react), usePathname (next/navigation)
USED BY: src/app/layout.tsx (root layout)
```

---

```
📄 FILE: src/components/ui/scroll-to-top.tsx
PURPOSE: Floating scroll-to-top button that appears after scrolling 300px. Color switches between teal (#14b8a6) and gold (#F59E0B) based on current route.
EXPORTS: ScrollToTop
KEY STYLING:
  - Button (visible): position fixed, bottom 24px, right 24px, zIndex 9999, width/height 40px, borderRadius 50%, backgroundColor = color, opacity 1, transform "translateY(0) scale(1)"  (line ~36–50)
  - Button (hidden): opacity 0, transform "translateY(8px) scale(0.9)", pointerEvents none
  - teal routes: /earn*, /dashboard*, /opportunities*, /how-it-works, /faq → color "#14b8a6"  (line ~12–16)
  - gold/default routes → color "#F59E0B"  (line ~18)
IMPORTS: useEffect, useState (react), usePathname (next/navigation), ArrowUp (lucide-react)
USED BY: src/app/layout.tsx (root layout)
```

---

```
📄 FILE: src/components/ui/stat-card.tsx
PURPOSE: Stat display card with label, large value, optional icon, and optional trend indicator.
EXPORTS: StatCard
KEY STYLING:
  - Card container: className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-5"  (line ~17–19)
  - Label: className="text-sm text-[var(--text-secondary)] font-medium"  (line ~23)
  - Value: className="text-2xl font-bold text-[var(--text-primary)] mt-1 truncate"  (line ~24)
  - Trend (up): className="text-xs mt-1 font-medium text-[var(--success-text)]"  (line ~28)
  - Trend (neutral): className="text-xs mt-1 font-medium text-[var(--text-muted)]"  (line ~29)
  - Icon wrapper: className="ml-3 flex-shrink-0 text-[var(--text-muted)]"  (line ~37)
IMPORTS: cn (@/lib/utils)
USED BY: Admin overview page, dashboard home page
```

---

## 3. LAYOUT FILES

---

```
📄 FILE: src/app/layout.tsx
PURPOSE: Root Next.js layout — wraps entire app. Sets global metadata, imports globals.css, adds ScrollReset and ScrollToTop.
KEY STRUCTURE:
  - <html lang="en">
      <body>
        <ScrollReset />
        {children}
        <ScrollToTop />
      </body>
    </html>
KEY STYLING:
  - No className on html or body in JSX — base styles come from globals.css body rule: background-color: #0D0D0D; color: var(--text-primary)  (globals.css line ~17–20)
IMPORTS COMPONENTS: ScrollReset, ScrollToTop
CHILDREN PAGES: All routes (root)
```

---

```
📄 FILE: src/app/(auth)/layout.tsx
PURPOSE: Auth route group layout (login, signup, forgot-password) — applies theme-teal, centers content vertically.
KEY STRUCTURE:
  - <div className="theme-teal min-h-screen bg-[var(--surface-page)] flex flex-col">
      <div className="absolute top-4 left-4 z-50"> NexGuildLogo </div>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        {children}
      </div>
      <p className="text-center text-xs text-[var(--text-muted)] pb-6">© year NexGuild</p>
    </div>
KEY STYLING:
  - Outer: className="theme-teal min-h-screen bg-[var(--surface-page)] flex flex-col"  (line ~5)
  - Logo position: className="absolute top-4 left-4 z-50"  (line ~7)
  - Content area: className="flex-1 flex items-center justify-center px-4 py-16"  (line ~10)
  - Footer text: className="text-center text-xs text-[var(--text-muted)] pb-6"  (line ~13)
IMPORTS COMPONENTS: NexGuildLogo
CHILDREN PAGES: (auth)/forgot-password, (auth)/login, (auth)/signup
```

---

```
📄 FILE: src/app/(gold)/layout.tsx
PURPOSE: Gold/client route group layout — applies theme-gold, wraps with ClientHeader and GoldFooter.
KEY STRUCTURE:
  - <div className="theme-gold min-h-screen bg-[var(--surface-page)]">
      <ClientHeader />
      <main className="pt-16">{children}</main>
      <GoldFooter />
    </div>
KEY STYLING:
  - Outer: className="theme-gold min-h-screen bg-[var(--surface-page)]"  (line ~6)
  - Main: className="pt-16" (clears the 64px fixed header)  (line ~8)
IMPORTS COMPONENTS: ClientHeader, GoldFooter
CHILDREN PAGES: (gold)/about, (gold)/client, (gold)/client/cookie-policy, (gold)/client/how-it-works, (gold)/client/privacy, (gold)/client/terms, (gold)/contact, (gold)/for-organizations, (gold)/services
```

---

```
📄 FILE: src/app/(teal)/layout.tsx
PURPOSE: Teal/contributor route group layout — applies theme-teal, wraps with ContributorHeader and TealFooter.
KEY STRUCTURE:
  - <div className="theme-teal min-h-screen bg-[var(--surface-page)]">
      <ContributorHeader />
      <main className="pt-16">{children}</main>
      <TealFooter />
    </div>
KEY STYLING:
  - Outer: className="theme-teal min-h-screen bg-[var(--surface-page)]"  (line ~6)
  - Main: className="pt-16"  (line ~8)
IMPORTS COMPONENTS: ContributorHeader, TealFooter
CHILDREN PAGES: (teal)/earn, (teal)/earn/about, (teal)/earn/contact, (teal)/earn/cookies, (teal)/earn/privacy, (teal)/earn/terms, (teal)/faq, (teal)/how-it-works, (teal)/opportunities
```

---

```
📄 FILE: src/app/admin/layout.tsx
PURPOSE: Admin section layout — applies theme-gold, wraps AdminShell inside AdminAuthGuard for role verification.
KEY STRUCTURE:
  - <AdminAuthGuard>
      <div className="theme-gold min-h-screen bg-[var(--surface-page)]">
        <AdminShell>{children}</AdminShell>
      </div>
    </AdminAuthGuard>
KEY STYLING:
  - Outer: className="theme-gold min-h-screen bg-[var(--surface-page)]"  (line ~7)
IMPORTS COMPONENTS: AdminShell, AdminAuthGuard
CHILDREN PAGES: admin/announcements, admin/assignments, admin/contributors, admin/contributors/[id], admin/finances, admin/login, admin/offerwalls, admin/page, admin/projects, admin/projects/new, admin/settings, admin/submissions, admin/support, admin/tasks, admin/tasks/[id], admin/tasks/[id]/edit, admin/tasks/new, admin/voucher-catalog, admin/vouchers, admin/withdrawals
```

---

```
📄 FILE: src/app/dashboard/layout.tsx
PURPOSE: Contributor dashboard layout — applies theme-teal, wraps DashboardShell inside AuthGuard for session verification. Includes floating SupportButton.
KEY STRUCTURE:
  - <AuthGuard>
      <div className="theme-teal min-h-screen bg-[var(--surface-page)]">
        <DashboardShell>{children}</DashboardShell>
        <SupportButton />
      </div>
    </AuthGuard>
KEY STYLING:
  - Outer: className="theme-teal min-h-screen bg-[var(--surface-page)]"  (line ~8)
IMPORTS COMPONENTS: DashboardShell, AuthGuard, SupportButton
CHILDREN PAGES: dashboard/announcements, dashboard/community, dashboard/earnings, dashboard/offerwalls, dashboard/opportunities, dashboard/page, dashboard/profile, dashboard/settings, dashboard/store, dashboard/support, dashboard/tasks, dashboard/tasks/[id], dashboard/tasks/[id]/submit, dashboard/tasks/[id]/work, dashboard/vouchers, dashboard/wallet
```

---

## 4. PUBLIC ASSETS

```
public/nexguild_logo_final.png
  Full NexGuild logo PNG image, used in GoldFooter and TealFooter (Next.js Image component, width 160 height 52)

public/favicon.svg
  SVG favicon — referenced in root layout metadata as icon and shortcut

public/apple-touch-icon.svg
  SVG apple touch icon — referenced in root layout metadata

public/robots.txt
  SEO robots crawl instructions file

public/sitemap.xml
  XML sitemap for search engine indexing
```

---

## 5. LIB FILES

```
src/lib/utils.ts
  Purpose: Utility helpers — cn() for merging Tailwind classes (clsx + tailwind-merge), formatCurrency(), formatDate(), timeAgo()

src/lib/supabase.ts
  Purpose: Browser-side Supabase singleton client with realtime enabled (eventsPerSecond: 10). Safe to import in any client component.

src/lib/supabase-server.ts
  Purpose: Server-side Supabase admin client using SUPABASE_SERVICE_ROLE_KEY. Only for Route Handlers / Server Components — never expose to browser.

src/lib/email.ts
  Purpose: HTML email template functions using Resend — exports welcomeHtml, taskApprovedHtml, taskRejectedHtml, assignmentApprovedHtml, assignmentRejectedHtml, newTaskHtml, accountBannedHtml, coinsReceivedHtml, coinsDeductedHtml, resubmissionRequestedHtml, announcementHtml.

src/lib/vouchers.ts
  Purpose: Static voucher catalog data — exports VOUCHERS array (Amazon, Flipkart, Google Play, Zomato gift cards with coin costs) and BRAND_META map (emoji + bg/text Tailwind classes per brand).
```

---

## 6. PAGE FILES

```
src/app/page.tsx
  Purpose: Split-screen landing page — left gold panel for organizations (/client), right teal panel for contributors (/earn). Uses framer-motion animations and inline CSS-in-JS styles. No Tailwind — fully inline styles.

src/app/(auth)/login/page.tsx
  Purpose: Supabase email+password login form for contributors

src/app/(auth)/signup/page.tsx
  Purpose: Contributor registration form with Supabase auth

src/app/(auth)/forgot-password/page.tsx
  Purpose: Password reset email request form

src/app/(gold)/client/page.tsx
  Purpose: Client/organization landing page (gold theme)

src/app/(gold)/client/how-it-works/page.tsx
  Purpose: How NexGuild works for organizations

src/app/(gold)/about/page.tsx
  Purpose: About NexGuild company page (gold theme)

src/app/(gold)/contact/page.tsx
  Purpose: Contact page with ContactForm component for organizations

src/app/(gold)/services/page.tsx
  Purpose: NexGuild services offered to organizations

src/app/(gold)/for-organizations/page.tsx
  Purpose: For-organizations marketing/services page

src/app/(gold)/client/terms/page.tsx
  Purpose: Terms of Service for client/organization users

src/app/(gold)/client/privacy/page.tsx
  Purpose: Privacy Policy for client users

src/app/(gold)/client/cookie-policy/page.tsx
  Purpose: Cookie Policy for client users

src/app/(teal)/earn/page.tsx
  Purpose: Contributor home/landing page (teal theme)

src/app/(teal)/earn/about/page.tsx
  Purpose: About NexGuild for contributors

src/app/(teal)/earn/contact/page.tsx
  Purpose: Contact page for contributors

src/app/(teal)/earn/terms/page.tsx
  Purpose: Terms of Service for contributors

src/app/(teal)/earn/privacy/page.tsx
  Purpose: Privacy Policy for contributors

src/app/(teal)/earn/cookies/page.tsx
  Purpose: Cookie Policy for contributors

src/app/(teal)/opportunities/page.tsx
  Purpose: Browse available earning opportunities (public, shows OpportunityCard components)

src/app/(teal)/how-it-works/page.tsx
  Purpose: How NexGuild works for contributors

src/app/(teal)/faq/page.tsx
  Purpose: Frequently asked questions for contributors

src/app/auth/callback/page.tsx
  Purpose: Supabase OAuth callback handler page

src/app/dashboard/page.tsx
  Purpose: Contributor dashboard home — overview stats, recent tasks, earnings summary

src/app/dashboard/opportunities/page.tsx
  Purpose: Browse available tasks/opportunities inside dashboard

src/app/dashboard/tasks/page.tsx
  Purpose: My Tasks list — active, submitted, completed tasks

src/app/dashboard/tasks/[id]/page.tsx
  Purpose: Individual task detail view

src/app/dashboard/tasks/[id]/work/page.tsx
  Purpose: Task work submission workspace

src/app/dashboard/tasks/[id]/submit/page.tsx
  Purpose: Submission confirmation/proof upload page

src/app/dashboard/offerwalls/page.tsx
  Purpose: Offerwall Hub — third-party offer walls via AdBanner

src/app/dashboard/earnings/page.tsx
  Purpose: Earnings history and NexCoin balance page

src/app/dashboard/wallet/page.tsx
  Purpose: NexCoins wallet view

src/app/dashboard/store/page.tsx
  Purpose: Voucher store — browse and redeem NexCoins for gift vouchers (uses VOUCHERS from lib/vouchers.ts)

src/app/dashboard/vouchers/page.tsx
  Purpose: My redeemed vouchers list

src/app/dashboard/community/page.tsx
  Purpose: Community leaderboard/social page

src/app/dashboard/announcements/page.tsx
  Purpose: Platform announcements list

src/app/dashboard/support/page.tsx
  Purpose: Support ticket list and messaging

src/app/dashboard/profile/page.tsx
  Purpose: Contributor profile edit page with avatar upload

src/app/dashboard/settings/page.tsx
  Purpose: Account settings (notifications, security)

src/app/admin/page.tsx
  Purpose: Admin overview dashboard with platform stats

src/app/admin/login/page.tsx
  Purpose: Admin login form (separate from contributor login)

src/app/admin/contributors/page.tsx
  Purpose: Contributors management list

src/app/admin/contributors/[id]/page.tsx
  Purpose: Individual contributor detail view

src/app/admin/tasks/page.tsx
  Purpose: Tasks management list

src/app/admin/tasks/new/page.tsx
  Purpose: Create new task form

src/app/admin/tasks/[id]/page.tsx
  Purpose: Task detail view for admin

src/app/admin/tasks/[id]/edit/page.tsx
  Purpose: Edit existing task form

src/app/admin/projects/page.tsx
  Purpose: Projects management list

src/app/admin/projects/new/page.tsx
  Purpose: Create new project form

src/app/admin/submissions/page.tsx
  Purpose: Review and approve/reject contributor submissions

src/app/admin/assignments/page.tsx
  Purpose: Review and approve/reject task assignment requests

src/app/admin/offerwalls/page.tsx
  Purpose: Manage offerwall integrations

src/app/admin/vouchers/page.tsx
  Purpose: Manage pending voucher redemption requests

src/app/admin/voucher-catalog/page.tsx
  Purpose: Manage the voucher catalog items

src/app/admin/announcements/page.tsx
  Purpose: Create and manage platform announcements

src/app/admin/support/page.tsx
  Purpose: Admin support ticket management/reply interface

src/app/admin/finances/page.tsx
  Purpose: Financial overview and reporting

src/app/admin/settings/page.tsx
  Purpose: Admin/platform settings

src/app/admin/withdrawals/page.tsx
  Purpose: Voucher redemption/withdrawal management

src/app/maintenance/page.tsx
  Purpose: Generic maintenance mode page

src/app/maintenance/[section]/page.tsx
  Purpose: Section-specific maintenance page
```

---

## 6. API ROUTES

```
src/app/api/admin/announcements/route.ts
  Purpose: GET/POST admin announcements — list and create platform-wide announcements

src/app/api/admin/assignments/route.ts
  Purpose: GET admin assignments — list pending task assignment requests

src/app/api/admin/contributors/route.ts
  Purpose: GET contributors list with pagination and filters

src/app/api/admin/contributors/[id]/route.ts
  Purpose: GET/PATCH individual contributor — view profile and update status/role

src/app/api/admin/coupons/route.ts
  Purpose: GET/POST coupon codes for the store discount system

src/app/api/admin/deduct-coins/route.ts
  Purpose: POST deduct NexCoins from a contributor's balance with reason + email notification

src/app/api/admin/deliver-voucher/route.ts
  Purpose: POST mark a voucher request as delivered and send voucher code to contributor

src/app/api/admin/projects/route.ts
  Purpose: GET/POST admin projects management

src/app/api/admin/reply-ticket/route.ts
  Purpose: POST reply to a support ticket from admin

src/app/api/admin/review-assignment/route.ts
  Purpose: POST approve or reject a task assignment request with email notification

src/app/api/admin/review-submission/route.ts
  Purpose: POST approve or reject a task submission with coins award and email notification

src/app/api/admin/send-coins/route.ts
  Purpose: POST send bonus NexCoins to a contributor with reason + email notification

src/app/api/admin/settings/route.ts
  Purpose: GET/POST admin platform settings (e.g. maintenance mode, feature flags)

src/app/api/admin/stats/route.ts
  Purpose: GET aggregated platform statistics for admin dashboard overview

src/app/api/admin/submissions/route.ts
  Purpose: GET list of pending/all contributor task submissions

src/app/api/admin/task-analytics/route.ts
  Purpose: GET per-task analytics (submission counts, approval rates)

src/app/api/admin/tasks/route.ts
  Purpose: GET/POST admin task management — list and create tasks

src/app/api/admin/voucher-availability/route.ts
  Purpose: GET/POST toggle voucher type availability in the store

src/app/api/admin/voucher-catalog/route.ts
  Purpose: GET/POST/PATCH manage voucher catalog items

src/app/api/auth/admin-check/route.ts
  Purpose: POST verify if the provided Supabase access token belongs to an admin/owner role

src/app/api/auth/welcome/route.ts
  Purpose: POST send welcome email to newly registered contributor (called after signup)

src/app/api/contact/route.ts
  Purpose: POST handle organization contact form submissions (sends email via Resend)

src/app/api/contributor-contact/route.ts
  Purpose: POST handle contributor contact form submissions

src/app/api/store/apply-coupon/route.ts
  Purpose: POST validate and apply a discount coupon code to a cart

src/app/api/store/redeem-cart/route.ts
  Purpose: POST process voucher redemption — deduct NexCoins, create voucher request records

src/app/api/support/create-ticket/route.ts
  Purpose: POST create a new support ticket from authenticated contributor

src/app/api/support/send-message/route.ts
  Purpose: POST send a message on an existing support ticket thread
```
