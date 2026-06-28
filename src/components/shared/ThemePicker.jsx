import { APP_THEMES } from '@/lib/themes';

function MiniAppPreview({ theme }) {
  const { bg, accent, text } = theme.preview;
  // Derive a card color (slightly lighter than bg) and muted text
  const isDark = theme.id === 'midnight';
  const cardBg = isDark ? '#1e2535' : '#ffffff';
  const mutedText = isDark ? '#8a9bbf' : '#9a8e8a';
  const borderColor = isDark ? '#2d3650' : 'rgba(0,0,0,0.08)';

  return (
    <div
      className="w-full h-16 rounded-lg overflow-hidden relative"
      style={{ background: bg, border: `1px solid ${borderColor}` }}
    >
      {/* Simulated nav bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-around px-2"
        style={{ background: cardBg, borderTop: `1px solid ${borderColor}` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: i === 2 ? 5 : 4,
              height: i === 2 ? 5 : 4,
              background: i === 2 ? accent : mutedText,
              opacity: i === 2 ? 1 : 0.5,
            }}
          />
        ))}
      </div>
      {/* Simulated content card */}
      <div
        className="absolute top-2.5 left-2 right-2 rounded-md px-2 py-1.5"
        style={{ background: cardBg, border: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-1.5">
          <div className="rounded-full shrink-0" style={{ width: 7, height: 7, background: accent }} />
          <div className="rounded-sm flex-1" style={{ height: 3, background: text, opacity: 0.6 }} />
          <div
            className="rounded-sm shrink-0"
            style={{ width: 14, height: 6, background: accent, opacity: 0.9, borderRadius: 3 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ThemePicker({ value, onChange, label = 'Theme' }) {
  return (
    <div className="space-y-1.5">
      {label && <p className="text-body font-medium">{label}</p>}
      <div className="grid grid-cols-2 gap-2">
        {APP_THEMES.map((theme) => {
          const isSelected = value === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange(theme.id)}
              className={`relative rounded-xl border-2 p-2.5 text-left transition-all bg-card text-card-foreground ${
                isSelected
                  ? 'border-primary shadow-sm ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: theme.preview.accent }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <MiniAppPreview theme={theme} />
              <p className="text-caption font-semibold leading-tight mt-2">
                {theme.emoji} {theme.name}
              </p>
              <p className="text-caption leading-tight" style={{ color: theme.preview.text, opacity: 0.55, fontSize: '0.65rem' }}>
                {theme.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}