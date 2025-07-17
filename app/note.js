let currentNoteId = null;
let autoSaveTimeout = null;

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    // Prüfe, ob eine Note-ID in der URL steht
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get("id");
    if (noteId) {
      currentNoteId = noteId;
      loadNoteById(noteId, user);
    }
    setupEditor(user);
    loadUserNotes(user);
  } else {
    window.location.href = "../login/login.html";
  }
});

function loadNoteById(noteId, user) {
  const db = firebase.firestore();
  db.collection("notes").doc(noteId).get().then(doc => {
    if (doc.exists && doc.data().userId === user.uid) {
      const data = doc.data();
      document.getElementById("note-title").value = data.title || "";
      document.getElementById("note-content").value = data.content || "";
    } else {
      // Falls die Note nicht existiert oder nicht dem User gehört
      document.getElementById("note-title").value = "";
      document.getElementById("note-content").value = "";
    }
  });
}

function setupEditor(user) {
  const titleInput = document.getElementById("note-title");
  const contentInput = document.getElementById("note-content");

  titleInput.addEventListener("input", () => triggerAutoSave(user));
  contentInput.addEventListener("input", () => triggerAutoSave(user));
}

function triggerAutoSave(user) {
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    saveNote(user);
  }, 2000);
}

function saveNote(user) {
  const db = firebase.firestore();
  const title = document.getElementById("note-title").value.trim();
  const content = document.getElementById("note-content").value.trim();

  if (!currentNoteId && (title || content)) { // Nur anlegen, wenn Inhalt da ist!
    db.collection("notes").add({
      userId: user.uid,
      title: title || "Untitled",
      content: content,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(docRef => {
      currentNoteId = docRef.id;
      addNoteLinkToSubNav(currentNoteId, title || "Untitled", user);
      loadNoteById(currentNoteId, user); // Jetzt laden!
      console.log("Note created:", docRef.id);
    });
  } else if (currentNoteId) {
    db.collection("notes").doc(currentNoteId).update({
      title: title || "Untitled",
      content: content,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      console.log("Note updated:", currentNoteId);
      updateNoteLinkInSubNav(currentNoteId, title || "Untitled");
    });
  }
}

function autoSaveNote() {
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    const title = document.getElementById("note-title").value;
    const content = document.getElementById("note-content").value;
    const db = firebase.firestore();
    const user = firebase.auth().currentUser;

    if (!user) return;

    if (currentNoteId) {
      // Update bestehende Note
      db.collection("notes").doc(currentNoteId).update({
        title,
        content,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        console.log("Auto-saved (update)");
      })
      .catch(err => console.error("Save error:", err));
    } else {
      // Neue Note anlegen
      db.collection("notes").add({
        userId: user.uid,
        title,
        content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(docRef => {
        currentNoteId = docRef.id;
        console.log("Auto-saved (new)", docRef.id);
      })
      .catch(err => console.error("Save error:", err));
    }
  }, 2000); // speichert 2 Sekunden nach dem letzten Tippen
}

function addNoteLinkToSubNav(noteId, title, user) {
  const subNav = document.getElementById("sub-nav");
  const existingLink = subNav.querySelector(`a[data-id="${noteId}"]`);

  if (!existingLink) {
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = title;
    link.dataset.id = noteId;
    link.style.color = "white";
    link.onclick = (e) => {
      e.preventDefault();
      openNoteModal(noteId, user);
    };
    subNav.appendChild(link);
  }
}

function updateNoteLinkInSubNav(noteId, newTitle) {
  const link = document.querySelector(`#sub-nav a[data-id="${noteId}"]`);
  if (link) {
    link.textContent = newTitle;
  }
}

function loadUserNotes(user) {
  const subNav = document.getElementById("sub-nav");
  subNav.innerHTML = "<p style='color: white;'>Loading...</p>";

  const db = firebase.firestore();

  db.collection("notes")
    .where("userId", "==", user.uid)
    .orderBy("updatedAt", "desc")
    .get()
    .then(snapshot => {
      subNav.innerHTML = "";

      if (snapshot.empty) {
        subNav.innerHTML = "<a style='color: white; text-decoration: none;' href='#'>You don't have any notes yet.</a>";
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        addNoteLinkToSubNav(doc.id, data.title || "Untitled", user);
      });
    })
    .catch(error => {
      console.error("Error fetching notes:", error);
      subNav.innerHTML = "<p style='color: white;'>Error loading notes.</p>";
    });
}

// Modal Logik
function openNoteModal(noteId, user) {
  const modal = document.getElementById("note-modal");
  modal.classList.remove("hidden");

  const db = firebase.firestore();
  db.collection("notes").doc(noteId).get().then(doc => {
    if (doc.exists && doc.data().userId === user.uid) {
      const data = doc.data();

      const createdAt = data.createdAt?.toDate?.() || null;
      const updatedAt = data.updatedAt?.toDate?.() || null;

      document.getElementById("modal-title").textContent = data.title || "Untitled";
      document.getElementById("modal-created").textContent = createdAt
        ? "Created: " + new Date(createdAt).toLocaleString()
        : "Created: Unknown";

      document.getElementById("modal-updated").textContent = updatedAt
        ? "Updated: " + new Date(updatedAt).toLocaleString()
        : "Updated: Unknown";

      document.getElementById("edit-note-btn").onclick = () => {
        window.location.href = `note.html?id=${noteId}`;
      };

      document.getElementById("delete-note-btn").onclick = () => {
        moveNoteToTrash(noteId, user);
      };
    }
  });

  document.getElementById("modal-close").onclick = () => {
    modal.classList.add("hidden");
  };
}

function goToProfile() {
  console.log("Navigating to profile...");
  window.location.href = "../profile/profile.html";
}

function copyEmailToClipboard() {
  const email = "noto.by.romano@gmail.com";
  navigator.clipboard.writeText(email).then(() => {
    console.log("Email copied to clipboard:", email);
    showSnackbar("Email copied to clipboard!");
  }).catch(err => {
    console.error("Error copying email:", err);
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

function moveNoteToTrash(noteId, user) {
  const db = firebase.firestore();
  db.collection("notes").doc(noteId).update({
    trashed: true,
    trashedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById("note-modal").classList.add("hidden");
    document.querySelector(`#subNav a[data-id="${noteId}"]`)?.remove();
    showSnackbar("Note moved to trash!");
    loadTrashNotes(user);
  });
}

function loadTrashNotes(user) {
  const trashList = document.getElementById("trash-notes-list");
  const trashEmptyMsg = document.getElementById("trash-empty-message");
  trashList.innerHTML = "";
  trashEmptyMsg.style.display = "none";

  const db = firebase.firestore();
  db.collection("notes")
    .where("userId", "==", user.uid)
    .where("trashed", "==", true)
    .orderBy("trashedAt", "desc")
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        trashEmptyMsg.style.display = "block";
        return;
      }
      snapshot.forEach(doc => {
        const data = doc.data();
        const noteDiv = document.createElement("div");
        noteDiv.className = "trash-note-card";
        noteDiv.innerHTML = `
          <h3>${data.title || "Untitled"}</h3>
          <p class="timestamp">${data.trashedAt?.toDate ? new Date(data.trashedAt.toDate()).toLocaleString() : ""}</p>
          <button class="restore-btn">Restore</button>
          <button class="delete-btn">Delete permanently</button>
        `;
        // Restore
        noteDiv.querySelector(".restore-btn").onclick = () => {
          db.collection("notes").doc(doc.id).update({
            trashed: false,
            trashedAt: null
          }).then(() => {
            showSnackbar("Note restored!");
            loadTrashNotes(user);
            loadUserNotes(user);
          });
        };
        // Delete permanently
        noteDiv.querySelector(".delete-btn").onclick = () => {
          if (confirm("Delete this note permanently?")) {
            db.collection("notes").doc(doc.id).delete().then(() => {
              showSnackbar("Note deleted permanently!");
              loadTrashNotes(user);
            });
          }
        };
        trashList.appendChild(noteDiv);
      });
    });
}

// Trash-Modal laden, wenn geöffnet:
document.addEventListener("DOMContentLoaded", () => {
  const trashToggle = document.getElementById("trash-toggle");
  const trashModal = document.getElementById("trash-modal");
  firebase.auth().onAuthStateChanged(user => {
    trashToggle.addEventListener("click", (e) => {
      e.preventDefault();
      trashModal.classList.toggle("hidden");
      if (!trashModal.classList.contains("hidden")) {
        loadTrashNotes(user);
      }
    });
  });
});