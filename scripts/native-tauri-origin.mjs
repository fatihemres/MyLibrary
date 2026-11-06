// These release-EXE harnesses use Windows Tauri's default HTTP custom-protocol origin.
function nativeOrigin(value) {
  if (
    typeof value !== 'string' ||
    !/^http:\/\//i.test(value) ||
    /[\s\\]/u.test(value) ||
    [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  )
    return undefined;
  try {
    const url = new URL(value);
    return url.username || url.password ? undefined : url.origin;
  } catch {
    return undefined;
  }
}

export function isTrustedTauriPage(value) {
  return nativeOrigin(value) === 'http://tauri.localhost';
}

// IPC and assets belong only to request accounting, never application-page selection.
export function isLocalTauriResource(value) {
  return ['http://tauri.localhost', 'http://ipc.localhost', 'http://asset.localhost'].includes(
    nativeOrigin(value),
  );
}
