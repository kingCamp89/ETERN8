// ETERN8 brand icon set — elegant line-art icons with coral-to-rose gradient.
// Matches the brand guide: medium-weight monoline strokes, rounded corners.

function BrandIcon({ children, className = 'w-5 h-5', strokeWidth = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8C8B6" />
          <stop offset="50%" stopColor="#E89A9A" />
          <stop offset="100%" stopColor="#D56A8A" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#brand-grad)" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

export function BrandHeart({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </BrandIcon>
  );
}

export function BrandGift({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <path d="M20 12v10H4V12" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7" />
    </BrandIcon>
  );
}

export function BrandClock({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </BrandIcon>
  );
}

export function BrandCalendar({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 10h18" />
    </BrandIcon>
  );
}

export function BrandSparkle({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
    </BrandIcon>
  );
}

export function BrandPen({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </BrandIcon>
  );
}

export function BrandMic({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </BrandIcon>
  );
}

export function BrandCamera({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7l1.5-2h5L16 7" />
      <circle cx="12" cy="13" r="3" />
    </BrandIcon>
  );
}

export function BrandVideo({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="M22 8l-6 4 6 4z" />
    </BrandIcon>
  );
}

export function BrandHome({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </BrandIcon>
  );
}

export function BrandUsers({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </BrandIcon>
  );
}

export function BrandUserPlus({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </BrandIcon>
  );
}

export function BrandUser({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </BrandIcon>
  );
}

export function BrandEnvelope({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </BrandIcon>
  );
}

export function BrandLock({ className, strokeWidth }) {
  return (
    <BrandIcon className={className} strokeWidth={strokeWidth}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </BrandIcon>
  );
}