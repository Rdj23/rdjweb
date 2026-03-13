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
