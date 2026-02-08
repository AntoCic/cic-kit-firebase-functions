

// functions/src/features/push/sendUserPush.ts
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import type { WebpushConfig, WebpushNotification } from 'firebase-admin/messaging';
import { db, messaging } from '../../admin.js';
import { getHttpsDefaults } from '../../config/env.js';

export const MAX_FCM_CHUNK = 500;
export function chunk<T>(arr: T[], n = MAX_FCM_CHUNK): T[][] {
  return arr.reduce<T[][]>((acc, _, i) => (i % n ? acc : [...acc, arr.slice(i, i + n)]), []);
}

type SendUserPushInput = {
  toUid: string;
  title: string;
  options?: WebpushNotification;
};

async function handleSendUserPush(request: CallableRequest<SendUserPushInput>) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login richiesto.')
  }

  const { toUid, title, options = {} } = (request.data ?? {}) as SendUserPushInput
  if (!toUid || !title) {
    throw new HttpsError('invalid-argument', 'toUid e title sono obbligatori')
  }

  const userDoc = await db.collection('users').doc(toUid).get()
  if (!userDoc.exists) {
    console.warn('sendUserPush: user non trovato', { toUid });
    logger.warn('sendUserPush: user non trovato', { toUid })
    return { sent: 0, total: 0, cleaned: 0 }
  }

  const fcmTokens: string[] = Array.isArray(userDoc.get('fcmTokens'))
    ? (userDoc.get('fcmTokens') as string[]).filter(Boolean)
    : []

  if (!fcmTokens.length) {
    return { sent: 0, total: 0, cleaned: 0 }
  }

  const { silent, ...ops } = options
  const webpush: WebpushConfig = {
    notification: {
      title,
      ...(silent === null ? {} : { silent }),
      ...ops
    },
    fcmOptions: {
      link: options?.data?.url ?? '/'
    },
    headers: {
      TTL: '3600',
      Urgency: 'normal',
    },
  }

  let sent = 0
  let cleaned = 0
  let stillValid = new Set(fcmTokens)

  for (const part of chunk(fcmTokens)) {
    const res = await messaging.sendEachForMulticast({
      tokens: part,
      notification: { title, body: options?.body ?? 'undefined' },
      webpush,
    })

    sent += res.responses.filter(r => r.success).length

    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code || ''
        const token = part[i]
        if ((
          code.includes('registration-token-not-registered') ||
          code.includes('invalid-argument')
        ) && token) {
          if (stillValid.delete(token)) cleaned++
        }
      }
    })
  }

  if (cleaned > 0) {
    await db.collection('users').doc(toUid).update({
      fcmTokens: Array.from(stillValid),
    })
  }
  return { sent, total: fcmTokens.length, cleaned }
}

export function createSendUserPush(httpsDefaults = getHttpsDefaults()) {
  return onCall(httpsDefaults, handleSendUserPush);
}