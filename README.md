# cic-kit-firebase-functions

Set di Firebase Functions riutilizzabili per progetti CIC.

**Installazione**
```bash
npm i cic-kit-firebase-functions
```

**Peer Dependencies**
```bash
npm i firebase-admin firebase-functions
```

**Uso Consigliato**
```ts
import { cicInit } from 'cic-kit-firebase-functions';

const { sendUserPush, syncPublicUser } = cicInit({
  region: 'europe-west1',
  https: { cors: true },
});

export { sendUserPush, syncPublicUser };
```

**Uso Avanzato (Factory)**
```ts
import { createSendUserPush, createSyncPublicUser } from 'cic-kit-firebase-functions';

export const sendUserPush = createSendUserPush({ region: 'europe-west1', cors: true });
export const syncPublicUser = createSyncPublicUser('europe-west1');
```

**API**
`cicInit(options)`
- `options.region`: `SupportedRegion` (default `europe-west1`)
- `options.https.cors`: `boolean | string | RegExp | Array<string | RegExp>` (default `true`)

`sendUserPush` (Callable)
- Input:
```ts
{
  toUid: string;
  title: string;
  options?: WebpushNotification;
}
```
- Behavior: legge `users/{toUid}`, usa `fcmTokens`, invia WebPush con `title` + `options`, ripulisce token invalidi.
- Return:
```ts
{ sent: number; total: number; cleaned: number }
```

`syncPublicUser` (Firestore trigger)
- Trigger: `users/{userId}`
- Copia i campi indicati in `publicKey` dentro `users_public/{userId}`
- Se `birthHideYear === true` maschera l'anno della data di nascita

**Dati Attesi in Firestore**
`users/{userId}`
- `fcmTokens`: `string[]`
- `publicKey`: `string[]` (lista campi da esporre)
- `birthHideYear`: `boolean` (opzionale)
- `birthDate`: `string` (formato `dd/mm/yyyy`, opzionale)
- `name`, `surname`, `createdAt`, `updatedAt` (opzionali)

**Build**
```bash
npm run build
```

**Note**
- Questo pacchetto esporta funzioni già pronte. Se usi `cicInit`, chiamala prima di esportare le function.
- L'opzione `options.data.url` in `sendUserPush` viene usata come link webpush (fallback `/`).
- Il pacchetto e' ESM: usare `import`, non `require`.
