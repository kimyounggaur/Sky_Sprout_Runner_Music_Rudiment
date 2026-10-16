/** Disable the feature without modifying user levels or local learning data. */
export function isMusicFeatureEnabled(buildValue?: string, search = ''): boolean {
  return buildValue !== 'false' && new URLSearchParams(search).get('music') !== 'off';
}
export const MUSIC_ENABLED = isMusicFeatureEnabled(import.meta.env.VITE_MUSIC_ENABLED, typeof window === 'undefined' ? '' : window.location.search);
