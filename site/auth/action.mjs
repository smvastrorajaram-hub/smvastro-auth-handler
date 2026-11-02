import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const FIREBASE_CONFIG = Object.freeze({
  apiKey: "AIzaSyCKXyfZ9sjGmej7ygxHpzHNcNysMXHuvSs",
  authDomain: "auth.smvastroservices.in",
  projectId: "smv-astro",
  storageBucket: "smv-astro.firebasestorage.app",
  messagingSenderId: "299081899217",
  appId: "1:299081899217:web:8d558df08e86037ea539f0"
});

const COPY = {
  en: {
    titles: {
      verifyEmail: "Verify your email address",
      resetPassword: "Create a new password",
      recoverEmail: "Restore your email address"
    },
    working: "Checking your secure link…",
    verified: "Your email address has been verified.",
    recovered: "Your previous email address has been restored.",
    resetReady: email => email ? `Create a new password for ${email}.` : "Create a new password below.",
    resetDone: "Your password has been changed successfully.",
    mismatch: "The passwords do not match.",
    tooShort: "Use a password with at least 6 characters.",
    invalid: "This link is invalid, expired, or has already been used. Request a new email and try again.",
    missing: "The link is incomplete. Open the complete link from your email.",
    failed: "We could not complete this request. Please request a new email and try again.",
    network: "A network error occurred. Check your connection and try again.",
    weak: "This password does not meet the project's password requirements.",
    busy: "Too many attempts. Please wait and try again.",
    saving: "Saving…",
    save: "Save new password",
    emailLabel: email => email ? `Account: ${email}` : "Your account has been updated.",
    home: "Go to SMV ASTRO"
  }
};

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") || "";
const actionCode = params.get("oobCode") || "";
const linkApiKey = params.get("apiKey") || "";
const rawContinueUrl = params.get("continueUrl") || "";
// Keep all account-action messages in English regardless of device or email locale.
const language = "en";
const t = COPY.en;

document.documentElement.lang = language;
document.getElementById("page-title").textContent = t.titles[mode] || "SMV ASTRO SERVICES";
document.getElementById("status").textContent = t.working;

// Remove one-time credentials from the visible address bar before loading SDK code.
// The code remains only in this page's short-lived JavaScript memory.
try {
  window.history.replaceState({}, document.title, window.location.pathname);
} catch {
  // Some embedded browsers may disallow history updates; action processing can continue.
}

const statusNode = document.getElementById("status");
const detailNode = document.getElementById("detail");
const resetForm = document.getElementById("reset-form");
const continueLink = document.getElementById("continue-link");
const passwordInput = document.getElementById("new-password");
const confirmInput = document.getElementById("confirm-password");
const resetSubmit = document.getElementById("reset-submit");

const ALLOWED_CONTINUE_ORIGINS = new Set([
  "https://smvastroservices.in",
  "https://auth.smvastroservices.in",
  "https://horoscope.smvastroservices.in",
  "https://calendar.smvastroservices.in"
]);

function safeContinueUrl(value) {
  if (!value) return "https://smvastroservices.in/";
  try {
    const candidate = new URL(value);
    if (candidate.protocol === "https:" && ALLOWED_CONTINUE_ORIGINS.has(candidate.origin) &&
        !candidate.username && !candidate.password) {
      return candidate.href;
    }
  } catch {
    // Invalid continuation URLs fall back to the verified main website.
  }
  return "https://smvastroservices.in/";
}

function showSuccess(message, detail = "") {
  statusNode.textContent = message;
  detailNode.textContent = detail;
  resetForm.hidden = true;
  continueLink.href = safeContinueUrl(rawContinueUrl);
  continueLink.textContent = t.home;
  continueLink.hidden = false;
}

