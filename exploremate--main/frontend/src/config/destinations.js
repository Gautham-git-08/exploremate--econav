/**
 * Central Destination Media Registry
 * Uses images.map.js as the single source of truth.
 */

import { IMAGE_MAP, NEUTRAL_PLACEHOLDER, DEFAULT_FALLBACK, getVerifiedImage } from './images.map.js';

export const FALLBACK_IMAGE = NEUTRAL_PLACEHOLDER;

export function getDestinationMedia(id, fallbackName = 'Pondicherry Landmark') {
  const verified = getVerifiedImage(id);
  return {
    src: verified.src,
    alt: verified.alt || `${fallbackName} in Pondicherry`,
    aspectRatio: '16/9'
  };
}

export default getDestinationMedia;
