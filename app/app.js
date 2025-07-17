window.onload = function () {
  // Lade Notizen nur, wenn der User eingeloggt ist
  firebase.auth().onAuthStateChanged(user => {
    const profileImg = document.getElementById("profile-img");

    if (profileImg) {
      if (user) {
        const photoURL = user.photoURL || "https://ui-avatars.com/api/?name=User&background=random";
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
      const container = document.getElementById("notes-container");
      if (container) container.innerHTML = "<p>Please log in to see your notes.</p>";
    }
  });
};

function toggleProfileMenu() {
  const menu = document.getElementById("profile-menu");
  if (menu) {
    menu.classList.toggle("hidden");
  }
}

function goToProfile() {
  window.location.href = "profile.html";
}

function logout() {
  firebase.auth().signOut().then(() => {
    location.reload();
  });
}

function loadUserNotes(user) {
  const container = document.getElementById("notes-container");
  if (!container) return;

  container.innerHTML = "<p>Loading...</p>";

  const db = firebase.firestore();
  db.collection("notes")
    .where("userId", "==", user.uid)
    .orderBy("updatedAt", "desc")
    .get()
    .then(snapshot => {
      container.innerHTML = "";

      if (snapshot.empty) {
        container.innerHTML = `
          <a>You don't have any notes yet.</a>
          <button onclick="createNewNote(this)" class="create-note-btn">Create your first note</button>
        `;
        return;
      }

      let noteCount = 0;

      snapshot.forEach(doc => {
        noteCount++;
        const data = doc.data();
        const noteDiv = document.createElement("div");
        noteDiv.className = "note-card";
        noteDiv.innerHTML = `
          <h3>${data.title || "Untitled"}</h3>
          <p class="timestamp">${new Date(data.updatedAt?.toDate?.() || Date.now()).toLocaleString()}</p>
          <button onclick="openNote('${doc.id}')">Open</button>
        `;
        container.appendChild(noteDiv);
      });

      if (noteCount < 20) {
        const addBtn = document.createElement("button");
        addBtn.id = "create-note-btn";
        addBtn.textContent = "Create New Note";
        addBtn.className = "create-note-btn";
        addBtn.onclick = function () {
          createNewNote(this);
        };
        container.appendChild(addBtn);
      } else {
        const warning = document.createElement("p");
        warning.style.color = "crimson";
        warning.style.marginTop = "1rem";
        warning.textContent = "You’ve reached the maximum (20) notes for the free plan.";
        container.appendChild(warning);
      }
    })
    .catch(error => {
      console.error("Error fetching notes:", error);
      container.innerHTML = "<p>Error loading notes.</p>";
    });
}

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

function openNote(id) {
  window.location.href = `note.html?id=${id}`;
}
