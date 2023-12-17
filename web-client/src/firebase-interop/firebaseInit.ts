// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, doc } from "firebase/firestore";


import type {QueryDocumentSnapshot, SnapshotOptions, DocumentData} from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Extract the secrets from the local environment vars.
// You should populate .env.local with your own secrets.
const {
  REACT_APP_FIREBASE_API_KEY: apiKey,
  REACT_APP_FIREBASE_AUTH_DOMAIN: authDomain,
  REACT_APP_FIREBASE_DATABASE_URL: databaseURL,
  REACT_APP_FIREBASE_PROJECT_ID: projectId,
  REACT_APP_FIREBASE_STORAGE_BUCKET: storageBucket,
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
  REACT_APP_FIREBASE_APP_ID: appId,
  REACT_APP_FIREBASE_MEASUREMENT_ID: measurementId,
} = process.env;

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey,
  authDomain,
  databaseURL,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Setup the Auth provider
export const auth = getAuth();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export function converter<T>() {
  return {
    toFirestore(data: T): DocumentData {
      return data as DocumentData;
    },
    fromFirestore(snap: QueryDocumentSnapshot, options: SnapshotOptions): T {
      return snap.data(options) as T;
    },
  };
}

export function typedCollection<T>(collectionPath: string) {
  return collection(db, collectionPath).withConverter(converter<T>());
}

export function typedDoc<T>(collectionPath: string) {
  const closedConverter = converter<T>();
  return (docPath: string) => doc(db, collectionPath, docPath).withConverter(closedConverter);
}