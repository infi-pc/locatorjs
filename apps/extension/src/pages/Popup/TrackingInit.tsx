import posthog from 'posthog-js';
import { useSyncedState } from './syncedState';

export default function TrackingInit() {
  const { clicks, controls, target } = useSyncedState();

  if (process.env.NODE_ENV === 'production') {
    posthog.init('phc_q37pVvL3Rb0yzrHotqmDXbWJBPuw6QCQt2TJrutShMm', {
      api_host: 'https://app.posthog.com',
      autocapture: true,
      persistence: 'localStorage',
    });
    posthog.capture('Loaded', {
      $set: {
        'Click Count': clicks(),
        Controls: controls.getString(),
        Target: target.get(),
      },
    });
  }

  return <></>;
}
