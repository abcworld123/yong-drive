import { useCallback, useEffect } from 'react';
import { Button, CheckBox } from 'components/buttons';
import { useCheckBoxStore, useHomeStore } from 'hooks/stores';
import styles from 'styles/Layouts.module.scss';
import type { ClipboardButtonProps } from 'types/props';

export default function AllCheckBox({ checkMode }: ClipboardButtonProps) {
  const objects = useHomeStore(state => state.objects);
  const chkAll = useCheckBoxStore(state => state.chkAll);

  const toggleChkAll = useCallback((target: EventTarget) => {
    console.log(target.constructor.name);
    if (target instanceof HTMLInputElement) return;
    useCheckBoxStore.setState(state => ({ chkAll: !state.chkAll }));
  }, []);

  useEffect(() => {
    if (!checkMode) {
      useCheckBoxStore.setState({ chkAll: false });
    }
  }, [checkMode]);

  return (
    <Button
      onClick={e => toggleChkAll(e.target)}
      className={styles.buttonAllCheckBox}
      icon={<CheckBox checked={chkAll} />}
      disabled={!objects.length}
    />
  );
}
