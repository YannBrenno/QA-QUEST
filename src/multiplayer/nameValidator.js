// src/multiplayer/nameValidator.js
// Verifica se nickname já está em uso por jogador ativo

import { supabase } from '../services/supabase.js';

const ONLINE_THRESHOLD = 300_000; // 5 min

export async function isNicknameTaken(nickname) {
  const { data, error } = await supabase
    .from('players_online')
    .select('id, nickname, lastSeen')
    .ilike('nickname', nickname);

  if (error || !data) return false;

  const cutoff = new Date(Date.now() - ONLINE_THRESHOLD).toISOString();
  return data.some(p => new Date(p.lastSeen) > new Date(cutoff));
}