function errorMessage(error) {
  switch (error?.code) {
    case "auth/expired-action-code":
    case "auth/invalid-action-code":
    case "auth/invalid-action-link":
      return t.invalid;
    case "auth/weak-password":
      return t.weak;
    case "auth/too-many-requests":
      return t.busy;
    case "auth/network-request-failed":
      return t.network;
    case "auth/unauthorized-domain":
      return "This verification page domain is not authorized in Firebase Authentication settings.";
    case "auth/invalid-api-key":
      return "Firebase rejected the API key used by this verification page. Please contact SMV ASTRO support.";
    case "auth/app-not-authorized":
      return "This Firebase web app is not authorized to use the current API key.";
    case "auth/operation-not-allowed":
      return "Email verification is not enabled for this Firebase Authentication project.";
    default:
      return t.failed;
  }
}

function showError(message, detail = "") {
  statusNode.textContent = message;
  detailNode.textContent = detail;
  resetForm.hidden = true;
  continueLink.href = "https://smvastroservices.in/";
  continueLink.textContent = t.home;
  continueLink.hidden = false;
}

async function handleVerifyEmail(auth) {
  // Firebase's custom email-handler flow completes verification by applying the
  // one-time action code directly. Keep the additional metadata preflight for
  // recoverEmail only, where the previous address must be displayed.
  await applyActionCode(auth, actionCode);
  showSuccess(t.verified, "");
}

async function handleRecoverEmail(auth) {
  const info = await checkActionCode(auth, actionCode);
  if (info.operation && info.operation !== "RECOVER_EMAIL") {
    throw Object.assign(new Error("Unexpected email action"), { code: "auth/invalid-action-code" });
  }
  const restoredEmail = info.data?.email || "";
  await applyActionCode(auth, actionCode);
  showSuccess(t.recovered, restoredEmail ? t.emailLabel(restoredEmail) : "");
}

async function handlePasswordReset(auth) {
  const email = await verifyPasswordResetCode(auth, actionCode);
  detailNode.textContent = t.resetReady(email);
  resetForm.hidden = false;
  resetSubmit.textContent = t.save;

  resetForm.addEventListener("submit", async event => {
    event.preventDefault();
    const newPassword = passwordInput.value;
    const confirmPassword = confirmInput.value;

    if (newPassword.length < 6) {
      statusNode.textContent = t.tooShort;
      passwordInput.focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      statusNode.textContent = t.mismatch;
      confirmInput.focus();
      return;
    }

    resetSubmit.disabled = true;
    resetSubmit.textContent = t.saving;
    statusNode.textContent = t.saving;
    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      passwordInput.value = "";
      confirmInput.value = "";
      showSuccess(t.resetDone, "");
    } catch (error) {
      statusNode.textContent = errorMessage(error);
      passwordInput.value = "";
      confirmInput.value = "";
      passwordInput.focus();
    } finally {
      resetSubmit.disabled = false;
      resetSubmit.textContent = t.save;
    }
  });
}

async function main() {
  if (!["verifyEmail", "resetPassword", "recoverEmail"].includes(mode) || !actionCode || !linkApiKey) {
    showError(t.missing);
    return;
  }
  if (linkApiKey !== FIREBASE_CONFIG.apiKey) {
    showError(t.invalid);
    return;
  }

  try {
    const app = initializeApp(FIREBASE_CONFIG);
    const auth = getAuth(app);

    switch (mode) {
      case "verifyEmail":
        await handleVerifyEmail(auth);
        break;
      case "recoverEmail":
        await handleRecoverEmail(auth);
        break;
      case "resetPassword":
        await handlePasswordReset(auth);
        break;
      default:
        showError(t.missing);
    }
  } catch (error) {
    const code = String(error?.code || "").trim();
    console.warn("Firebase email action failed:", code || "unknown");
    showError(errorMessage(error), code ? "Firebase error code: " + code : "Please share this screen with SMV ASTRO support.");
  }
}

main().catch(error => {
  const code = String(error?.code || "").trim();
  console.warn("Firebase email action handler failed:", code || "unknown");
  showError(errorMessage(error), code ? "Firebase error code: " + code : "Please share this screen with SMV ASTRO support.");
});
