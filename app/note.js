let noteId = null;
let autoSaveTimeout = null;
let currentNoteId = null;

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    setupEditor(user);
  } else {
    window.location.href = "../login/login.html";
  }
});

function setupEditor(user) {
  const titleInput = document.getElementById("note-title");
  const contentInput = document.getElementById("note-content");

  titleInput.addEventListener("input", () => triggerAutoSave(user));
  contentInput.addEventListener("input", () => triggerAutoSave(user));
}

function triggerAutoSave(user) {
  const db = firebase.firestore();
  const title = document.getElementById("note-title").value.trim();
  const content = document.getElementById("note-content").value.trim();

  if (!currentNoteId) {
    db.collection("notes").add({
      userId: user.uid,
      title: title || "Untitled",
      content: content,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(docRef => {
      currentNoteId = docRef.id;
      addNoteLinkToSubNav(currentNoteId, title || "Untitled");
      console.log("Note created with ID:", docRef.id);
    });
  } else {
    db.collection("notes").doc(currentNoteId).update({
      title: title || "Untitled",
      content: content,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      console.log("Note auto-saved with ID ", currentNoteId + "and title " + title + " and content " + content);
      updateNoteLinkInSubNav(currentNoteId, title || "Untitled");
    });
  }
}

function addNoteLinkToSubNav(noteId, title) {
  const subNav = document.getElementById("sub-nav");
  const existingLink = subNav.querySelector(`a[data-id="${noteId}"]`);

  if (!existingLink) {
    const link = document.createElement("a");
    link.href = `note.html?id=${noteId}`;
    link.textContent = title;
    link.dataset.id = noteId;
    link.style.color = "white";
    subNav.appendChild(link);
  }
}

function updateNoteLinkInSubNav(noteId, newTitle) {
  const link = document.querySelector(`#sub-nav a[data-id="${noteId}"]`);
  if (link) {
    link.textContent = newTitle;
  }
}

window.onload = function () {
  // Lade Notizen nur, wenn der User eingeloggt ist
  firebase.auth().onAuthStateChanged(user => {
    const profileImg = document.getElementById("profile-img");

    if (profileImg) {
      if (user) {
        const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`;
        profileImg.src = photoURL;
        profileImg.style.display = "block";

        // ✅ Lade Notes erst nach erfolgreichem Login
        loadUserNotes(user);
      } else {
        profileImg.style.display = "none";
      }
    } else {
      console.warn("⚠️ Element #profile-img nicht im DOM gefunden.");
    }

    // Falls user nicht eingeloggt ist, trotzdem Notes-Bereich leeren
    if (!user) {
      const container = document.getElementById("sub-nav");
      if (container) container.innerHTML = "<p>Please log in to see your notes.</p>";
    }
  });
};

function autoSaveNote() {
  saveTimeout = setTimeout(() => {
    const title = document.getElementById("note-title").value;
    const content = document.getElementById("note-content").value;

  clearTimeout(saveTimeout);

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

function loadUserNotes(user) {
  const subNav = document.getElementById("sub-nav");
  if (!subNav) return;

  subNav.innerHTML = "<p style='color: white; padding: 0.5rem;'>Loading...</p>";

  const db = firebase.firestore();

  db.collection("notes")
    .where("userId", "==", user.uid)
    .orderBy("updatedAt", "desc")
    .get()
    .then(snapshot => {
      subNav.innerHTML = "";

      if (snapshot.empty) {
        const emptyMsg = document.createElement("p");
        emptyMsg.textContent = "You don't have any notes yet.";
        emptyMsg.style.color = "white";
        emptyMsg.style.padding = "0.5rem";
        subNav.appendChild(emptyMsg);
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        const noteLink = document.createElement("a");
        noteLink.href = `note.html?id=${doc.id}`;
        noteLink.textContent = data.title || "Untitled";
        noteLink.style.color = "white";
        noteLink.style.padding = "0.5rem";
        noteLink.style.textDecoration = "none";
        subNav.appendChild(noteLink);
      });
    })
    .catch(error => {
      console.error("Error fetching notes:", error);
      subNav.innerHTML = "<p style='color: white; padding: 0.5rem;'>Error loading notes.</p>";
    });
}

auth.onAuthStateChanged((user) => {
  if (user) {
    loadUserNotes();
  }
});

function createNewNote(buttonEl) {
  const user = firebase.auth().currentUser;
  // For modular SDK, get UID from _delegate
  const uid = user?.uid || user?._delegate?.uid;
  if (!uid) {
    alert("You must be logged in to create a note.");
    window.location.href = "../login/login.html";
    return;
  }

  const originalText = buttonEl?.textContent || "Create New Note";
  if (buttonEl) {
    buttonEl.disabled = true;
    buttonEl.textContent = "Creating...";
  }

  const db = firebase.firestore();
  const newNote = {
    userId: uid,
    title: "Untitled",
    content: "",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("notes")
    .add(newNote)
    .then(docRef => {
      window.location.href = `note.html?id=${docRef.id}`;
    })
    .catch(error => {
      console.error("Error creating note:", error);
      alert("There was an error creating the note.");
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.textContent = originalText;
      }
    });
}

window.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged((user) => {
    console.log("User: " + user)
    if (user) {
      loadUserNotes(user);
    }
  });
});

function goToProfile() {
  console.log("Navigating to profile page");
  window.location.href = "./profile/profile.html";
}

function setupNoteLinks(user) {
  document.querySelectorAll("#sub-nav a").forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      const noteId = link.dataset.id;
      openNoteModal(noteId, user);
    };
  });
}

function openNoteModal(noteId, user) {
  const modal = document.getElementById("note-modal");
  modal.classList.remove("hidden");

  const db = firebase.firestore();
  db.collection("notes").doc(noteId).get().then(doc => {
    if (doc.exists && doc.data().userId === user.uid) {
      const data = doc.data();
      document.getElementById("modal-title").textContent = data.title || "Untitled";
      document.getElementById("modal-created").textContent = "Created: " + new Date(doc.createTime.toDate()).toLocaleString();
      document.getElementById("modal-updated").textContent = "Updated: " + new Date(data.updatedAt?.toDate?.() || Date.now()).toLocaleString();

      document.getElementById("edit-note-btn").onclick = () => {
        window.location.href = `note.html?id=${noteId}`;
      };

      document.getElementById("delete-note-btn").onclick = () => {
        db.collection("notes").doc(noteId).delete().then(() => {
          modal.classList.add("hidden");
          document.querySelector(`#sub-nav a[data-id="${noteId}"]`)?.remove();
        });
      };
    }
  });

  document.getElementById("modal-close").onclick = () => {
    modal.classList.add("hidden");
  };
}