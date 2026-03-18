
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBjcI122qYfHW9ibPLz-XG8kleDq4r2pF8",
  authDomain: "math-rpg-test.firebaseapp.com",
  projectId: "math-rpg-test",
  storageBucket: "math-rpg-test.firebasestorage.app",
  messagingSenderId: "593199481365",
  appId: "1:593199481365:web:7ad8656ff4aef6d0ca841c"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const STARTER_PROFILE = {
  level: 1,
  exp: 0,
  coins: 100,
  inventory: [],
  skin: "hero-classic"
};

export async function primeAuth() {
  try {
    await getRedirectResult(auth);
  } catch (error) {
    console.warn("redirect auth result", error);
  }
}

export async function ensureUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data();
  }
  const profile = {
    name: user.displayName || "勇者",
    email: user.email || "",
    ...STARTER_PROFILE
  };
  await setDoc(userRef, profile);
  return profile;
}

export async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export function watchUser(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null, null);
      return;
    }
    const profile = await ensureUserProfile(user);
    callback(user, profile);
  });
}

export async function signInGoogle() {
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    const fallbackCodes = [
      "auth/popup-blocked",
      "auth/popup-closed-by-user",
      "auth/cancelled-popup-request",
      "auth/operation-not-supported-in-this-environment"
    ];
    if (fallbackCodes.includes(error.code)) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export async function signOutGoogle() {
  await signOut(auth);
}

export async function rewardPlayer(uid, coins = 0, exp = 0) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    coins: increment(coins),
    exp: increment(exp)
  });
}
