import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// themes.css לפני global.css — כדי שמצב ניגודיות גבוהה (ב-global) ינצח ערכת נושא
import './styles/themes.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
