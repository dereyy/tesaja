import { formatDate, setAuthHeader } from "./utils.js";

const apiNotesUrl = "https://backend-nopal-505940949397.us-central1.run.app/api/notes";
const tokenKey = "accessToken";

const notesContainer = document.getElementById("notesContainer");
const searchInput = document.getElementById("searchInput");
const addNoteBtn = document.getElementById("addNoteBtn");
const noteForm = document.getElementById("noteForm");
const formTitle = document.getElementById("formTitle");
const noteIdInput = document.getElementById("noteId");
const noteTitleInput = document.getElementById("noteTitle");
const noteContentInput = document.getElementById("noteContent");
const saveNoteBtn = document.getElementById("saveNote");
const cancelFormBtn = document.getElementById("cancelForm");

function openNoteForm(note = null) {
  noteForm.classList.remove("hidden");
  if (note) {
    formTitle.textContent = "Edit Note";
    noteIdInput.value = note.id || "";
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
  } else {
    formTitle.textContent = "New Note";
    noteIdInput.value = "";
    noteTitleInput.value = "";
    noteContentInput.value = "";
  }
}

function closeNoteForm() {
  noteForm.classList.add("hidden");
}

function loadNotes(searchQuery = "") {
  setAuthHeader();
  axios
    .get(`${apiNotesUrl}/notes`)
    .then((res) => {
       console.log("Notes response:", res.data); 
      const query = searchQuery.toLowerCase();
      const colors = [
        "bg-blue-800",
        "bg-green-800",
        "bg-red-800",
        "bg-yellow-800",
        "bg-purple-800",
        "bg-indigo-800",
        "bg-pink-800",
        "bg-blue-600",
        "bg-green-600",
        "bg-red-600",
        "bg-yellow-600",
        "bg-purple-600",
        "bg-indigo-600",
        "bg-pink-600",
      ];
      let noteColors = JSON.parse(sessionStorage.getItem("noteColors")) || {};
      let availableColors = JSON.parse(
        sessionStorage.getItem("availableColors")
      ) || [...colors];
      function getUniqueColor() {
        if (availableColors.length === 0) {
          availableColors = [...colors];
        }
        const colorIndex = Math.floor(Math.random() * availableColors.length);
        return availableColors.splice(colorIndex, 1)[0];
      }
      let notes = res.data || [];
      if (query) {
        notes = notes.filter(
          (note) =>
            (note.title && note.title.toLowerCase().includes(query)) ||
            (note.content && note.content.toLowerCase().includes(query))
        );
      }
      notesContainer.innerHTML = "";
      notes.forEach((note) => {
        if (!noteColors[note.id]) {
          noteColors[note.id] = getUniqueColor();
        }
        const noteDiv = document.createElement("div");
        noteDiv.className = `${noteColors[note.id]} p-4 rounded-lg flex flex-col h-auto`;
        noteDiv.innerHTML = `
          <h3 class="text-lg font-bold">${note.title}</h3>
          <div class="note-content grow break-words">${marked.parse(
            note.content
          )}</div>
          <small class="mt-2 block text-white">${formatDate(
            note.created_at
          )}</small>
          <div class="flex justify-end space-x-2 mt-2">
            <button onclick="editNote(${note.id}, '${note.title}', '${encodeURIComponent(note.content)}')" 
                    class="text-blue-400 hover:text-yellow-300">
              <i class="fas fa-pen"></i>
            </button>
            <button onclick="deleteNote(${note.id})" class="text-red-700 hover:text-red-400">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
        notesContainer.appendChild(noteDiv);
      });
      sessionStorage.setItem("noteColors", JSON.stringify(noteColors));
      sessionStorage.setItem(
        "availableColors",
        JSON.stringify(availableColors)
      );
    })
    .catch((err) => {
      if (err.response && err.response.status === 404) {
        alert("Gagal memuat catatan: Endpoint tidak ditemukan (404).");
      } else if (err.code === "ERR_NETWORK") {
        alert("Tidak dapat terhubung ke backend.");
      } else {
        alert(
          "Gagal memuat catatan: " +
            (err.response?.data?.message || err.message)
        );
      }
    });
}

function saveNote() {
  setAuthHeader();
  const id = noteIdInput.value;
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();
  if (!title && !content) {
    alert("Isi setidaknya judul atau konten.");
    return;
  }
  if (id) {
    axios
      .put(`${apiNotesUrl}/${id}`, { title, content })
      .then(() => {
        closeNoteForm();
        loadNotes(searchInput.value.trim());
      })
      .catch((err) => {
        alert(
          "Gagal menyimpan catatan: " +
            (err.response?.data?.message || err.message)
        );
      });
  } else {
    axios
      .post(`${apiNotesUrl}/notes`, { title, content })
      .then(() => {
        closeNoteForm();
        loadNotes(searchInput.value.trim());
      })
      .catch((err) => {
        alert(
          "Gagal menyimpan catatan: " +
            (err.response?.data?.message || err.message)
        );
      });
  }
}

function deleteNote(id) {
  if (confirm("Yakin ingin menghapus catatan ini?")) {
    setAuthHeader();
    axios
      .delete(`${apiNotesUrl}/notes/${id}`)
      .then(() => {
        loadNotes(); // reload daftar catatan setelah penghapusan
      })
      .catch((err) => {
        console.error("Gagal menghapus catatan:", err);
        alert("Gagal menghapus catatan.");
      });
  }
}

// agar bisa diakses dari HTML onclick
window.deleteNote = deleteNote;


function setupNotesEventListeners() {
  addNoteBtn.addEventListener("click", () => {
    openNoteForm();
  });
  cancelFormBtn.addEventListener("click", () => {
    closeNoteForm();
  });
  saveNoteBtn.addEventListener("click", () => {
    saveNote();
  });
  searchInput.addEventListener("input", () => {
    loadNotes(searchInput.value.trim());
  });
}

export { openNoteForm, closeNoteForm, loadNotes, saveNote, deleteNote, setupNotesEventListeners }; 