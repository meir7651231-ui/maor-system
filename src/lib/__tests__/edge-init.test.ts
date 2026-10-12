/**
 * ratchet (א)+(ב) — 🌉 מצב-מסונן (12.10.2026): אתחול ה-SDK ב-initCloud, מול SDK מדומה.
 *
 * (א) בלי מתווך ⇒ **בדיוק** הקריאות של היום (getAuth · useDeviceLanguage · initializeFirestore
 *     עם localCache בלבד; ובנפילת-IndexedDB — getFirestore). המבחן הזה נכתב והורץ ירוק על
 *     הקוד **לפני** החיווט, ונשאר זהה אחריו — זו ההוכחה ל"ביט-זהה".
 * (ב) עם מתווך ⇒ ההפניה מוחלת: initializeAuth בלי popupRedirectResolver (אפס gapi/iframe) +
 *     connectAuthEmulator(https://<edge>, disableWarnings) + Firestore עם host/ssl (וגם בנפילת-
 *     IndexedDB — לא getFirestore, שהיה חוזר לגוגל) + שכתוב כתובות-הפונקציות.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const log: unknown[][] = [];
  const APP = { name: '[DEFAULT]' };
  const AUTH: { useDeviceLanguage: () => void; currentUser: null | { getIdToken: () => Promise<string> } } = {
    useDeviceLanguage: () => {
      log.push(['useDeviceLanguage']);
    },
    currentUser: null,
  };
  const FS = { kind: 'firestore' };
  const TAB_MANAGER = { kind: 'tabManager' };
  const LOCAL_CACHE = { kind: 'localCache' };
  const P_IDB = { kind: 'indexedDBLocalPersistence' };
  const P_LOCAL = { kind: 'browserLocalPersistence' };
  const P_SESSION = { kind: 'browserSessionPersistence' };
  return { log, APP, AUTH, FS, TAB_MANAGER, LOCAL_CACHE, P_IDB, P_LOCAL, P_SESSION, failFirestoreInit: { times: 0 } };
});

vi.mock('firebase/app', () => ({
  initializeApp: (fb: unknown) => {
    h.log.push(['initializeApp', fb]);
    return h.APP;
  },
}));

vi.mock('firebase/auth', () => ({
  getAuth: (app: unknown) => {
    h.log.push(['getAuth', app]);
    return h.AUTH;
  },
  initializeAuth: (app: unknown, deps: unknown) => {
    h.log.push(['initializeAuth', app, deps]);
    return h.AUTH;
  },
  connectAuthEmulator: (auth: unknown, url: unknown, opts: unknown) => {
    h.log.push(['connectAuthEmulator', auth, url, opts]);
  },
  indexedDBLocalPersistence: h.P_IDB,
  browserLocalPersistence: h.P_LOCAL,
  browserSessionPersistence: h.P_SESSION,
  EmailAuthProvider: { credential: vi.fn() },
  createUserWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn(),
  reauthenticateWithCredential: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: (app: unknown, settings: unknown) => {
    h.log.push(['initializeFirestore', app, settings]);
    if (h.failFirestoreInit.times > 0) {
      h.failFirestoreInit.times--;
      throw new Error('IndexedDB unavailable / already initialized');
    }
    return h.FS;
  },
  getFirestore: (app: unknown) => {
    h.log.push(['getFirestore', app]);
    return h.FS;
  },
  persistentLocalCache: (opts: unknown) => {
    h.log.push(['persistentLocalCache', opts]);
    return h.LOCAL_CACHE;
  },
  persistentMultipleTabManager: () => {
    h.log.push(['persistentMultipleTabManager']);
    return h.TAB_MANAGER;
  },
  addDoc: vi.fn(),
  collection: vi.fn(),
  deleteField: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  runTransaction: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(),
}));

const FB = {
  apiKey: 'AIzaSyCVvJvJAnTEWSzdtmONXcZyRijHdrvPeIo',
  authDomain: 'maor-system.firebaseapp.com',
  projectId: 'maor-system',
  appId: '1:437845665303:web:955fa5636e5b408ae7de52',
};

/** הקריאות של היום — נעולות לפני החיווט. */
const TODAY = [
  ['initializeApp', FB],
  ['getAuth', h.APP],
  ['useDeviceLanguage'],
  ['persistentMultipleTabManager'],
  ['persistentLocalCache', { tabManager: h.TAB_MANAGER }],
  ['initializeFirestore', h.APP, { localCache: h.LOCAL_CACHE }],
];

async function freshCloud() {
  vi.resetModules();
  return import('../cloud');
}

