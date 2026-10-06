import {useEffect,useRef} from 'react';
import {getCurrentWindow} from '@tauri-apps/api/window';

/** Protect an in-progress form from reload and native window close. */
export function useUnsaved(dirty:boolean){
 const dirtyRef=useRef(dirty);dirtyRef.current=dirty;
 useEffect(()=>{
  const before=(event:BeforeUnloadEvent)=>{if(dirtyRef.current){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',before);
  let disposed=false;let unlisten:(()=>void)|undefined;
  getCurrentWindow().onCloseRequested(event=>{if(dirtyRef.current&&!window.confirm('Discard unsaved changes and close MyLibrary?'))event.preventDefault();}).then(fn=>{if(disposed)fn();else unlisten=fn;}).catch(()=>{/* Browser previews do not expose a native window. */});
  return()=>{disposed=true;unlisten?.();window.removeEventListener('beforeunload',before);};
 },[]);
}
