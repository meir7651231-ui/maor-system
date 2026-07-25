import { Component, type ReactNode } from 'react';

/**
 * גבול-שגיאה גלובלי — אפליקציה local-first ללא שרת: חריגה לא-תפוסה ב-render
 * הייתה מפרקת את כל העץ למסך לבן קבוע. כאן תופסים, מציגים הודעה עברית מרגיעה
 * (הנתונים שמורים מקומית) ומאפשרים רענון, במקום אובדן-מסך שקט.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };

  static getDerivedStateFromError(err: Error) {
    return { err };
  }

  componentDidCatch(err: Error) {
    console.error('ErrorBoundary:', err);
  }

  render() {
    if (this.state.err) {
      return (
        <div dir="rtl" style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 520, margin: '40px auto' }}>
          <h2>אירעה שגיאה בלתי-צפויה</h2>
          <p>הנתונים שלך שמורים מקומית ולא אבדו. נסו לרענן את הדף.</p>
          <button
            type="button"
            onClick={() => location.reload()}
            style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer', borderRadius: 8 }}
          >
            רענון
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
