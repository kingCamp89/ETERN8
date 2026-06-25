import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BrandWordmark from '@/components/shared/BrandWordmark';
import { Mail, Heart, Image, Mic, Video, Quote } from 'lucide-react';
import { format } from 'date-fns';

const MEDIA_LABELS = {
  photo: { icon: Image, label: 'Photo — view in ETRN8 app' },
  voice: { icon: Mic, label: 'Voice recording — listen in ETRN8 app' },
  video: { icon: Video, label: 'Video — watch in ETRN8 app' },
};

export default function DeliveryPreviewDialog({ group, open, onOpenChange }) {
  if (!group) return null;

  const { date, memories } = group;
  const userName = memories[0]?.created_by_name || 'your loved one';
  const recipientName = memories[0]?.loved_one_name || 'there';
  const memoryCount = memories.length;
  const formattedDate = format(new Date(date), 'MMMM d, yyyy');

  const subject = memoryCount === 1
    ? `A special message from ${userName}: ${memories[0].title || memories[0].scheduled_occasion || 'A memory for you'}`
    : `${memoryCount} special messages from ${userName} — ${formattedDate}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-primary" />
            Delivery Preview
          </DialogTitle>
          <DialogDescription>
            {memoryCount > 1
              ? `${memoryCount} messages grouped into one email, delivered to ${recipientName} on ${formattedDate}.`
              : `This is what ${recipientName} will receive by email on ${formattedDate}.`}
          </DialogDescription>
        </DialogHeader>

        {/* Email mockup */}
        <div className="rounded-2xl border border-border overflow-hidden bg-background">
          {/* Email header */}
          <div className="bg-secondary/60 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-gradient-gold flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <BrandWordmark size="sm" className="truncate" />
                <p className="text-[10px] text-muted-foreground">noreply@etrn8.app</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-foreground">To:</span> {recipientName}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Subject:</span> {subject}
            </p>
          </div>

          {/* Email body — story style */}
          <div className="px-5 py-5 space-y-4">
            <p className="font-body text-sm">Dear {recipientName},</p>
            <p className="font-body text-sm">
              {userName} has preserved {memoryCount} {memoryCount === 1 ? 'special memory' : 'special memories'} for you.
            </p>

            {/* Story date banner */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-primary/20" />
              <span className="font-heading text-sm font-semibold text-primary px-2">
                {formattedDate}
              </span>
              <div className="flex-1 h-px bg-primary/20" />
            </div>

            {/* Each memory as a story chapter */}
            {memories.map((memory, idx) => {
              const mediaInfo = MEDIA_LABELS[memory.memory_type];
              return (
                <div key={memory.id} className="space-y-2">
                  {memoryCount > 1 && (
                    <p className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Chapter {idx + 1}
                    </p>
                  )}

                  {memory.scheduled_occasion && (
                    <p className="font-body text-xs text-muted-foreground italic">
                      Occasion: {memory.scheduled_occasion}
                    </p>
                  )}

                  {memory.title && (
                    <div className="flex items-start gap-1.5">
                      <Quote className="w-4 h-4 text-primary/40 flex-shrink-0 mt-0.5" />
                      <p className="font-heading text-lg font-medium leading-snug">
                        {memory.title}
                      </p>
                    </div>
                  )}

                  {memory.content && (
                    <p className="font-display text-base leading-relaxed text-foreground/80 whitespace-pre-wrap pl-5">
                      {memory.content}
                    </p>
                  )}

                  {mediaInfo && (
                    <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2.5 text-xs text-muted-foreground pl-5">
                      <mediaInfo.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{mediaInfo.label}</span>
                    </div>
                  )}

                  {idx < memories.length - 1 && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="flex-1 border-t border-dashed border-border/50" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Closing */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-primary/20" />
              <Heart className="w-3 h-3 text-primary/40" />
              <div className="flex-1 h-px bg-primary/20" />
            </div>

            <div className="pt-1">
              <p className="font-body text-sm">With love,</p>
              <p className="font-heading italic text-muted-foreground text-sm">The ETRN8 Team</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}