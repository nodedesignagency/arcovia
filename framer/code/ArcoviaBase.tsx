/**
 * Arcovia: shared base for every Arcovia code component.
 *
 * Holds the design tokens (colour, type, spacing, radius, shadows, motion), the
 * resets the HTML site put on html/body (scoped to the .arc wrapper here), the
 * shared parts (chip, buttons, logo, seam), Montserrat, the icon sprite and the
 * small runtime helpers the components use to start and clean up their scripts.
 *
 * Source of truth: site/styles.css on main. Tokens also exist as Framer colour
 * and text styles for canvas work.
 */
import * as React from "react"
import { RenderTarget } from "framer"

/** Images uploaded to this Framer project */
export const ASSETS = {
    "concrete": "https://framerusercontent.com/images/wTpvZWjYdsGuNNesJpmLSgRLFm4.jpg",
    "concreteCast": "https://framerusercontent.com/images/suaPi971EUCdkfkwmmjXeBAKEY.jpg",
    "globeLand": "https://framerusercontent.com/images/JcquvXbB7yqTXs4ZBWRvepD6A.png",
    "globeRelief": "https://framerusercontent.com/images/KvX3JESf3PCuIGYoFajSTRsWjHY.jpg",
    "colin": "https://framerusercontent.com/images/DtKi1LyiPlKw9iURrzlmMbnaWGU.jpg",
    "caroline": "https://framerusercontent.com/images/lMEo8kIeXkS8fl4T9muGSaKZDgw.jpg",
    "portraitPlaceholder": "https://framerusercontent.com/images/r8kxm1YQ4DJVEiAcov8OXpleY8I.svg",
    "aMark": "https://framerusercontent.com/images/J3u6tNxZ0wrasSgM4dps2eaA5s.svg"
}

export const FONT_URL = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap"

