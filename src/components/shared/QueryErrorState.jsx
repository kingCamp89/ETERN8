import KeepsakeCard from '@/components/shared/KeepsakeCard';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function QueryErrorState({
  title = "Couldn't load data",
  message = 'Something went wrong. Check your connection and try again.',
  onRetry,
  className = '',
}) {
  return (
    <KeepsakeCard className={`text-center py-10 ${className}`.trim()}>
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7 text-destructive/60" />
      </div>
      <h3 className="text-section-title mb-2">{title}</h3>
      <p className="text-caption max-w-xs mx-auto mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="rounded-xl gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      )}
    </KeepsakeCard>
  );
}
