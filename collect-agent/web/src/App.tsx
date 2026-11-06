import { AppProvider, useApp } from './store.tsx';
import { useRoute } from './router.ts';
import { Shell } from './components/Shell.tsx';
import { Landing } from './pages/Landing.tsx';
import { Signup } from './pages/Signup.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Invoices } from './pages/Invoices.tsx';
import { Settings } from './pages/Settings.tsx';

function Routed() {
  const r = useRoute();
  const { toast } = useApp();
  const page = r === 'landing' ? <Landing /> : r === 'signup' ? <Signup /> : (
    <Shell route={r}>{r === 'dashboard' ? <Dashboard /> : r === 'invoices' ? <Invoices /> : <Settings />}</Shell>
  );
  return (
    <>
      {page}
      <div aria-live="polite" className="fixed bottom-5 inset-x-0 flex justify-center pointer-events-none z-50 px-4">
        {toast && <div className="bg-ink-900 text-white rounded-xl px-5 py-3 shadow-pop font-medium">{toast}</div>}
      </div>
    </>
  );
}
export const App = () => <AppProvider><Routed /></AppProvider>;
