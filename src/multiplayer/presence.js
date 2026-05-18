// src/multiplayer/presence.js
// Gerencia presença online via Supabase Realtime

import { supabase } from '../services/supabase.js';

const HEARTBEAT_INTERVAL = 20_000;   // 20s
const ONLINE_THRESHOLD   = 120_000;  // 2 min - treat players inactive after 2 minutes to remove stuck avatars from screens

let _player       = null;
let _channel      = null;
let _heartbeatId  = null;
let _onUpdate     = null; // callback(players[])
let _lastArea     = null;
let _fetchSeq     = 0; // sequence to ignore out-of-order fetches

// ---- Helpers ----

function isOnline(lastSeen) {
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD;
}

// ---- Public API ----

export const presence = {

  // Called once after character creation
  async register(player) {
    _player = { ...player };
    // Ensure internal last-area tracks player's area
    _lastArea = _player.currentArea ?? _lastArea;

    // Upsert own row (insert or update)
    const { error } = await supabase.from('players_online').upsert({
      id:           _player.id,
      nickname:     _player.nickname,
      color:        _player.color,
      accessory:    _player.accessory,
      x:            _player.x ?? 200,
      y:            _player.y ?? 200,
      direction:    _player.direction ?? 0,
      currentArea:  _player.currentArea ?? 'lobby',
      lastSeen:     new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) console.error('[presence] register error:', error);

    this._startHeartbeat();
  },

  // Join a Realtime channel for an area and listen to changes
  joinArea(area, onUpdate) {
    _lastArea = area;
    _onUpdate = onUpdate;

    // bump fetch sequence - any previous fetch results become stale
    _fetchSeq++;
    const mySeq = _fetchSeq;

    // Unsubscribe from previous channel
    if (_channel) {
      supabase.removeChannel(_channel);
      _channel = null;
    }

    // Clear previous polling
    if (this._pollId) {
      clearInterval(this._pollId);
      this._pollId = null;
    }

    // Subscribe to Realtime changes (no server-side filter).
    // We handle area filtering client-side so updates that change a player's currentArea
    // are observed by previous-area subscribers and they can remove the player quickly.
    _channel = supabase
      .channel(`area:${area}:${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players_online' },
        (payload) => {
          // simple debugging hook
          // console.debug('[presence] realtime payload', payload);
          this._fetchArea(area, mySeq);
        }
      )
      .subscribe((status) => {
        console.log('[presence] Realtime status:', status);
      });

    // Polling de fallback a cada 3s (garante que funciona mesmo sem Realtime habilitado)
    // Make polling quicker (1s) to reduce the visible window when players change area
    this._pollId = setInterval(() => this._fetchArea(area, mySeq), 1000);

    // Initial fetch — small delay to allow local changeArea update to commit and avoid reading stale state
    setTimeout(() => this._fetchArea(area, mySeq), 120);
  },

  async _fetchArea(area, seq) {
    // If seq provided, ignore if it doesn't match current
    if (typeof seq !== 'undefined' && seq !== _fetchSeq) {
      console.log('[presence] _fetchArea ignored stale seq', seq, 'current', _fetchSeq);
      return;
    }
    if (!_onUpdate) return;
    // Ignore results for areas we are no longer subscribed to
    if (area !== _lastArea) return;
    const { data, error } = await supabase
      .from('players_online')
      .select('*')
      .eq('currentArea', area);

    if (error) { console.error('[presence] _fetchArea error:', error); return; }
    if (!data) return;

    // Defensive: ensure rows actually declare the expected area
    const mismatched = data.filter(p => p.currentArea !== area);
    if (mismatched.length) {
      console.warn('[presence] fetched rows with mismatched currentArea:', mismatched.map(m => ({ id: m.id, currentArea: m.currentArea })));
    }

    // Filter ghosts and own player and ensure currentArea matches (defensive)
    const others = data.filter(p =>
      p.id !== _player?.id && isOnline(p.lastSeen) && p.currentArea === area
    );

    // Debug log counts to help trace asymmetric visibility
    // console.debug('[presence] _fetchArea', area, 'seq', seq ?? '-', 'returned', data.length, 'others', others.length);

    _onUpdate(others);
  },

  // Move player (throttled outside)
  async updatePosition(x, y, direction) {
    if (!_player) return;
    _player.x = x;
    _player.y = y;
    _player.direction = direction;
    await supabase.from('players_online').update({
      x, y, direction,
      lastSeen: new Date().toISOString(),
    }).eq('id', _player.id);
  },

  // Change area
  async changeArea(area) {
    if (!_player) return;
    const prevArea = _player.currentArea;
    _player.currentArea = area;
    await supabase.from('players_online').update({
      currentArea: area,
      lastSeen:    new Date().toISOString(),
    }).eq('id', _player.id);

    // Always re-join the area channel so others appear
    if (_onUpdate) {
      this.joinArea(area, _onUpdate);
    } else {
      _lastArea = area;
    }

    // Try to nudge other clients: quick local fetch of prevArea (best-effort) so a previous-area
    // client will see the change sooner through its polling/realtime handlers. Harmless if prevArea undefined.
    try {
      if (prevArea && prevArea !== area) {
        setTimeout(() => this._fetchArea(prevArea, _fetchSeq), 50);
        console.log('[presence] changeArea: prevArea', prevArea, '->', area);
      }
    } catch (e) {
      // ignore
    }
  },

  // Heartbeat
  _startHeartbeat() {
    if (_heartbeatId) clearInterval(_heartbeatId);
    _heartbeatId = setInterval(async () => {
      if (!_player) return;
      await supabase.from('players_online').update({
        lastSeen: new Date().toISOString(),
      }).eq('id', _player.id);
    }, HEARTBEAT_INTERVAL);
  },

  // Cleanup on unload
  async disconnect() {
    clearInterval(_heartbeatId);
    clearInterval(this._pollId);
    if (_channel) supabase.removeChannel(_channel);
    if (_player) {
      await supabase.from('players_online').delete().eq('id', _player.id);
    }
    _player = null;
  },

  // Leave current subscribed area (stop realtime & polling)
  leaveArea() {
    console.log('[presence] leaveArea');
    _onUpdate = null;
    if (this._pollId) { clearInterval(this._pollId); this._pollId = null; }
    if (_channel) { supabase.removeChannel(_channel); _channel = null; }
  },

  getPlayer() { return _player; },
};

// Cleanup on tab close
window.addEventListener('beforeunload', () => {
  if (_player) {
    // sync beacon — best effort
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/players_online?id=eq.${_player.id}`);
    }
    presence.disconnect();
  }
});
