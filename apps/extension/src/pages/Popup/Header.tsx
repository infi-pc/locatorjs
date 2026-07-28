import { ArrowLeft, CircleHelp, Settings } from 'lucide-solid';
import { IconButton, LocatorBrand } from '@locator/ui';
import { css } from '@locator/styled-system/css';
import { Page } from './Page';
import browser from '../../browser';

const styles = {
  header: css({
    alignItems: 'center',
    bg: 'bg.default',
    borderBottomColor: 'border',
    borderBottomWidth: '1px',
    display: 'flex',
    justifyContent: 'space-between',
    mb: '4',
    mx: '-4',
    position: 'sticky',
    px: '4',
    py: '3',
    top: '0',
    zIndex: 'sticky',
  }),
  actions: css({ alignItems: 'center', display: 'flex', gap: '1' }),
};

export function Header(props: { page: Page; setPage: (page: Page) => void }) {
  const settings = () => props.page.type === 'settings';
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
        <IconButton
          aria-label={settings() ? 'Back' : 'Settings'}
          onClick={() =>
            props.setPage(
              settings()
                ? { type: 'home' }
                : { type: 'settings', tab: 'user-extension' }
            )
          }
        >
          {settings() ? <ArrowLeft size={16} /> : <Settings size={16} />}
        </IconButton>
      </div>
    </div>
  );
}
