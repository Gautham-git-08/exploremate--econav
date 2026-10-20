/**
 * ExploreMate Vivid Travel Stories & Lore
 * 
 * Each story is crafted with rich sensory details, local Pondicherry cultural lore,
 * and clear ecological stakes. Word count: 250-350 words per story.
 */

import { IMAGE_MAP } from '../config/images.map.js';

export const STORIES = [
  {
    id: 'chapter-turtle',
    title: "The Sea Turtle's Midnight Beach",
    subtitle: "Serenity Beach Coastal Sanctuary",
    tagline: "Can one walker's quiet footsteps protect 45 vulnerable hatchlings?",
    unlockThresholdKg: 0.5,
    heroImage: IMAGE_MAP['chapter-turtle']?.src || '/images/serenity_beach_coast.jpg.jpeg',
    heroAlt: IMAGE_MAP['chapter-turtle']?.alt || 'Serenity Beach coastal sands at night',
    readingTimeMinutes: 2,
    wordCount: 284,
    badgeAward: "Coastal Guardian",
    location: "Serenity Beach & Kottakuppam Coast",
    summary: "Olive Ridley turtles navigate by moonlight. When travelers replace roaring mopeds with barefoot coastal walks, newly hatched turtles find the ocean without fatal disorientation.",
    content: `Under a sky dusted with sea salt and starlight, the Bay of Bengal rolls in with a rhythmic, low-frequency roar. It is nearly midnight on Serenity Beach, and the sand has cooled from the fierce tropical heat of midday into a damp, powdery cushion. 

From the black water, a gentle crest of foam reveals a solitary silhouette: an Olive Ridley sea turtle, her olive-green carapace glistening under the crescent moon. She drags herself forward, flipper by laborious flipper, instinctually following the ancient celestial map encoded in her bloodline. She is searching for high ground above the tide line to dig her chamber and deposit over one hundred soft, ping-pong-ball-sized eggs.

Yet just behind the casuarina dunes, modern vibration threatens this primeval ritual. When roaring tourist motorcycles and idling taxis blaze their halogen high-beams along the coastal road, the delicate hatchlings—who instinctively crawl toward the brightest horizon—turn away from the ocean and wander toward traffic, asphalt, and predators. Exhaust fumes and tire rumble trigger deep disorientation.

By choosing to walk quietly along the sandy periphery, leaving headlights and internal combustion engines far behind, you preserve the natural dark-sky corridor. The gentle rustle of your quiet stride leaves the shoreline undisturbed. Two months from now, forty-five newly hatched turtles will emerge from the sand, orient themselves purely by the moonlit surf, and slip into the warm current of the Bay of Bengal. Your mindful, zero-emission footsteps became the silent shield that allowed their journey to begin.`,
    audioText: "Under a sky dusted with sea salt and starlight, the Bay of Bengal rolls in with a rhythmic, low-frequency roar. It is nearly midnight on Serenity Beach, and the sand has cooled into a damp cushion. From the black water, an Olive Ridley sea turtle drags herself forward, instinctually following an ancient celestial map. By choosing to walk quietly along the sandy periphery, leaving headlights and vehicle fumes far behind, you preserve the natural dark-sky corridor that allows 45 hatchlings to reach the ocean."
  },
  {
    id: 'chapter-fisherman',
    title: "The Fisherman's Dawn Catamaran",
    subtitle: "Artisanal Fishermen of Kottakuppam",
    tagline: "Pedaling through morning mist while catamarans take flight over the surf.",
    unlockThresholdKg: 1.0,
    heroImage: IMAGE_MAP['chapter-fisherman']?.src || '/images/serenity_beach_coast.jpg.jpeg',
    heroAlt: IMAGE_MAP['chapter-fisherman']?.alt || 'Artisanal catamarans on the morning sands',
    readingTimeMinutes: 2,
    wordCount: 298,
    badgeAward: "Dawn Navigator",
    location: "Kottakuppam Shore & Goubert Pier",
    summary: "At first light, artisanal catamaran fishermen brave the Coromandel breakers. Pedaling a heritage bicycle keeps shoreline waters clean of particulate soot and combustion runoff.",
    content: `Dawn breaks across the Coromandel coast in delicate watercolor washes of lavender, bruised apricot, and soft sea-foam green. Long before the French Quarter bakeries pull their first warm baguettes from the oven, Kottakuppam beach is alive with the guttural calls of Tamil fishermen chanting rhythmic sea shanties. 

Thiru Murugan and his brother hoist their hand-lashed wooden kattumaram—a traditional twin-log craft bound with thick coir ropes—and charge directly into the surging coastal breakers. Their sinewy shoulders strain against the current as a towering wave lifts the wooden hull skyward. Their entire survival depends on reading the subtle shifts of morning tides and casting handmade nylon nets for silver pomfret, mackerel, and anchovies in the nearshore shoals.

These nearshore waters are extraordinarily fragile. When thousands of tourists congest the seaside boulevards in fossil-fueled cabs and scooters, particulate soot and petrochemical wash-off run straight down the historic storm drains into the surf, acidifying the shallow feeding banks where fish breed.

When you rent a single-speed heritage bicycle, you glide along the seaside promenade with only the faint clicking of the chain and the salty morning breeze on your face. You pause by the seawall, breathing in the fragrance of temple jasmine mingles with roasting filter coffee from Mission Street. You avoided over two kilograms of carbon emissions, keeping the coastline pristine for the men who ride the wooden logs into the dawn.`,
    audioText: "Dawn breaks across the Coromandel coast in delicate watercolor washes of lavender and bruised apricot. Long before the French Quarter bakeries pull warm baguettes from the oven, fishermen chant rhythmic sea shanties as they launch hand-lashed wooden catamarans into the surging surf. When you choose a heritage bicycle along the promenade, you keep the shallow coastal shoals clean from soot and oil, preserving the ancestral waters for the fishermen."
  },
  {
    id: 'chapter-neem',
    title: "The Ancient Neem of Rue Dumas",
    subtitle: "French Quarter Heritage Canopy",
    tagline: "Cool shade beneath centuries of bougainvillea, lime plaster, and living history.",
    unlockThresholdKg: 1.5,
    heroImage: IMAGE_MAP['chapter-neem']?.src || '/images/white_town_reference.jpg.jpeg',
    heroAlt: IMAGE_MAP['chapter-neem']?.alt || 'Colonial tree canopy on Rue Dumas',
    readingTimeMinutes: 2,
    wordCount: 282,
    badgeAward: "Heritage Custodian",
    location: "Rue Dumas & Rue Romain Rolland, White Town",
    summary: "Ancient neem and gulmohar trees maintain the microclimate of White Town. Walking instead of driving prevents soot from eroding historic lime-plaster facades.",
    content: `Step off Goubert Avenue and turn west onto Rue Dumas, and the frenetic clamor of coastal traffic evaporates. Here in the quiet grid of the Ville Blanche, an eighty-year-old Neem tree arches majestically across the cobbled lane, interlocking its dense serrated foliage with vibrant magenta bougainvillea tumbling over high mustard walls. 

Underneath this living cathedral of green, the ambient air is astonishingly four degrees cooler than the asphalt boulevards just two blocks away. The breeze smells faintly of bitter neem leaves, damp terracotta tiles, and the vanilla sweetness of almond croissants wafting from a hidden courtyard café.

Colonial French architecture in Pondicherry was engineered for natural thermodynamics. The porous lime-plaster and brick walls breathe, absorbing coastal moisture by night and releasing it during midday heat. But modern automobile exhaust is disastrous for this heritage fabric. Acidic carbon soot settles into the lime plaster, blackening historic facades, eroding decorative wrought-iron balconies, and choking the root beds of old street trees that have provided communal shade since the days of French governorship.

When you choose to explore White Town on foot, your unhurried footsteps honor the peaceful cadence of the quarter. You pause to photograph an arched doorway, watch an artisan embroider linen on Rue Romain Rolland, and hear the bells of Notre Dame des Anges toll through the trees. You preserved the quiet microclimate and allowed the ancient Neem to breathe freely.`,
    audioText: "Step onto Rue Dumas, and the clamor of traffic evaporates beneath an eighty-year-old Neem tree that arches across the cobbled lane. Under this living canopy, the air is four degrees cooler than the asphalt streets nearby. Historic lime plaster walls breathe in this microclimate, but car exhaust blackens and erodes their heritage finish. By exploring White Town on foot, your unhurried stride preserves the shade and history of this French colonial oasis."
  },
  {
    id: 'chapter-auroville',
    title: "The Golden Forest of Auroville",
    subtitle: "The Red Earth Regeneration Belt",
    tagline: "How dry red wasteland became a thriving tropical evergreen forest.",
    unlockThresholdKg: 2.5,
    heroImage: IMAGE_MAP['chapter-auroville']?.src || '/images/matrimandir_auroville.png',
    heroAlt: IMAGE_MAP['chapter-auroville']?.alt || 'Matrimandir golden dome in the regenerated forest',
    readingTimeMinutes: 2,
    wordCount: 310,
    badgeAward: "Forest Pioneer",
    location: "Auroville Green Belt & Matrimandir",
    summary: "In 1968, Auroville was an eroded red desert. Five decades of collective planting restored the Tropical Dry Evergreen Forest. Quiet electric and pedal transit respects its deep silence.",
    content: `Fifty-five years ago, the laterite plateau north of Pondicherry was a scorching, windswept moonscape. Monsoons gouged deep ravines through barren red earth, washing millions of tons of topsoil directly into the sea. When pioneers gathered in 1968 to found the experimental township of Auroville, there was scarcely a single tree in sight to offer shelter from the blistering sun.

Today, you pedal your bicycle down a shaded, red-dirt pathway tunnel enveloped by towering acacias, wild fig trees, and flowering mahogany. Over three million indigenous trees were hand-planted and nurtured by international volunteers, reviving the nearly extinct Tropical Dry Evergreen Forest biome. The forest canopy echoes with the liquid calls of Asian Koels, drongos, and the fluttering wings of Paradise Flycatchers. At its quiet heart rises the breathtaking golden sphere of the Matrimandir, shimmering like a cosmic sun amidst twelve tranquil meditation gardens.

The sanctuary of Auroville relies on profound environmental stillness. Swarms of idling cars and tourist buses create choking plumes of exhaust and kick up fine laterite dust that coats the stomata of delicate native seedlings, stunting their growth and scaring away re-established bird populations.

When you traverse the green belt by bicycle or hop on the shared electric eco-shuttle from the Visitors Centre, you become an active custodian of this ecological miracle. You dismount beneath a giant sacred Banyan tree, listening to the gentle rustle of leaves in the breeze. Your quiet, zero-emission journey avoided nearly four kilograms of carbon, helping this regenerated sanctuary continue to breathe and inspire the world.`,
    audioText: "Fifty-five years ago, the laterite plateau of Auroville was a barren red desert. Through five decades of dedicated planting, three million trees revived the Tropical Dry Evergreen Forest biome. Today, the golden sphere of the Matrimandir rises in a sanctuary of silence. By pedaling through the red-earth trails or using the electric shuttle, your zero-carbon journey protects delicate native seedlings and honors this extraordinary ecological miracle."
  }
];

