import { initializeApp, getApp, getApps } from "firebase/app";
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Configuration from google-services.json
const firebaseConfig = {
    apiKey: "AIzaSyDXKUDXnldvtS0lnyku1flb9z16JVNamfg",
    authDomain: "contraceptiq-b126b.firebaseapp.com",
    projectId: "contraceptiq-b126b",
    storageBucket: "contraceptiq-b126b.firebasestorage.app",
    messagingSenderId: "895041117989", // project_number
    // appId: "1:895041117989:android:26d2eb4b8dba4333aa44cc" // Android ID might cause issues on iOS with JS SDK
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth and Firestore
// @ts-ignore: getReactNativePersistence is available in newer versions but types might differ
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
