import { open, save } from '@tauri-apps/plugin-dialog';
import { api } from './api';

export interface PlatformInfo {
  os: string;
  arch: string;
  version: string;
  schema: number;
  channel: 'stable';
  updatesConfigured: boolean;
  paths: { data: string; cache: string; temporary: string; backups: string };
}
export const platformInfo = () => api<PlatformInfo>('platform');
export const openDataFolder = () => api('open_folder');
// Only native user selection grants a path; imported paths never open external files.
export const chooseFile = open;
export const chooseDestination = save;
export const isMac = (platform = navigator.platform) => /Mac/i.test(platform);
export const shortcutLabel = (key: string, mac = isMac()) => `${mac ? '⌘' : 'Ctrl'} ${key}`;
export const commandPressed = (event: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey'>) =>
  isMac() ? event.metaKey : event.ctrlKey;