export const TOKENS_CSS = `/* ---------- Tokens ---------- */
:root {
  /* Colour: monochrome, sampled from the October deck */
  --color-concrete: #d3d3d3;
  --color-concrete-light: #e3e3e2;
  --color-concrete-shade: #c2c2c2;
  --color-charcoal: #565656;
  --color-charcoal-deep: #3e3e3e;
  --color-black: #0b0b0b;          /* black sections (why founders choose Arcovia) */
  /* Text: a deep ink so type doesn't sink into the concrete.
     The softer set we had before is kept below as data-ink="soft" (or ?ink=soft). */
  --color-ink: #151515;            /* headlines, nav */
  --color-text: #222222;           /* body */
  --color-text-muted: #3a3a3a;     /* small text and labels */
  --color-white: #ffffff;          /* cards */
  --color-well: #f2f2f2;           /* inset number wells inside cards */
  --color-line: rgba(43, 43, 43, 0.14);
  --color-on-dark: #f4f4f3;
  --color-on-dark-muted: rgba(244, 244, 243, 0.72);

  /* Type: Montserrat stands in for Gotham until the licence is bought */
  --font-sans: "Montserrat", "Helvetica Neue", Arial, sans-serif;
  --weight-book: 400;
  --weight-medium: 500;
  --weight-semibold: 600;

  --fs-hero: 76px;    --lh-hero: 1.02;   --ls-hero: -0.028em;
  --fs-h2: 48px;      --lh-h2: 1.08;     --ls-h2: -0.022em;
  --fs-h3: 26px;      --lh-h3: 1.2;      --ls-h3: -0.012em;
  --fs-lede: 20px;    --lh-lede: 1.5;
  --fs-body: 17px;    --lh-body: 1.6;
  --fs-small: 14px;   --lh-small: 1.5;
  --fs-nav: 15px;
  --fs-caps: 12px;    --ls-caps: 0.18em;

  /* Spacing: 4px base */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
  --space-10: 128px;
  --space-11: 160px;

  /* Layout */
  --container-max: 1520px;
  --gutter: 40px;
  --grid-gap: 24px;

  /* Radius */
  --radius-s: 8px;
  --radius-m: 14px;
  --radius-l: 22px;
  --radius-pill: 999px;

  /* Elevation: white cards floating on concrete, as in the deck */
  --shadow-card: 0 0 0 1px rgba(255, 255, 255, 0.7) inset, 0 1px 2px rgba(0, 0, 0, 0.06), 0 10px 30px -8px rgba(0, 0, 0, 0.14);
  --shadow-pop: 0 1px 2px rgba(0, 0, 0, 0.08), 0 18px 48px -12px rgba(0, 0, 0, 0.28);
  /* Menus and popovers: soft and even on every side (after the user's reference) */
  --shadow-menu:
    0 0 0 1px rgba(17, 17, 17, 0.06),
    0 2px 4px -1px rgba(17, 17, 17, 0.03),
    0 12px 32px -4px rgba(17, 17, 17, 0.09);
  /* Primary button, values from the Framer reference */
  --btn-dark: #292929;
  --shadow-btn:
    0 0 0 1px rgba(41, 41, 41, 0.05),
    0 4px 4px 0 rgba(41, 41, 41, 0.02),
    inset 0 1px 0 1px rgba(255, 255, 255, 0.16),
    inset 0 -2px 0 1px #292929;
  --shadow-btn-pressed:
    0 0 0 1px rgba(41, 41, 41, 0.05),
    inset 0 1px 0 1px rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 1px #292929;

  /* Motion: calm and quick */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 160ms;
  --dur-base: 240ms;
  --dur-slow: 420ms;

  /* Surfaces */
  --texture-concrete: url("https://framerusercontent.com/images/wTpvZWjYdsGuNNesJpmLSgRLFm4.jpg");
}

@media (max-width: 1199px) {
  :root {
    --fs-hero: 60px;
    --fs-h2: 40px;
    --fs-h3: 24px;
    --fs-lede: 19px;
    --fs-body: 16px;
    --gutter: 32px;
    --grid-gap: 20px;
  }
}

@media (max-width: 809px) {
  :root {
    --fs-hero: 38px;
    --ls-hero: -0.024em;
    --fs-h2: 32px;
    --fs-h3: 22px;
    --fs-lede: 17px;
    --fs-body: 16px;
    --fs-caps: 11px;
    --gutter: 20px;
    --grid-gap: 12px;
  }
}

/* Previous, softer text colours (closer to the deck). Switch back with
   <html data-ink="soft"> or by opening the page with ?ink=soft */
:root[data-ink="soft"] {
  --color-ink: #2b2b2b;
  --color-text: #3d3d3d;
  --color-text-muted: #4d4d4d;
}


/* Header sizes (hero uses --header-h) */
:root {
  --mh-labels: 48px;      /* labels row, including its hairline */
  --mh-row: 40px;         /* one link row */
  --fs-masthead: 18px;    /* nav links and "Menu +" */
  --mh-rows: 3;
  --mh-pad: 16px;         /* space above the first row */
  --mh-main: calc(var(--mh-pad) + var(--mh-row) * var(--mh-rows));
  --mh-compact: 68px;
  --mh-mark: 116px;       /* big A-mark width (official mark, 72:57) */
  --mh-mark-small: 30px;
  --header-h: calc(var(--mh-labels) + var(--mh-main));
  --mh-ease: cubic-bezier(0.65, 0, 0.2, 1);
  --mh-dur: 560ms;
  --mh-line: rgba(21, 21, 21, 0.16);
}
@media (max-width: 1199px) { :root { --mh-main: 64px; --mh-mark: 30px; } }`

