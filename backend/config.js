const firebase = require("firebase");
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2pOu7FIB93tQBdUszysXoTB9bhPvaZ64",
  authDomain: "authentico-217e4.firebaseapp.com",
  projectId: "authentico-217e4",
  storageBucket: "authentico-217e4.firebasestorage.app",
  messagingSenderId: "84508372050",
  appId: "1:84508372050:web:0f6e14f9f2bb24433d438b",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const User = db.collection("Users");
module.exports = User;