beforeEach(() => {
  h.log.length = 0;
  h.failFirestoreInit.times = 0;
  h.AUTH.currentUser = null;
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('(א) בלי מתווך — קריאות-האתחול של היום, בדיוק', () => {
  it('initCloud(fb) ⇒ getAuth + useDeviceLanguage + initializeFirestore({localCache}) — ותו לא', async () => {
    const { initCloud } = await freshCloud();
    initCloud(FB);
    expect(h.log).toStrictEqual(TODAY);
    const settings = h.log[5][2] as Record<string, unknown>;
    expect(Object.keys(settings)).toStrictEqual(['localCache']);
  });

  it('נפילת-IndexedDB ⇒ getFirestore(app) כמו היום', async () => {
    const { initCloud } = await freshCloud();
    h.failFirestoreInit.times = 1;
    initCloud(FB);
    expect(h.log).toStrictEqual([...TODAY, ['getFirestore', h.APP]]);
  });

  it('קריאה חוזרת = אידמפוטנטית (אף קריאת-SDK נוספת)', async () => {
    const { initCloud } = await freshCloud();
    initCloud(FB);
    initCloud(FB);
    expect(h.log).toStrictEqual(TODAY);
  });

  it('edge=null מפורש (מה שהחיווט מעביר בלי edgeProxy) ⇒ אותן קריאות בדיוק', async () => {
    const { initCloud } = await freshCloud();
    initCloud(FB, null);
    expect(h.log).toStrictEqual(TODAY);
  });

  it('קריאות-הפונקציות יוצאות לכתובת המקורית (viaEdge = זהות)', async () => {
    const { initCloud, syncGContacts, pullSola, pullNedarim } = await freshCloud();
    initCloud(FB);
    const urls = await callFunctions({ syncGContacts, pullSola, pullNedarim });
    expect(urls).toStrictEqual([
      'https://us-central1-maor-system.cloudfunctions.net/gcontactsSyncNow?org=root',
      'https://us-central1-maor-system.cloudfunctions.net/solaPull?org=root',
      'https://us-central1-maor-system.cloudfunctions.net/nedarimPull?org=root&full=1',
    ]);
  });
});

/** מפעיל את שלוש קריאות-הפונקציות מול fetch מדומה ומחזיר את הכתובות שיצאו. */
async function callFunctions(m: {
  syncGContacts: (u: string) => Promise<unknown>;
  pullSola: (u: string) => Promise<unknown>;
  pullNedarim: (u: string) => Promise<unknown>;
}): Promise<string[]> {
  h.AUTH.currentUser = { getIdToken: async () => 'id-token' };
  const fetchMock = vi.fn(async () => new Response('{"ok":true,"status":{}}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  const base = 'https://us-central1-maor-system.cloudfunctions.net/';
  await m.syncGContacts(base + 'gcontactsSyncNow');
  await m.pullSola(base + 'solaPull');
  await m.pullNedarim(base + 'nedarimPull');
  for (const call of fetchMock.mock.calls as unknown as Array<[string, RequestInit]>) {
    expect(call[1].headers).toStrictEqual({ Authorization: 'Bearer id-token' });
  }
  return (fetchMock.mock.calls as unknown as Array<[string]>).map(([u]) => u);
}

describe('(ב) עם מתווך — ההפניה מוחלת', () => {
  const EDGE = { host: 'edge.orbit-il.com' };

  it('Auth: initializeAuth (אותה התמדה, בלי resolver) + connectAuthEmulator(https://edge, disableWarnings) · Firestore: host+ssl', async () => {
    const { initCloud } = await freshCloud();
    initCloud(FB, EDGE);
    expect(h.log).toStrictEqual([
      ['initializeApp', FB],
      ['initializeAuth', h.APP, { persistence: [h.P_IDB, h.P_LOCAL, h.P_SESSION] }],
      ['connectAuthEmulator', h.AUTH, 'https://edge.orbit-il.com', { disableWarnings: true }],
      ['useDeviceLanguage'],
      ['persistentMultipleTabManager'],
      ['persistentLocalCache', { tabManager: h.TAB_MANAGER }],
      ['initializeFirestore', h.APP, { localCache: h.LOCAL_CACHE, host: 'edge.orbit-il.com', ssl: true }],
    ]);
    // אף קריאה שהייתה פונה לגוגל ישירות / טוענת gapi
    expect(h.log.some(([n]) => n === 'getAuth' || n === 'getFirestore')).toBe(false);
    const deps = h.log[1][2] as Record<string, unknown>;
    expect(Object.keys(deps)).toStrictEqual(['persistence']);
  });

  it('forceLongPolling ⇒ experimentalForceLongPolling (ורק אז)', async () => {
    const { initCloud } = await freshCloud();
    initCloud(FB, { ...EDGE, forceLongPolling: true });
    expect(h.log.at(-1)).toStrictEqual([
      'initializeFirestore',
      h.APP,
      { localCache: h.LOCAL_CACHE, host: 'edge.orbit-il.com', ssl: true, experimentalForceLongPolling: true },
    ]);
  });

  it('נפילת-IndexedDB במצב-מסונן ⇒ Firestore בלי מטמון אבל דרך המתווך (לא getFirestore)', async () => {
    const { initCloud } = await freshCloud();
    h.failFirestoreInit.times = 1;
    initCloud(FB, EDGE);
    expect(h.log.slice(-2)).toStrictEqual([
      ['initializeFirestore', h.APP, { localCache: h.LOCAL_CACHE, host: 'edge.orbit-il.com', ssl: true }],
      ['initializeFirestore', h.APP, { host: 'edge.orbit-il.com', ssl: true }],
    ]);
  });

  it('נפילה כפולה (כבר אותחל) ⇒ המופע הקיים (getFirestore), בלי לזרוק', async () => {
    const { initCloud } = await freshCloud();
    h.failFirestoreInit.times = 2;
    expect(() => initCloud(FB, EDGE)).not.toThrow();
    expect(h.log.at(-1)).toStrictEqual(['getFirestore', h.APP]);
  });

  it('Functions: שלוש הקריאות יוצאות דרך המתווך (מארח-גוגל כמקטע-ראשון), אותם כותרות ופרמטרים', async () => {
    const { initCloud, syncGContacts, pullSola, pullNedarim } = await freshCloud();
    initCloud(FB, EDGE);
    const urls = await callFunctions({ syncGContacts, pullSola, pullNedarim });
    expect(urls).toStrictEqual([
      'https://edge.orbit-il.com/us-central1-maor-system.cloudfunctions.net/gcontactsSyncNow?org=root',
      'https://edge.orbit-il.com/us-central1-maor-system.cloudfunctions.net/solaPull?org=root',
      'https://edge.orbit-il.com/us-central1-maor-system.cloudfunctions.net/nedarimPull?org=root&full=1',
    ]);
  });
});
