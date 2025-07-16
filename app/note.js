const db = window.firebaseDb;
const auth = window.firebaseAuth;

let noteId = null;

window.onload = function () {
  auth.onAuthStateChanged(user => {
    if (!user) return location.href = "login.html";

    const params = new URLSearchParams(window.location.search);
    noteId = params.get("id");

    if (noteId) {
      // Bestehende Notiz laden
      db.collection("notes").doc(noteId).get().then(doc => {
        if (doc.exists && doc.data().userId === user.uid) {
          const data = doc.data();
          document.getElementById("note-title").value = data.title || "";
          document.getElementById("note-content").value = data.content || "";
        } else {
          alert("Note not found or access denied");
          window.location.href = "home.html";
        }
      });
    }
  });
};

function saveNote() {
  const title = document.getElementById("note-title").value.trim();
  const content = document.getElementById("note-content").value.trim();
  const user = auth.currentUser;

  if (!user) {
    console.log("Kein Benutzer eingeloggt.");
    return;
  }

  const userId = user.uid;

  db.collection("notes").add({
    userId: userId,
    title: title,
    content: content,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    console.log("Note saved");
    showSnackbar("Note saved ✅");
  })
  .catch((error) => {
    console.error("Fehler beim Speichern:", error);
    showSnackbar("Error saving note ❌");
  });
}

function goBack() {
  window.location.href = "dashboard.html";
}

let saveTimeout;

function autoSaveNote() {
  clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    const title = document.getElementById("note-title").value;
    const content = document.getElementById("note-content").value;

    db.collection("notes").add({
      userId: auth.currentUser.uid,
      title,
      content,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      console.log("Auto-saved");
    })
    .catch(err => console.error("Save error:", err));
  }, 2000); // speichert 2 Sekunden nach dem letzten Tippen
}

const pagesToggle = document.getElementById("pages-toggle");
const subNav = document.getElementById("sub-nav");

pagesToggle.addEventListener("click", (e) => {
  e.preventDefault();
  subNav.classList.toggle("active");
});

function loadUserNotes() {
  const user = auth.currentUser;
  if (!user) return;

  const subNav = document.getElementById("sub-nav");
  subNav.innerHTML = "";

  db.collection("users").doc(user.uid).collection("notes").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const note = doc.data();
      const link = document.createElement("a");
      link.href = `note.html?id=${doc.id}`;
      link.textContent = note.title;
      subNav.appendChild(link);
    });
  });
}

auth.onAuthStateChanged((user) => {
  if (user) {
    loadUserNotes();
  }
});