export const EMISSION_OPTIONS = [
  {
    id: 'bicycle',
    name: 'Bicycle',
    label: 'Heritage Rental / Pedal',
    co2PerKm: 0.0,
    icon: '🚲',
    color: 'emerald',
    description: 'Zero emissions. Pure pedal power along coastal boulevards.',
    celebrate: true
  },
  {
    id: 'walking',
    name: 'Walking',
    label: 'Footsteps / Stroll',
    co2PerKm: 0.0,
    icon: '👟',
    color: 'teal',
    description: 'Zero emissions. The cleanest, quietest way to explore White Town.',
    celebrate: true
  },
  {
    id: 'transit',
    name: 'Local Train / Public Bus',
    label: 'PRTC / Municipal Transit',
    co2PerKm: 0.041,
    icon: '🚆',
    color: 'blue',
    description: 'Shared municipal efficiency: 0.041 kg CO2 / passenger-km.',
    celebrate: false
  },
  {
    id: 'car',
    name: 'Personal Car',
    label: 'Cab / Private Petrol Vehicle',
    co2PerKm: 0.192,
    icon: '🚗',
    color: 'rose',
    description: 'Fossil fuel baseline: 0.192 kg CO2 / km. Heaviest urban footprint.',
    celebrate: false
  }
];
