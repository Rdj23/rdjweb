// CleverTap Payload Properties Mapping
export const cleverTapPayloadProperties = {
  mobile: "phone",
  crn: "crn",
  gender: "Gender",
  dob: "DOB",
};

// Simple XOR Encryption for Mobile Number
export const encryptKeyWithXor = (mobileNumber) => {
  if (!mobileNumber) return "";

  const xorKey = 42; // Simple XOR key, you can change this
  let encrypted = "";

  for (let i = 0; i < mobileNumber.toString().length; i++) {
    encrypted += String.fromCharCode(mobileNumber.charCodeAt(i) ^ xorKey);
  }

  return encrypted;
};

// Seeded PRNG so the same content always resolves to the same price,
// while different content gets different prices (plain Math.random()
// would just re-roll on every render/navigation).
const seededRandom = (seed) => {
  let state = 0;
  const seedStr = String(seed ?? "");
  for (let i = 0; i < seedStr.length; i++) {
    state = (state * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

// Generate a Random Price for a Piece of Content (Movie/Series)
// so the "Charged" event amount varies per title instead of a fixed value.
export const generateRandomPrice = (seed, { min = 99, max = 799, step = 10 } = {}) => {
  const rand = seededRandom(seed)();
  const steps = Math.floor((max - min) / step);
  return min + Math.floor(rand * (steps + 1)) * step;
};

// Add Event to CleverTap
export const addEventToCleverTap = (cleverTapEventName, cleverTapEventData) => {
  if (typeof window !== "undefined" && window.clevertap && cleverTapEventName && cleverTapEventData) {
    window.clevertap.event.push(cleverTapEventName, cleverTapEventData);
  }
};

// Update Profile on CleverTap
export const updateProfileOnClevertap = (updateEventPayload, fireInitialEvent = false) => {
  if (typeof window !== "undefined" && window.clevertap && updateEventPayload) {
    // Define a Variable and Make Local Copy of Incoming Payload
    let payloadData = { ...updateEventPayload };

    Object.keys(updateEventPayload).forEach((key) => {
      if (key in cleverTapPayloadProperties) {
        if (cleverTapPayloadProperties[key] === cleverTapPayloadProperties.mobile) {
          // Insert "Identity" Key into the Payload
          const finalKey = updateEventPayload[key];
          const encryptedMobileNumber = encryptKeyWithXor(finalKey);
          payloadData.Identity = encryptedMobileNumber;
          payloadData[cleverTapPayloadProperties.mobile] = `+910${encryptedMobileNumber}`;
        } else if (cleverTapPayloadProperties[key] === cleverTapPayloadProperties.crn) {
          payloadData.Identity = updateEventPayload[key];
          payloadData.crn = updateEventPayload[key];
        } else if (cleverTapPayloadProperties[key] === cleverTapPayloadProperties.gender) {
          // Send "M" or "F" as Payload Values for Male / Female
          payloadData[cleverTapPayloadProperties.gender] = updateEventPayload[key].charAt(0);
        } else if (cleverTapPayloadProperties[key] === cleverTapPayloadProperties.dob) {
          // Convert the String Based Date into the Javascript Date Object
          payloadData[cleverTapPayloadProperties.dob] = new Date(updateEventPayload[key]);
        } else {
          // Handle any other Keys appearing in the ENUM where Special Handling is Not Required
          payloadData[cleverTapPayloadProperties[key]] = updateEventPayload[key];
        }

        // Remove the Duplicate Key from the Main Payload
        delete payloadData[key];
      }
    });

    // Restructure the Payload before Sending to CleverTap
    payloadData = { Site: { ...payloadData } };

    // Fire the onUserLogin method if Event generated from First Page
    if (fireInitialEvent) {
      window.clevertap.onUserLogin.push(payloadData);
      return;
    }

    // Fire the profile push method if Event generated from Subsequent Pages
    window.clevertap.profile.push(payloadData);
  }
};
