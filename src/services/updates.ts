/** No network or installer calls until a separately reviewed signed distribution is configured. */
export const updatePolicy = Object.freeze({
  configured: false,
  channel: 'stable',
  automatic: false,
});
export type UpdateStatus = { state: 'notConfigured'; currentVersion: string; latestVersion: null };
export async function checkUpdates(currentVersion: string): Promise<UpdateStatus> {
  return { state: 'notConfigured', currentVersion, latestVersion: null };
}
