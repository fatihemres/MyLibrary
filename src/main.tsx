import { t } from './i18n';
import React, { Component, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './desktop.css';
import './foundation.css';
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: '' };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <main>
        <h1>{t('ui.somethingWentWrong')}</h1>
        <p>{t('ui.yourSavedLibraryIsStillOnThisComputerRestartTheApplicationToReopenIt')}</p>
        <pre>{this.state.error}</pre>
        <button onClick={() => window.location.reload()}>{t('ui.reloadApplication')}</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
