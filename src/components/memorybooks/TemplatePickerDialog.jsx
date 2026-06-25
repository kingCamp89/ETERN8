import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PDF_TEMPLATES } from '@/lib/generateStoryPDF';
import { Download, CheckCircle2 } from 'lucide-react';

export default function TemplatePickerDialog({ open, onOpenChange, onGenerate, isGenerating }) {
  const [selected, setSelected] = useState('blush');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Choose a Style</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">Pick a template for your printed memory book.</p>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {PDF_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => setSelected(tpl.id)}
              className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                selected === tpl.id ? 'border-primary shadow-sm' : 'border-border hover:border-primary/40'
              }`}
            >
              {selected === tpl.id && (
                <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />
              )}
              {/* Mini preview */}
              <div
                className="w-full h-14 rounded-lg mb-2 flex flex-col items-center justify-center gap-1 overflow-hidden"
                style={{ backgroundColor: tpl.preview.bg }}
              >
                <div
                  className="w-full h-1 rounded-full"
                  style={{ backgroundColor: tpl.preview.accent }}
                />
                <div className="w-12 h-1.5 rounded-full mt-1" style={{ backgroundColor: tpl.preview.accent, opacity: 0.7 }} />
                <div className="w-16 h-1 rounded-full" style={{ backgroundColor: tpl.preview.text, opacity: 0.2 }} />
                <div className="w-14 h-1 rounded-full" style={{ backgroundColor: tpl.preview.text, opacity: 0.15 }} />
              </div>
              <p className="text-xs font-semibold">{tpl.name}</p>
              <p className="text-xs text-muted-foreground">{tpl.description}</p>
            </button>
          ))}
        </div>

        <Button
          onClick={() => onGenerate(selected)}
          disabled={isGenerating}
          className="w-full rounded-xl gap-2 mt-1"
        >
          <Download className="w-4 h-4" />
          {isGenerating ? 'Generating PDF...' : 'Download PDF'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}