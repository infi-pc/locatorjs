import { describe, expect, test } from 'vitest';
import { safeFrameProjection } from './settingsProjection';

describe('safeFrameProjection', () => {
  test('withholds machine paths, editor templates, sessions and prompt text', () => {
    const projected = safeFrameProjection({
      projectPath: '/Users/me/private-repo',
      replacePath: { from: '/host', to: '/container' },
      tmuxSession: 'secret-session',
      editor: {
        kind: 'template',
        template: 'private-editor://${filePath}',
      },
      bindings: [
        {
          trigger: { kind: 'modifier-click', modifiers: ['alt'] },
          action: {
            kind: 'open-editor',
            destination: {
              kind: 'template',
              template: 'private-editor://${filePath}',
            },
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
          trigger: { kind: 'modifier-click', modifiers: ['alt'] },
          action: { kind: 'open-editor' },
        },
      ],
      disabled: false,
    });
  });
});
