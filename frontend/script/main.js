import "./axiosConfig.js";
import { showNotesApp, showAuth, clearAuthForms, setupAuthEventListeners } from "./auth.js";
import { loadNotes, setupNotesEventListeners } from "./notes.js";
import { ensureValidAccessToken, setAuthHeader } from "./utils.js";


document.addEventListener("DOMContentLoaded", async () => {
    const valid = await ensureValidAccessToken();
    if (valid) {
      setAuthHeader();
      showNotesApp();
      loadNotes();
    } else {
      showAuth();
      clearAuthForms();
    }
    setupAuthEventListeners(() => {
      showNotesApp();
      loadNotes();
    });
    setupNotesEventListeners();
  });