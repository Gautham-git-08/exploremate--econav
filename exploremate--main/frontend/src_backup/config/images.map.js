/**
 * ExploreMate Central Image Map — Single Source of Truth
 * 
 * Maps every destination, chapter, stay, restaurant, and itinerary activity
 * strictly to its verified local image asset or a branded neutral placeholder.
 * 
 * Rules:
 * - Match by what the picture REALLY shows, not just file name.
 * - If no exact match exists in public/images, use NEUTRAL_PLACEHOLDER.
 * - Never use external URLs or unverified stock photos.
 */

export const NEUTRAL_PLACEHOLDER = '/images/neutral_placeholder.svg';
export const DEFAULT_FALLBACK = '/images/white_town_reference.jpg.jpeg';

export const IMAGE_MAP = {
  // === CORE VERIFIED PLACES (matching actual photos) ===
  'aurobindo-ashram': {
    src: '/images/aurobindo_ashram.png',
    alt: 'Sri Aurobindo Ashram marble Samadhi courtyard and flower decorations',
    reason: 'Photo shows the tranquil flower-covered central Samadhi in White Town'
  },
  'white-town': {
    src: '/images/white_town_reference.jpg.jpeg',
    alt: 'White Town French Quarter colonial yellow villa facade with bougainvillea',
    reason: 'Photo shows iconic Rue Dumas colonial yellow heritage villa and street'
  },
  'promenade-beach': {
    src: '/images/rock_beach.png',
    alt: 'Promenade Rock Beach seawall boulders and Goubert Avenue seaside walkway',
    reason: 'Photo shows the black basalt rock seawall facing the Bay of Bengal'
  },
  'pondicherry-museum': {
    src: '/images/pondicherry_museum.jpg.jpeg',
    alt: 'Pondicherry Museum historic French colonial building facade on Rue Saint Louis',
    reason: 'Photo shows the actual museum building exterior housing Arikamedu relics'
  },
  'matrimandir-viewing-point': {
    src: '/images/matrimandir_auroville.png',
    alt: 'Matrimandir golden geodesic meditation sphere surrounded by green forest',
    reason: 'Photo shows the iconic golden sphere of Matrimandir in Auroville'
  },
  'auroville-visitors-centre': {
    src: '/images/matrimandir_auroville.png',
    alt: 'Auroville orientation and Matrimandir golden dome sanctuary',
    reason: 'Photo shows Matrimandir gardens which Visitors Centre provides passes for'
  },
  'casablanca-boutique': {
    src: '/images/casablanca.png',
    alt: 'Casablanca Heritage Boutique entrance on Mission Street',
    reason: 'Photo shows the multi-storey Casablanca lifestyle store facade'
  },
  'eden-beach': {
    src: '/images/eden_beach.png',
    alt: 'Eden Beach Blue Flag eco-certified golden shoreline and watchtower',
    reason: 'Photo shows the clean sandbar and eco-facilities of Eden Beach'
  },
  'serenity-beach': {
    src: '/images/serenity_beach_coast.jpg.jpeg',
    alt: 'Serenity Beach rocky groyne pier and artisanal fishing boats',
    reason: 'Photo shows the northern rocky pier and surf break at Serenity Beach'
  },
  'french-war-memorial': {
    src: '/images/french_war_memorial.png',
    alt: 'French War Memorial stone monument on Goubert Avenue',
    reason: 'Photo shows the WWI memorial tribute monument facing the seafront'
  },
  'manakula-vinayagar-temple': {
    src: '/images/manakula_vinayagar_temple.png',
    alt: 'Manakula Vinayagar Temple ornate carved Hindu Rajagopuram gopuram tower',
    reason: 'Photo shows the traditional Ganesha temple tower in White Town'
  },

  // === CAFES & INDOOR ALTERNATIVES (Sheltered Rainy Day Swaps) ===
  'cafe-des-arts': {
    src: '/images/cafe des arts.png',
    alt: 'Café des Arts colonial yellow courtyard garden on Rue Suffren',
    reason: 'Photo shows the shaded vintage colonial café courtyard on Rue Suffren'
  },
  'coromandel-cafe': {
    src: '/images/coromandel_cafe .png',
    alt: 'Coromandel Café romantic pink heritage villa restaurant dining hall',
    reason: 'Photo shows the 19th-century French mansion indoor dining area'
  },
  'surguru-restaurant': {
    src: '/images/surguru_spot.png',
    alt: 'Surguru traditional South Indian vegetarian restaurant on Mission Street',
    reason: 'Photo shows the authentic vegetarian eatery popular for filter coffee'
  },
  'tanto-pizzeria': {
    src: '/images/tanto_pizerria.png',
    alt: 'Tanto wood-fired pizzeria in Auroville with outdoor Casuarina seating',
    reason: 'Photo shows the Italian wood-fired restaurant in Auroville'
  },

  // === ECO-STAYS & HERITAGE HOTELS ===
  'villa-shanti': {
    src: '/images/villa shanti.png',
    alt: 'Villa Shanti 19th-century restored French boutique hotel courtyard',
    reason: 'Photo shows the quiet inner courtyard and white arches of Villa Shanti'
  },
  'promenade-hotel': {
    src: '/images/Promenade Seafront Boutique Hotel.avif',
    alt: 'The Promenade Seafront Boutique Hotel overlooking Goubert Avenue',
    reason: 'Photo shows the modern luxury seafront hotel facing the sea'
  },
  'maison-perumal': {
    src: '/images/Maison Perumal - CGH Earth.jpg.jpeg',
    alt: 'Maison Perumal CGH Earth Chettinad-French heritage villa courtyard',
    reason: 'Photo shows the teak pillars and courtyard of Maison Perumal'
  },
  'dune-eco-village': {
    src: '/images/dune eco.png',
    alt: 'The Dune Eco Beach Village organic farm retreat by the sea',
    reason: 'Photo shows the thatched coastal eco-bungalows of Dune resort'
  },
  'auroville-green-guesthouse': {
    src: '/images/Auroville_Green_guesthouse.png',
    alt: 'Auroville Green Guesthouse solar-powered quiet forest stay',
    reason: 'Photo shows the tranquil eco-guesthouse in the Auroville forest'
  },

  // === CHAPTER HERO IMAGES ===
  'chapter-turtle': {
    src: '/images/serenity_beach_coast.jpg.jpeg',
    alt: 'Serenity Beach starlit coastal nesting grounds of the Olive Ridley sea turtle',
    reason: 'Serenity Beach is the primary Olive Ridley coastal nesting strip in Pondicherry'
  },
  'chapter-fisherman': {
    src: '/images/serenity_beach_coast.jpg.jpeg',
    alt: 'Wooden catamarans on the morning sands of northern Pondicherry',
    reason: 'Photo shows authentic fishing catamarans at the fisherman beach'
  },
  'chapter-neem': {
    src: '/images/white_town_reference.jpg.jpeg',
    alt: 'Ancient tree canopies over colonial villas on Rue Dumas',
    reason: 'Photo captures the leafy streetscape and pastel architecture of Rue Dumas'
  },
  'chapter-auroville': {
    src: '/images/matrimandir_auroville.png',
    alt: 'Matrimandir sanctuary inside the green regeneration belt',
    reason: 'Photo shows the central golden globe amidst the regenerated dry forest'
  }
};

/**
 * Get verified image for a place ID, fallback to NEUTRAL_PLACEHOLDER if missing.
 */
export function getVerifiedImage(id) {
  if (IMAGE_MAP[id]) {
    return IMAGE_MAP[id];
  }
  return {
    src: NEUTRAL_PLACEHOLDER,
    alt: 'ExploreMate Pondicherry Destination (Photo verification in progress)',
    reason: 'No exact local photograph available; using branded neutral placeholder'
  };
}
