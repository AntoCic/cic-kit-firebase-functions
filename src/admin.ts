// functions/src/libs/admin.ts
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const _app: App[] = getApps();
export const app: App = (_app.length && _app?.[0]) ? _app[0] : initializeApp();
export const db = getFirestore(app);
export const messaging = getMessaging(app);
