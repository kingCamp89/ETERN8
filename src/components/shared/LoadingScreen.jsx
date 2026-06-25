import Logo from './Logo';

export default function LoadingScreen({ message = 'Loading your memories...' }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-warm screen-wash z-50">
      <div className="text-center">
        <Logo size="lg" className="mx-auto mb-5" />
        <p className="text-sm text-muted-foreground font-body">{message}</p>
      </div>
    </div>
  );
}
