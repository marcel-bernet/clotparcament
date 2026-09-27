// Small inline SVG icons and illustrations (no icon library).

export function LogoPin({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 2C12.3 2 6 8.1 6 15.8 6 26 20 38 20 38s14-12 14-22.2C34 8.1 27.7 2 20 2z" fill="var(--green)" />
      <circle cx="20" cy="15.5" r="7.5" fill="#fff" />
      <text x="20" y="20" textAnchor="middle" fontSize="12" fontWeight="900" fill="var(--green)" fontFamily="inherit">P</text>
    </svg>
  );
}

export function CarIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M5.5 10.5 7.2 6.3A2 2 0 0 1 9.1 5h5.8a2 2 0 0 1 1.9 1.3l1.7 4.2A2.5 2.5 0 0 1 20 13v3.5a1 1 0 0 1-1 1h-.6a2 2 0 0 1-3.8 0H9.4a2 2 0 0 1-3.8 0H5a1 1 0 0 1-1-1V13a2.5 2.5 0 0 1 1.5-2.5zm2.2-.2h8.6L15 7.1a.6.6 0 0 0-.5-.4H9.5a.6.6 0 0 0-.5.4zM7 14.6a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm10 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 19c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6z" />
      <circle cx="17" cy="9" r="2.8" />
      <path d="M16.3 13.1c3 .1 5.2 2.3 5.2 5.4v.5h-4.4c0-2.4-.8-4.4-2.3-5.6.5-.2 1-.3 1.5-.3z" />
    </svg>
  );
}

export function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="var(--amber)">
      <path d="M12 2l2.2 6.4L21 11l-6.8 2.6L12 20l-2.2-6.4L3 11l6.8-2.6z" />
    </svg>
  );
}

// Simple Clot street scene: buildings, bell tower, trees and the "EL CLOT" sign.
export function ClotScene() {
  return (
    <svg className="scene" viewBox="0 0 360 150" role="img" aria-label="Il·lustració del barri del Clot">
      <circle cx="300" cy="34" r="16" fill="#F6D58E" />
      <rect x="20" y="58" width="44" height="80" rx="3" fill="#E9A77C" />
      <rect x="64" y="40" width="28" height="98" rx="3" fill="#D98B5F" />
      <path d="M64 40l14-18 14 18z" fill="#C06E47" />
      <rect x="92" y="70" width="52" height="68" rx="3" fill="#F2C29B" />
      <rect x="220" y="62" width="48" height="76" rx="3" fill="#E9A77C" />
      <rect x="268" y="48" width="30" height="90" rx="3" fill="#D98B5F" />
      <path d="M268 48l15-20 15 20z" fill="#C06E47" />
      <rect x="298" y="74" width="46" height="64" rx="3" fill="#F2C29B" />
      <g fill="#FFF6E6" opacity=".9">
        <rect x="28" y="68" width="8" height="10" rx="1" /><rect x="46" y="68" width="8" height="10" rx="1" />
        <rect x="28" y="88" width="8" height="10" rx="1" /><rect x="46" y="88" width="8" height="10" rx="1" />
        <rect x="73" y="54" width="10" height="12" rx="5" />
        <rect x="100" y="80" width="8" height="10" rx="1" /><rect x="116" y="80" width="8" height="10" rx="1" /><rect x="132" y="80" width="6" height="10" rx="1" />
        <rect x="228" y="72" width="8" height="10" rx="1" /><rect x="248" y="72" width="8" height="10" rx="1" />
        <rect x="277" y="62" width="10" height="12" rx="5" />
        <rect x="306" y="84" width="8" height="10" rx="1" /><rect x="324" y="84" width="8" height="10" rx="1" />
      </g>
      <g fill="#4E9B63">
        <circle cx="160" cy="112" r="20" /><circle cx="186" cy="104" r="24" /><circle cx="210" cy="116" r="17" />
        <circle cx="14" cy="122" r="14" /><circle cx="350" cy="120" r="14" />
      </g>
      <g fill="#3B7F4F">
        <rect x="184" y="120" width="5" height="20" /><rect x="158" y="124" width="4" height="16" />
      </g>
      <rect x="0" y="136" width="360" height="14" fill="#CFC7B8" />
      <rect x="112" y="104" width="4" height="34" fill="#5A5A5A" />
      <rect x="84" y="92" width="60" height="18" rx="3" fill="#fff" stroke="#1D3B2F" strokeWidth="2" />
      <text x="114" y="105.5" textAnchor="middle" fontSize="11" fontWeight="900" fill="#1D3B2F" fontFamily="inherit">EL CLOT</text>
    </svg>
  );
}
