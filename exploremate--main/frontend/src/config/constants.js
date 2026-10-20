/**
 * ExploreMate Global Constants
 * All brand and emergency numbers live strictly in this file.
 */

export const BRAND_NAME = "ExploreMate";
export const CONTACT_PHONE = "9********0";

export const SAFETY_NUMBERS = {
  police: "100",
  ambulance: "108",
  fire: "101",
  women: "1091",
  tourist: "1363",
  tourism_office: "+91 413 2234500",
  hospital_emergency: "+91 413 2336050"
};

export const PONDY_BOUNDS = {
  center: [11.9338, 79.8297],
  zoom: 13
};

// Check if query is Pondicherry
export function isPondicherryQuery(str) {
  if (!str) return true;
  const s = str.trim().toLowerCase();
  return (
    s.includes("pondy") ||
    s.includes("pondicherry") ||
    s.includes("puducherry") ||
    s.includes("puducheri") ||
    s.includes("pondiche") ||
    s === ""
  );
}
