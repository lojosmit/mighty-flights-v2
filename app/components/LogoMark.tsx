import type { SVGProps } from "react";

export default function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 80"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {/* Left wing feathers — gold, fanning upward */}
      <path d="M 55,38 C 42,33 16,35 6,40 C 16,46 42,47 55,43 Z" fill="#B8985A" />
      <path d="M 55,34 C 42,26 16,24 9,28 C 16,33 42,36 55,38 Z" fill="#B8985A" />
      <path d="M 54,30 C 40,20 18,16 14,17 C 18,23 40,30 54,34 Z" fill="#B8985A" />

      {/* Right wing feathers — mirrored */}
      <path d="M 105,38 C 118,33 144,35 154,40 C 144,46 118,47 105,43 Z" fill="#B8985A" />
      <path d="M 105,34 C 118,26 144,24 151,28 C 144,33 118,36 105,38 Z" fill="#B8985A" />
      <path d="M 106,30 C 120,20 142,16 146,17 C 142,23 120,30 106,34 Z" fill="#B8985A" />

      {/* Dartboard segment lines (inner ring r=9 to outer r=25), 8 spokes */}
      <g stroke="currentColor" strokeWidth="0.75" opacity="0.45">
        <line x1="89" y1="40" x2="105" y2="40" />
        <line x1="71" y1="40" x2="55" y2="40" />
        <line x1="80" y1="31" x2="80" y2="15" />
        <line x1="80" y1="49" x2="80" y2="65" />
        <line x1="86.4" y1="33.6" x2="97.7" y2="22.3" />
        <line x1="73.6" y1="46.4" x2="62.3" y2="57.7" />
        <line x1="86.4" y1="46.4" x2="97.7" y2="57.7" />
        <line x1="73.6" y1="33.6" x2="62.3" y2="22.3" />
      </g>

      {/* Dartboard rings */}
      <circle cx="80" cy="40" r="25" stroke="currentColor" strokeWidth="2" />
      <circle cx="80" cy="40" r="16" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="80" cy="40" r="9" stroke="currentColor" strokeWidth="1" />

      {/* Bull — gold outline + fill */}
      <circle cx="80" cy="40" r="5.5" stroke="#B8985A" strokeWidth="1.5" />
      <circle cx="80" cy="40" r="3" fill="#B8985A" />
    </svg>
  );
}
