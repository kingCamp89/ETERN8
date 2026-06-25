import { APP_THEMES } from '@/lib/themes';
import { CheckCircle2 } from 'lucide-react';

function themeSwatch(theme) {
  if (theme.ambience) {
    const { light, accent, mid, deep } = theme.ambience;
    return `linear-gradient(135deg, hsl(${light}) 0%, hsl(${accent}) 38%, hsl(${mid}) 72%, hsl(${deep}) 100%)`;
  }
  return `linear-gradient(135deg, ${theme.preview.bg} 40%, ${theme.preview.accent} 100%)`;
}

export default function ThemePicker({ value, onChange, label = 'Theme' }) {
  return (
    <div className="space-y-1.5">
      {label && <p className="text-body font-medium">{label}</p>}
      <div className="grid grid-cols-2 gap-2">
        {APP_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={`relative rounded-xl border-2 p-3 text-left transition-all bg-card text-card-foreground ${
              value === theme.id
                ? 'border-primary shadow-sm'
                : 'border-border hover:border-primary/40'
            }`}
          >
            {value === theme.id && (
              <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />
            )}
            {/* Colour swatch */}
            <div
              className="w-full h-8 rounded-lg mb-2"
              style={{ background: themeSwatch(theme) }}
            />
            <p className="text-caption font-semibold leading-tight">
              {theme.emoji} {theme.name}
            </p>
            <p className="text-caption text-muted-foreground">{theme.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}