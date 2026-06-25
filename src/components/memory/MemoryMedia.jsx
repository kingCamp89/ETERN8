import { format } from 'date-fns';
import { FileText, Image, Mic, Video, Calendar, Clock, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons = {
  text: FileText,
  photo: Image,
  voice: Mic,
  video: Video,
};

const typeLabels = {
  text: 'Written memory',
  photo: 'Photo memory',
  voice: 'Voice memory',
  video: 'Video memory',
};

export function MemoryMediaPreview({ memory, className, large = false }) {
  const TypeIcon = typeIcons[memory.memory_type] || FileText;

  if (memory.memory_type === 'photo' && memory.media_url) {
    return (
      <div className={cn('overflow-hidden rounded-2xl ring-1 ring-border/30', className)}>
        <img
          src={memory.media_url}
          alt={memory.title}
          className={cn(
            'w-full object-cover transition-transform duration-500',
            large ? 'max-h-[28rem]' : 'max-h-80 hover:scale-[1.02]',
          )}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  if (memory.memory_type === 'video' && memory.media_url) {
    if (large) {
      return (
        <div className={cn('overflow-hidden rounded-2xl ring-1 ring-border/30', className)}>
          <video src={memory.media_url} controls className="w-full" />
        </div>
      );
    }
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/30 to-accent/20 ring-1 ring-border/30',
          'flex items-center justify-center',
          large ? 'h-56' : 'h-36',
          className,
        )}
      >
        <div className="flex flex-col items-center gap-2 text-primary/70">
          <div className="w-12 h-12 rounded-full bg-card/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Video className="w-5 h-5" />
          </div>
          <span className="text-caption font-medium">Tap to watch</span>
        </div>
      </div>
    );
  }

  if (memory.memory_type === 'voice') {
    return (
      <div
        className={cn(
          'rounded-2xl bg-gradient-to-br from-primary/8 via-secondary/30 to-accent/15 ring-1 ring-border/30',
          large ? 'p-5' : 'p-4 mx-3 mt-2',
          className,
        )}
      >
        <div className={cn('flex gap-3', large ? 'flex-col sm:flex-row sm:items-center' : 'items-center')}>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mic className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-body font-medium text-foreground">Voice recording</p>
              {!large && <p className="text-caption">Tap to listen</p>}
            </div>
          </div>
          {large && memory.media_url && (
            <audio src={memory.media_url} controls className="w-full min-w-0" />
          )}
        </div>
      </div>
    );
  }

  if (memory.memory_type === 'text' || !memory.media_url) {
    return (
      <div
        className={cn(
          'rounded-2xl bg-gradient-to-br from-accent/20 via-secondary/20 to-transparent ring-1 ring-border/20',
          large ? 'p-6' : 'p-4 mx-3 mt-2',
          className,
        )}
      >
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-9 h-9 rounded-xl bg-card/60 flex items-center justify-center">
            <TypeIcon className="w-4 h-4 text-primary/70" />
          </div>
          <span className="text-caption font-medium italic">A written keepsake</span>
        </div>
      </div>
    );
  }

  return null;
}

export function MemoryMetaChips({ memory, memoryDate, className, showDate = true }) {
  const TypeIcon = typeIcons[memory.memory_type] || FileText;
  const date = memoryDate || memory.memory_date || memory.created_date;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-caption text-muted-foreground">
        <TypeIcon className="w-3 h-3" />
        {typeLabels[memory.memory_type] || memory.memory_type}
      </span>
      {showDate && date && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-caption text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {format(new Date(date), 'MMMM d, yyyy')}
        </span>
      )}
      {memory.is_scheduled && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-caption text-primary">
          <Clock className="w-3 h-3" />
          Scheduled
        </span>
      )}
      {(memory.is_legacy || memory.delivery_type === 'legacy') && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-caption text-primary">
          <Heart className="w-3 h-3" />
          Legacy
        </span>
      )}
    </div>
  );
}
