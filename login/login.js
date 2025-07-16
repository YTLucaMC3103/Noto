function togglePassword(id, icon) {
  const input = document.getElementById(id);
  const isHidden = input.type === 'password';
  input.type= isHidden ? 'text' : 'password';

  icon.classList.toggle('fa-eye');
  icon.classList.toggle('fa-eye-slash');
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      // Login erfolgreich
      const user = userCredential.user;
      createNoteAndRedirect(user);
    })
    .catch(error => {
      const message = getFriendlyErrorMessage(error.code);
      showSnackbar(message);
    });
}

function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const errorMsg = document.getElementById("error-msg");

  if (!email || !password || !confirmPassword) {
    errorMsg.textContent = "Please fill out all fields.";
    showSnackbar(errorMsg.textContent)
  }

  if (password !== confirmPassword) {
    errorMsg.textContent = "Passwords do not match.";
    showSnackbar(errorMsg.textContent)
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;

      user.sendEmailVerification()
        .then(() => {
          showSnackbar("Verification email has been sent.")
          window.location.href = "link.html"
        })
    })
    .catch(error => {
      const message = getFriendlyErrorMessage(error.code);
      showSnackbar(message);
    });
}

function showSnackbar(message) {
  const snackbar = document.getElementById("snackbar");
  snackbar.textContent = message;
  snackbar.className = "show";
  
  setTimeout(() => {
    snackbar.className = snackbar.className.replace("show", "");
  }, 3000); // Anzeigezeit: 3 Sekunden
}

function getFriendlyErrorMessage(error) {
  const code = error.code || error.message || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "This email address is already in use.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No user found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/missing-password":
      return "Please enter a password.";
    case "auth/missing-email":
      return "Please enter an email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completing.";
    case "auth/popup-blocked":
      return "Popup was blocked by the browser.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/internal-error":
      return "An internal error occurred. Please try again.";

    default:
      console.warn("Unhandled Firebase error code:", code);
      return "An unknown error occurred. Please try again.";
  }
}


function checkDomain() {
  const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

  if (isLocalhost) {
    window.location.href = "../app/dashboard.html"
  }
}

function openForgotModal() {
  document.getElementById('forgot-password-modal').classList.remove('hidden');
}

function closeForgotModal() {
  document.getElementById('forgot-password-modal').classList.add('hidden');
}

function sendPasswordReset() {
  const email = document.getElementById("reset-email").value;
  const status = document.getElementById("reset-status");

  if (!email) {
    status.textContent = "Please enter your email.";
    return;
  }

  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      status.style.color = "lightgreen";
      status.textContent = "Reset link sent!";
    })
    .catch((error) => {
      const message = getFriendlyErrorMessage(error.code);
      showSnackbar(message);
      console.error(error)
    });
}