export const BASE_CSS = `/* ---------- Base, scoped to Arcovia components ----------
   The HTML site set these on html/body and bare elements. Here they live on the
   .arc wrapper; :where() keeps element rules at their original (zero-class)
   specificity, so component classes still win exactly as before. */
.arc {
  font-family: var(--font-sans);
  font-weight: var(--weight-book);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
.arc, :where(.arc) *, :where(.arc) *::before, :where(.arc) *::after { box-sizing: border-box; }
:where(.arc) :where(h1, h2, h3, h4, p, ul, ol, figure) { margin: 0; }
:where(.arc) :where(ul, ol) { padding: 0; list-style: none; }
:where(.arc) a { color: inherit; text-decoration: none; }
:where(.arc) :where(img, svg) { display: block; max-width: 100%; }
:where(.arc) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
:where(.arc) :focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 3px;
  border-radius: 4px;
}

/* Shared parts below are wrapped in :where() (zero specificity): this stylesheet is repeated in
   every component, and a section's own rules must always win over it, as they did on the HTML site. */
:where(.visually-hidden) {
  position: absolute !important;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

:where(.sprite) { position: absolute; width: 0; height: 0; overflow: hidden; }
:where(.nowrap) { white-space: nowrap; }

:where(.container) {
  width: 100%;
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--gutter);
}


:where(.eyebrow) {
  font-size: var(--fs-caps);
  font-weight: var(--weight-medium);
  letter-spacing: var(--ls-caps);
  line-height: 1.6;
  text-transform: uppercase;
  color: var(--color-text-muted);
}


:where(.chip) {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  font-size: 13px;
  font-weight: var(--weight-medium);
  letter-spacing: 0.14em;
  line-height: 1.4;
  text-transform: uppercase;
  color: var(--color-text);
}

:where(.chip)::before { content: "[\\00a0"; content: "[\\00a0" / ""; }
:where(.chip)::after { content: "\\00a0]"; content: "\\00a0]" / ""; }
@media (max-width: 809px) {
  :where(.chip) { font-size: 11px; letter-spacing: 0.08em; }
}


:where(.btn) {
  --btn-h: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: var(--btn-h);
  padding: 0 24px;
  border-radius: var(--radius-pill);
  font-size: var(--fs-nav);
  font-weight: var(--weight-medium);
  letter-spacing: 0.005em;
  line-height: 1;
  white-space: nowrap;
  transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
:where(.btn:active) { transform: scale(0.98); }
:where(.btn--small) { --btn-h: 40px; padding: 0 18px; font-size: 14px; }


:where(.btn--primary) {
  color: var(--color-on-dark);
  background: linear-gradient(180deg, rgba(207, 207, 207, 0.16) 0%, rgba(207, 207, 207, 0.11) 100%), var(--btn-dark);
  box-shadow: var(--shadow-btn);
}
:where(.btn--quiet) { background: var(--color-white); color: var(--color-ink); box-shadow: var(--shadow-card); }

@media (hover: hover) {
  :where(.btn--primary:hover) { background: linear-gradient(180deg, rgba(207, 207, 207, 0.22) 0%, rgba(207, 207, 207, 0.15) 100%), var(--btn-dark); }
  :where(.btn--quiet:hover) { background: var(--color-well); }
}
:where(.btn--primary:active) { box-shadow: var(--shadow-btn-pressed); }

:where(.btn__icon) {
  width: 14px;
  height: 14px;
  flex: none;
  transition: transform var(--dur-base) var(--ease-out);
}


:where(.logo) {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--color-ink);
}
:where(.logo__mark) { flex: none; width: 28px; height: auto; fill: currentColor; }

:where(.logo__word) { flex: none; width: auto; height: 13px; fill: currentColor; }


:where(.seam) {
  position: relative;
  height: 1px;
  background: rgba(43, 43, 43, 0.16);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.45);
}
:where(.seam__hole) {
  position: absolute;
  top: 50%;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  box-shadow: inset 1.5px 1.5px 2px rgba(0, 0, 0, 0.35), 1px 1px 0 rgba(255, 255, 255, 0.55);
}
:where(.seam__hole--start) { left: 0; transform: translate(-50%, -50%); }
:where(.seam__hole--end) { right: 0; transform: translate(50%, -50%); }


/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  :where(.arc) *, :where(.arc) *::before, :where(.arc) *::after {
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
  }
}
`

