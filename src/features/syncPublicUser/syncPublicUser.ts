import { onDocumentWritten, type DocumentSnapshot, type FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { Change } from 'firebase-functions/v2';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../admin.js';
import { getRegion } from '../../config/env.js';

type PublicUserKeys = string[];

function pickPublicFields(user: Record<string, any>, publicKeys: PublicUserKeys) {
  const out: Record<string, any> = {};

  for (const key of publicKeys) {
    if (typeof key !== 'string') continue;
    if (key in user) out[key] = user[key];
  }

  return out;
}

function maskBirthDate(date: string): string {
  const match = /^(\d{2}\/\d{2})\/\d{4}$/.exec(date);
  return (match && match[1]) ? match[1] : date;
}

type UserWriteEvent = FirestoreEvent<Change<DocumentSnapshot> | undefined, { userId: string }>;

// users -> users_public sync
async function handleSyncPublicUser(event: UserWriteEvent) {
  const id = event.params.userId;

  const beforeExists = event.data?.before.exists ?? false;
  const afterExists = event.data?.after.exists ?? false;

  const publicRef = db.doc(`users_public/${id}`);

  // Se lo user viene eliminato, elimina anche la versione pubblica
  if (beforeExists && !afterExists) {
    await publicRef.delete();
    return;
  }

  // Se non esiste after, non fare nulla (caso strano ma safe)
  if (!afterExists) return;

  const user = event.data!.after.data() as Record<string, any>;

  // publicKey: lista campi da esporre
  const publicKeys: PublicUserKeys = Array.isArray(user.publicKey) ? user.publicKey : [];

  const picked = pickPublicFields(user, publicKeys);

  if (user.birthHideYear === true && typeof picked.birthDate === 'string') {
    picked.birthDate = maskBirthDate(picked.birthDate);
  }

  // opzionale: metadati utili
  const updatedAt: Timestamp = (user.updatedAt as Timestamp | undefined) ?? Timestamp.now();
  const createdAt: Timestamp = (user.createdAt as Timestamp | undefined) ?? updatedAt;
  const name = typeof user.name === 'string' ? user.name : '';
  const surname = typeof user.surname === 'string' ? user.surname : '';

  // Set "merge: false" cosi se togli una key da publicKey, sparisce anche dal doc pubblico
  await publicRef.set(
    {
      ...picked,
      id,
      name,
      surname,
      createdAt,
      updatedAt,
    },
    { merge: false }
  );
}

export function createSyncPublicUser(region = getRegion()) {
  return onDocumentWritten({ region, document: 'users/{userId}' }, handleSyncPublicUser);
}

export const syncPublicUser = createSyncPublicUser();
