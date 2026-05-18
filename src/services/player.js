// src/services/player.js
// Busca ou cria player no Supabase

import { supabase } from './supabase.js';
import { v4 as uuidv4 } from '../utils/uuid.js';

export async function getOrCreatePlayer({ nickname, color, accessory }) {
  // 1. Buscar player existente
  const { data, error } = await supabase
    .from('players_online')
    .select('*')
    .ilike('nickname', nickname)
    .order('lastSeen', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (data && data.length > 0) {
    // Player existe, retorna o mais recente
    return data[0];
  }

  // 2. Criar novo player
  const newPlayer = {
    id: uuidv4(),
    nickname,
    color,
    accessory,
    x: 200,
    y: 300,
    direction: 0,
    currentArea: 'lobby',
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const { error: insertError } = await supabase
    .from('players_online')
    .insert([newPlayer]);
  if (insertError) throw insertError;
  return newPlayer;
}
