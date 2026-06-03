export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 560 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', maxWidth: 560 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroPanel" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#4F8CFF" stopOpacity="0.34" />
          <stop offset="1" stopColor="#23C7D9" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="heroStroke" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#8FD7FF" />
          <stop offset="1" stopColor="#4F8CFF" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <g opacity="0.96">
        <rect x="68" y="44" width="422" height="258" rx="28" fill="url(#heroPanel)" stroke="url(#heroStroke)" />
        <rect x="92" y="72" width="374" height="36" rx="14" fill="rgba(255,255,255,0.04)" />
        <rect x="116" y="84" width="108" height="12" rx="6" fill="#8FD7FF" opacity="0.85" />
        <rect x="238" y="84" width="76" height="12" rx="6" fill="rgba(255,255,255,0.18)" />
        <rect x="322" y="84" width="64" height="12" rx="6" fill="rgba(255,255,255,0.12)" />

        <g>
          <rect x="108" y="130" width="158" height="78" rx="18" fill="rgba(255,255,255,0.04)" />
          <rect x="126" y="148" width="84" height="10" rx="5" fill="rgba(255,255,255,0.82)" />
          <rect x="126" y="168" width="108" height="8" rx="4" fill="rgba(255,255,255,0.18)" />
          <rect x="126" y="184" width="92" height="8" rx="4" fill="rgba(79,140,255,0.5)" />
          <circle cx="236" cy="170" r="14" fill="rgba(16,185,129,0.22)">
            <animate attributeName="r" values="14;17;14" dur="3.6s" repeatCount="indefinite" />
          </circle>
          <text x="229" y="175" fill="#86EFAC" fontSize="14">+</text>
        </g>

        <g>
          <rect x="286" y="130" width="158" height="78" rx="18" fill="rgba(255,255,255,0.04)" />
          <rect x="304" y="148" width="72" height="10" rx="5" fill="rgba(255,255,255,0.82)" />
          <rect x="304" y="168" width="110" height="8" rx="4" fill="rgba(255,255,255,0.18)" />
          <rect x="304" y="184" width="96" height="8" rx="4" fill="rgba(35,199,217,0.46)" />
          <circle cx="412" cy="170" r="14" fill="rgba(245,158,11,0.2)">
            <animate attributeName="cy" values="170;165;170" dur="3.2s" repeatCount="indefinite" />
          </circle>
          <text x="406" y="175" fill="#FCD34D" fontSize="12">AI</text>
        </g>

        <path d="M120 246 C176 222, 208 282, 258 252 C298 228, 340 200, 430 234" stroke="#4F8CFF" strokeWidth="4" strokeLinecap="round">
          <animate attributeName="stroke-dasharray" values="0 400;400 0" dur="2.6s" fill="freeze" />
        </path>

        <g>
          <rect x="118" y="228" width="82" height="82" rx="20" fill="rgba(10,185,129,0.08)" stroke="rgba(16,185,129,0.26)" />
          <circle cx="158" cy="268" r="18" fill="rgba(16,185,129,0.22)" />
          <path d="M149 268 L156 275 L169 260" stroke="#6EE7B7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g>
          <rect x="358" y="222" width="88" height="88" rx="20" fill="rgba(79,140,255,0.08)" stroke="rgba(79,140,255,0.22)" />
          <rect x="378" y="244" width="48" height="10" rx="5" fill="#8FD7FF" />
          <rect x="378" y="262" width="34" height="8" rx="4" fill="rgba(255,255,255,0.18)" />
          <rect x="378" y="278" width="42" height="8" rx="4" fill="rgba(79,140,255,0.46)" />
        </g>
      </g>

      <g opacity="0.9">
        <rect x="18" y="96" width="82" height="58" rx="16" fill="rgba(79,140,255,0.1)" stroke="rgba(79,140,255,0.22)">
          <animate attributeName="y" values="96;86;96" dur="4s" repeatCount="indefinite" />
        </rect>
        <rect x="24" y="112" width="42" height="8" rx="4" fill="rgba(255,255,255,0.82)" />
        <rect x="24" y="128" width="32" height="8" rx="4" fill="rgba(255,255,255,0.18)" />
      </g>

      <g opacity="0.9">
        <rect x="470" y="174" width="72" height="54" rx="16" fill="rgba(35,199,217,0.1)" stroke="rgba(35,199,217,0.22)">
          <animate attributeName="y" values="174;164;174" dur="4.2s" repeatCount="indefinite" />
        </rect>
        <circle cx="492" cy="201" r="8" fill="#23C7D9" />
        <rect x="506" y="188" width="22" height="6" rx="3" fill="rgba(255,255,255,0.72)" />
        <rect x="506" y="201" width="16" height="6" rx="3" fill="rgba(255,255,255,0.2)" />
      </g>
    </svg>
  );
}
