import type { CicInitOptions } from './config/env.js';
import { setConfig } from './config/env.js';
import { createSendUserPush } from './features/senderPush/sendUserPush.js';
import { createSyncPublicUser } from './features/syncPublicUser/syncPublicUser.js';

export function cicInit(options: CicInitOptions = {}) {
  setConfig(options);

  return {
    sendUserPush: createSendUserPush(),
    syncPublicUser: createSyncPublicUser(),
  } as const;
}
