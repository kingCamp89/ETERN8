import { motion } from 'framer-motion';

const examples = [
  {
    title: "Letters to Aurora",
    photo: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=300&h=400&fit=crop&crop=faces",
    accent: "from-primary/35 to-primary/55",
  },
  {
    title: "Dad's Stories",
    photo: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=300&h=400&fit=crop&crop=faces",
    accent: "from-primary/25 to-secondary/50",
  },
  {
    title: "A Life Well Lived",
    photo: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=300&h=400&fit=crop&crop=faces",
    accent: "from-primary/30 to-accent/45",
  },
];

export default function BookExamples() {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-border" />
        <p className="text-overline normal-case tracking-normal">Example books</p>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}>
        {examples.map((book, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex-shrink-0 w-44 group"
          >
            <div className="relative h-56 w-44">
              {/* Stacked pages behind */}
              <div className="absolute top-2 left-[6px] right-0 bottom-0 rounded-r-md bg-muted/60 shadow-sm" />
              <div className="absolute top-[5px] left-[2px] right-0 bottom-0 rounded-r-md bg-card/80" />

              {/* Main book */}
              <div className="absolute inset-0 rounded-r-xl shadow-lg overflow-hidden flex flex-col group-hover:shadow-xl transition-shadow duration-300">
                {/* Photo cover */}
                <div className="flex-1 relative overflow-hidden">
                  <img
                    src={book.photo}
                    alt={book.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${book.accent}`} />
                  
                  {/* Title overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-10 pb-4 px-3">
                    <p className="text-section-title text-sm text-white leading-tight text-center drop-shadow-md">
                      {book.title}
                    </p>
                  </div>
                </div>

                {/* Page edges at bottom */}
                <div className="bg-card/90 px-3 py-1.5 border-t border-border/40">
                  <div className="flex gap-[2px]">
                    {[...Array(10)].map((_, k) => (
                      <div key={k} className="h-[2px] flex-1 rounded-sm bg-border/60" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Subtle hover shadow */}
              <div className="absolute -bottom-2 left-2 right-2 h-3 bg-foreground/5 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}