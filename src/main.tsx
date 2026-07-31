import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
// themes.css לפני global.css — כדי שמצב ניגודיות גבוהה (ב-global) ינצח ערכת נושא
import './styles/themes.css';
import './styles/global.css';
import './styles/orbit.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
