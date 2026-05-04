// Subtext color paired with each predefined text color
const SUBTEXT_MAP = {
  '#e0e0e0': '#9CA3AF',
  '#fbbf24': '#FFF0C0',
  '#22d3ee': '#C0F7FF',
  '#a78bfa': '#DDD0FF',
  '#4ade80': '#A8FFB5',
  '#f472b6': '#FFC0E8',
  '#f87171': '#FFC0C0',
  '#fb923c': '#FFD9B0',
};

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return [h*360, s*100, l*100];
}

function hslToHex(h, s, l) {
  h/=360; s/=100; l/=100;
  let r,g,b;
  if (s===0) { r=g=b=l; }
  else {
    const hue2rgb = (p,q,t) => {
      if(t<0)t+=1; if(t>1)t-=1;
      if(t<1/6)return p+(q-p)*6*t;
      if(t<1/2)return q;
      if(t<2/3)return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const q = l<0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  return '#'+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

function generateSubtext(textColor) {
  if (SUBTEXT_MAP[textColor]) return SUBTEXT_MAP[textColor];
  try {
    const [h, s, l] = hexToHsl(textColor);
    return hslToHex(h, Math.min(s, 60), 75);
  } catch { return '#9CA3AF'; }
}

export const TEXT_COLORS = [
  { label: 'Default',  value: '#e0e0e0' },
  { label: 'Amber',    value: '#fbbf24' },
  { label: 'Cyan',     value: '#22d3ee' },
  { label: 'Purple',   value: '#a78bfa' },
  { label: 'Green',    value: '#4ade80' },
  { label: 'Pink',     value: '#f472b6' },
  { label: 'Red',      value: '#f87171' },
  { label: 'Orange',   value: '#fb923c' },
];

export const BG_THEMES = [
  { label: 'Default',     value: '#0a0a0a', card: '#0f0f0f', elevated: '#111111', subtle: '#141414', border: '#1a1a1a' },
  { label: 'Midnight',    value: '#05080f', card: '#0a0d14', elevated: '#0f1320', subtle: '#0d1118', border: '#1a2030' },
  { label: 'Dim',         value: '#15202b', card: '#1e2732', elevated: '#22303c', subtle: '#192734', border: '#2f3f50' },
  { label: 'Deep Purple', value: '#080510', card: '#0d0a18', elevated: '#120f20', subtle: '#100d1a', border: '#1e1a30' },
  { label: 'Forest',      value: '#050f08', card: '#0a1510', elevated: '#0f1c15', subtle: '#0c1812', border: '#1a2e20' },
];

// Complete preset themes — override everything at once
export const OVERALL_THEMES = [
  {
    id: 'default',
    label: 'Default',
    emoji: '⬛',
    description: 'Pure black — the original SameHere experience',
    preview: ['#0a0a0a', '#e0e0e0', '#9CA3AF'],
    textColor: '#e0e0e0',
    bgBase: '#0a0a0a',
    card: '#0f0f0f',
    elevated: '#111111',
    subtle: '#141414',
    border: '#1a1a1a',
    subtext: '#9CA3AF',
    accent: '#ffffff',
  },
  // ── Gradient Themes ──
  {
    id: 'sunset-drift',
    label: 'Sunset Drift',
    emoji: '🌅',
    description: 'Warm dusk fading into night — cinematic and alive',
    preview: ['#1a0a0d', '#ff8c42', '#e05555'],
    gradient: 'linear-gradient(160deg, #1a0a0d 0%, #1a0a04 35%, #150c02 65%, #0d0808 100%)',
    textColor: '#ffe8d0',
    bgBase: '#120807',
    card: '#1e100a',
    elevated: '#281508',
    subtle: '#220e06',
    border: '#3a1e0e',
    subtext: '#cc7744',
    accent: '#ff8c42',
  },
  {
    id: 'galaxy',
    label: 'Galaxy',
    emoji: '🪐',
    description: 'Deep space — vast, mysterious, infinite',
    preview: ['#04040f', '#7b68ee', '#4444bb'],
    gradient: 'linear-gradient(160deg, #04040f 0%, #080520 35%, #0d0830 65%, #050410 100%)',
    textColor: '#d4ccff',
    bgBase: '#04040f',
    card: '#0c0a20',
    elevated: '#140e30',
    subtle: '#100c28',
    border: '#241a50',
    subtext: '#7766cc',
    accent: '#7b68ee',
  },
  {
    id: 'northern-lights',
    label: 'Northern Lights',
    emoji: '🌈',
    description: 'Shifting greens and blues of the aurora — ethereal',
    preview: ['#040d10', '#00ffcc', '#0088aa'],
    gradient: 'linear-gradient(160deg, #040d10 0%, #041810 35%, #050d18 65%, #040d12 100%)',
    textColor: '#b8ffe8',
    bgBase: '#040d10',
    card: '#071a16',
    elevated: '#0a2420',
    subtle: '#091e1a',
    border: '#0e3830',
    subtext: '#3aaa88',
    accent: '#00ffcc',
  },
  {
    id: 'midnight-rose',
    label: 'Midnight Rose',
    emoji: '🌹',
    description: 'Deep violet meets dark rose — romantic and intense',
    preview: ['#0d0510', '#ff4d8f', '#aa3366'],
    gradient: 'linear-gradient(160deg, #0d0510 0%, #100514 35%, #120408 65%, #0a040e 100%)',
    textColor: '#ffc8e0',
    bgBase: '#0d0510',
    card: '#180818',
    elevated: '#220c22',
    subtle: '#1c0a1c',
    border: '#3a1030',
    subtext: '#aa5577',
    accent: '#ff4d8f',
  },
  {
    id: 'ember',
    label: 'Ember',
    emoji: '🔥',
    description: 'Dying coals glowing in the dark — warm, raw, intense',
    preview: ['#100500', '#ff7700', '#cc4400'],
    gradient: 'linear-gradient(160deg, #100500 0%, #1a0800 35%, #120400 65%, #0d0300 100%)',
    textColor: '#ffd4a0',
    bgBase: '#100500',
    card: '#1c0a00',
    elevated: '#261000',
    subtle: '#200c00',
    border: '#401800',
    subtext: '#cc6622',
    accent: '#ff7700',
  },

  {
    id: 'phantom',
    label: 'Phantom',
    emoji: '🌑',
    description: 'Ink-deep indigo — silent, weightless, infinite',
    preview: ['#010212', '#667aff', '#4455dd'],
    gradient: 'linear-gradient(160deg, #010212 0%, #020418 35%, #030620 65%, #020414 100%)',
    textColor: '#c8d4ff',
    bgBase: '#010212',
    card: '#060a22',
    elevated: '#0c1234',
    subtle: '#080e2c',
    border: '#141e4a',
    subtext: '#5566cc',
    accent: '#667aff',
  },

  // ── Solid Themes ──
  {
    id: 'neon-tokyo',
    label: 'Neon Tokyo',
    emoji: '🌆',
    description: 'Deep purple dark with electric violet accents',
    preview: ['#0d0914', '#bf5fff', '#9b72cf'],
    textColor: '#e8d5ff',
    bgBase: '#0d0914',
    card: '#140d1e',
    elevated: '#1c1230',
    subtle: '#180f28',
    border: '#2e1e50',
    subtext: '#9b72cf',
    accent: '#bf5fff',
  },
  {
    id: 'blood-moon',
    label: 'Blood Moon',
    emoji: '🌑',
    description: 'Crimson dark — intense, dramatic, unforgettable',
    preview: ['#0d0404', '#ff4444', '#cc5555'],
    textColor: '#ffe8e8',
    bgBase: '#0d0404',
    card: '#150707',
    elevated: '#1e0a0a',
    subtle: '#180808',
    border: '#3a1212',
    subtext: '#cc7777',
    accent: '#ff4444',
  },
  {
    id: 'deep-ocean',
    label: 'Deep Ocean',
    emoji: '🌊',
    description: 'Dark teal abyss — calm, focused, immersive',
    preview: ['#020d14', '#00bbff', '#5599bb'],
    textColor: '#c8eeff',
    bgBase: '#020d14',
    card: '#051420',
    elevated: '#071c2c',
    subtle: '#061828',
    border: '#0d3550',
    subtext: '#5599bb',
    accent: '#00bbff',
  },
  {
    id: 'sakura',
    label: 'Sakura',
    emoji: '🌸',
    description: 'Cherry blossom nights — soft, elegant, feminine',
    preview: ['#0f080d', '#ff6eb4', '#c47a9a'],
    textColor: '#ffd6e8',
    bgBase: '#0f080d',
    card: '#1a0d15',
    elevated: '#220f1c',
    subtle: '#1d0c18',
    border: '#3a1828',
    subtext: '#c47a9a',
    accent: '#ff6eb4',
  },
  {
    id: 'obsidian-gold',
    label: 'Obsidian Gold',
    emoji: '✨',
    description: 'Pure black meets warm gold — timeless luxury',
    preview: ['#080706', '#ffd700', '#b8960c'],
    textColor: '#fff4c2',
    bgBase: '#080706',
    card: '#111009',
    elevated: '#1a1810',
    subtle: '#141208',
    border: '#2a2410',
    subtext: '#b8960c',
    accent: '#ffd700',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    emoji: '🌌',
    description: 'Northern lights in the dark — magical and alive',
    preview: ['#050d10', '#00ffaa', '#4daa7a'],
    textColor: '#a8ffdb',
    bgBase: '#050d10',
    card: '#08161a',
    elevated: '#0c2028',
    subtle: '#0a1c22',
    border: '#0d2e24',
    subtext: '#4daa7a',
    accent: '#00ffaa',
  },
  {
    id: 'volcanic',
    label: 'Volcanic',
    emoji: '🌋',
    description: 'Dark rock and lava glow — raw, intense, powerful',
    preview: ['#0d0805', '#ff6600', '#cc7733'],
    textColor: '#ffd4b0',
    bgBase: '#0d0805',
    card: '#160e08',
    elevated: '#201408',
    subtle: '#1a1006',
    border: '#3a1e08',
    subtext: '#cc7733',
    accent: '#ff6600',
  },
  {
    id: 'arctic',
    label: 'Arctic',
    emoji: '❄️',
    description: 'Frozen tundra darkness — cold, crisp, sharp',
    preview: ['#040810', '#66ccff', '#6699bb'],
    textColor: '#d0eeff',
    bgBase: '#040810',
    card: '#081018',
    elevated: '#0c1820',
    subtle: '#0a1418',
    border: '#102030',
    subtext: '#6699bb',
    accent: '#66ccff',
  },

  // ── Special ──
  {
    id: 'dim',
    label: 'Dim',
    emoji: '🌫️',
    description: 'Soft grey tones — easy on the eyes, all day',
    preview: ['#1a1a1a', '#e8e8e8', '#888888'],
    textColor: '#e8e8e8',
    bgBase: '#1a1a1a',
    card: '#242424',
    elevated: '#2e2e2e',
    subtle: '#282828',
    border: '#383838',
    subtext: '#888888',
    accent: '#ffffff',
  },
  {
    id: 'light',
    label: 'Light',
    emoji: '☀️',
    description: 'Clean white — bright, minimal, familiar',
    preview: ['#f8f8f8', '#0d0d0d', '#666666'],
    textColor: '#0d0d0d',
    bgBase: '#f8f8f8',
    card: '#ffffff',
    elevated: '#f0f0f0',
    subtle: '#e8e8e8',
    border: '#e0e0e0',
    subtext: '#666666',
    accent: '#000000',
  },
];

export function getSubtext(textColor) {
  return generateSubtext(textColor);
}

export function getTheme() {
  try {
    const t = localStorage.getItem('samehere_theme');
    if (t) return JSON.parse(t);
  } catch {}
  return { textColor: '#e0e0e0', bgBase: '#0a0a0a', overallTheme: 'default' };
}

export function applyTheme(textColor, bgBase, overallTheme = null) {
  let cfg;
  if (overallTheme) {
    // Overall theme overrides everything
    const ot = OVERALL_THEMES.find(t => t.id === overallTheme);
    if (ot) {
      cfg = { value: ot.bgBase, card: ot.card, elevated: ot.elevated, subtle: ot.subtle, border: ot.border };
      textColor = ot.textColor;
      bgBase = ot.bgBase;
    }
  }
  if (!cfg) cfg = BG_THEMES.find(t => t.value === bgBase) || BG_THEMES[0];
  const subColor = overallTheme
    ? (OVERALL_THEMES.find(t => t.id === overallTheme)?.subtext || generateSubtext(textColor))
    : generateSubtext(textColor);
  const accent = overallTheme
    ? (OVERALL_THEMES.find(t => t.id === overallTheme)?.accent || '#fff')
    : '#fff';

  let style = document.getElementById('user-theme');
  if (!style) { style = document.createElement('style'); style.id = 'user-theme'; document.head.appendChild(style); }

  const gradient = overallTheme ? (OVERALL_THEMES.find(t => t.id === overallTheme)?.gradient || null) : null;

  style.innerHTML = `
    :root {
      --bg-base: ${cfg.value};
      --bg-card: ${cfg.card};
      --bg-elevated: ${cfg.elevated};
      --bg-subtle: ${cfg.subtle};
      --bg-border: ${cfg.border};
      --main-text-color: ${textColor};
      --secondary-text-color: ${subColor};
      --accent: ${accent};
    }
    body {
      background-color: ${cfg.value} !important;
      ${gradient ? `background-image: ${gradient} !important; background-attachment: fixed !important; background-size: cover !important;` : 'background-image: none !important;'}
    }
    p, h1, h2, h3, h4, h5, h6, li, td, th, label, input::placeholder, textarea::placeholder {
      color: ${textColor} !important;
    }
  `;
}

export function saveTheme(textColor, bgBase, overallTheme = null) {
  localStorage.setItem('samehere_theme', JSON.stringify({ textColor, bgBase, overallTheme }));
  applyTheme(textColor, bgBase, overallTheme);
}

export function applyOverallTheme(themeId) {
  const current = getTheme();
  saveTheme(current.textColor, current.bgBase, themeId);
}
