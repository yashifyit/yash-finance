import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/ErrorState';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState message="The page hit an unexpected error." onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}