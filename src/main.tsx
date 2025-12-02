import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './presentation/App';
import { ErrorBoundary } from './presentation/components/ErrorBoundary';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