const SPRITE = `<symbol id="a-mark" viewBox="0 0 72 57"><path d="M12.0606 45.653L6.4043 56.272L9.58059 56.3005C11.096 56.3148 12.4458 56.3605 14.1267 56.2321L35.0366 17.4288C32.9219 16.7924 31.1725 15.7479 29.6286 14.4009L12.0606 45.653Z"/><path d="M62.5327 50.738L42.9184 14.1807C41.2461 15.8616 39.5509 16.9432 37.3164 17.1743L57.8439 56.243H65.3551C64.3192 54.3652 63.3831 52.7499 62.5327 50.738Z"/><path d="M36.201 16.0215C40.6267 16.0215 44.2145 12.4351 44.2145 8.0109C44.2145 3.58674 40.6267 0.000244141 36.201 0.000244141C31.7753 0.000244141 28.1875 3.58674 28.1875 8.0109C28.1875 12.4351 31.7753 16.0215 36.201 16.0215Z"/></symbol>
<symbol id="wordmark" viewBox="0 0 72 11"><path d="M60.8672 10.8151L65.4337 0.362549H67.1239L71.6903 10.8151H69.7629L68.7103 8.30942H63.8028L62.7353 10.8151H60.8672ZM64.47 6.69336H68.0431L66.2491 2.54201L64.47 6.69336Z"/><path d="M57.1562 10.8149V0.436523H58.9799V10.8149H57.1562Z"/><path d="M49.3426 10.889L45.043 0.436523H47.0593L50.1877 8.41305L53.3012 0.436523H55.2731L50.9735 10.889H49.3426Z"/><path d="M38.9389 10.993C35.7513 10.993 33.5273 8.57632 33.5273 5.65554V5.62589C33.5273 2.71995 35.7809 0.258789 38.9686 0.258789C42.1562 0.258789 44.3802 2.67547 44.3802 5.59624V5.62589C44.3802 8.53184 42.1266 10.993 38.9389 10.993ZM38.9686 9.3028C41.0294 9.3028 42.4676 7.67191 42.4676 5.65554V5.62589C42.4676 3.60952 41.0146 1.94898 38.9389 1.94898C36.8781 1.94898 35.4399 3.57987 35.4399 5.59624V5.62589C35.4399 7.64226 36.8929 9.3028 38.9686 9.3028Z"/><path d="M28.1356 10.993C25.111 10.993 22.8574 8.63562 22.8574 5.65554V5.62589C22.8574 2.67547 25.0665 0.258789 28.1949 0.258789C30.1223 0.258789 31.2787 0.92597 32.2721 1.87485L31.1008 3.22404C30.2557 2.45307 29.381 1.94898 28.18 1.94898C26.223 1.94898 24.77 3.56504 24.77 5.59624V5.62589C24.77 7.65709 26.2082 9.3028 28.1949 9.3028C29.4551 9.3028 30.2854 8.79871 31.1749 7.96844L32.3462 9.15454C31.2936 10.2962 30.063 10.993 28.1356 10.993Z"/><path d="M12.6016 10.8149V0.436523H17.2274C18.5321 0.436523 19.5551 0.822006 20.2223 1.47436C20.7708 2.05259 21.0822 2.80872 21.0822 3.71313V3.74278C21.0822 5.4478 20.0592 6.47081 18.621 6.88594L21.4232 10.8149H19.2585L16.7084 7.19729H14.4252V10.8149H12.6016ZM14.4252 5.58123H17.0939C18.3986 5.58123 19.2289 4.91405 19.2289 3.84656V3.81691C19.2289 2.69011 18.4431 2.09706 17.0791 2.09706H14.4252V5.58123Z"/><path d="M0 10.8151L4.56649 0.362549H6.25668L10.8232 10.8151H8.89575L7.84309 8.30942H2.9356L1.86811 10.8151H0ZM3.60278 6.69336H7.17591L5.38193 2.54201L3.60278 6.69336Z"/></symbol>
<symbol id="icon-raise" viewBox="0 0 24 24"><path opacity="0.2" d="M12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22Z" fill="currentColor"/><path d="M7 14.25C7.41421 14.25 7.75 14.5858 7.75 15V18C7.75 18.4142 7.41421 18.75 7 18.75C6.58579 18.75 6.25 18.4142 6.25 18V15C6.25 14.5858 6.58579 14.25 7 14.25Z" fill="currentColor"/><path d="M12 11.25C12.4142 11.25 12.75 11.5858 12.75 12V18C12.75 18.4142 12.4142 18.75 12 18.75C11.5858 18.75 11.25 18.4142 11.25 18V12C11.25 11.5858 11.5858 11.25 12 11.25Z" fill="currentColor"/><path d="M17 8.25C17.4142 8.25 17.75 8.58579 17.75 9V18C17.75 18.4142 17.4142 18.75 17 18.75C16.5858 18.75 16.25 18.4142 16.25 18V9C16.25 8.58579 16.5858 8.25 17 8.25Z" fill="currentColor"/></symbol>
<symbol id="icon-invest" viewBox="0 0 24 24"><path opacity="0.2" d="M6.25993 21.3884H6C5.05719 21.3884 4.58579 21.3884 4.29289 21.0955C4 20.8026 4 20.3312 4 19.3884V18.2764C4 17.7579 4 17.4987 4.13318 17.2672C4.26636 17.0356 4.46727 16.9188 4.8691 16.6851C7.51457 15.1464 11.2715 14.2803 13.7791 15.7759C13.9475 15.8764 14.0991 15.9977 14.2285 16.1431C14.7866 16.77 14.746 17.7161 14.1028 18.2775C13.9669 18.396 13.8222 18.486 13.6764 18.5172C13.7962 18.5033 13.911 18.4874 14.0206 18.4699C14.932 18.3245 15.697 17.8375 16.3974 17.3084L18.2046 15.9433C18.8417 15.462 19.7873 15.4619 20.4245 15.943C20.9982 16.3762 21.1736 17.0894 20.8109 17.6707C20.388 18.3487 19.7921 19.216 19.2199 19.7459C18.6469 20.2766 17.7939 20.7504 17.0975 21.0865C16.326 21.4589 15.4738 21.6734 14.6069 21.8138C12.8488 22.0983 11.0166 22.0549 9.27633 21.6964C8.29253 21.4937 7.27079 21.3884 6.25993 21.3884Z" fill="currentColor"/><path d="M6.58579 2.58579C6.21901 2.95256 6.08188 3.4593 6.03061 4.2498C7.24895 4.23355 8.23355 3.24896 8.2498 2.03061C7.4593 2.08188 6.95256 2.21901 6.58579 2.58579Z" fill="currentColor"/><path d="M17.4142 2.58579C17.0474 2.21901 16.5407 2.08188 15.7502 2.03061C15.7664 3.24895 16.751 4.23355 17.9694 4.2498C17.9181 3.4593 17.781 2.95256 17.4142 2.58579Z" fill="currentColor"/><path d="M17.4142 9.41421C17.0474 9.78099 16.5407 9.91812 15.7502 9.96939C15.7665 8.75104 16.751 7.76645 17.9694 7.7502C17.9181 8.5407 17.781 9.04744 17.4142 9.41421Z" fill="currentColor"/><path d="M6.58579 9.41421C6.95256 9.78099 7.4593 9.91812 8.2498 9.96939C8.23355 8.75105 7.24895 7.76645 6.03061 7.7502C6.08188 8.5407 6.21901 9.04744 6.58579 9.41421Z" fill="currentColor"/><path d="M6 5.75C8.07107 5.75 9.75 4.07107 9.75 2H14.25C14.25 4.07107 15.9289 5.75 18 5.75V6.25C15.9289 6.25 14.25 7.92893 14.25 10H9.75C9.75 7.92893 8.07107 6.25 6 6.25V5.75ZM12 7C12.5523 7 13 6.55228 13 6C13 5.44772 12.5523 5 12 5C11.4477 5 11 5.44772 11 6C11 6.55228 11.4477 7 12 7Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/></symbol>
<symbol id="icon-institution" viewBox="0 0 24 24"><path d="M12.75 8.83697V9.87803C13.6239 10.1869 14.25 11.0203 14.25 12C14.25 12.0492 14.2484 12.0979 14.2453 12.1463L15.2025 12.5565C15.2337 12.3757 15.25 12.1898 15.25 12C15.25 10.4632 14.1833 9.17555 12.75 8.83697Z" fill="currentColor"/><path d="M11.25 8.83697C9.81665 9.17555 8.75 10.4632 8.75 12C8.75 12.1898 8.76626 12.3757 8.79747 12.5565L9.75468 12.1463C9.75158 12.0979 9.75 12.0492 9.75 12C9.75 11.0203 10.3761 10.1869 11.25 9.87803V8.83697Z" fill="currentColor"/><path d="M14.6113 13.9351L13.6544 13.525C13.2432 13.9708 12.6542 14.25 12 14.25C11.3458 14.25 10.7568 13.9708 10.3456 13.525L9.38865 13.9351C9.98087 14.733 10.9301 15.25 12 15.25C13.0699 15.25 14.0191 14.733 14.6113 13.9351Z" fill="currentColor"/><path d="M13.0549 4.25H10.9451C9.57755 4.24998 8.47521 4.24996 7.60825 4.36652C6.70814 4.48754 5.95027 4.74643 5.34835 5.34835C5.07033 5.62637 4.8655 5.93766 4.71362 6.28086C4.64592 6.26078 4.57422 6.25 4.5 6.25C4.08579 6.25 3.75 6.58579 3.75 7V10C3.75 10.3266 3.95871 10.6044 4.25002 10.7073V13.2927C3.95871 13.3956 3.75 13.6734 3.75 14V17C3.75 17.4142 4.08579 17.75 4.5 17.75C4.57422 17.75 4.64592 17.7392 4.71362 17.7191C4.8655 18.0623 5.07033 18.3736 5.34835 18.6517C5.95027 19.2536 6.70814 19.5125 7.60825 19.6335C8.47522 19.75 9.57754 19.75 10.9451 19.75H13.0549C14.4225 19.75 15.5248 19.75 16.3918 19.6335C17.2919 19.5125 18.0497 19.2536 18.6516 18.6517C19.2536 18.0497 19.5125 17.2919 19.6335 16.3918C19.75 15.5248 19.75 14.4225 19.75 13.0549V10.9451C19.75 9.57754 19.75 8.47522 19.6335 7.60825C19.5125 6.70814 19.2536 5.95027 18.6516 5.34835C18.0497 4.74643 17.2919 4.48754 16.3918 4.36652C15.5248 4.24996 14.4225 4.24998 13.0549 4.25ZM7.25 12C7.25 9.37665 9.37665 7.25 12 7.25C14.6234 7.25 16.75 9.37665 16.75 12C16.75 14.6234 14.6234 16.75 12 16.75C9.37665 16.75 7.25 14.6234 7.25 12Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/><path opacity="0.2" d="M3.46447 3.46447C2 4.92893 2 7.28595 2 12C2 16.714 2 19.0711 3.46447 20.5355C4.92893 22 7.28595 22 12 22C16.714 22 19.0711 22 20.5355 20.5355C22 19.0711 22 16.714 22 12C22 7.28595 22 4.92893 20.5355 3.46447C19.0711 2 16.714 2 12 2C7.28595 2 4.92893 2 3.46447 3.46447ZM10.9451 4.25H13.0549C14.4225 4.24998 15.5248 4.24996 16.3918 4.36652C17.2919 4.48754 18.0497 4.74643 18.6516 5.34835C19.2536 5.95027 19.5125 6.70814 19.6335 7.60825C19.75 8.47522 19.75 9.57754 19.75 10.9451V13.0549C19.75 14.4225 19.75 15.5248 19.6335 16.3918C19.5125 17.2919 19.2536 18.0497 18.6516 18.6517C18.0497 19.2536 17.2919 19.5125 16.3918 19.6335C15.5248 19.75 14.4225 19.75 13.0549 19.75H10.9451C9.57754 19.75 8.47522 19.75 7.60825 19.6335C6.70814 19.5125 5.95027 19.2536 5.34835 18.6517C5.07033 18.3736 4.8655 18.0623 4.71362 17.7191C4.64592 17.7392 4.57422 17.75 4.5 17.75C4.08579 17.75 3.75 17.4142 3.75 17V14C3.75 13.6734 3.95871 13.3956 4.25002 13.2927V10.7073C3.95871 10.6044 3.75 10.3266 3.75 10V7C3.75 6.58579 4.08579 6.25 4.5 6.25C4.57422 6.25 4.64592 6.26078 4.71362 6.28086C4.8655 5.93766 5.07033 5.62637 5.34835 5.34835C5.95027 4.74643 6.70814 4.48754 7.60825 4.36652C8.47521 4.24996 9.57755 4.24998 10.9451 4.25Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/></symbol>
<symbol id="icon-chevron-right" viewBox="0 0 16 16"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="icon-arrow" viewBox="0 0 16 16"><path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="icon-linkedin" viewBox="0 0 24 24"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0h.01Z"/></symbol>`

