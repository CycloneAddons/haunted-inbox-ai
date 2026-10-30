export const SPOOKY_ERROR_STATUSES = {
  400: {
    title: "Cursed Malformed Incantation",
    defaultMessage: "The arcane syntax is broken. The spirits cannot decipher your malformed request.",
    quotes: [
      "The ritual was performed incorrectly. Malformed payload received.",
      "Your invocation is fractured. Darkness refuses to parse this syntax.",
      "A twisted query that even the catacomb gargoyles cannot comprehend.",
      "Corrupted runes detected in request parameters."
    ]
  },
  401: {
    title: "The Spirits Deny Your Access",
    defaultMessage: "You wander without a spectral seal. Unholy access denied by the guardians of the tomb.",
    quotes: [
      "An uninvited soul stands before the crypt gates. Access forbidden.",
      "No valid token detected. You cast no shadow in this realm.",
      "The spirit ward expels you. Present your credentials to the abyss.",
      "Your spectral key has expired or turned to dust."
    ]
  },
  403: {
    title: "Forbidden Necromantic Wards",
    defaultMessage: "The ancient seal forbids your presence from tampering with this soul's domain.",
    quotes: [
      "The crypt is locked by blood covenant. You have no authority here.",
      "Forbidden passage. The guardians bar your soul from this resource.",
      "You lack the dark privileges to disturb this resting place."
    ]
  },
  404: {
    title: "Lost in the Spectral Void",
    defaultMessage: "The entity you seek has vanished into the ethereal mist. Nothing dwells here.",
    quotes: [
      "You've entered the unknown catacombs. Nothing dwells at this path.",
      "The grave is hollow. No portal or webhook exists at these coordinates.",
      "Swallowed by the dark void. Entity erased from memory.",
      "Dust and spiderwebs... the requested spirit could not be found."
    ]
  },
  413: {
    title: "Beast Gorge: Offering Too Massive",
    defaultMessage: "Your payload is too colossal for the cauldron. The altar collapses under the weight.",
    quotes: [
      "The beast choked on your payload. Maximum byte stream exceeded.",
      "The crypt walls fissure from the sheer size of your data offering.",
      "Too heavy for the ethereal conduit. Truncate your payload."
    ]
  },
  429: {
    title: "Wrath of the Restless Spirits",
    defaultMessage: "You are hammering the void too rapidly! The cemetery gates slam shut until the spirits calm.",
    quotes: [
      "The spirits grow furious! Slow your frenzied rituals.",
      "The ethereal link is scorching hot. Restrain your soul and wait before knocking again.",
      "Too many invocations in a single moon cycle. Rate limit enforced by the gargoyles."
    ]
  },
  500: {
    title: "Cataclysm in the Underworld",
    defaultMessage: "A blood-curdling screech echoes through the server. An unholy disaster occurred in the catacombs.",
    quotes: [
      "The altar shattered. Internal necromantic system failure.",
      "Something catastrophic awakened in the server shadows.",
      "The underworld server collapsed under demonic strain."
    ]
  },
  503: {
    title: "Oracle Severed from Realm",
    defaultMessage: "The necromantic conduit to the AI oracle has dissolved. The spirits are dormant.",
    quotes: [
      "The AI crystal ball is clouded with black smoke. Service temporarily unavailable.",
      "The spectral channel to the oracle cannot be maintained right now.",
      "The spirits are slumbering. AI autopsy cannot be reached."
    ]
  },
  504: {
    title: "Lost in the Eternal Labyrinth",
    defaultMessage: "The request wandered too deep into the underworld maze and timed out into the abyss.",
    quotes: [
      "The witching hour passed. The oracle failed to return before timeout.",
      "Lost in the eternal labyrinth. Spiritual response timed out."
    ]
  }
};

export function getSpookyError(status = 500, customDetail = null) {
  const code = Number(status) || 500;
  const config = SPOOKY_ERROR_STATUSES[code] || {
    title: "Supernatural Anomaly",
    defaultMessage: "An eerie disturbance occurred in the shadows.",
    quotes: ["The spirits shudder at an unknown anomaly."]
  };

  let chosenQuote = config.defaultMessage;
  if (Array.isArray(config.quotes) && config.quotes.length > 0) {
    const idx = Math.floor(Math.random() * config.quotes.length);
    chosenQuote = config.quotes[idx];
  }

  const finalErrorText = customDetail && typeof customDetail === 'string' && customDetail.trim()
    ? `${chosenQuote} (${customDetail.trim()})`
    : chosenQuote;

  return {
    error: finalErrorText,
    horrorStatus: config.title,
    statusCode: code,
    spooky: true,
    timestamp: new Date().toISOString()
  };
}
