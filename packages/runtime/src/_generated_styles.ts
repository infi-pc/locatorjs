export default `@layer legacy, reset, base, tokens, recipes, utilities;
@layer legacy {
*, ::before, ::after {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
  --tw-contain-size:  ;
  --tw-contain-layout:  ;
  --tw-contain-paint:  ;
  --tw-contain-style:  ;
}

::backdrop {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
  --tw-contain-size:  ;
  --tw-contain-layout:  ;
  --tw-contain-paint:  ;
  --tw-contain-style:  ;
}

/*
! tailwindcss v3.4.19 | MIT License | https://tailwindcss.com
*/

/*
1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)
2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)
*/

*,
::before,
::after {
  box-sizing: border-box;
  /* 1 */
  border-width: 0;
  /* 2 */
  border-style: solid;
  /* 2 */
  border-color: #e5e7eb;
  /* 2 */
}

::before,
::after {
  --tw-content: '';
}

/*
1. Use a consistent sensible line-height in all browsers.
2. Prevent adjustments of font size after orientation changes in iOS.
3. Use a more readable tab size.
4. Use the user's configured \`sans\` font-family by default.
5. Use the user's configured \`sans\` font-feature-settings by default.
6. Use the user's configured \`sans\` font-variation-settings by default.
7. Disable tap highlights on iOS
*/

html,
:host {
  line-height: 1.5;
  /* 1 */
  -webkit-text-size-adjust: 100%;
  /* 2 */
  -moz-tab-size: 4;
  /* 3 */
  -o-tab-size: 4;
     tab-size: 4;
  /* 3 */
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  /* 4 */
  font-feature-settings: normal;
  /* 5 */
  font-variation-settings: normal;
  /* 6 */
  -webkit-tap-highlight-color: transparent;
  /* 7 */
}

/*
1. Remove the margin in all browsers.
2. Inherit line-height from \`html\` so users can set them as a class directly on the \`html\` element.
*/

body {
  margin: 0;
  /* 1 */
  line-height: inherit;
  /* 2 */
}

/*
1. Add the correct height in Firefox.
2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)
3. Ensure horizontal rules are visible by default.
*/

hr {
  height: 0;
  /* 1 */
  color: inherit;
  /* 2 */
  border-top-width: 1px;
  /* 3 */
}

/*
Add the correct text decoration in Chrome, Edge, and Safari.
*/

abbr:where([title]) {
  -webkit-text-decoration: underline dotted;
          text-decoration: underline dotted;
}

/*
Remove the default font size and weight for headings.
*/

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}

/*
Reset links to optimize for opt-in styling instead of opt-out.
*/

a {
  color: inherit;
  text-decoration: inherit;
}

/*
Add the correct font weight in Edge and Safari.
*/

b,
strong {
  font-weight: bolder;
}

/*
1. Use the user's configured \`mono\` font-family by default.
2. Use the user's configured \`mono\` font-feature-settings by default.
3. Use the user's configured \`mono\` font-variation-settings by default.
4. Correct the odd \`em\` font sizing in all browsers.
*/

code,
kbd,
samp,
pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  /* 1 */
  font-feature-settings: normal;
  /* 2 */
  font-variation-settings: normal;
  /* 3 */
  font-size: 1em;
  /* 4 */
}

/*
Add the correct font size in all browsers.
*/

small {
  font-size: 80%;
}

/*
Prevent \`sub\` and \`sup\` elements from affecting the line height in all browsers.
*/

sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}

/*
1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
3. Remove gaps between table borders by default.
*/

table {
  text-indent: 0;
  /* 1 */
  border-color: inherit;
  /* 2 */
  border-collapse: collapse;
  /* 3 */
}

/*
1. Change the font styles in all browsers.
2. Remove the margin in Firefox and Safari.
3. Remove default padding in all browsers.
*/

button,
input,
optgroup,
select,
textarea {
  font-family: inherit;
  /* 1 */
  font-feature-settings: inherit;
  /* 1 */
  font-variation-settings: inherit;
  /* 1 */
  font-size: 100%;
  /* 1 */
  font-weight: inherit;
  /* 1 */
  line-height: inherit;
  /* 1 */
  letter-spacing: inherit;
  /* 1 */
  color: inherit;
  /* 1 */
  margin: 0;
  /* 2 */
  padding: 0;
  /* 3 */
}

/*
Remove the inheritance of text transform in Edge and Firefox.
*/

button,
select {
  text-transform: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Remove default button styles.
*/

button,
input:where([type='button']),
input:where([type='reset']),
input:where([type='submit']) {
  -webkit-appearance: button;
  /* 1 */
  background-color: transparent;
  /* 2 */
  background-image: none;
  /* 2 */
}

/*
Use the modern Firefox focus style for all focusable elements.
*/

:-moz-focusring {
  outline: auto;
}

/*
Remove the additional \`:invalid\` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)
*/

:-moz-ui-invalid {
  box-shadow: none;
}

/*
Add the correct vertical alignment in Chrome and Firefox.
*/

progress {
  vertical-align: baseline;
}

/*
Correct the cursor style of increment and decrement buttons in Safari.
*/

::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}

/*
1. Correct the odd appearance in Chrome and Safari.
2. Correct the outline style in Safari.
*/

[type='search'] {
  -webkit-appearance: textfield;
  /* 1 */
  outline-offset: -2px;
  /* 2 */
}

/*
Remove the inner padding in Chrome and Safari on macOS.
*/

::-webkit-search-decoration {
  -webkit-appearance: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Change font properties to \`inherit\` in Safari.
*/

::-webkit-file-upload-button {
  -webkit-appearance: button;
  /* 1 */
  font: inherit;
  /* 2 */
}

/*
Add the correct display in Chrome and Safari.
*/

summary {
  display: list-item;
}

/*
Removes the default spacing and border for appropriate elements.
*/

blockquote,
dl,
dd,
h1,
h2,
h3,
h4,
h5,
h6,
hr,
figure,
p,
pre {
  margin: 0;
}

fieldset {
  margin: 0;
  padding: 0;
}

legend {
  padding: 0;
}

ol,
ul,
menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

/*
Reset default styling for dialogs.
*/

dialog {
  padding: 0;
}

/*
Prevent resizing textareas horizontally by default.
*/

textarea {
  resize: vertical;
}

/*
1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)
2. Set the default placeholder color to the user's configured gray 400 color.
*/

input::-moz-placeholder, textarea::-moz-placeholder {
  opacity: 1;
  /* 1 */
  color: #9ca3af;
  /* 2 */
}

input::placeholder,
textarea::placeholder {
  opacity: 1;
  /* 1 */
  color: #9ca3af;
  /* 2 */
}

/*
Set the default cursor for buttons.
*/

button,
[role="button"] {
  cursor: pointer;
}

/*
Make sure disabled buttons don't get the pointer cursor.
*/

:disabled {
  cursor: default;
}

/*
1. Make replaced elements \`display: block\` by default. (https://github.com/mozdevs/cssremedy/issues/14)
2. Add \`vertical-align: middle\` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)
   This can trigger a poorly considered lint error in some tools but is included by design.
*/

img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block;
  /* 1 */
  vertical-align: middle;
  /* 2 */
}

/*
Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
*/

img,
video {
  max-width: 100%;
  height: auto;
}

/* Make elements with the HTML hidden attribute stay hidden by default */

[hidden]:where(:not([hidden="until-found"])) {
  display: none;
}

input:where([type='text']),input:where(:not([type])),input:where([type='email']),input:where([type='url']),input:where([type='password']),input:where([type='number']),input:where([type='date']),input:where([type='datetime-local']),input:where([type='month']),input:where([type='search']),input:where([type='tel']),input:where([type='time']),input:where([type='week']),select:where([multiple]),textarea,select {
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
  background-color: #fff;
  border-color: #6b7280;
  border-width: 1px;
  border-radius: 0px;
  padding-top: 0.5rem;
  padding-right: 0.75rem;
  padding-bottom: 0.5rem;
  padding-left: 0.75rem;
  font-size: 1rem;
  line-height: 1.5rem;
  --tw-shadow: 0 0 #0000;
}

input:where([type='text']):focus, input:where(:not([type])):focus, input:where([type='email']):focus, input:where([type='url']):focus, input:where([type='password']):focus, input:where([type='number']):focus, input:where([type='date']):focus, input:where([type='datetime-local']):focus, input:where([type='month']):focus, input:where([type='search']):focus, input:where([type='tel']):focus, input:where([type='time']):focus, input:where([type='week']):focus, select:where([multiple]):focus, textarea:focus, select:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  --tw-ring-inset: var(--tw-empty,/*!*/ /*!*/);
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: #2563eb;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  border-color: #2563eb;
}

input::-moz-placeholder, textarea::-moz-placeholder {
  color: #6b7280;
  opacity: 1;
}

input::placeholder,textarea::placeholder {
  color: #6b7280;
  opacity: 1;
}

::-webkit-datetime-edit-fields-wrapper {
  padding: 0;
}

::-webkit-date-and-time-value {
  min-height: 1.5em;
  text-align: inherit;
}

::-webkit-datetime-edit {
  display: inline-flex;
}

::-webkit-datetime-edit,::-webkit-datetime-edit-year-field,::-webkit-datetime-edit-month-field,::-webkit-datetime-edit-day-field,::-webkit-datetime-edit-hour-field,::-webkit-datetime-edit-minute-field,::-webkit-datetime-edit-second-field,::-webkit-datetime-edit-millisecond-field,::-webkit-datetime-edit-meridiem-field {
  padding-top: 0;
  padding-bottom: 0;
}

select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
}

select:where([multiple]),select:where([size]:not([size="1"])) {
  background-image: initial;
  background-position: initial;
  background-repeat: unset;
  background-size: initial;
  padding-right: 0.75rem;
  -webkit-print-color-adjust: unset;
          print-color-adjust: unset;
}

input:where([type='checkbox']),input:where([type='radio']) {
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
  padding: 0;
  -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
  display: inline-block;
  vertical-align: middle;
  background-origin: border-box;
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
  flex-shrink: 0;
  height: 1rem;
  width: 1rem;
  color: #2563eb;
  background-color: #fff;
  border-color: #6b7280;
  border-width: 1px;
  --tw-shadow: 0 0 #0000;
}

input:where([type='checkbox']) {
  border-radius: 0px;
}

input:where([type='radio']) {
  border-radius: 100%;
}

input:where([type='checkbox']):focus,input:where([type='radio']):focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  --tw-ring-inset: var(--tw-empty,/*!*/ /*!*/);
  --tw-ring-offset-width: 2px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: #2563eb;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}

input:where([type='checkbox']):checked,input:where([type='radio']):checked {
  border-color: transparent;
  background-color: currentColor;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}

input:where([type='checkbox']):checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
}

@media (forced-colors: active)  {
  input:where([type='checkbox']):checked {
    -webkit-appearance: auto;
       -moz-appearance: auto;
            appearance: auto;
  }
}

input:where([type='radio']):checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='8' cy='8' r='3'/%3e%3c/svg%3e");
}

@media (forced-colors: active)  {
  input:where([type='radio']):checked {
    -webkit-appearance: auto;
       -moz-appearance: auto;
            appearance: auto;
  }
}

input:where([type='checkbox']):checked:hover,input:where([type='checkbox']):checked:focus,input:where([type='radio']):checked:hover,input:where([type='radio']):checked:focus {
  border-color: transparent;
  background-color: currentColor;
}

input:where([type='checkbox']):indeterminate {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e");
  border-color: transparent;
  background-color: currentColor;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}

@media (forced-colors: active)  {
  input:where([type='checkbox']):indeterminate {
    -webkit-appearance: auto;
       -moz-appearance: auto;
            appearance: auto;
  }
}

input:where([type='checkbox']):indeterminate:hover,input:where([type='checkbox']):indeterminate:focus {
  border-color: transparent;
  background-color: currentColor;
}

input:where([type='file']) {
  background: unset;
  border-color: inherit;
  border-width: 0;
  border-radius: 0;
  padding: 0;
  font-size: unset;
  line-height: inherit;
}

input:where([type='file']):focus {
  outline: 1px solid ButtonText;
  outline: 1px auto -webkit-focus-ring-color;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.pointer-events-none {
  pointer-events: none;
}

.pointer-events-auto {
  pointer-events: auto;
}

.\!visible {
  visibility: visible !important;
}

.visible {
  visibility: visible;
}

.invisible {
  visibility: hidden;
}

.collapse {
  visibility: collapse;
}

.fixed {
  position: fixed;
}

.absolute {
  position: absolute;
}

.relative {
  position: relative;
}

.-bottom-7 {
  bottom: -1.75rem;
}

.-left-1 {
  left: -0.25rem;
}

.-left-2 {
  left: -0.5rem;
}

.-left-4 {
  left: -1rem;
}

.-right-2 {
  right: -0.5rem;
}

.-top-1 {
  top: -0.25rem;
}

.-top-2 {
  top: -0.5rem;
}

.-top-4 {
  top: -1rem;
}

.-top-7 {
  top: -1.75rem;
}

.bottom-3 {
  bottom: 0.75rem;
}

.left-0 {
  left: 0px;
}

.left-1 {
  left: 0.25rem;
}

.left-1\\/2 {
  left: 50%;
}

.left-3 {
  left: 0.75rem;
}

.top-0 {
  top: 0px;
}

.top-1 {
  top: 0.25rem;
}

.top-1\\/2 {
  top: 50%;
}

.isolate {
  isolation: isolate;
}

.z-10 {
  z-index: 10;
}

.m-1 {
  margin: 0.25rem;
}

.m-2 {
  margin: 0.5rem;
}

.m-4 {
  margin: 1rem;
}

.-mx-4 {
  margin-left: -1rem;
  margin-right: -1rem;
}

.my-2 {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.-mb-px {
  margin-bottom: -1px;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.ml-3 {
  margin-left: 0.75rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

.mt-4 {
  margin-top: 1rem;
}

.block {
  display: block;
}

.inline-block {
  display: inline-block;
}

.inline {
  display: inline;
}

.flex {
  display: flex;
}

.inline-flex {
  display: inline-flex;
}

.table {
  display: table;
}

.grid {
  display: grid;
}

.contents {
  display: contents;
}

.hidden {
  display: none;
}

.h-4 {
  height: 1rem;
}

.h-5 {
  height: 1.25rem;
}

.h-6 {
  height: 1.5rem;
}

.h-screen {
  height: 100vh;
}

.max-h-full {
  max-height: 100%;
}

.w-11 {
  width: 2.75rem;
}

.w-4 {
  width: 1rem;
}

.w-6 {
  width: 1.5rem;
}

.w-60 {
  width: 15rem;
}

.w-80 {
  width: 20rem;
}

.w-9 {
  width: 2.25rem;
}

.w-96 {
  width: 24rem;
}

.w-full {
  width: 100%;
}

.w-screen {
  width: 100vw;
}

.max-w-2xl {
  max-width: 42rem;
}

.max-w-full {
  max-width: 100%;
}

.max-w-md {
  max-width: 28rem;
}

.max-w-xl {
  max-width: 36rem;
}

.flex-shrink {
  flex-shrink: 1;
}

.flex-grow {
  flex-grow: 1;
}

.grow {
  flex-grow: 1;
}

.border-collapse {
  border-collapse: collapse;
}

.-translate-x-1 {
  --tw-translate-x: -0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.-translate-x-1\\/2 {
  --tw-translate-x: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.-translate-x-full {
  --tw-translate-x: -100%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.-translate-y-1 {
  --tw-translate-y: -0.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.-translate-y-1\\/2 {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.translate-x-0 {
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.translate-x-4 {
  --tw-translate-x: 1rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.translate-x-full {
  --tw-translate-x: 100%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.translate-y-0 {
  --tw-translate-y: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.transform {
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.cursor-auto {
  cursor: auto;
}

.cursor-default {
  cursor: default;
}

.cursor-pointer {
  cursor: pointer;
}

.select-none {
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
}

.resize {
  resize: both;
}

.list-disc {
  list-style-type: disc;
}

.flex-col {
  flex-direction: column;
}

.items-start {
  align-items: flex-start;
}

.items-center {
  align-items: center;
}

.justify-end {
  justify-content: flex-end;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-1 {
  gap: 0.25rem;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-4 {
  gap: 1rem;
}

.self-stretch {
  align-self: stretch;
}

.overflow-auto {
  overflow: auto;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-scroll {
  overflow: scroll;
}

.text-ellipsis {
  text-overflow: ellipsis;
}

.whitespace-nowrap {
  white-space: nowrap;
}

.whitespace-pre-wrap {
  white-space: pre-wrap;
}

.break-words {
  overflow-wrap: break-word;
}

.break-all {
  word-break: break-all;
}

.rounded {
  border-radius: 0.25rem;
}

.rounded-full {
  border-radius: 9999px;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.rounded-md {
  border-radius: 0.375rem;
}

.rounded-sm {
  border-radius: 0.125rem;
}

.rounded-xl {
  border-radius: 0.75rem;
}

.border {
  border-width: 1px;
}

.border-2 {
  border-width: 2px;
}

.border-b {
  border-bottom-width: 1px;
}

.border-b-2 {
  border-bottom-width: 2px;
}

.border-solid {
  border-style: solid;
}

.border-dashed {
  border-style: dashed;
}

.border-amber-200 {
  --tw-border-opacity: 1;
  border-color: rgb(253 230 138 / var(--tw-border-opacity, 1));
}

.border-blue-500 {
  --tw-border-opacity: 1;
  border-color: rgb(59 130 246 / var(--tw-border-opacity, 1));
}

.border-gray-200 {
  --tw-border-opacity: 1;
  border-color: rgb(229 231 235 / var(--tw-border-opacity, 1));
}

.border-gray-300 {
  --tw-border-opacity: 1;
  border-color: rgb(209 213 219 / var(--tw-border-opacity, 1));
}

.border-gray-600 {
  --tw-border-opacity: 1;
  border-color: rgb(75 85 99 / var(--tw-border-opacity, 1));
}

.border-gray-700 {
  --tw-border-opacity: 1;
  border-color: rgb(55 65 81 / var(--tw-border-opacity, 1));
}

.border-green-500 {
  --tw-border-opacity: 1;
  border-color: rgb(34 197 94 / var(--tw-border-opacity, 1));
}

.border-purple-500 {
  --tw-border-opacity: 1;
  border-color: rgb(168 85 247 / var(--tw-border-opacity, 1));
}

.border-red-500 {
  --tw-border-opacity: 1;
  border-color: rgb(239 68 68 / var(--tw-border-opacity, 1));
}

.border-sky-500 {
  --tw-border-opacity: 1;
  border-color: rgb(14 165 233 / var(--tw-border-opacity, 1));
}

.border-slate-200 {
  --tw-border-opacity: 1;
  border-color: rgb(226 232 240 / var(--tw-border-opacity, 1));
}

.border-slate-300 {
  --tw-border-opacity: 1;
  border-color: rgb(203 213 225 / var(--tw-border-opacity, 1));
}

.border-transparent {
  border-color: transparent;
}

.border-t-blue-600 {
  --tw-border-opacity: 1;
  border-top-color: rgb(37 99 235 / var(--tw-border-opacity, 1));
}

.bg-amber-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(254 243 199 / var(--tw-bg-opacity, 1));
}

.bg-amber-50 {
  --tw-bg-opacity: 1;
  background-color: rgb(255 251 235 / var(--tw-bg-opacity, 1));
}

.bg-amber-900 {
  --tw-bg-opacity: 1;
  background-color: rgb(120 53 15 / var(--tw-bg-opacity, 1));
}

.bg-black {
  --tw-bg-opacity: 1;
  background-color: rgb(0 0 0 / var(--tw-bg-opacity, 1));
}

.bg-black\\/60 {
  background-color: rgb(0 0 0 / 0.6);
}

.bg-black\\/70 {
  background-color: rgb(0 0 0 / 0.7);
}

.bg-blue-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(219 234 254 / var(--tw-bg-opacity, 1));
}

.bg-blue-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(59 130 246 / var(--tw-bg-opacity, 1));
}

.bg-blue-500\\/30 {
  background-color: rgb(59 130 246 / 0.3);
}

.bg-blue-600 {
  --tw-bg-opacity: 1;
  background-color: rgb(37 99 235 / var(--tw-bg-opacity, 1));
}

.bg-gray-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(243 244 246 / var(--tw-bg-opacity, 1));
}

.bg-gray-200 {
  --tw-bg-opacity: 1;
  background-color: rgb(229 231 235 / var(--tw-bg-opacity, 1));
}

.bg-gray-300 {
  --tw-bg-opacity: 1;
  background-color: rgb(209 213 219 / var(--tw-bg-opacity, 1));
}

.bg-gray-50 {
  --tw-bg-opacity: 1;
  background-color: rgb(249 250 251 / var(--tw-bg-opacity, 1));
}

.bg-gray-600 {
  --tw-bg-opacity: 1;
  background-color: rgb(75 85 99 / var(--tw-bg-opacity, 1));
}

.bg-gray-700 {
  --tw-bg-opacity: 1;
  background-color: rgb(55 65 81 / var(--tw-bg-opacity, 1));
}

.bg-gray-800 {
  --tw-bg-opacity: 1;
  background-color: rgb(31 41 55 / var(--tw-bg-opacity, 1));
}

.bg-gray-900 {
  --tw-bg-opacity: 1;
  background-color: rgb(17 24 39 / var(--tw-bg-opacity, 1));
}

.bg-green-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(220 252 231 / var(--tw-bg-opacity, 1));
}

.bg-green-50 {
  --tw-bg-opacity: 1;
  background-color: rgb(240 253 244 / var(--tw-bg-opacity, 1));
}

.bg-green-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(34 197 94 / var(--tw-bg-opacity, 1));
}

.bg-green-500\\/30 {
  background-color: rgb(34 197 94 / 0.3);
}

.bg-orange-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(249 115 22 / var(--tw-bg-opacity, 1));
}

.bg-orange-500\\/30 {
  background-color: rgb(249 115 22 / 0.3);
}

.bg-purple-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(243 232 255 / var(--tw-bg-opacity, 1));
}

.bg-purple-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(168 85 247 / var(--tw-bg-opacity, 1));
}

.bg-red-50 {
  --tw-bg-opacity: 1;
  background-color: rgb(254 242 242 / var(--tw-bg-opacity, 1));
}

.bg-red-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(239 68 68 / var(--tw-bg-opacity, 1));
}

.bg-slate-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(241 245 249 / var(--tw-bg-opacity, 1));
}

.bg-slate-300 {
  --tw-bg-opacity: 1;
  background-color: rgb(203 213 225 / var(--tw-bg-opacity, 1));
}

.bg-slate-50 {
  --tw-bg-opacity: 1;
  background-color: rgb(248 250 252 / var(--tw-bg-opacity, 1));
}

.bg-slate-900 {
  --tw-bg-opacity: 1;
  background-color: rgb(15 23 42 / var(--tw-bg-opacity, 1));
}

.bg-transparent {
  background-color: transparent;
}

.bg-white {
  --tw-bg-opacity: 1;
  background-color: rgb(255 255 255 / var(--tw-bg-opacity, 1));
}

.bg-yellow-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(254 249 195 / var(--tw-bg-opacity, 1));
}

.p-0 {
  padding: 0px;
}

.p-1 {
  padding: 0.25rem;
}

.p-2 {
  padding: 0.5rem;
}

.p-3 {
  padding: 0.75rem;
}

.p-4 {
  padding: 1rem;
}

.p-6 {
  padding: 1.5rem;
}

.p-8 {
  padding: 2rem;
}

.px-0 {
  padding-left: 0px;
  padding-right: 0px;
}

.px-1 {
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}

.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-0 {
  padding-top: 0px;
  padding-bottom: 0px;
}

.py-0\\.5 {
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
}

.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.pb-0 {
  padding-bottom: 0px;
}

.pb-0\\.5 {
  padding-bottom: 0.125rem;
}

.pb-1 {
  padding-bottom: 0.25rem;
}

.pl-2 {
  padding-left: 0.5rem;
}

.pl-4 {
  padding-left: 1rem;
}

.pr-2 {
  padding-right: 0.5rem;
}

.pt-2 {
  padding-top: 0.5rem;
}

.pt-3 {
  padding-top: 0.75rem;
}

.text-left {
  text-align: left;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.font-sans {
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}

.text-base {
  font-size: 1rem;
  line-height: 1.5rem;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-xl {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.font-bold {
  font-weight: 700;
}

.font-medium {
  font-weight: 500;
}

.uppercase {
  text-transform: uppercase;
}

.lowercase {
  text-transform: lowercase;
}

.italic {
  font-style: italic;
}

.text-amber-200 {
  --tw-text-opacity: 1;
  color: rgb(253 230 138 / var(--tw-text-opacity, 1));
}

.text-amber-700 {
  --tw-text-opacity: 1;
  color: rgb(180 83 9 / var(--tw-text-opacity, 1));
}

.text-amber-800 {
  --tw-text-opacity: 1;
  color: rgb(146 64 14 / var(--tw-text-opacity, 1));
}

.text-amber-900 {
  --tw-text-opacity: 1;
  color: rgb(120 53 15 / var(--tw-text-opacity, 1));
}

.text-black {
  --tw-text-opacity: 1;
  color: rgb(0 0 0 / var(--tw-text-opacity, 1));
}

.text-blue-300 {
  --tw-text-opacity: 1;
  color: rgb(147 197 253 / var(--tw-text-opacity, 1));
}

.text-blue-500 {
  --tw-text-opacity: 1;
  color: rgb(59 130 246 / var(--tw-text-opacity, 1));
}

.text-blue-600 {
  --tw-text-opacity: 1;
  color: rgb(37 99 235 / var(--tw-text-opacity, 1));
}

.text-blue-700 {
  --tw-text-opacity: 1;
  color: rgb(29 78 216 / var(--tw-text-opacity, 1));
}

.text-gray-100 {
  --tw-text-opacity: 1;
  color: rgb(243 244 246 / var(--tw-text-opacity, 1));
}

.text-gray-200 {
  --tw-text-opacity: 1;
  color: rgb(229 231 235 / var(--tw-text-opacity, 1));
}

.text-gray-300 {
  --tw-text-opacity: 1;
  color: rgb(209 213 219 / var(--tw-text-opacity, 1));
}

.text-gray-400 {
  --tw-text-opacity: 1;
  color: rgb(156 163 175 / var(--tw-text-opacity, 1));
}

.text-gray-500 {
  --tw-text-opacity: 1;
  color: rgb(107 114 128 / var(--tw-text-opacity, 1));
}

.text-gray-600 {
  --tw-text-opacity: 1;
  color: rgb(75 85 99 / var(--tw-text-opacity, 1));
}

.text-gray-700 {
  --tw-text-opacity: 1;
  color: rgb(55 65 81 / var(--tw-text-opacity, 1));
}

.text-gray-800 {
  --tw-text-opacity: 1;
  color: rgb(31 41 55 / var(--tw-text-opacity, 1));
}

.text-gray-900 {
  --tw-text-opacity: 1;
  color: rgb(17 24 39 / var(--tw-text-opacity, 1));
}

.text-green-500 {
  --tw-text-opacity: 1;
  color: rgb(34 197 94 / var(--tw-text-opacity, 1));
}

.text-green-600 {
  --tw-text-opacity: 1;
  color: rgb(22 163 74 / var(--tw-text-opacity, 1));
}

.text-green-700 {
  --tw-text-opacity: 1;
  color: rgb(21 128 61 / var(--tw-text-opacity, 1));
}

.text-green-800 {
  --tw-text-opacity: 1;
  color: rgb(22 101 52 / var(--tw-text-opacity, 1));
}

.text-indigo-600 {
  --tw-text-opacity: 1;
  color: rgb(79 70 229 / var(--tw-text-opacity, 1));
}

.text-orange-500 {
  --tw-text-opacity: 1;
  color: rgb(249 115 22 / var(--tw-text-opacity, 1));
}

.text-purple-500 {
  --tw-text-opacity: 1;
  color: rgb(168 85 247 / var(--tw-text-opacity, 1));
}

.text-purple-700 {
  --tw-text-opacity: 1;
  color: rgb(126 34 206 / var(--tw-text-opacity, 1));
}

.text-red-500 {
  --tw-text-opacity: 1;
  color: rgb(239 68 68 / var(--tw-text-opacity, 1));
}

.text-red-600 {
  --tw-text-opacity: 1;
  color: rgb(220 38 38 / var(--tw-text-opacity, 1));
}

.text-red-800 {
  --tw-text-opacity: 1;
  color: rgb(153 27 27 / var(--tw-text-opacity, 1));
}

.text-sky-500 {
  --tw-text-opacity: 1;
  color: rgb(14 165 233 / var(--tw-text-opacity, 1));
}

.text-sky-700 {
  --tw-text-opacity: 1;
  color: rgb(3 105 161 / var(--tw-text-opacity, 1));
}

.text-slate-400 {
  --tw-text-opacity: 1;
  color: rgb(148 163 184 / var(--tw-text-opacity, 1));
}

.text-slate-500 {
  --tw-text-opacity: 1;
  color: rgb(100 116 139 / var(--tw-text-opacity, 1));
}

.text-slate-600 {
  --tw-text-opacity: 1;
  color: rgb(71 85 105 / var(--tw-text-opacity, 1));
}

.text-slate-700 {
  --tw-text-opacity: 1;
  color: rgb(51 65 85 / var(--tw-text-opacity, 1));
}

.text-slate-800 {
  --tw-text-opacity: 1;
  color: rgb(30 41 59 / var(--tw-text-opacity, 1));
}

.text-white {
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity, 1));
}

.underline {
  text-decoration-line: underline;
}

.opacity-0 {
  opacity: 0;
}

.opacity-100 {
  opacity: 1;
}

.shadow {
  --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.shadow-lg {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.shadow-sm {
  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.shadow-xl {
  --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}

.outline-none {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.outline {
  outline-style: solid;
}

.ring-2 {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

.ring-4 {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

.ring-blue-300 {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(147 197 253 / var(--tw-ring-opacity, 1));
}

.ring-blue-400 {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(96 165 250 / var(--tw-ring-opacity, 1));
}

.ring-blue-800 {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(30 64 175 / var(--tw-ring-opacity, 1));
}

.grayscale {
  --tw-grayscale: grayscale(100%);
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}

.filter {
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}

.transition {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.duration-300 {
  transition-duration: 300ms;
}

.hover\\:border-slate-400:hover {
  --tw-border-opacity: 1;
  border-color: rgb(148 163 184 / var(--tw-border-opacity, 1));
}

.hover\\:bg-blue-700:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(29 78 216 / var(--tw-bg-opacity, 1));
}

.hover\\:bg-gray-100:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(243 244 246 / var(--tw-bg-opacity, 1));
}

.hover\\:bg-gray-200:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(229 231 235 / var(--tw-bg-opacity, 1));
}

.hover\\:bg-green-700:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(21 128 61 / var(--tw-bg-opacity, 1));
}

.hover\\:bg-purple-600:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(147 51 234 / var(--tw-bg-opacity, 1));
}

.hover\\:bg-sky-100:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(224 242 254 / var(--tw-bg-opacity, 1));
}

.hover\\:bg-slate-100:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(241 245 249 / var(--tw-bg-opacity, 1));
}

.hover\\:bg-slate-300:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(203 213 225 / var(--tw-bg-opacity, 1));
}

.hover\\:bg-slate-50:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(248 250 252 / var(--tw-bg-opacity, 1));
}

.hover\\:bg-white\\/30:hover {
  background-color: rgb(255 255 255 / 0.3);
}

.hover\\:text-gray-100:hover {
  --tw-text-opacity: 1;
  color: rgb(243 244 246 / var(--tw-text-opacity, 1));
}

.hover\\:text-indigo-800:hover {
  --tw-text-opacity: 1;
  color: rgb(55 48 163 / var(--tw-text-opacity, 1));
}

.hover\\:text-sky-900:hover {
  --tw-text-opacity: 1;
  color: rgb(12 74 110 / var(--tw-text-opacity, 1));
}

.hover\\:text-slate-600:hover {
  --tw-text-opacity: 1;
  color: rgb(71 85 105 / var(--tw-text-opacity, 1));
}

.hover\\:text-slate-800:hover {
  --tw-text-opacity: 1;
  color: rgb(30 41 59 / var(--tw-text-opacity, 1));
}

.hover\\:underline:hover {
  text-decoration-line: underline;
}

.focus\\:border-indigo-500:focus {
  --tw-border-opacity: 1;
  border-color: rgb(99 102 241 / var(--tw-border-opacity, 1));
}

.focus\\:ring-indigo-200:focus {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(199 210 254 / var(--tw-ring-opacity, 1));
}

.focus\\:ring-indigo-500:focus {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(99 102 241 / var(--tw-ring-opacity, 1));
}

.active\\:bg-slate-200:active {
  --tw-bg-opacity: 1;
  background-color: rgb(226 232 240 / var(--tw-bg-opacity, 1));
}

.group\\/tooltip:hover .group-hover\\/tooltip\\:visible {
  visibility: visible;
}

.group\\/tooltip:hover .group-hover\\/tooltip\\:opacity-100 {
  opacity: 1;
}

@media (min-width: 640px) {
  .sm\\:text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
}
}
@layer reset, base, tokens, recipes, utilities;

@layer base{
  :root {
    --made-with-panda: '🐼';
}

  *,::before,::after,::backdrop {
    --blur: /*-*/ /*-*/;
    --brightness: /*-*/ /*-*/;
    --contrast: /*-*/ /*-*/;
    --grayscale: /*-*/ /*-*/;
    --hue-rotate: /*-*/ /*-*/;
    --invert: /*-*/ /*-*/;
    --saturate: /*-*/ /*-*/;
    --sepia: /*-*/ /*-*/;
    --drop-shadow: /*-*/ /*-*/;
    --backdrop-blur: /*-*/ /*-*/;
    --backdrop-brightness: /*-*/ /*-*/;
    --backdrop-contrast: /*-*/ /*-*/;
    --backdrop-grayscale: /*-*/ /*-*/;
    --backdrop-hue-rotate: /*-*/ /*-*/;
    --backdrop-invert: /*-*/ /*-*/;
    --backdrop-opacity: /*-*/ /*-*/;
    --backdrop-saturate: /*-*/ /*-*/;
    --backdrop-sepia: /*-*/ /*-*/;
    --gradient-from-position: /*-*/ /*-*/;
    --gradient-to-position: /*-*/ /*-*/;
    --gradient-via-position: /*-*/ /*-*/;
    --scroll-snap-strictness: proximity;
    --border-spacing-x: 0;
    --border-spacing-y: 0;
    --translate-x: 0;
    --translate-y: 0;
    --rotate: 0;
    --rotate-x: 0;
    --rotate-y: 0;
    --skew-x: 0;
    --skew-y: 0;
    --scale-x: 1;
    --scale-y: 1;
}

  * {
    --global-color-border: var(--colors-border);
    --global-color-placeholder: var(--colors-fg-subtle);
    --global-color-selection: var(--colors-color-palette-subtle-bg);
    --global-color-focus-ring: var(--colors-color-palette-solid-bg);
}

  html {
    --colors-color-palette-1: var(--colors-gray-1);
    --colors-color-palette-2: var(--colors-gray-2);
    --colors-color-palette-3: var(--colors-gray-3);
    --colors-color-palette-4: var(--colors-gray-4);
    --colors-color-palette-5: var(--colors-gray-5);
    --colors-color-palette-6: var(--colors-gray-6);
    --colors-color-palette-7: var(--colors-gray-7);
    --colors-color-palette-8: var(--colors-gray-8);
    --colors-color-palette-9: var(--colors-gray-9);
    --colors-color-palette-10: var(--colors-gray-10);
    --colors-color-palette-11: var(--colors-gray-11);
    --colors-color-palette-12: var(--colors-gray-12);
    --colors-color-palette-a1: var(--colors-gray-a1);
    --colors-color-palette-a2: var(--colors-gray-a2);
    --colors-color-palette-a3: var(--colors-gray-a3);
    --colors-color-palette-a4: var(--colors-gray-a4);
    --colors-color-palette-a5: var(--colors-gray-a5);
    --colors-color-palette-a6: var(--colors-gray-a6);
    --colors-color-palette-a7: var(--colors-gray-a7);
    --colors-color-palette-a8: var(--colors-gray-a8);
    --colors-color-palette-a9: var(--colors-gray-a9);
    --colors-color-palette-a10: var(--colors-gray-a10);
    --colors-color-palette-a11: var(--colors-gray-a11);
    --colors-color-palette-a12: var(--colors-gray-a12);
    --colors-color-palette-solid-bg: var(--colors-gray-solid-bg);
    --colors-color-palette-solid-bg-hover: var(--colors-gray-solid-bg-hover);
    --colors-color-palette-solid-fg: var(--colors-gray-solid-fg);
    --colors-color-palette-subtle-bg: var(--colors-gray-subtle-bg);
    --colors-color-palette-subtle-bg-hover: var(--colors-gray-subtle-bg-hover);
    --colors-color-palette-subtle-bg-active: var(--colors-gray-subtle-bg-active);
    --colors-color-palette-subtle-fg: var(--colors-gray-subtle-fg);
    --colors-color-palette-surface-bg: var(--colors-gray-surface-bg);
    --colors-color-palette-surface-bg-hover: var(--colors-gray-surface-bg-hover);
    --colors-color-palette-surface-bg-active: var(--colors-gray-surface-bg-active);
    --colors-color-palette-surface-border: var(--colors-gray-surface-border);
    --colors-color-palette-surface-border-hover: var(--colors-gray-surface-border-hover);
    --colors-color-palette-surface-fg: var(--colors-gray-surface-fg);
    --colors-color-palette-outline-bg-hover: var(--colors-gray-outline-bg-hover);
    --colors-color-palette-outline-bg-active: var(--colors-gray-outline-bg-active);
    --colors-color-palette-outline-border: var(--colors-gray-outline-border);
    --colors-color-palette-outline-fg: var(--colors-gray-outline-fg);
    --colors-color-palette-plain-bg-hover: var(--colors-gray-plain-bg-hover);
    --colors-color-palette-plain-bg-active: var(--colors-gray-plain-bg-active);
    --colors-color-palette-plain-fg: var(--colors-gray-plain-fg);
}

  body {
    background: canvas;
    color: var(--colors-fg-default);
}
}

@layer tokens{
  :where(:root, :host) {
    --colors-black: #000000;
    --colors-black-a1: rgba(0, 0, 0, 0.05);
    --colors-black-a2: rgba(0, 0, 0, 0.1);
    --colors-black-a3: rgba(0, 0, 0, 0.15);
    --colors-black-a4: rgba(0, 0, 0, 0.2);
    --colors-black-a5: rgba(0, 0, 0, 0.3);
    --colors-black-a6: rgba(0, 0, 0, 0.4);
    --colors-black-a7: rgba(0, 0, 0, 0.5);
    --colors-black-a8: rgba(0, 0, 0, 0.6);
    --colors-black-a9: rgba(0, 0, 0, 0.7);
    --colors-black-a10: rgba(0, 0, 0, 0.8);
    --colors-black-a11: rgba(0, 0, 0, 0.9);
    --colors-black-a12: rgba(0, 0, 0, 0.95);
    --colors-white: #ffffff;
    --colors-white-a1: rgba(255, 255, 255, 0.05);
    --colors-white-a2: rgba(255, 255, 255, 0.1);
    --colors-white-a3: rgba(255, 255, 255, 0.15);
    --colors-white-a4: rgba(255, 255, 255, 0.2);
    --colors-white-a5: rgba(255, 255, 255, 0.3);
    --colors-white-a6: rgba(255, 255, 255, 0.4);
    --colors-white-a7: rgba(255, 255, 255, 0.5);
    --colors-white-a8: rgba(255, 255, 255, 0.6);
    --colors-white-a9: rgba(255, 255, 255, 0.7);
    --colors-white-a10: rgba(255, 255, 255, 0.8);
    --colors-white-a11: rgba(255, 255, 255, 0.9);
    --colors-white-a12: rgba(255, 255, 255, 0.95);
    --durations-fastest: 50ms;
    --durations-faster: 100ms;
    --durations-fast: 150ms;
    --durations-normal: 200ms;
    --durations-slow: 250ms;
    --durations-slower: 300ms;
    --durations-slowest: 400ms;
    --z-index-hide: -1;
    --z-index-base: 0;
    --z-index-docked: 10;
    --z-index-dropdown: 1000;
    --z-index-sticky: 1100;
    --z-index-banner: 1200;
    --z-index-overlay: 1300;
    --z-index-modal: 1400;
    --z-index-popover: 1500;
    --z-index-skip-link: 1600;
    --z-index-toast: 1700;
    --z-index-tooltip: 1800;
}

  @keyframes expand-height {
    from {
      height: 0;
}

    to {
      height: var(--height);
}
}

  @keyframes collapse-height {
    from {
      height: var(--height);
}

    to {
      height: 0;
}
}

  @keyframes expand-width {
    from {
      width: 0;
}

    to {
      width: var(--width);
}
}

  @keyframes collapse-width {
    from {
      width: var(--width);
}

    to {
      width: 0;
}
}

  @keyframes fade-in {
    from {
      opacity: 0;
}

    to {
      opacity: 1;
}
}

  @keyframes fade-out {
    from {
      opacity: 1;
}

    to {
      opacity: 0;
}
}

  @keyframes slide-from-left-full {
    from {
      translate: -100% 0;
}

    to {
      translate: 0 0;
}
}

  @keyframes slide-from-right-full {
    from {
      translate: 100% 0;
}

    to {
      translate: 0 0;
}
}

  @keyframes slide-from-top-full {
    from {
      translate: 0 -100%;
}

    to {
      translate: 0 0;
}
}

  @keyframes slide-from-bottom-full {
    from {
      translate: 0 100%;
}

    to {
      translate: 0 0;
}
}

  @keyframes slide-to-left-full {
    from {
      translate: 0 0;
}

    to {
      translate: -100% 0;
}
}

  @keyframes slide-to-right-full {
    from {
      translate: 0 0;
}

    to {
      translate: 100% 0;
}
}

  @keyframes slide-to-top-full {
    from {
      translate: 0 0;
}

    to {
      translate: 0 -100%;
}
}

  @keyframes slide-to-bottom-full {
    from {
      translate: 0 0;
}

    to {
      translate: 0 100%;
}
}

  @keyframes slide-from-top {
    0% {
      translate: 0 -0.5rem;
}

    to {
      translate: 0;
}
}

  @keyframes slide-from-bottom {
    0% {
      translate: 0 0.5rem;
}

    to {
      translate: 0;
}
}

  @keyframes slide-from-left {
    0% {
      translate: -0.5rem 0;
}

    to {
      translate: 0;
}
}

  @keyframes slide-from-right {
    0% {
      translate: 0.5rem 0;
}

    to {
      translate: 0;
}
}

  @keyframes slide-to-top {
    0% {
      translate: 0;
}

    to {
      translate: 0 -0.5rem;
}
}

  @keyframes slide-to-bottom {
    0% {
      translate: 0;
}

    to {
      translate: 0 0.5rem;
}
}

  @keyframes slide-to-left {
    0% {
      translate: 0;
}

    to {
      translate: -0.5rem 0;
}
}

  @keyframes slide-to-right {
    0% {
      translate: 0;
}

    to {
      translate: 0.5rem 0;
}
}

  @keyframes scale-in {
    from {
      scale: 0.95;
}

    to {
      scale: 1;
}
}

  @keyframes scale-out {
    from {
      scale: 1;
}

    to {
      scale: 0.95;
}
}

  @keyframes bg-position {
    from {
      background-position: var(--animate-from, 1rem) 0;
}

    to {
      background-position: var(--animate-to, 0) 0;
}
}

  @keyframes position {
    from {
      inset-inline-start: var(--animate-from-x);
      inset-block-start: var(--animate-from-y);
}

    to {
      inset-inline-start: var(--animate-to-x);
      inset-block-start: var(--animate-to-y);
}
}

  @media (prefers-color-scheme: dark) {
    :where(:root, :host) {
      --colors-fg-default: var(--colors-gray-12);
      --colors-fg-muted: var(--colors-gray-11);
      --colors-fg-subtle: var(--colors-gray-10);
      --colors-border: var(--colors-gray-4);
      --colors-error: var(--colors-red-9);
      --colors-gray-1: #111111;
      --colors-gray-2: #191919;
      --colors-gray-3: #222222;
      --colors-gray-4: #2a2a2a;
      --colors-gray-5: #313131;
      --colors-gray-6: #3a3a3a;
      --colors-gray-7: #484848;
      --colors-gray-8: #606060;
      --colors-gray-9: #6e6e6e;
      --colors-gray-10: #7b7b7b;
      --colors-gray-11: #b4b4b4;
      --colors-gray-12: #eeeeee;
      --colors-gray-a1: #00000000;
      --colors-gray-a2: #ffffff09;
      --colors-gray-a3: #ffffff12;
      --colors-gray-a4: #ffffff1b;
      --colors-gray-a5: #ffffff22;
      --colors-gray-a6: #ffffff2c;
      --colors-gray-a7: #ffffff3b;
      --colors-gray-a8: #ffffff55;
      --colors-gray-a9: #ffffff64;
      --colors-gray-a10: #ffffff72;
      --colors-gray-a11: #ffffffaf;
      --colors-gray-a12: #ffffffed;
      --colors-gray-solid-bg: var(--colors-white);
      --colors-gray-solid-bg-hover: var(--colors-gray-12);
      --colors-gray-solid-fg: var(--colors-black);
      --colors-gray-subtle-bg: var(--colors-gray-a3);
      --colors-gray-subtle-bg-hover: var(--colors-gray-a4);
      --colors-gray-subtle-bg-active: var(--colors-gray-a5);
      --colors-gray-subtle-fg: var(--colors-gray-12);
      --colors-gray-surface-bg: var(--colors-gray-1);
      --colors-gray-surface-bg-hover: var(--colors-gray-2);
      --colors-gray-surface-bg-active: var(--colors-gray-3);
      --colors-gray-surface-border: var(--colors-gray-6);
      --colors-gray-surface-border-hover: var(--colors-gray-7);
      --colors-gray-surface-fg: var(--colors-gray-12);
      --colors-gray-outline-bg-hover: var(--colors-gray-a2);
      --colors-gray-outline-bg-active: var(--colors-gray-a3);
      --colors-gray-outline-border: var(--colors-gray-6);
      --colors-gray-outline-fg: var(--colors-gray-12);
      --colors-gray-plain-bg-hover: var(--colors-gray-a3);
      --colors-gray-plain-bg-active: var(--colors-gray-a4);
      --colors-gray-plain-fg: var(--colors-gray-12);
      --colors-green-1: #0e1512;
      --colors-green-2: #121b17;
      --colors-green-3: #132d21;
      --colors-green-4: #113b29;
      --colors-green-5: #174933;
      --colors-green-6: #20573e;
      --colors-green-7: #28684a;
      --colors-green-8: #2f7c57;
      --colors-green-9: #30a46c;
      --colors-green-10: #33b074;
      --colors-green-11: #3dd68c;
      --colors-green-12: #b1f1cb;
      --colors-green-a1: #00de4505;
      --colors-green-a2: #29f99d0b;
      --colors-green-a3: #22ff991e;
      --colors-green-a4: #11ff992d;
      --colors-green-a5: #2bffa23c;
      --colors-green-a6: #44ffaa4b;
      --colors-green-a7: #50fdac5e;
      --colors-green-a8: #54ffad73;
      --colors-green-a9: #44ffa49e;
      --colors-green-a10: #43fea4ab;
      --colors-green-a11: #46fea5d4;
      --colors-green-a12: #bbffd7f0;
      --colors-green-solid-bg: var(--colors-green-9);
      --colors-green-solid-bg-hover: var(--colors-green-10);
      --colors-green-solid-fg: white;
      --colors-green-subtle-bg: var(--colors-green-a3);
      --colors-green-subtle-bg-hover: var(--colors-green-a4);
      --colors-green-subtle-bg-active: var(--colors-green-a5);
      --colors-green-subtle-fg: var(--colors-green-a11);
      --colors-green-surface-bg: var(--colors-green-a2);
      --colors-green-surface-bg-active: var(--colors-green-a3);
      --colors-green-surface-border: var(--colors-green-a6);
      --colors-green-surface-border-hover: var(--colors-green-a7);
      --colors-green-surface-fg: var(--colors-green-a11);
      --colors-green-outline-bg-hover: var(--colors-green-a2);
      --colors-green-outline-bg-active: var(--colors-green-a3);
      --colors-green-outline-border: var(--colors-green-a7);
      --colors-green-outline-fg: var(--colors-green-a11);
      --colors-green-plain-bg-hover: var(--colors-green-a3);
      --colors-green-plain-bg-active: var(--colors-green-a4);
      --colors-green-plain-fg: var(--colors-green-a11);
      --colors-red-1: #191111;
      --colors-red-2: #201314;
      --colors-red-3: #3b1219;
      --colors-red-4: #500f1c;
      --colors-red-5: #611623;
      --colors-red-6: #72232d;
      --colors-red-7: #8c333a;
      --colors-red-8: #b54548;
      --colors-red-9: #e5484d;
      --colors-red-10: #ec5d5e;
      --colors-red-11: #ff9592;
      --colors-red-12: #ffd1d9;
      --colors-red-a1: #f4121209;
      --colors-red-a2: #f22f3e11;
      --colors-red-a3: #ff173f2d;
      --colors-red-a4: #fe0a3b44;
      --colors-red-a5: #ff204756;
      --colors-red-a6: #ff3e5668;
      --colors-red-a7: #ff536184;
      --colors-red-a8: #ff5d61b0;
      --colors-red-a9: #fe4e54e4;
      --colors-red-a10: #ff6465eb;
      --colors-red-a11: #ff9592;
      --colors-red-a12: #ffd1d9;
      --colors-red-solid-bg: var(--colors-red-9);
      --colors-red-solid-bg-hover: var(--colors-red-10);
      --colors-red-solid-fg: white;
      --colors-red-subtle-bg: var(--colors-red-a3);
      --colors-red-subtle-bg-hover: var(--colors-red-a4);
      --colors-red-subtle-bg-active: var(--colors-red-a5);
      --colors-red-subtle-fg: var(--colors-red-a11);
      --colors-red-surface-bg: var(--colors-red-a2);
      --colors-red-surface-bg-active: var(--colors-red-a3);
      --colors-red-surface-border: var(--colors-red-a6);
      --colors-red-surface-border-hover: var(--colors-red-a7);
      --colors-red-surface-fg: var(--colors-red-a11);
      --colors-red-outline-bg-hover: var(--colors-red-a2);
      --colors-red-outline-bg-active: var(--colors-red-a3);
      --colors-red-outline-border: var(--colors-red-a7);
      --colors-red-outline-fg: var(--colors-red-a11);
      --colors-red-plain-bg-hover: var(--colors-red-a3);
      --colors-red-plain-bg-active: var(--colors-red-a4);
      --colors-red-plain-fg: var(--colors-red-a11);
      --shadows-xs: 0px 1px 1px var(--colors-black-a8), 0px 0px 1px inset var(--colors-gray-a8);
      --shadows-sm: 0px 2px 4px var(--colors-black-a8), 0px 0px 1px inset var(--colors-gray-a8);
      --shadows-md: 0px 4px 8px var(--colors-black-a8), 0px 0px 1px inset var(--colors-gray-a8);
      --shadows-lg: 0px 8px 16px var(--colors-black-a8), 0px 0px 1px inset var(--colors-gray-a8);
      --shadows-xl: 0px 16px 24px var(--colors-black-a8), 0px 0px 1px inset var(--colors-gray-a8);
      --shadows-2xl: 0px 24px 40px var(--colors-black-a8), 0px 0px 1px inset var(--colors-gray-a8);
      --shadows-inset: inset 8px 0 12px -8px var(--colors-black-a6)
        }
    }

  @media (prefers-color-scheme: light) {
    :where(:root, :host) {
      --colors-fg-default: var(--colors-gray-12);
      --colors-fg-muted: var(--colors-gray-11);
      --colors-fg-subtle: var(--colors-gray-10);
      --colors-border: var(--colors-gray-4);
      --colors-error: var(--colors-red-9);
      --colors-gray-1: #fcfcfc;
      --colors-gray-2: #f9f9f9;
      --colors-gray-3: #f0f0f0;
      --colors-gray-4: #e8e8e8;
      --colors-gray-5: #e0e0e0;
      --colors-gray-6: #d9d9d9;
      --colors-gray-7: #cecece;
      --colors-gray-8: #bbbbbb;
      --colors-gray-9: #8d8d8d;
      --colors-gray-10: #838383;
      --colors-gray-11: #646464;
      --colors-gray-12: #202020;
      --colors-gray-a1: #00000003;
      --colors-gray-a2: #00000006;
      --colors-gray-a3: #0000000f;
      --colors-gray-a4: #00000017;
      --colors-gray-a5: #0000001f;
      --colors-gray-a6: #00000026;
      --colors-gray-a7: #00000031;
      --colors-gray-a8: #00000044;
      --colors-gray-a9: #00000072;
      --colors-gray-a10: #0000007c;
      --colors-gray-a11: #0000009b;
      --colors-gray-a12: #000000df;
      --colors-gray-solid-bg: var(--colors-black);
      --colors-gray-solid-bg-hover: var(--colors-gray-12);
      --colors-gray-solid-fg: var(--colors-white);
      --colors-gray-subtle-bg: var(--colors-gray-a3);
      --colors-gray-subtle-bg-hover: var(--colors-gray-a4);
      --colors-gray-subtle-bg-active: var(--colors-gray-a5);
      --colors-gray-subtle-fg: var(--colors-gray-12);
      --colors-gray-surface-bg: var(--colors-white);
      --colors-gray-surface-bg-hover: var(--colors-gray-2);
      --colors-gray-surface-bg-active: var(--colors-gray-3);
      --colors-gray-surface-border: var(--colors-gray-6);
      --colors-gray-surface-border-hover: var(--colors-gray-7);
      --colors-gray-surface-fg: var(--colors-gray-12);
      --colors-gray-outline-bg-hover: var(--colors-gray-a2);
      --colors-gray-outline-bg-active: var(--colors-gray-a3);
      --colors-gray-outline-border: var(--colors-gray-6);
      --colors-gray-outline-fg: var(--colors-gray-12);
      --colors-gray-plain-bg-hover: var(--colors-gray-a3);
      --colors-gray-plain-bg-active: var(--colors-gray-a4);
      --colors-gray-plain-fg: var(--colors-gray-12);
      --colors-green-1: #fbfefc;
      --colors-green-2: #f4fbf6;
      --colors-green-3: #e6f6eb;
      --colors-green-4: #d6f1df;
      --colors-green-5: #c4e8d1;
      --colors-green-6: #adddc0;
      --colors-green-7: #8eceaa;
      --colors-green-8: #5bb98b;
      --colors-green-9: #30a46c;
      --colors-green-10: #2b9a66;
      --colors-green-11: #218358;
      --colors-green-12: #193b2d;
      --colors-green-a1: #00c04004;
      --colors-green-a2: #00a32f0b;
      --colors-green-a3: #00a43319;
      --colors-green-a4: #00a83829;
      --colors-green-a5: #019c393b;
      --colors-green-a6: #00963c52;
      --colors-green-a7: #00914071;
      --colors-green-a8: #00924ba4;
      --colors-green-a9: #008f4acf;
      --colors-green-a10: #008647d4;
      --colors-green-a11: #00713fde;
      --colors-green-a12: #002616e6;
      --colors-green-solid-bg: var(--colors-green-9);
      --colors-green-solid-bg-hover: var(--colors-green-10);
      --colors-green-solid-fg: white;
      --colors-green-subtle-bg: var(--colors-green-a3);
      --colors-green-subtle-bg-hover: var(--colors-green-a4);
      --colors-green-subtle-bg-active: var(--colors-green-a5);
      --colors-green-subtle-fg: var(--colors-green-a11);
      --colors-green-surface-bg: var(--colors-green-a2);
      --colors-green-surface-bg-active: var(--colors-green-a3);
      --colors-green-surface-border: var(--colors-green-a6);
      --colors-green-surface-border-hover: var(--colors-green-a7);
      --colors-green-surface-fg: var(--colors-green-a11);
      --colors-green-outline-bg-hover: var(--colors-green-a2);
      --colors-green-outline-bg-active: var(--colors-green-a3);
      --colors-green-outline-border: var(--colors-green-a7);
      --colors-green-outline-fg: var(--colors-green-a11);
      --colors-green-plain-bg-hover: var(--colors-green-a3);
      --colors-green-plain-bg-active: var(--colors-green-a4);
      --colors-green-plain-fg: var(--colors-green-a11);
      --colors-red-1: #fffcfc;
      --colors-red-2: #fff7f7;
      --colors-red-3: #feebec;
      --colors-red-4: #ffdbdc;
      --colors-red-5: #ffcdce;
      --colors-red-6: #fdbdbe;
      --colors-red-7: #f4a9aa;
      --colors-red-8: #eb8e90;
      --colors-red-9: #e5484d;
      --colors-red-10: #dc3e42;
      --colors-red-11: #ce2c31;
      --colors-red-12: #641723;
      --colors-red-a1: #ff000003;
      --colors-red-a2: #ff000008;
      --colors-red-a3: #f3000d14;
      --colors-red-a4: #ff000824;
      --colors-red-a5: #ff000632;
      --colors-red-a6: #f8000442;
      --colors-red-a7: #df000356;
      --colors-red-a8: #d2000571;
      --colors-red-a9: #db0007b7;
      --colors-red-a10: #d10005c1;
      --colors-red-a11: #c40006d3;
      --colors-red-a12: #55000de8;
      --colors-red-solid-bg: var(--colors-red-9);
      --colors-red-solid-bg-hover: var(--colors-red-10);
      --colors-red-solid-fg: white;
      --colors-red-subtle-bg: var(--colors-red-a3);
      --colors-red-subtle-bg-hover: var(--colors-red-a4);
      --colors-red-subtle-bg-active: var(--colors-red-a5);
      --colors-red-subtle-fg: var(--colors-red-a11);
      --colors-red-surface-bg: var(--colors-red-a2);
      --colors-red-surface-bg-active: var(--colors-red-a3);
      --colors-red-surface-border: var(--colors-red-a6);
      --colors-red-surface-border-hover: var(--colors-red-a7);
      --colors-red-surface-fg: var(--colors-red-a11);
      --colors-red-outline-bg-hover: var(--colors-red-a2);
      --colors-red-outline-bg-active: var(--colors-red-a3);
      --colors-red-outline-border: var(--colors-red-a7);
      --colors-red-outline-fg: var(--colors-red-a11);
      --colors-red-plain-bg-hover: var(--colors-red-a3);
      --colors-red-plain-bg-active: var(--colors-red-a4);
      --colors-red-plain-fg: var(--colors-red-a11);
      --shadows-xs: 0px 1px 2px var(--colors-gray-a6), 0px 0px 1px var(--colors-gray-a7);
      --shadows-sm: 0px 2px 4px var(--colors-gray-a4), 0px 0px 1px var(--colors-gray-a4);
      --shadows-md: 0px 4px 8px var(--colors-gray-a4), 0px 0px 1px var(--colors-gray-a4);
      --shadows-lg: 0px 8px 16px var(--colors-gray-a4), 0px 0px 1px var(--colors-gray-a4);
      --shadows-xl: 0px 16px 24px var(--colors-gray-a4), 0px 0px 1px var(--colors-gray-a4);
      --shadows-2xl: 0px 24px 40px var(--colors-gray-a4), 0px 0px 1px var(--colors-gray-a4);
      --shadows-inset: inset 8px 0 12px -8px var(--colors-gray-a4)
        }
    }
}

@layer recipes{
  @layer _base{

    .button {
      border-radius: l2;
      gap: 2px;
      outline: 0;
      transition-property: background-color, border-color, color, box-shadow;
      transition-timing-function: var(--transition-easing, cubic-bezier(0.4, 0, 0.2, 1));
      transition-duration: var(--transition-duration, 150ms);
      align-items: center;
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
      display: inline-flex;
      flex-shrink: 0;
      font-weight: semibold;
      isolation: isolate;
      justify-content: center;
      position: relative;
      --transition-prop: background-color, border-color, color, box-shadow;
      -webkit-user-select: none;
      user-select: none;
      vertical-align: middle;
      white-space: nowrap;
      --focus-ring-color: var(--focus-ring-color-prop, var(--global-color-focus-ring, #005FCC));
}

    .button:is(:focus-visible, [data-focus-visible]) {
      outline-width: var(--focus-ring-width, 2px);
      outline-offset: var(--focus-ring-offset, 2px);
      outline-style: var(--focus-ring-style, solid);
      outline-color: var(--focus-ring-color);
}

    .button :where(svg) {
      flex-shrink: 0;
}

    .button:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
      cursor: not-allowed;
      opacity: 0.67;
      filter: grayscale(100%);
}

    .badge {
      display: inline-flex;
      align-items: center;
      line-height: 1;
      font-weight: medium;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      -webkit-user-select: none;
      user-select: none;
}

    .badge,.input {
      border-radius: l2;
}

    .input {
      outline: 0;
      transition-property: var(--transition-prop, color, background-color, border-color, outline-color, text-decoration-color, fill, stroke);
      transition-timing-function: var(--transition-easing, cubic-bezier(0.4, 0, 0.2, 1));
      transition-duration: var(--transition-duration, 150ms);
      appearance: none;
      -webkit-appearance: none;
      position: relative;
      text-align: start;
      height: var(--input-height);
      min-height: var(--input-height);
      min-width: var(--input-height);
      width: 100%;
}

    .input:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
      cursor: not-allowed;
      opacity: 0.67;
      filter: grayscale(100%);
}

    .kbd {
      border-radius: l2;
      display: inline-flex;
      align-items: center;
      font-weight: medium;
      font-family: code;
      flex-shrink: 0;
      white-space: nowrap;
      word-spacing: -0.5em;
      -webkit-user-select: none;
      user-select: none;
      justify-content: center;
}

    .spinner {
      --spinner-track-color: transparent;
      animation: spin;
      border-color: currentColor;
      border-radius: full;
      border-style: solid;
      border-width: 2px;
      animation-duration: var(--durations-slowest);
      border-inline-start-color: var(--spinner-track-color);
      display: inline-block;
      border-bottom-color: var(--spinner-track-color);
      height: var(--spinner-size);
      width: var(--spinner-size);
}

    .group {
      gap: 2px;
      display: inline-flex;
      position: relative;
}

    .group > *:is(:focus-visible, [data-focus-visible]) {
      z-index: 1;
}

    .absolute-center {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
}
}

  .button--variant_solid {
    background: var(--colors-color-palette-solid-bg);
    color: var(--colors-color-palette-solid-fg);
}

  .button--variant_solid:not(:disabled):hover {
    background: var(--colors-color-palette-solid-bg-hover);
}

  .button--size_md {
    padding-inline: 3.5px;
    font-size: sm;
    line-height: 1.25rem;
    height: 10px;
    min-width: 10px;
}

  .button--size_md :where(svg) {
    width: 5px;
    height: 5px;
}

  .button--size_xs {
    padding-inline: 2.5px;
    font-size: sm;
    line-height: 1.25rem;
    height: 8px;
    min-width: 8px;
}

  .button--size_xs :where(svg) {
    width: 4px;
    height: 4px;
}

  .button--variant_outline {
    border-width: 1px;
    border-color: var(--colors-color-palette-outline-border);
    color: var(--colors-color-palette-outline-fg);
}

  .button--variant_outline:is([data-state=on]) {
    background: var(--colors-color-palette-outline-bg-active);
}

  .button--variant_outline:not(:disabled):hover {
    background: var(--colors-color-palette-outline-bg-hover);
}

  .button--variant_outline:not(:disabled):active {
    background: var(--colors-color-palette-outline-bg-active);
}

  .badge--variant_subtle {
    background: var(--colors-color-palette-subtle-bg);
    color: var(--colors-color-palette-subtle-fg);
}

  .badge--size_sm {
    padding-inline: 1.5px;
    gap: 0.5px;
    font-size: xs;
    height: 4.5px;
}

  .badge--size_sm :where(svg) {
    width: 2.5px;
    height: 2.5px;
}

  .input--size_sm {
    --input-height: sizes.9;
    padding-inline: 2.5px;
    font-size: sm;
    line-height: 1.25rem;
}

  .input--variant_outline {
    border-width: 1px;
    border-color: var(--colors-gray-outline-border);
    --focus-ring-color: var(--focus-ring-color-prop, var(--global-color-focus-ring, #005FCC));
}

  .input--variant_outline:is(:focus-visible, [data-focus-visible]) {
    outline-offset: 0px;
    outline-width: var(--focus-ring-width, 1px);
    outline-color: var(--focus-ring-color);
    outline-style: var(--focus-ring-style, solid);
    border-color: var(--focus-ring-color);
}

  .input--variant_outline:is(:user-invalid, [data-invalid], [aria-invalid=true]) {
    border-color: var(--colors-error);
    --focus-ring-color-prop: var(--colors-error);
}

  .kbd--size_sm {
    padding-inline: 1px;
    font-size: xs;
    line-height: 1.125rem;
    height: 4.5px;
    min-width: 4.5px;
}

  .kbd--variant_surface {
    background: var(--colors-color-palette-surface-bg);
    border-width: 1px;
    border-color: var(--colors-color-palette-surface-border);
    color: var(--colors-color-palette-surface-fg);
}

  .spinner--size_lg {
    --spinner-size: sizes.6;
}

  .spinner--size_inherit {
    --spinner-size: 1em;
}

  .group--orientation_horizontal {
    flex-direction: row;
}

  .absolute-center--axis_both {
    inset-inline-start: 50%;
    translate: -50% -50%;
    top: 50%;
}

  :where([dir=rtl], :dir(rtl)) .absolute-center--axis_both {
    translate: 50% -50%;
}
}

@layer recipes.slots{
  @layer _base{

    .tabs__root {
      position: relative;
      display: flex;
      align-items: start;
}

    .tabs__root[data-orientation=horizontal] {
      gap: 2px;
      flex-direction: column;
}

    .tabs__root[data-orientation=vertical] {
      gap: 4px;
      flex-direction: row;
}

    .tabs__list {
      display: flex;
      position: relative;
      isolation: isolate;
}

    .tabs__list[data-orientation=horizontal] {
      flex-direction: row;
}

    .tabs__list[data-orientation=vertical] {
      flex-direction: column;
}

    .tabs__trigger {
      outline: 0;
      align-items: center;
      cursor: pointer;
      display: flex;
      font-weight: semibold;
      position: relative;
}

    .tabs__trigger:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
      cursor: not-allowed;
      opacity: 0.67;
      filter: grayscale(100%);
}

    .tabs__trigger:is(:focus-visible, [data-focus-visible]) {
      z-index: 1;
      --focus-ring-color: var(--focus-ring-color-prop, var(--global-color-focus-ring, #005FCC));
}

    .tabs__trigger:is(:focus-visible, [data-focus-visible]):is(:focus-visible, [data-focus-visible]) {
      outline-width: var(--focus-ring-width, 2px);
      outline-offset: var(--focus-ring-offset, 2px);
      outline-style: var(--focus-ring-style, solid);
      outline-color: var(--focus-ring-color);
}

    .tabs__content {
      --focus-ring-color: var(--focus-ring-color-prop, var(--global-color-focus-ring, #005FCC));
}

    .tabs__content:is(:focus-visible, [data-focus-visible]) {
      outline-offset: 0px;
      outline-width: var(--focus-ring-width, 1px);
      outline-color: var(--focus-ring-color);
      outline-style: var(--focus-ring-style, solid);
      border-color: var(--focus-ring-color);
}

    .tabs__content[data-orientation=horizontal] {
      width: 100%;
}

    .tabs__content[data-orientation=vertical] {
      height: 100%;
}

    .tabs__indicator {
      z-index: -1;
      width: var(--width);
      height: var(--height);
}

    .switch__root {
      --switch-diff: calc(var(--switch-width) - var(--switch-height));
      --switch-x: var(--switch-diff);
      display: inline-flex;
      align-items: center;
      position: relative;
      vertical-align: middle;
}

    :where([dir=rtl], :dir(rtl)) .switch__root {
      --switch-x: calc(var(--switch-diff) * -1);
}

    .switch__label {
      font-weight: medium;
      -webkit-user-select: none;
      user-select: none;
      line-height: 1;
}

    .switch__control {
      gap: 0.5rem;
      border-radius: full;
      transition: backgrounds;
      display: inline-flex;
      flex-shrink: 0;
      justify-content: flex-start;
      cursor: pointer;
      position: relative;
      --focus-ring-color: var(--focus-ring-color-prop, var(--global-color-focus-ring, #005FCC));
}

    .switch__control:is(:focus-visible, [data-focus-visible]) {
      outline-width: var(--focus-ring-width, 2px);
      outline-offset: var(--focus-ring-offset, 2px);
      outline-style: var(--focus-ring-style, solid);
      outline-color: var(--focus-ring-color);
}

    .switch__control {
      width: var(--switch-width);
      height: var(--switch-height);
}

    .switch__control:is(:user-invalid, [data-invalid], [aria-invalid=true]) {
      outline: 2px solid;
      outline-color: var(--colors-error);
      outline-offset: 2px;
}

    .switch__control:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
      cursor: not-allowed;
      opacity: 0.67;
      filter: grayscale(100%);
}

    .switch__thumb {
      border-radius: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      --transition-prop: translate;
      transition-property: translate;
      --transition-duration: var(--durations-fast);
      transition-duration: var(--durations-fast);
}

    .switch__thumb:is(:checked, [data-checked], [data-state=checked], [aria-checked=true], [data-state=indeterminate]) {
      translate: var(--switch-x) 0;
}

    .switch__indicator {
      place-content: center;
      transition: inset-inline-start 0.12s ease;
      position: absolute;
      font-size: var(--switch-indicator-font-size);
      font-weight: medium;
      flex-shrink: 0;
      -webkit-user-select: none;
      user-select: none;
      display: grid;
      inset-inline-start: calc(var(--switch-x) - 2px);
      height: var(--switch-height);
      width: var(--switch-height);
}

    .switch__indicator:is(:checked, [data-checked], [data-state=checked], [aria-checked=true], [data-state=indeterminate]) {
      inset-inline-start: 2px;
}
}

  .tabs__list--size_md {
    gap: 1px;
}

  .tabs__trigger--size_md {
    padding-inline: 4px;
    gap: 2px;
    font-size: sm;
    line-height: 1.25rem;
    height: 10px;
    min-width: 10px;
}

  .tabs__root--variant_line {
    align-items: stretch;
}

  .tabs__list--variant_line[data-orientation=vertical] {
    border-inline-start-width: 1px;
}

  .tabs__list--variant_line[data-orientation=horizontal] {
    border-bottom-width: 1px;
}

  .tabs__trigger--variant_line {
    color: var(--colors-fg-muted);
}

  .tabs__trigger--variant_line:is([aria-selected=true], [data-selected]) {
    color: var(--colors-color-palette-plain-fg);
}

  .tabs__indicator--variant_line {
    background: var(--colors-color-palette-solid-bg);
}

  .tabs__indicator--variant_line[data-orientation=horizontal] {
    transform: translateY(1px);
    bottom: 0;
    height: 0.5px;
}

  .tabs__indicator--variant_line[data-orientation=vertical] {
    transform: translateX(-1px);
    left: 0;
    width: 0.5px;
}

  .switch__control--variant_solid {
    background: var(--colors-gray-subtle-bg);
    border-radius: full;
    --focus-ring-color: var(--focus-ring-color-prop, var(--global-color-focus-ring, #005FCC));
}

  .switch__control--variant_solid:is(:focus-visible, [data-focus-visible]) {
    outline-width: var(--focus-ring-width, 2px);
    outline-offset: var(--focus-ring-offset, 2px);
    outline-style: var(--focus-ring-style, solid);
    outline-color: var(--focus-ring-color);
}

  .switch__control--variant_solid:is(:checked, [data-checked], [data-state=checked], [aria-checked=true], [data-state=indeterminate]) {
    background: var(--colors-color-palette-solid-bg);
}

  .switch__thumb--variant_solid {
    background: var(--colors-white);
    scale: 0.8;
    box-shadow: var(--shadows-xs);
    width: var(--switch-height);
    height: var(--switch-height);
}

  .switch__thumb--variant_solid:is(:checked, [data-checked], [data-state=checked], [aria-checked=true], [data-state=indeterminate]) {
    background: var(--colors-color-palette-solid-fg);
}

  .switch__root--size_md {
    --switch-width: sizes.10;
    --switch-height: sizes.5;
    --switch-indicator-font-size: fontSizes.sm;
    gap: 3px;
}

  .switch__label--size_md {
    font-size: md;
}
}

@layer utilities{

  .bg_green\\.subtle\\.bg {
    background: var(--colors-green-subtle-bg);
}

  .p_1 {
    padding: 1px;
}

  .bg_gray\\.surface\\.bg {
    background: var(--colors-gray-surface-bg);
}

  .bg_gray\\.subtle\\.bg {
    background: var(--colors-gray-subtle-bg);
}

  .gap_4 {
    gap: 4px;
}

  .bdr_l2 {
    border-radius: l2;
}

  .px_3 {
    padding-inline: 3px;
}

  .py_2 {
    padding-block: 2px;
}

  .gap_2 {
    gap: 2px;
}

  .td_underline {
    text-decoration: underline;
}

  .bd-c_gray\\.outline\\.border {
    border-color: var(--colors-gray-outline-border);
}

  .border-style_dashed {
    border-style: dashed;
}

  .bd-w_1px {
    border-width: 1px;
}

  .px_2 {
    padding-inline: 2px;
}

  .py_1\\.5 {
    padding-block: 1.5px;
}

  .gap_1 {
    gap: 1px;
}

  .gap_1\\.5 {
    gap: 1.5px;
}

  .bd-w_0\\.125em {
    border-width: 0.125em;
}

  .bd-c_gray\\.surface\\.border {
    border-color: var(--colors-gray-surface-border);
}

  .bdr_l3 {
    border-radius: l3;
}

  .py_1 {
    padding-block: 1px;
}

  .d_flex {
    display: flex;
}

  .flex-d_column {
    flex-direction: column;
}

  .c_green\\.subtle\\.fg {
    color: var(--colors-green-subtle-fg);
}

  .fs_xs {
    font-size: xs;
}

  .ai_center {
    align-items: center;
}

  .jc_space-between {
    justify-content: space-between;
}

  .c_fg\\.default {
    color: var(--colors-fg-default);
}

  .fs_sm {
    font-size: sm;
}

  .fw_medium {
    font-weight: medium;
}

  .c_fg\\.subtle {
    color: var(--colors-fg-subtle);
}

  .cursor_pointer {
    cursor: pointer;
}

  .ac-c_var\(--colors-green-9\) {
    accent-color: var(--colors-green-9);
}

  .flex-sh_0 {
    flex-shrink: 0;
}

  .c_fg\\.muted {
    color: var(--colors-fg-muted);
}

  .ai_flex-start {
    align-items: flex-start;
}

  .color-palette_green {
    --colors-color-palette-1: var(--colors-green-1);
    --colors-color-palette-2: var(--colors-green-2);
    --colors-color-palette-3: var(--colors-green-3);
    --colors-color-palette-4: var(--colors-green-4);
    --colors-color-palette-5: var(--colors-green-5);
    --colors-color-palette-6: var(--colors-green-6);
    --colors-color-palette-7: var(--colors-green-7);
    --colors-color-palette-8: var(--colors-green-8);
    --colors-color-palette-9: var(--colors-green-9);
    --colors-color-palette-10: var(--colors-green-10);
    --colors-color-palette-11: var(--colors-green-11);
    --colors-color-palette-12: var(--colors-green-12);
    --colors-color-palette-a1: var(--colors-green-a1);
    --colors-color-palette-a2: var(--colors-green-a2);
    --colors-color-palette-a3: var(--colors-green-a3);
    --colors-color-palette-a4: var(--colors-green-a4);
    --colors-color-palette-a5: var(--colors-green-a5);
    --colors-color-palette-a6: var(--colors-green-a6);
    --colors-color-palette-a7: var(--colors-green-a7);
    --colors-color-palette-a8: var(--colors-green-a8);
    --colors-color-palette-a9: var(--colors-green-a9);
    --colors-color-palette-a10: var(--colors-green-a10);
    --colors-color-palette-a11: var(--colors-green-a11);
    --colors-color-palette-a12: var(--colors-green-a12);
    --colors-color-palette-solid-bg: var(--colors-green-solid-bg);
    --colors-color-palette-solid-bg-hover: var(--colors-green-solid-bg-hover);
    --colors-color-palette-solid-fg: var(--colors-green-solid-fg);
    --colors-color-palette-subtle-bg: var(--colors-green-subtle-bg);
    --colors-color-palette-subtle-bg-hover: var(--colors-green-subtle-bg-hover);
    --colors-color-palette-subtle-bg-active: var(--colors-green-subtle-bg-active);
    --colors-color-palette-subtle-fg: var(--colors-green-subtle-fg);
    --colors-color-palette-surface-bg: var(--colors-green-surface-bg);
    --colors-color-palette-surface-bg-active: var(--colors-green-surface-bg-active);
    --colors-color-palette-surface-border: var(--colors-green-surface-border);
    --colors-color-palette-surface-border-hover: var(--colors-green-surface-border-hover);
    --colors-color-palette-surface-fg: var(--colors-green-surface-fg);
    --colors-color-palette-outline-bg-hover: var(--colors-green-outline-bg-hover);
    --colors-color-palette-outline-bg-active: var(--colors-green-outline-bg-active);
    --colors-color-palette-outline-border: var(--colors-green-outline-border);
    --colors-color-palette-outline-fg: var(--colors-green-outline-fg);
    --colors-color-palette-plain-bg-hover: var(--colors-green-plain-bg-hover);
    --colors-color-palette-plain-bg-active: var(--colors-green-plain-bg-active);
    --colors-color-palette-plain-fg: var(--colors-green-plain-fg);
}

  .fs_md {
    font-size: md;
}

  .c_green\\.9 {
    color: var(--colors-green-9);
}

  .c_inherit {
    color: inherit;
}

  .d_contents {
    display: contents;
}

  .vis_hidden {
    visibility: hidden;
}

  .d_inline-flex {
    display: inline-flex;
}

  .us_none {
    -webkit-user-select: none;
    user-select: none;
}

  .white-space_nowrap {
    white-space: nowrap;
}

  .mt_1 {
    margin-top: 1px;
}

  .max-w_100\% {
    max-width: 100%;
}

  .w_560px {
    width: 560px;
}

  .mt_4 {
    margin-top: 4px;
}

  .mb_2 {
    margin-bottom: 2px;
}

  .mt_2 {
    margin-top: 2px;
}

  .w_16px {
    width: 16px;
}

  .h_16px {
    height: 16px;
}

  .min-h_10 {
    min-height: 10px;
}

  .w_100\% {
    width: 100%;
}

  .min-h_8 {
    min-height: 8px;
}

  .pt_3 {
    padding-top: 3px;
}

  .\\[\&\\[data-selected\\]\\]\\:bg_green\\.surface\\.bg[data-selected] {
    background: var(--colors-green-surface-bg);
}

  .\\[\&_\>_\*\\:not\(\\:first-child\)\\:not\(\\:last-child\)\\]\\:bdr_0 > *:not(:first-child):not(:last-child) {
    border-radius: 0;
}

  .\\[\&_\>_\*\\:first-child\\]\\:bdr-e_0 > *:first-child {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
}

  .\\[\&_\>_\*\\:first-child\\]\\:me_-1px > *:first-child {
    margin-inline-end: -1px;
}

  .\\[\&_\>_\*\\:last-child\\]\\:bdr-s_0 > *:last-child {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
}

  .\\[\&_\>_\*\\:not\(\\:first-child\)\\:not\(\\:last-child\)\\]\\:me_-1px > *:not(:first-child):not(:last-child) {
    margin-inline-end: -1px;
}

  .\\[\&_\>_\*\\:first-child\\]\\:bdr-b_0 > *:first-child {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

  .\\[\&_\>_\*\\:last-child\\]\\:bdr-t_0 > *:last-child {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

  .\\[\&\\[data-selected\\]\\]\\:c_green\\.surface\\.fg[data-selected] {
    color: var(--colors-green-surface-fg);
}

  .\\[\&\\[data-selected\\]\\]\\:bx-sh_xs[data-selected] {
    box-shadow: var(--shadows-xs);
}

  .\\[\&_\>_\*\\:first-child\\]\\:mb_-1px > *:first-child,.\\[\&_\>_\*\\:not\(\\:first-child\)\\:not\(\\:last-child\)\\]\\:mb_-1px > *:not(:first-child):not(:last-child) {
    margin-bottom: -1px;
}

  .focus\\:c_fg\\.default:is(:focus, [data-focus]) {
    color: var(--colors-fg-default);
}

  .hover\\:bg_gray\\.plain\\.bg\\.hover:not(:disabled):hover {
    background: var(--colors-gray-plain-bg-hover);
}

  .hover\\:bd-c_gray\\.surface\\.border\\.hover:not(:disabled):hover {
    border-color: var(--colors-gray-surface-border-hover);
}

  .hover\\:c_fg\\.muted:not(:disabled):hover {
    color: var(--colors-fg-muted);
}

  .hover\\:c_fg\\.default:not(:disabled):hover {
    color: var(--colors-fg-default);
}
}`;
