import { installSharedShadowRootTracking } from '@locator/shared';
import { installReactDevtoolsHook } from '@locator/react-devtools-hook';
import { insertRuntimeScript } from './insertRuntimeScript';

installSharedShadowRootTracking();
installReactDevtoolsHook();
insertRuntimeScript();
