import { useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { confirmAction } from './Confirmation';

/** Protect an in-progress form from reload and native window close. */
export function useUnsaved(dirty: boolean) {
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    const before = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', before);
    let disposed = false;
    let unlisten: (() => void) | undefined;
    getCurrentWindow()
      .onCloseRequested(async (event) => {
        if (dirtyRef.current) {
          event.preventDefault();
          if (await confirmAction('Discard unsaved changes and close MyLibrary?'))
            await getCurrentWindow().destroy();
        }
      })
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      })
      .catch(() => {
        /* Browser previews do not expose a native window. */
      });
    return () => {
      disposed = true;
      unlisten?.();
      window.removeEventListener('beforeunload', before);
    };
  }, []);
}