/** Tokens, scoped resets, shared parts and Montserrat. Render once in every Arcovia component: {baseStyle()} */
export function baseStyle() {
    return (
        <>
            <link rel="stylesheet" href={FONT_URL} />
            <style data-arcovia="base" dangerouslySetInnerHTML={{ __html: TOKENS_CSS + "\n" + BASE_CSS }} />
        </>
    )
}

/** A component's own stylesheet: {cssTag("hero", HERO_CSS)}. dangerouslySetInnerHTML so ">" survives server rendering. */
export function cssTag(name: string, css: string) {
    return <style data-arcovia={name} dangerouslySetInnerHTML={{ __html: css }} />
}

/** The hidden icon sprite: logo (a-mark, wordmark) and icons, used with <use href="#id"/>: {sprite()} */
export function sprite() {
    return <svg className="sprite" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: SPRITE }} />
}

/** True on the Framer canvas (and thumbnails/exports): render the still, settled layout there. */
export function isStaticRender(): boolean {
    const t = RenderTarget.current()
    return t === RenderTarget.canvas || t === RenderTarget.thumbnail || t === RenderTarget.export
}

/** Everything a component script starts, so it can all be stopped when the component unmounts. */
export interface Life {
    readonly dead: boolean
    on(target: EventTarget, type: string, fn: any, opts?: AddEventListenerOptions | boolean): void
    raf(fn: FrameRequestCallback): number
    cancelRaf(id: number): void
    timeout(fn: () => void, ms: number): number
    interval(fn: () => void, ms: number): number
    clear(id: number): void
    observe<T extends { disconnect(): void }>(observer: T): T
    add(fn: () => void): void
    dispose(): void
}

