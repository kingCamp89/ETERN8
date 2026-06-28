import IntroExperience from '@/components/shared/IntroExperience';

export default function IntroDialog({ open, onClose }) {
  if (!open) return null;

  return (
    <IntroExperience
      mode="dialog"
      completeLabel="Done"
      onComplete={onClose}
      onDismiss={onClose}
    />
  );
}
