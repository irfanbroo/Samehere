import "./globals.css";
import Script from 'next/script';

export const metadata = {
  title: "Same Here",
  description: "We all have 24 hours. What did you do with yours?",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-visual',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        <Script id="theme-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
          try {
            var bgThemes = {
              '#0a0a0a': {card:'#0f0f0f',elevated:'#111111',subtle:'#141414',border:'#1a1a1a'},
              '#05080f': {card:'#0a0d14',elevated:'#0f1320',subtle:'#0d1118',border:'#1a2030'},
              '#15202b': {card:'#1e2732',elevated:'#22303c',subtle:'#192734',border:'#2f3f50'},
              '#080510': {card:'#0d0a18',elevated:'#120f20',subtle:'#100d1a',border:'#1e1a30'},
              '#050f08': {card:'#0a1510',elevated:'#0f1c15',subtle:'#0c1812',border:'#1a2e20'},
            };
            var overallThemes = {
              'default':         {bgBase:'#0a0a0a',card:'#0f0f0f',elevated:'#111111',subtle:'#141414',border:'#1a1a1a',text:'#e0e0e0',sub:'#9CA3AF',accent:'#ffffff'},
              'neon-tokyo':      {bgBase:'#0d0914',card:'#140d1e',elevated:'#1c1230',subtle:'#180f28',border:'#2e1e50',text:'#e8d5ff',sub:'#9b72cf',accent:'#bf5fff'},
              'blood-moon':      {bgBase:'#0d0404',card:'#150707',elevated:'#1e0a0a',subtle:'#180808',border:'#3a1212',text:'#ffe8e8',sub:'#cc7777',accent:'#ff4444'},
              'deep-ocean':      {bgBase:'#020d14',card:'#051420',elevated:'#071c2c',subtle:'#061828',border:'#0d3550',text:'#c8eeff',sub:'#5599bb',accent:'#00bbff'},
              'sakura':          {bgBase:'#0f080d',card:'#1a0d15',elevated:'#220f1c',subtle:'#1d0c18',border:'#3a1828',text:'#ffd6e8',sub:'#c47a9a',accent:'#ff6eb4'},
              'obsidian-gold':   {bgBase:'#080706',card:'#111009',elevated:'#1a1810',subtle:'#141208',border:'#2a2410',text:'#fff4c2',sub:'#b8960c',accent:'#ffd700'},
              'aurora':          {bgBase:'#050d10',card:'#08161a',elevated:'#0c2028',subtle:'#0a1c22',border:'#0d2e24',text:'#a8ffdb',sub:'#4daa7a',accent:'#00ffaa'},
              'volcanic':        {bgBase:'#0d0805',card:'#160e08',elevated:'#201408',subtle:'#1a1006',border:'#3a1e08',text:'#ffd4b0',sub:'#cc7733',accent:'#ff6600'},
              'arctic':          {bgBase:'#040810',card:'#081018',elevated:'#0c1820',subtle:'#0a1418',border:'#102030',text:'#d0eeff',sub:'#6699bb',accent:'#66ccff'},
              'sunset-drift':    {bgBase:'#120807',card:'#1e100a',elevated:'#281508',subtle:'#220e06',border:'#3a1e0e',text:'#ffe8d0',sub:'#cc7744',accent:'#ff8c42',gradient:'linear-gradient(160deg,#1a0a0d 0%,#1a0a04 35%,#150c02 65%,#0d0808 100%)'},
              'galaxy':          {bgBase:'#04040f',card:'#0c0a20',elevated:'#140e30',subtle:'#100c28',border:'#241a50',text:'#d4ccff',sub:'#7766cc',accent:'#7b68ee',gradient:'linear-gradient(160deg,#04040f 0%,#080520 35%,#0d0830 65%,#050410 100%)'},
              'northern-lights': {bgBase:'#040d10',card:'#071a16',elevated:'#0a2420',subtle:'#091e1a',border:'#0e3830',text:'#b8ffe8',sub:'#3aaa88',accent:'#00ffcc',gradient:'linear-gradient(160deg,#040d10 0%,#041810 35%,#050d18 65%,#040d12 100%)'},
              'midnight-rose':   {bgBase:'#0d0510',card:'#180818',elevated:'#220c22',subtle:'#1c0a1c',border:'#3a1030',text:'#ffc8e0',sub:'#aa5577',accent:'#ff4d8f',gradient:'linear-gradient(160deg,#0d0510 0%,#100514 35%,#120408 65%,#0a040e 100%)'},
              'ember':           {bgBase:'#100500',card:'#1c0a00',elevated:'#261000',subtle:'#200c00',border:'#401800',text:'#ffd4a0',sub:'#cc6622',accent:'#ff7700',gradient:'linear-gradient(160deg,#100500 0%,#1a0800 35%,#120400 65%,#0d0300 100%)'},
              'dim':             {bgBase:'#1a1a1a',card:'#242424',elevated:'#2e2e2e',subtle:'#282828',border:'#383838',text:'#e8e8e8',sub:'#888888',accent:'#ffffff'},
              'light':           {bgBase:'#f8f8f8',card:'#ffffff',elevated:'#f0f0f0',subtle:'#e8e8e8',border:'#e0e0e0',text:'#0d0d0d',sub:'#666666',accent:'#000000'},
            };
            var subtextMap = {
              '#e0e0e0':'#9CA3AF','#fbbf24':'#FFF0C0','#22d3ee':'#C0F7FF',
              '#a78bfa':'#DDD0FF','#4ade80':'#A8FFB5','#f472b6':'#FFC0E8',
              '#f87171':'#FFC0C0','#fb923c':'#FFD9B0',
            };
            function genSub(hex) {
              if (subtextMap[hex]) return subtextMap[hex];
              try {
                var r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
                var max=Math.max(r,g,b),min=Math.min(r,g,b),h,s,l=(max+min)/2;
                if(max===min){h=s=0;}else{var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);if(max===r)h=((g-b)/d+(g<b?6:0))/6;else if(max===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6;}
                h=h*360;s=Math.min(s*100,60);l=75;
                h/=360;s/=100;l/=100;
                var q=l<0.5?l*(1+s):l+s-l*s,p2=2*l-q;
                function hue2rgb(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}
                var rr=hue2rgb(p2,q,h+1/3),gg=hue2rgb(p2,q,h),bb=hue2rgb(p2,q,h-1/3);
                return '#'+[rr,gg,bb].map(function(x){return Math.round(x*255).toString(16).padStart(2,'0');}).join('');
              } catch(e){return '#9CA3AF';}
            }
            var t = localStorage.getItem('samehere_theme');
            if (t) {
              var p = JSON.parse(t);
              var ot = p.overallTheme && overallThemes[p.overallTheme];
              var c, sub, accent='#fff', textColor=p.textColor;
              if (ot) { c={card:ot.card,elevated:ot.elevated,subtle:ot.subtle,border:ot.border}; p.bgBase=ot.bgBase; sub=ot.sub; accent=ot.accent; textColor=ot.text; }
              else { c = bgThemes[p.bgBase] || bgThemes['#0a0a0a']; sub = genSub(p.textColor); }
              var s = document.createElement('style');
              s.id = 'user-theme';
              var grad = ot && ot.gradient ? 'background-image:'+ot.gradient+'!important;background-attachment:fixed!important;background-size:cover!important;' : 'background-image:none!important;';
              s.innerHTML = ':root{--bg-base:'+p.bgBase+';--bg-card:'+c.card+';--bg-elevated:'+c.elevated+';--bg-subtle:'+c.subtle+';--bg-border:'+c.border+';--main-text-color:'+textColor+';--secondary-text-color:'+sub+';--accent:'+accent+'}body{background-color:'+p.bgBase+'!important;'+grad+'}p,h1,h2,h3,h4,h5,h6,li,td,th,label,input::placeholder,textarea::placeholder{color:'+textColor+'!important}';
              document.head.appendChild(s);
            }
          } catch(e) {}
        `}} />
        {children}
      </body>
    </html>
  );
}
