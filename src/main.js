// src/main.js
// Application shell — manages screen transitions and global state

import './styles/global.css';

import { storage }                  from './services/storage.js';
import { presence }                 from './multiplayer/presence.js';
import { showToast }                from './components/Toast.js';

import { MenuScreen }               from './screens/MenuScreen.js';
import { CharacterCreationScreen }  from './screens/CharacterCreationScreen.js';
import { WorldScreen }              from './screens/WorldScreen.js';
import { ChallengeScreen }          from './screens/ChallengeScreen.js';
import { EndingScreen }             from './screens/EndingScreen.js';
import { CreditsScreen }            from './screens/CreditsScreen.js';

const app = document.getElementById('app');

// ---- State ----
let currentScreen = null;
let playerData    = storage.loadPlayer();
let progress      = storage.loadProgress();

// ---- Screen manager ----
function goto(screenEl) {
  currentScreen?._destroy?.();
  app.innerHTML = '';
  app.appendChild(screenEl);
  currentScreen = screenEl;
}

// ---- Routes ----
function showMenu() {
  goto(MenuScreen({
    onStart() {
      if (playerData) {
        // Already has a character — go directly to lobby
        showLobby();
      } else {
        showCharacterCreation();
      }
    },
    onCredits: showCredits,
  }));
}

function showCredits() {
  goto(CreditsScreen({ onBack: showMenu }));
}

function showCharacterCreation() {
  goto(CharacterCreationScreen({
    async onComplete(data) {
      playerData = data;
      storage.savePlayer(data);
      try {
        await presence.register({ ...data, x: 200, y: 300, currentArea: 'lobby' });
      } catch {
        showToast('Modo offline — progresso salvo localmente.', 'error');
      }
      showLobby();
    },
  }));
}

function showLobby() {
  progress = storage.loadProgress();
  goto(WorldScreen({
    player:   playerData,
    area:     'lobby',
    progress,
    onEnterChallenge: showChallenge,
    onGoToMap: () => showMap(),
  }));
}

function showMap() {
  progress = storage.loadProgress();
  goto(WorldScreen({
    player:   playerData,
    area:     'map',
    progress,
    onEnterChallenge: showChallenge,
    onGoToMap: () => showLobby(),
  }));
}

function showChallenge(node) {
  progress = storage.loadProgress();
  goto(ChallengeScreen({
    challengeId: node.id,
    player:      playerData,
    onComplete(id) {
      progress = storage.loadProgress();
      const allDone = progress.completed.length >= 5;
      if (allDone) {
        showEnding();
      } else {
        showMap();
      }
    },
    onExit: showMap,
  }));
}

function showEnding() {
  progress = storage.loadProgress();
  try { presence.changeArea('ending'); } catch {}
  goto(EndingScreen({ player: playerData, progress }));
}

// ---- Boot ----
async function boot() {
  try {
    // Se player existe no localStorage, re-registra no Supabase
    if (playerData) {
      try {
        await presence.register({ ...playerData, x: 200, y: 300, currentArea: 'lobby' });
      } catch (e) {
        console.warn('[boot] presence.register falhou, modo offline:', e);
      }
    }

    // Se todos os desafios completos — vai para o ending
    if (progress && progress.completed && progress.completed.length >= 5) {
      showEnding();
    } else {
      showMenu();
    }
  } catch (e) {
    console.error('[boot] Erro fatal, mostrando menu:', e);
    showMenu();
  }
}

boot();
