// functions/src/config/env.ts
import type { SupportedRegion } from 'firebase-functions/v2/options';

export type CicInitOptions = {
  region?: SupportedRegion;
  https?: {
    cors?: boolean;
  };
};

type CicConfig = {
  region: SupportedRegion;
  https: {
    cors: boolean;
  };
};

const defaultConfig: CicConfig = {
  region: 'europe-west1',
  https: {
    cors: true,
  },
};

let config: CicConfig = {
  region: defaultConfig.region,
  https: { ...defaultConfig.https },
};

export function setConfig(options: CicInitOptions = {}) {
  if (options.region) config.region = options.region;
  if (options.https?.cors !== undefined) config.https.cors = options.https.cors;
}

export function getRegion(): SupportedRegion {
  return config.region;
}

export function getHttpsDefaults() {
  return { region: config.region, cors: config.https.cors } as const;
}
