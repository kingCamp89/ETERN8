import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';
import { PDF_TEMPLATES } from '@/lib/generateStoryPDF';

const templateById = Object.fromEntries(PDF_TEMPLATES.map((t) => [t.id, t]));

const examples = [
  {
    id: 'aurora',
    title: 'Letters to Aurora',
    subtitle: 'Words she will carry forever',
    templateId: 'blush',
    memories: 28,
    pages: 64,
    photo:
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&h=800&fit=crop&q=80',
  },
  {
    id: 'dad',
    title: "Dad's Stories",
    subtitle: 'Wisdom, laughter & legacy',
    templateId: 'warm',
    memories: 42,
    pages: 96,
    photo:
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=800&fit=crop&q=80',
  },
  {
    id: 'life',
    title: 'A Life Well Lived',
    subtitle: 'A family archive in print',
    templateId: 'sepia',
    memories: 56,
    pages: 120,
    photo:
      'https://images.unsplash.com/photo-1609220136736-4435c08c2643?w=600&h=800&fit=crop&q=80',
  },
  {
    id: 'garden',
    title: 'Our Garden Years',
    subtitle: 'Seasons of joy together',
    templateId: 'sage',
    memories: 34,
    pages: 72,
    photo:
      'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=600&h=800&fit=crop&q=80',
  },
];

function ExampleBookCover({ book, index }) {
  const theme = templateById[book.templateId];
  const accent = theme?.preview?.accent ?? '#c4708a';
  const cream = theme?.preview?.bg ?? '#fdf6f8';
  const ink = theme?.preview?.text ?? '#3d2028';

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 w-[11.5rem] sm:w-[12.75rem] group"
      style={{ perspective: '1200px' }}
    >
      <div
        className="relative transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-hover:scale-[1.02]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute -inset-3 rounded-2xl opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
          style={{ background: `radial-gradient(ellipse at 50% 80%, ${accent}55, transparent 70%)` }}
          aria-hidden
        />

        {/* Page stack */}
        <div
          className="absolute top-3 left-[10px] right-[-3px] bottom-[-2px] rounded-r-lg border border-black/[0.06]"
          style={{ backgroundColor: cream, boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}
          aria-hidden
        />
        <div
          className="absolute top-1.5 left-[5px] right-[-1px] bottom-[-1px] rounded-r-lg border border-black/[0.05]"
          style={{ backgroundColor: cream, opacity: 0.92 }}
          aria-hidden
        />

        {/* Hardcover */}
        <div
          className="relative flex h-[17.5rem] sm:h-[19rem] overflow-hidden rounded-r-2xl shadow-[4px_8px_28px_rgba(0,0,0,0.18),1px_2px_0_rgba(255,255,255,0.5)_inset]"
          style={{ backgroundColor: cream }}
        >
          {/* Spine */}
          <div
            className="relative z-10 w-[14px] flex-shrink-0 border-r border-black/10"
            style={{
              background: `linear-gradient(90deg, ${ink}ee 0%, ${accent} 35%, ${accent}cc 70%, ${ink}99 100%)`,
              boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.25)',
            }}
            aria-hidden
          >
            <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-white/20" />
          </div>

          {/* Cover face */}
          <div className="relative flex min-w-0 flex-1 flex-col">
            {/* Photo panel */}
            <div className="relative h-[58%] overflow-hidden">
              <img
                src={book.photo}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/35" />
              <div
                className="absolute inset-0 opacity-[0.12] mix-blend-multiply"
                style={{ backgroundColor: accent }}
                aria-hidden
              />

              {/* Foil corner mark */}
              <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-white/15 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-white/90" strokeWidth={1.75} />
              </div>
            </div>

            {/* Title band — editorial layout */}
            <div
              className="relative flex flex-1 flex-col justify-between px-3.5 pb-3 pt-3"
              style={{ backgroundColor: cream, color: ink }}
            >
              <div
                className="absolute inset-x-3.5 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                aria-hidden
              />

              <div className="space-y-1 pt-1">
                <p
                  className="font-brand text-[0.5rem] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: accent }}
                >
                  Memory story
                </p>
                <h3 className="font-heading text-[1.05rem] font-semibold leading-[1.15] tracking-wide line-clamp-2">
                  {book.title}
                </h3>
                <p
                  className="font-heading text-[0.68rem] italic leading-snug opacity-75 line-clamp-2"
                  style={{ color: ink }}
                >
                  {book.subtitle}
                </p>
              </div>

              {/* Page edge detail */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-px flex-1" style={{ backgroundColor: `${accent}44` }} />
                  <BookOpen className="h-3 w-3 opacity-50" style={{ color: accent }} strokeWidth={1.5} />
                  <div className="h-px flex-1" style={{ backgroundColor: `${accent}44` }} />
                </div>
                <div className="flex justify-between gap-1 px-0.5">
                  {[...Array(14)].map((_, k) => (
                    <div
                      key={k}
                      className="h-[2px] flex-1 rounded-full"
                      style={{ backgroundColor: `${accent}${k % 3 === 0 ? '55' : '28'}` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Paper texture overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
              }}
              aria-hidden
            />
          </div>

          {/* Right page edge */}
          <div
            className="absolute right-0 top-2 bottom-2 w-[3px] rounded-r-sm"
            style={{
              background: `linear-gradient(180deg, ${cream}, ${accent}33, ${cream})`,
              boxShadow: '1px 0 2px rgba(0,0,0,0.06)',
            }}
            aria-hidden
          />
        </div>

        {/* Surface shadow */}
        <div
          className="absolute -bottom-3 left-4 right-2 h-4 rounded-[100%] bg-black/15 blur-md transition-all duration-500 group-hover:left-6 group-hover:bg-black/20"
          aria-hidden
        />
      </div>

      {/* Meta */}
      <div className="mt-4 space-y-1.5 px-0.5 text-center">
        <span
          className="inline-block rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          {theme?.name}
        </span>
        <p className="text-caption text-muted-foreground">
          {book.memories} memories · {book.pages} pages
        </p>
      </div>
    </motion.article>
  );
}

export default function BookExamples() {
  return (
    <section className="mb-1" aria-label="Example memory books">
      <div className="mb-5 space-y-2 text-center">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
          <p className="font-brand text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Premium keepsakes
          </p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
        </div>
        <p className="font-heading text-base font-medium text-foreground/90 sm:text-lg">
          Crafted like a professional storybook
        </p>
        <p className="mx-auto max-w-md text-caption text-muted-foreground leading-relaxed">
          Full-bleed photos, elegant typography, and archival-quality layouts — the same
          finish you would expect from a luxury printed memoir.
        </p>
      </div>

      <div
        className="-mx-1 flex gap-5 overflow-x-auto px-1 pb-4 pt-1 scrollbar-hide sm:gap-6 sm:justify-center sm:overflow-visible sm:flex-wrap"
        style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        {examples.map((book, i) => (
          <ExampleBookCover key={book.id} book={book} index={i} />
        ))}
      </div>
    </section>
  );
}
