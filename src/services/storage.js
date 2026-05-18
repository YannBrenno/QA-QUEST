// src/services/storage.js
// Abstração sobre localStorage

const PLAYER_KEY   = 'playerData';
const PROGRESS_KEY = 'qaquest_progress';

export const storage = {

  // ---- Player data ----

  savePlayer(data) {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(data));
  },

  loadPlayer() {
    try {
      const raw = localStorage.getItem(PLAYER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  clearPlayer() {
    localStorage.removeItem(PLAYER_KEY);
  },

  // ---- Progress ----

  saveProgress(data) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  },

  loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : { completed: [] };
    } catch { return { completed: [] }; }
  },

  markChallengeComplete(id) {
    const p = this.loadProgress();
    if (!p.completed.includes(id)) p.completed.push(id);
    this.saveProgress(p);
  },

  isChallengeComplete(id) {
    return this.loadProgress().completed.includes(id);
  },
};
