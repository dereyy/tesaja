// main.js atau entry point
import "./axiosConfig.js";
import {
  setupAuthEventListeners,
  showNotesApp,
  showAuth,
  clearAuthForms,
} from "./auth.js";
import { loadNotes, setupNotesEventListeners } from "./notes.js";
import { scheduleTokenRefresh } from "./axiosConfig.js";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    showNotesApp();
    loadNotes();
    scheduleTokenRefresh(); // <— kalau sudah login sebelumnya
  } else {
    showAuth();
    clearAuthForms();
  }

  setupAuthEventListeners();
  setupNotesEventListeners();
});
