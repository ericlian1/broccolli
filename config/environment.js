// change the file name dummy.environment.js to "environment.js"
// and add your keys below

var environments = {
  staging: {
    FIREBASE_API_KEY: "AIzaSyCijZIwYYrXKetkFcenl_yVqp1vEYijtyY",
    FIREBASE_AUTH_DOMAIN: "receipt-bbca6.firebaseapp.com",
    FIREBASE_DATABASE_URL: "https://receipt-bbca6.firebaseio.com",
    FIREBASE_PROJECT_ID: "receipt-bbca6",
    FIREBASE_STORAGE_BUCKET: "receipt-bbca6.appspot.com",
    FIREBASE_MESSAGING_SENDER_ID: "946958434268",
    GOOGLE_CLOUD_VISION_API_KEY: "AIzaSyAjNJMBGPY42r4VxFvqHXrghpwf4IKjHf8"
  },
  production: {
    // Warning: This file still gets included in your native binary and is not a secure way to store secrets if you build for the app stores. Details: https://github.com/expo/expo/issues/83
  }
};

function getReleaseChannel() {
  let releaseChannel = Expo.Constants.manifest.releaseChannel;
  if (releaseChannel === undefined) {
    return "staging";
  } else if (releaseChannel === "staging") {
    return "staging";
  } else {
    return "staging";
  }
}
function getEnvironment(env) {
  console.log("Release Channel: ", getReleaseChannel());
  return environments[env];
}
var Environment = getEnvironment(getReleaseChannel());
export default Environment;
