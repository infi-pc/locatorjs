import {
  BsDiscord,
  BsLinkedin,
  BsReddit,
  BsSlack,
  BsTwitter,
  BsX,
} from 'solid-icons/bs';
import { BiLogoMicrosoftTeams } from 'solid-icons/bi';

import { ImHackernews } from 'solid-icons/im';

import './socialShare.css';
import { Tooltip } from '@hope-ui/solid';
import { useSyncedState } from './syncedState';
import { Page } from './Page';
import { JSX } from 'solid-js';

type Props = {
  setPage: (page: Page) => void;
};

export default function SocialShare(props: Props) {
  const { sharedOnSocialMedia } = useSyncedState();
  const pageUrl = encodeURIComponent('https://www.locatorjs.com');

  const twitterText = encodeURIComponent(
    'Check out @locatorjs!. You can click on any React component in a browser to open its code in Editor.'
  );

  const text = encodeURIComponent(
    'Check out LocatorJS!. You can click on any React component in a browser to open its code in Editor.'
  );

  const hnText = encodeURIComponent(
    'Click on any React component in a browser to open its code in Editor.'
  );

  const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;

  return (
    <>
      {sharedOnSocialMedia.get() ? null : (
        <div class="flex justify-between w-full bg-slate-100 dark:bg-gray-800 px-4 py-1 items-center">
          <div class="share-panel">
            Share Locator on
            <div class="share-icons">
              <IconWrapper
                label="Share it on Twitter"
                link={`https://twitter.com/intent/tweet?text=${twitterText}&url=${pageUrl}`}
                onClick={() => {
                  sharedOnSocialMedia.set('twitter');
                }}
              >
                <BsTwitter />
              </IconWrapper>

              <IconWrapper
                label="Share it on Reddit"
                link={`https://www.reddit.com/submit?url=${pageUrl}&title=${text}`}
                onClick={() => {
                  sharedOnSocialMedia.set('reddit');
                }}
              >
                <BsReddit />
              </IconWrapper>

              <IconWrapper
                label="Share it on Hackernews"
                link={`https://news.ycombinator.com/submitlink?u=${pageUrl}&t=${hnText}`}
                onClick={() => {
                  sharedOnSocialMedia.set('hackernews');
                }}
              >
                <ImHackernews />
              </IconWrapper>

              <IconWrapper
                label="Share it on LinkedIn"
                link={linkedIn}
                onClick={(e) => {
                  sharedOnSocialMedia.set('linkedin');
                  window.open(linkedIn, '', 'width=400,height=600');
                  e.preventDefault();
                }}
              >
                <BsLinkedin />
              </IconWrapper>

              {/* <IconWrapper
          label="Facebook"
          link={`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`}
        >
          <BsFacebook />
        </IconWrapper> */}
            </div>
            or show it to your team
            <div class="share-icons">
              <IconWrapper
                label="Share it on Slack"
                onClick={() => {
                  props.setPage({ type: 'share', media: 'Slack' });
                }}
              >
                <BsSlack />
              </IconWrapper>

              <IconWrapper
                label="Share it on Discord"
                onClick={() => {
                  props.setPage({ type: 'share', media: 'Discord' });
                }}
              >
                <BsDiscord />
              </IconWrapper>

              <IconWrapper
                label="Share it on Teams"
                onClick={() => {
                  props.setPage({ type: 'share', media: 'Teams' });
                }}
              >
                <BiLogoMicrosoftTeams />
              </IconWrapper>
            </div>
          </div>
          <div>
            <IconWrapper
              label={`Close this panel`}
              onClick={() => {
                sharedOnSocialMedia.set('close');
              }}
            >
              <BsX size={'20px'} />
            </IconWrapper>
          </div>
        </div>
      )}
    </>
  );
}

function IconWrapper(props: {
  label: string;
  link?: string;
  onClick: (e: MouseEvent) => void;
  children?: JSX.Element;
}) {
  //   const [isHover, setIsHover] = createSignal(false);
  return (
    <Tooltip label={props.label} placement="top">
      <div>
        <a
          class="icon-wrapper block"
          href={props.link}
          target="_blank"
          onClick={(e) => props.onClick(e)}
          //   onMouseEnter={() => setIsHover(true)}
          //   onMouseLeave={() => setIsHover(false)}
        >
          {props.children}
        </a>
      </div>
    </Tooltip>
  );
}
