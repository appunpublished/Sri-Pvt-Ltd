import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const C = window.SITE_CONFIG;
const form = document.querySelector("#loginForm");
const status = document.querySelector("#loginStatus");

document.querySelector("#togglePassword").addEventListener("click", () => {
  const input = document.querySelector("#password");
  input.type = input.type === "password" ? "text" : "password";
  document.querySelector("#togglePassword").textContent =
    input.type === "password" ? "Show" : "Hide";
});

function friendlyError(err) {
  const code = err?.code || "";

  const messages = {
    "auth/invalid-credential":
      "Incorrect email or password. Also confirm that Email/Password sign-in is enabled in Firebase.",
    "auth/invalid-login-credentials":
      "Incorrect email or password. Also confirm that Email/Password sign-in is enabled in Firebase.",
    "auth/user-not-found":
      "No Firebase Authentication user exists with this email address.",
    "auth/wrong-password":
      "The Firebase password is incorrect.",
    "auth/invalid-email":
      "The email address is not valid.",
    "auth/too-many-requests":
      "Firebase temporarily blocked sign-in attempts. Wait a while and try again.",
    "auth/network-request-failed":
      "The browser could not reach Firebase. Check your internet connection.",
    "auth/operation-not-allowed":
      "Email/Password authentication is not enabled in Firebase Authentication.",
    "permission-denied":
      "Firebase Authentication succeeded, but Firestore denied access. Deploy firestore.rules and create admins/{USER_UID}.",
    "failed-precondition":
      "Firestore is not configured correctly. Check that Firestore Database has been created."
  };

  return messages[code] || `Firebase error: ${code || err?.message || "Unknown error"}`;
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  status.textContent = "Signing in…";
  status.style.color = "";

  if (!C.firebase?.enabled) {
    status.textContent = "Firebase is disabled in config.js.";
    return;
  }

  try {
    const app = initializeApp(C.firebase);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;

    const credential = await signInWithEmailAndPassword(auth, email, password);

    let admin;
    try {
      admin = await getDoc(doc(db, "admins", credential.user.uid));
    } catch (firestoreError) {
      console.error("Firestore admin check failed:", firestoreError);
      await auth.signOut();
      status.textContent = friendlyError(firestoreError);
      return;
    }

    if (!admin.exists()) {
      await auth.signOut();
      status.textContent =
        `Firebase login succeeded, but admins/${credential.user.uid} does not exist in Firestore.`;
      return;
    }

    if (admin.data().active !== true) {
      await auth.signOut();
      status.textContent =
        `Firebase login succeeded, but admins/${credential.user.uid} is not active. Set active to true.`;
      return;
    }

    status.textContent = "Login successful. Opening dashboard…";
    location.href = "dashboard.html";
  } catch (err) {
    console.error("Firebase login error:", err);
    status.textContent = friendlyError(err);
  }
});
