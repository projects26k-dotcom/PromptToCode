import React from 'react';
import { AlertCircle, RotateCcw, Wrench } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

const DEFAULT_PACKAGE_JSON = JSON.stringify(
  {
    name: 'react-prompttocode',
    version: '1.0.0',
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
    },
  },
  null,
  2
);

export default class SandpackErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Sandpack ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleResetPackageJson = () => {
    try {
      useProjectStore.getState().updateFileContent('/package.json', DEFAULT_PACKAGE_JSON);
      useProjectStore.getState().updateFileContent('package.json', DEFAULT_PACKAGE_JSON);
    } catch {}
    this.handleReload();
  };

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || String(this.state.error);

      return (
        <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center mb-3 shadow-lg shadow-rose-950/40">
            <AlertCircle className="w-6 h-6 text-rose-400" />
          </div>

          <h3 className="text-sm font-semibold text-rose-200 mb-1">
            Preview Render Error
          </h3>

          <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed font-mono bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-left break-all text-[11px]">
            {errMsg}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Preview</span>
            </button>

            <button
              onClick={this.handleResetPackageJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset package.json</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
