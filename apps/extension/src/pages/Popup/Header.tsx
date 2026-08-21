import { CircleHelp } from 'lucide-solid';
import { IconButton, LocatorBrand } from '@locator/ui';
import { css } from '@locator/styled-system/css';
import browser from '../../browser';

const styles = {
  header: css({
    alignItems: 'center',
    bg: 'bg.default',
    borderBottomColor: 'border',
    borderBottomWidth: '1px',
    display: 'flex',
    justifyContent: 'space-between',
    mb: '2',
    mx: '-3',
    position: 'sticky',
    px: '3',
    py: '2',
    top: '0',
    zIndex: 'sticky',
  }),
  actions: css({ alignItems: 'center', display: 'flex', gap: '1' }),
};

export function Header() {
  return (
    <div class={styles.header}>
      <LocatorBrand />
      <div class={styles.actions}>
        <IconButton
          aria-label="Setup guide"
          onClick={() =>
            browser.tabs.create({
              url: browser.runtime.getURL('onboarding.html'),
            })
          }
        >
          <CircleHelp size={16} />
        </IconButton>
      </div>
    </div>
  );
}
