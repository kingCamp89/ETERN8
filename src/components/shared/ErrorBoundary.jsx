import { Component } from 'react';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({ reset: this.handleReset });
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <KeepsakeCard className="text-center py-10 max-w-md w-full">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-destructive/60" />
            </div>
            <h3 className="text-section-title mb-2">Something went wrong</h3>
            <p className="text-caption max-w-xs mx-auto mb-4">
              An unexpected error occurred. Try refreshing the page.
            </p>
            <Button onClick={this.handleReset} variant="outline" className="rounded-xl gap-2">
              <RefreshCw className="w-4 h-4" /> Try again
            </Button>
          </KeepsakeCard>
        </div>
      );
    }

    return this.props.children;
  }
}
