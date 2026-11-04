/** Marka işareti: üç düğümlü minik bir akış şeması (başla → işlem → karar). */
export function LogoMark({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b74ff" />
          <stop offset="1" stopColor="#4b32c4" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#logo-g)" />
      <rect x="1" y="1" width="46" height="46" rx="13" stroke="white" strokeOpacity="0.22" strokeWidth="2" />
      {/* bağlantı çizgileri */}
      <path d="M24 15v7M24 31v-1.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      {/* terminal */}
      <rect x="15" y="9" width="18" height="8" rx="4" fill="white" />
      {/* süreç */}
      <rect x="14" y="21.5" width="20" height="8.5" rx="2.5" fill="white" fillOpacity="0.92" />
      {/* karar */}
      <path d="M24 33l7 5-7 5-7-5z" fill="#ffd25e" className={animated ? "logo-diamond" : undefined} />
    </svg>
  );
}
