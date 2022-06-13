import { createEffect } from 'solid-js';
import posthog from 'posthog-js';

posthog.init('phc_q37pVvL3Rb0yzrHotqmDXbWJBPuw6QCQt2TJrutShMm', {
  api_host: 'https://app.posthog.com',
  autocapture: true,
  persistence: 'localStorage',
});

createEffect(() => {
  // listen????
});
