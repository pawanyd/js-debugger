import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
          <div className="max-w-md p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The visualizer encountered an error. This usually happens when:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
              <li>Code generates too many execution steps</li>
              <li>Code uses unsupported advanced features</li>
              <li>Animation library gets overwhelmed</li>
            </ul>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Reload Page
            </button>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Technical details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-slate-900 rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
