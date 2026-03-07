import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyAYI9yS2rTgml2F7sOXEheq7bNMhBDgUBg",
    authDomain: "contraceptiq-app.firebaseapp.com",
    projectId: "contraceptiq-app",
    storageBucket: "contraceptiq-app.firebasestorage.app",
    messagingSenderId: "539037702889",
    appId: "1:539037702889:web:cfd04a0857e4a6127fae78"
};

// Initialize Firebase App
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Ensure Auth is initialized properly and attach AsyncStorage to it
let auth: any;
if (!auth) {
    try {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(ReactNativeAsyncStorage)
        });
    } catch (e: any) {
        // Under Hot Reloads, `initializeAuth` might be called again while internally 
        // Firebase considers it "initialized". In that case, we MUST explicitly grab the "auth" 
        // singleton off the `app` instance using the standard `getAuth` method.
        if (e.code === 'auth/already-initialized') {
            const { getAuth } = require('firebase/auth');
            auth = getAuth(app);
        } else {
            throw e;
        }
    }
}

export { auth };
export const db = getFirestore(app);
