import { installSharedShadowRootTracking } from '@locator/shared';
import { startPageAgent } from './pageAgent';

// Closed shadow roots can only be tracked by patching attachShadow before the
// page creates them, which is why this runs at document_start.
installSharedShadowRootTracking();
startPageAgent();
