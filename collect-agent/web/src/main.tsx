import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// גופנים מקומיים (בלי CDN — אין שליחת כתובת IP של המבקר לצד שלישי). עברית + לטינית.
import '@fontsource/heebo/hebrew-400.css';
import '@fontsource/heebo/hebrew-500.css';
import '@fontsource/heebo/hebrew-700.css';
import '@fontsource/heebo/400.css';
import '@fontsource/heebo/500.css';
import '@fontsource/heebo/700.css';
import '@fontsource/rubik/hebrew-600.css';
import '@fontsource/rubik/hebrew-800.css';
import '@fontsource/rubik/600.css';
import '@fontsource/rubik/800.css';
import './brand/tokens.css';
import { App } from './App.tsx';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
