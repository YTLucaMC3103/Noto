const firebaseConfig = {
    apiKey: "AIzaSyAq5rxUa0QzcSS_wBVlJDV3PimrHoKAMVE",
    authDomain: "noto-6cfb7.firebaseapp.com",
    projectId: "noto-6cfb7",
    storageBucket: "noto-6cfb7.firebasestorage.app",
    messagingSenderId: "717653458967",
    appId: "1:717653458967:web:ec9417bb70a0b34b289c52"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

window.firebaseAuth = auth;
window.firebaseDb = db;