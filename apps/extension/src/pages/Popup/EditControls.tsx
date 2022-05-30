import { IconButton, Switch } from '@hope-ui/solid';
import { HiSolidX } from 'solid-icons/hi';

type Props = {
  setPage: (page: 'home' | 'edit-controls') => void;
};

export function EditControls({ setPage }: Props) {
  return (
    <div class="flex justify-between">
      <div>
        <label class="text-lg font-medium text-gray-900 mb-4">Controls: </label>
        <p>Modifier keys to enable "mouse click":</p>
        <div class="flex flex-col items-start">
          <Switch labelPlacement="end">Control</Switch>
          <Switch labelPlacement="end">Command</Switch>
          <Switch labelPlacement="end">Option</Switch>
          <Switch labelPlacement="end">Shift</Switch>
        </div>
      </div>
      <IconButton
        variant="ghost"
        aria-label="close"
        icon={<HiSolidX />}
        onClick={() => {
          setPage('home');
        }}
      />
    </div>
  );
}
