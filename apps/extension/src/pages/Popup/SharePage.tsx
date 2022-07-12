import { Button, CloseButton, Textarea } from '@hope-ui/solid';
import { BiCheck } from 'solid-icons/bi';
import { ImCopy } from 'solid-icons/im';
import { createSignal } from 'solid-js';
import { Page } from './Page';
import SectionHeadline from './SectionHeadline';

type Props = {
  setPage: (page: Page) => void;
  media: string;
};

export function SharePage(props: Props) {
  let textareaRef: HTMLTextAreaElement | undefined;
  const text =
    'Check out LocatorJS!. \nYou can click on any React component in a browser to open its code in Editor. \nhttps://www.locatorjs.com';

  const [copied, setCopied] = createSignal(false);

  return (
    <div class="flex justify-between gap-4">
      <div class="flex-grow">
        <SectionHeadline>Share on {props.media}</SectionHeadline>
        <p>
          We don't have an automatic link to {props.media}, but for your
          convenience, here is an example text you can copy-paste to your{' '}
          {props.media}
        </p>
        <Textarea
          onClick={() => {
            if (textareaRef) {
              textareaRef.select();
              document.execCommand('copy');
              setCopied(true);
            }
          }}
          ref={textareaRef}
          class="h-36 mt-4"
          value={text}
          size="sm"
          readOnly
        />
        <div class="flex justify-between items-center">
          <div class="flex gap-1 items-center">
            {copied() && (
              <>
                <BiCheck size={'18px'} />
                Saved to clipboard
              </>
            )}
          </div>
          <Button
            size="sm"
            leftIcon={<ImCopy />}
            onClick={() => {
              if (textareaRef) {
                textareaRef.select();
                document.execCommand('copy');
                setCopied(true);
              }
            }}
          >
            Copy text
          </Button>
        </div>
      </div>
      <CloseButton
        onClick={() => {
          props.setPage({ type: 'home' });
        }}
      />
    </div>
  );
}