export function createLife(): Life {
    const offs: Array<() => void> = []
    const frames = new Set<number>()
    const timers = new Set<number>()
    let dead = false
    return {
        get dead() {
            return dead
        },
        on(target, type, fn, opts) {
            target.addEventListener(type, fn, opts)
            offs.push(() => target.removeEventListener(type, fn, opts))
        },
        raf(fn) {
            if (dead) return 0
            const id = requestAnimationFrame((t) => {
                frames.delete(id)
                if (!dead) fn(t)
            })
            frames.add(id)
            return id
        },
        cancelRaf(id) {
            cancelAnimationFrame(id)
            frames.delete(id)
        },
        timeout(fn, ms) {
            const id = window.setTimeout(() => {
                timers.delete(id)
                if (!dead) fn()
            }, ms)
            timers.add(id)
            return id
        },
        interval(fn, ms) {
            const id = window.setInterval(() => {
                if (!dead) fn()
            }, ms)
            timers.add(id)
            return id
        },
        clear(id) {
            clearTimeout(id)
            clearInterval(id)
            timers.delete(id)
        },
        observe(observer) {
            offs.push(() => observer.disconnect())
            return observer
        },
        add(fn) {
            offs.push(fn)
        },
        dispose() {
            if (dead) return
            dead = true
            frames.forEach((id) => cancelAnimationFrame(id))
            timers.forEach((id) => {
                clearTimeout(id)
                clearInterval(id)
            })
            offs.splice(0).reverse().forEach((f) => {
                try {
                    f()
                } catch (e) {}
            })
        },
    }
}

/**
 * Runs a component's script against its own root element after mount (never on
 * the canvas), and stops everything it started on unmount.
 */
export function useArcoviaScript(
    ref: React.RefObject<HTMLElement>,
    init: (root: HTMLElement, life: Life) => void,
    deps: React.DependencyList = []
) {
    React.useEffect(() => {
        const root = ref.current
        if (!root || isStaticRender()) return
        const life = createLife()
        try {
            init(root, life)
        } catch (e) {
            console.error("[Arcovia]", e)
        }
        return () => life.dispose()
    }, deps)
}
