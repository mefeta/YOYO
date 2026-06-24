import { Component, type ReactNode } from 'react';
import { PageHeader } from './ui';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <PageHeader title="Unexpected Error" subtitle="Something went wrong." />
          <div className="panel">
            <div className="panel-bd" style={{ padding: 32, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 10, color: '#c43a31', marginBottom: 16 }}>
                {this.state.error?.message || 'An error occurred'}
              </div>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                className="btn btn-primary"
              >
                Return to Command
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
