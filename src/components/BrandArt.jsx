export default function BrandArt() {
  return (
<svg viewBox="0 0 520 420" aria-hidden="true" className="brand-art">
<defs>
<radialGradient id="sd-glow" cx="380" cy="150" r="230" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#f97316" stopOpacity="0.30"/><stop offset="1" stopColor="#f97316" stopOpacity="0"/></radialGradient>
<radialGradient id="sd-fade" cx="260" cy="210" r="260" gradientUnits="userSpaceOnUse"><stop offset="0.35" stopColor="#fff"/><stop offset="1" stopColor="#000"/></radialGradient>
<mask id="sd-mask"><rect width="520" height="420" fill="url(#sd-fade)"/></mask>
<pattern id="sd-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#fff" fillOpacity="0.16"/></pattern>
</defs>
<rect width="520" height="420" fill="url(#sd-glow)"/>
<rect width="520" height="420" fill="url(#sd-dots)" mask="url(#sd-mask)"/>
<path d="M60 330 C120 330 130 250 200 235 C280 218 330 250 380 190 C410 155 440 150 470 128" fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="3" strokeLinecap="round"/>
<path className="route-flow" d="M60 330 C120 330 130 250 200 235 C280 218 330 250 380 190 C410 155 440 150 470 128" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round"/>
<circle cx="60" cy="330" r="12" fill="#f97316" fillOpacity="0.25"/><circle cx="60" cy="330" r="6" fill="#fff"/>
<path d="M470 60 C455 60 445 72 445 85 C445 105 470 128 470 128 C470 128 495 105 495 85 C495 72 485 60 470 60 Z" fill="#f97316"/><circle cx="470" cy="85" r="9" fill="#121828"/>
<ellipse cx="130" cy="226" rx="46" ry="9" fill="#000" fillOpacity="0.28"/>
<polygon points="90,140 130,160 130,210 90,190" fill="#f97316"/>
<polygon points="130,160 170,140 170,190 130,210" fill="#c2410c"/>
<polygon points="130,120 170,140 130,160 90,140" fill="#fdba74"/>
<line x1="110" y1="130" x2="150" y2="150" stroke="#fff" strokeOpacity="0.65" strokeWidth="7"/>
<rect x="236" y="262" width="268" height="136" rx="16" fill="#1b2338" stroke="#fff" strokeOpacity="0.12"/>
<text x="256" y="288" fontSize="11" fill="#9aa3bd">Tracking number</text>
<text x="256" y="312" fontSize="18" fontWeight="700" fill="#fff">SD123456</text>
<rect x="404" y="294" width="84" height="22" rx="11" fill="#f97316" fillOpacity="0.18"/>
<text x="446" y="309" fontSize="11" fontWeight="600" fill="#fdba74" textAnchor="middle">In transit</text>
<line x1="270" y1="352" x2="470" y2="352" stroke="#fff" strokeOpacity="0.18" strokeWidth="3" strokeLinecap="round"/>
<line x1="270" y1="352" x2="403" y2="352" stroke="#f97316" strokeWidth="3" strokeLinecap="round"/>
<circle cx="270" cy="352" r="6" fill="#f97316"/><circle cx="337" cy="352" r="6" fill="#f97316"/>
<circle cx="403" cy="352" r="11" fill="#f97316" fillOpacity="0.25"/><circle cx="403" cy="352" r="6" fill="#f97316"/>
<circle cx="470" cy="352" r="6" fill="#1b2338" stroke="#fff" strokeOpacity="0.4" strokeWidth="2"/>
<g fontSize="10.5" fill="#9aa3bd" textAnchor="middle"><text x="270" y="378">Created</text><text x="337" y="378">Picked up</text><text x="403" y="378">In transit</text><text x="470" y="378">Delivered</text></g>
</svg>

  );
}