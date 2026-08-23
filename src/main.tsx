import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// ⚡ מגן-רענון ל-chunks עצלים (VISION-LIGHT ‏#13): deploy מחליף את קובצי-ה-assets
// המגובבים ⇒ ייבוא-עצל מלשונית ישנה נופל (404). רענון-עצמי חד-פעמי מרים את
// ה-index הטרי; שומר-קצב (60ש׳) מונע לולאת-רענונים אם גם הרענון נכשל.
window.addEventListener('vite:preloadError', (e) => {
  const KEY = 'maor_chunk_reload';
  let last = 0;
  try { last = Number(sessionStorage.getItem(KEY) ?? 0); } catch { /* storage חסום */ }
  if (Date.now() - last < 60_000) return; // נותנים ל-ErrorBoundary לתפוס
  e.preventDefault();
  try { sessionStorage.setItem(KEY, String(Date.now())); } catch { /* storage חסום */ }
  window.location.reload();
});
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
