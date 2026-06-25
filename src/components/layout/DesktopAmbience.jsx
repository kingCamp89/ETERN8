/**
 * Desktop canvas — lg+ only.
 * Wave colours come from --ambience-* tokens, set per theme in themes.js.
 */
export default function DesktopAmbience() {
  return (
    <div
      className="desktop-ambience pointer-events-none fixed inset-0 z-0 hidden lg:block"
      aria-hidden="true"
    >
      <div className="desktop-ambience-sky" />

      <div className="desktop-ambience-waves">
        <svg
          className="desktop-ambience-waves-svg"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="etern8-soft-blur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
            <filter id="etern8-wave-ridge" x="-2%" y="-4%" width="104%" height="108%">
              <feDropShadow
                dx="0"
                dy="-1.5"
                stdDeviation="0"
                floodColor="var(--ambience-ridge)"
                floodOpacity="0.14"
              />
            </filter>
          </defs>

          <ellipse
            className="desktop-ambience-glow-orb"
            cx="1240"
            cy="310"
            rx="260"
            ry="210"
            filter="url(#etern8-soft-blur)"
          />

          <g filter="url(#etern8-wave-ridge)">
            <path
              className="desktop-ambience-wave desktop-ambience-wave--deep"
              d="M-120,868 C220,828 420,892 640,852 C860,812 1060,878 1280,838 C1460,805 1540,848 1720,818 L1720,940 L-120,940 Z"
            />
            <path
              className="desktop-ambience-wave desktop-ambience-wave--mid"
              d="M-120,788 C200,748 460,808 680,762 C900,716 1120,782 1340,736 C1500,705 1580,752 1720,722 L1720,940 L-120,940 Z"
            />
            <path
              className="desktop-ambience-wave desktop-ambience-wave--accent"
              d="M-120,708 C240,662 500,722 720,676 C940,630 1160,696 1380,650 C1520,620 1600,668 1720,638 L1720,940 L-120,940 Z"
            />
            <path
              className="desktop-ambience-wave desktop-ambience-wave--light"
              d="M-120,628 C280,578 540,638 760,592 C980,546 1200,612 1420,566 C1560,536 1640,584 1720,554 L1720,940 L-120,940 Z"
            />
          </g>
        </svg>
      </div>

      <div className="desktop-ambience-center-veil" />
      <div className="desktop-ambience-frame" />
    </div>
  );
}
