export const SPOOKY_WHISPERS = [
  "Something stirred in the tomb... your webhook was caught in the spider's web.",
  "A cold chill runs through the server rack as the payload materializes.",
  "The spirits have received your spectral dispatch from beyond the veil.",
  "A phantom pulse echoes through the catacombs of port 3000.",
  "Whispers in the dark confirm the payload has been inscribed in the ledger of souls.",
  "The autopsy begins... the cadaver of your HTTP request reveals all.",
  "Beware what lurks within the JSON payload... darkness watches.",
  "The midnight hour strikes. Your webhook has crossed the threshold into the void.",
  "Demonic packets captured. The spirits are dissecting the byte stream.",
  "An eerie silence falls over the inbox as the ghastly payload settles in the crypt.",
  "The candles flicker as another mortal request enters the haunted chamber.",
  "Blood and bytes: your webhook has been bound to the ethereal ledger."
];

export const SPOOKY_PORTAL_SUMMONS = [
  "A tear in the mortal veil has been carved. Your webhook portal is now listening.",
  "The crypt door creaks open. Any payload that dares cross shall be preserved forever.",
  "A spectral beacon has been ignited. Awaiting dispatches from the underworld.",
  "Portal summoned successfully under the pale moonlight.",
  "The void accepts your endpoint. Spirits stand ready to intercept incoming calls."
];

export const SPOOKY_AUTOPSY_NOTES = [
  "The payload was dissected under flickering candlelight. No pulse, yet the data breathes.",
  "Cadaver examination complete. Extracted raw telemetry from the ghostly headers.",
  "Supernatural anomalies analyzed. Schema boundaries identified amidst the mist.",
  "The spirit of this webhook has confessed its field names and data types."
];

export const SPOOKY_CODEGEN_NOTES = [
  "Enchanted Express route handler summoned from ancient backend grimoires.",
  "TypeScript wards forged in blood to protect against cursed and malformed payloads.",
  "A clean script blessed with garlic to fend off unexpected webhook exceptions.",
  "Handler incantation synthesized. Cast into your server to banish runtime crashes."
];

export function getRandomSpookyWhisper() {
  const idx = Math.floor(Math.random() * SPOOKY_WHISPERS.length);
  return SPOOKY_WHISPERS[idx];
}

export function getRandomPortalSummon() {
  const idx = Math.floor(Math.random() * SPOOKY_PORTAL_SUMMONS.length);
  return SPOOKY_PORTAL_SUMMONS[idx];
}

export function getRandomAutopsyNote() {
  const idx = Math.floor(Math.random() * SPOOKY_AUTOPSY_NOTES.length);
  return SPOOKY_AUTOPSY_NOTES[idx];
}

export function getRandomCodegenNote() {
  const idx = Math.floor(Math.random() * SPOOKY_CODEGEN_NOTES.length);
  return SPOOKY_CODEGEN_NOTES[idx];
}

export { SPOOKY_ERROR_STATUSES, getSpookyError } from './spookyErrors.js';
