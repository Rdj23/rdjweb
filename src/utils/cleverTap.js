// CleverTap web SDK bridge.
//
// The SDK is bootstrapped in index.html and may still be loading when React
// mounts, so every call guards on `window.clevertap`. The SDK's own array
// shims queue calls made before the script lands, which is why pushing onto
// them early is safe.

export const cleverTapPayloadProperties = {
  mobile: "phone",
  crn: "crn",
  gender: "Gender",
  dob: "DOB",
};

/** Simple XOR obfuscation for mobile-number-derived identities. */
export const encryptKeyWithXor = (mobileNumber) => {
  if (!mobileNumber) return "";
  const xorKey = 42;
  let encrypted = "";
  const str = mobileNumber.toString();
  for (let i = 0; i < str.length; i++) {
    encrypted += String.fromCharCode(str.charCodeAt(i) ^ xorKey);
  }
  return encrypted;
};

const sdk = () => (typeof window !== "undefined" ? window.clevertap : undefined);

/** Fire a custom event. Undefined/null properties are dropped. */
export const addEventToCleverTap = (eventName, eventData = {}) => {
  const ct = sdk();
  if (!ct || !eventName) return;

  const payload = Object.fromEntries(
    Object.entries(eventData).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

  try {
    ct.event.push(eventName, payload);
  } catch (error) {
    console.warn(`[clevertap] "${eventName}" failed`, error);
  }
};

/**
 * Fire the special `Charged` event.
 * CleverTap expects `Amount`, `Charged ID` and an `Items` array on this event,
 * which is what powers revenue reporting - it is not a plain custom event.
 */
export const addChargedEventToCleverTap = ({ amount, chargedId, items = [], ...rest }) => {
  const ct = sdk();
  if (!ct) return;
  try {
    ct.event.push("Charged", {
      Amount: amount,
      "Charged ID": chargedId,
      ...rest,
      Items: items.slice(0, 50),
    });
  } catch (error) {
    console.warn("[clevertap] Charged failed", error);
  }
};

/** Push a raw profile payload, e.g. { Site: { watchlist: { $add: "Dune" } } }. */
export const pushProfileCommand = (payload) => {
  const ct = sdk();
  if (!ct || !payload) return;
  try {
    ct.profile.push(payload);
  } catch (error) {
    console.warn("[clevertap] profile push failed", error);
  }
};

/**
 * Normalise and send a profile update.
 * @param {object} updateEventPayload profile fields, using either CleverTap's
 *   own keys (Name, Email, Phone) or the aliases in cleverTapPayloadProperties
 * @param {boolean} fireInitialEvent  true on login/signup, so the SDK creates
 *   or merges the identity rather than only updating the current one
 */
export const updateProfileOnClevertap = (updateEventPayload, fireInitialEvent = false) => {
  const ct = sdk();
  if (!ct || !updateEventPayload) return;

  let payloadData = { ...updateEventPayload };

  Object.keys(updateEventPayload).forEach((key) => {
    if (!(key in cleverTapPayloadProperties)) return;
    const mapped = cleverTapPayloadProperties[key];

    if (mapped === cleverTapPayloadProperties.mobile) {
      const encryptedMobileNumber = encryptKeyWithXor(updateEventPayload[key]);
      payloadData.Identity = encryptedMobileNumber;
      payloadData[mapped] = `+910${encryptedMobileNumber}`;
    } else if (mapped === cleverTapPayloadProperties.crn) {
      payloadData.Identity = updateEventPayload[key];
      payloadData.crn = updateEventPayload[key];
    } else if (mapped === cleverTapPayloadProperties.gender) {
      payloadData[mapped] = updateEventPayload[key].charAt(0);
    } else if (mapped === cleverTapPayloadProperties.dob) {
      payloadData[mapped] = new Date(updateEventPayload[key]);
    } else {
      payloadData[mapped] = updateEventPayload[key];
    }

    delete payloadData[key];
  });

  payloadData = { Site: { ...payloadData } };

  try {
    if (fireInitialEvent) {
      ct.onUserLogin.push(payloadData);
      return;
    }
    ct.profile.push(payloadData);
  } catch (error) {
    console.warn("[clevertap] profile update failed", error);
  }
};
