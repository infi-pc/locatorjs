import { describe, expect, test } from 'vitest';
import { safeFrameProjection } from './settingsProjection';

describe('safeFrameProjection', () => {
  test('withholds machine paths, editor templates, sessions and prompt text', () => {
    const projected = safeFrameProjection({
      projectPath: '/Users/me/private-repo',
      replacePath: { from: '/host', to: '/container' },
      tmuxSession: 'secret-session',
      editor: { targetTemplate: 'private-editor://${filePath}' },
      bindings: [
        {
          trigger: { kind: 'modifier-click', modifiers: 'alt' },
          action: {
            kind: 'open-editor',
            targetTemplate: 'private-editor://${filePath}',
          },
        },
        {
          trigger: { kind: 'hover-toolbar' },
          action: { kind: 'copy-prompt', template: 'private prompt' },
        },
      ],
      disabled: false,
    });

    expect(projected).toEqual({
      bindings: [
        {
          trigger: { kind: 'modifier-click', modifiers: 'alt' },
          action: { kind: 'open-editor' },
        },
      ],
      disabled: false,
      hrefTarget: undefined,
      showIntro: undefined,
      adapterId: undefined,
    });
  });
});
