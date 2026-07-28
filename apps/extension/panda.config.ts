import { defineConfig } from '@pandacss/dev';
import { preset } from '../../packages/styled-system/preset';

export default defineConfig({
  presets: [preset],
  outdir: 'styled-system',
  importMap: '@locator/styled-system',
  jsxFramework: 'solid',
  include: [
    './src/**/*.{ts,tsx,jsx,js}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  preflight: true,
});
