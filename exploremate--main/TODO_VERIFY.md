# ExploreMate — Verification & Review Checklist (TODO_VERIFY)

This file tracks items requiring physical on-ground verification, unconfirmed phone numbers, Google Maps fallback URLs, unmatched user photos, and places with unverified hours/fees.

---

## 1. Contact Numbers to Verify
- `CONTACT_PHONE`: Set to standard masked constant `"9********0"` in `/frontend/src/config/constants.js` and `/backend/config/settings.py`. Replace with registered customer support line before full launch.
- `Puducherry Tourism Helpline`: `1363` (official MTDC / Tourism line).
- `Puducherry Central Police Station`: `100` / `+91 413 2334000` (to be confirmed on-ground).

---

## 2. Places Requiring Hours or Fee Verification (Task 3 Specification)
The following places are populated with established public facts, but their exact daily entry fees and operating hours must be physically confirmed on-ground:
- **Kanniga Parameswari Temple**: Daily puja times and festival entry.
- **Meeran Mosque**: Community visiting hours outside congregational prayer.
- **Kuthba Mosque**: Visiting schedule and prayer intervals.
- **Jamia Mosque**: Visiting hours.
- **Old Lighthouse**: Interior public stair climbing ticket/access hours.
- **Raj Niwas**: Current official public slot registration process and days.
- **French Institute of Pondicherry (IFP)**: Public exhibition hours and library access.
- **Hotel de Ville / Municipal Office**: Civic exhibition access.
- **Jawahar Toy Museum**: Confirm reopening and current maintenance status.
- **Auroville Farms & Green Belt**: Guided tour appointment procedures.

*Rule maintained*: UI displays `"Not verified"` badge for all of the above and never invents times or fees.

---

## 3. Photos & Attribution Verification
| File Name | Assigned To | Status | Notes / License |
|---|---|---|---|
| `aurobindo_ashram.png` | Sri Aurobindo Ashram | Assigned | CasualWalker watermark visible. Need license confirmation or replace with CC BY-SA Commons image. |
| `Auroville_Green_guesthouse.png` | Green's Guesthouse | Assigned | Verified fit for Auroville Road eco-stay. |
| `cafe des arts.png` | Café des Arts | Assigned | Matches Rue Suffren French cafe exterior. |
| `casablanca.png` | Casablanca Department Store | Assigned | Mission Street heritage retail store. |
| `french_war_memorial.png` | French War Memorial | Assigned | Goubert Avenue First World War memorial. |
| `matrimandir_auroville.png` | Matrimandir / Auroville | Assigned | Golden sphere iconic monument. |
| `rock_beach.png` | Promenade Rock Beach | Assigned | Coastal rocks along Goubert Avenue. |
| `Promenade Seafront Boutique Hotel.avif` | The Promenade Hotel | Assigned | Seafront luxury boutique hotel. |

### Unmatched / Pending Confirmation Photos:
- `05_UNIDENTIFIED_green-palm-mural-interior.png` -> Not assigned. Needs confirmation on whether this belongs to a specific French Quarter cafe or boutique stay.
- `06_UNIDENTIFIED_red-lit-reception-pavilion.png` -> Not assigned. Modern resort lobby or lounge to be identified.
- `07_TO-CONFIRM_beach-aerial-with-lagoon.png` -> Possibly Chunnambar / Paradise Beach backwaters, pending verification.
- `09_UNIDENTIFIED_vishnu-temple-gopuram.png` -> Perumal/Vishnu temple gopuram. Kept unassigned as per rule: none of the spec temples are Vishnu/Perumal temples.
- `11_UNIDENTIFIED_bust-gallery-building.jpg` -> Not assigned.

---

## 4. Fallback Links
- Whenever official reservation or menu URLs are unverified, ExploreMate safely falls back to:
  `https://www.google.com/maps/search/?api=1&query=<name+Pondicherry>` with `target="_blank" rel="noopener noreferrer"`.
