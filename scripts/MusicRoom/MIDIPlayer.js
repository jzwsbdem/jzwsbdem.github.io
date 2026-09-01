(function() {
    const PIANO_COUNT = 16;
    const WHITE_KEYS = 56;
    const BLACK_KEYS = 40;
    const TOTAL_KEYS = WHITE_KEYS + BLACK_KEYS;

    const romanNumerals = [
        'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII',
        'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI'
    ];

    function generateKeyData() {
        const keys = [];
        const blackPattern = [1, 3, 6, 8, 10];
        let total = 0;
        let noteIndex = 0;
        while (total < TOTAL_KEYS) {
            const isBlack = blackPattern.includes(noteIndex);
            keys.push({
                isBlack: isBlack,
                midiNote: 24 + total,
            });
            total++;
            noteIndex = (noteIndex + 1) % 12;
        }
        return keys;
    }

    const keyData = generateKeyData();
    const container = document.getElementById('pianoContainer');
    const pianoKeys = [];

    // ★★★ 回弹速度配置 ★★★
    const KEY_HIGHLIGHT_DURATION = 120;
    const KEY_HIGHLIGHT_DURATION_MIDI = 300;

    // ---------- 音频（静音模式） ----------
    let audioCtx = null;
    let midiTimer = null;
    let isPlaying = false;
    let isPaused = false;

    // MIDI 状态
    let midiSong = null;
    let midiActive = [];
    let midiLevelArr = [];
    let midiNext = [];
    let midiAnchorCtx = 0;
    let midiAnchorSong = 0;
    const MIDI_AHEAD = 0.25;
    let currentPercent = 0;

    // 存储当前高亮的音符和对应的定时器
    let activeHighlights = new Map(); // key: "pianoIndex-noteIndex", value: { timeoutId, startTime, duration }

    window.midiIsPaused = false;

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new(window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    // ============================================================
    // ★★★ 核心修改：MIDI 音符按下和释放完全匹配音符时长 ★★★
    // ============================================================

    // 手动点击琴键（保持快速回弹）
    function playNote(midiNote, pianoIndex, velocity = 80) {
        highlightKey(pianoIndex, midiNote, true);
        setTimeout(() => {
            highlightKey(pianoIndex, midiNote, false);
        }, KEY_HIGHLIGHT_DURATION);
    }

    // ★★★ MIDI 播放：按下音符，持续音符时长后释放 ★★★
    function playMidiNote(track, t, dur, note, vel) {
        const trackIdx = tracks.indexOf(track);
        if (trackIdx >= 0 && trackIdx < PIANO_COUNT) {
            const keys = pianoKeys[trackIdx];
            if (!keys) return;
            const noteIndex = note - 24;
            if (noteIndex < 0 || noteIndex >= keys.length) return;

            const key = keys[noteIndex];
            const keyId = `${trackIdx}-${noteIndex}`;

            // ★★★ 如果这个键已经有高亮，先清除旧的高亮 ★★★
            if (activeHighlights.has(keyId)) {
                const old = activeHighlights.get(keyId);
                clearTimeout(old.timeoutId);
                key.classList.remove('midi-active');
                activeHighlights.delete(keyId);
            }

            // ★★★ 按下琴键（高亮） ★★★
            key.classList.add('midi-active');

            // ★★★ 计算实际持续时间（秒转毫秒，但至少保留50ms） ★★★
            let durationMs = Math.max(50, dur * 1000);

            // ★★★ 设置定时器，在音符持续时长后释放 ★★★
            const timeoutId = setTimeout(() => {
                key.classList.remove('midi-active');
                activeHighlights.delete(keyId);
            }, durationMs);

            // 存储定时器信息
            activeHighlights.set(keyId, {
                timeoutId: timeoutId,
                startTime: performance.now(),
                duration: durationMs
            });
        }
    }

    function highlightKey(pianoIndex, midiNote, on) {
        const keys = pianoKeys[pianoIndex];
        if (!keys) return;
        const noteIndex = midiNote - 24;
        if (noteIndex >= 0 && noteIndex < keys.length) {
            if (on) {
                keys[noteIndex].classList.add('midi-active');
            } else {
                keys[noteIndex].classList.remove('midi-active');
            }
        }
    }

    // ============================================================
    // ★★★ 新增：停止所有高亮（用于暂停/停止时清理）★★★
    // ============================================================
    function clearAllHighlights() {
        // 清除所有定时器
        for (const [keyId, data] of activeHighlights) {
            clearTimeout(data.timeoutId);
            // 移除高亮类
            const [pianoIdx, noteIdx] = keyId.split('-').map(Number);
            const keys = pianoKeys[pianoIdx];
            if (keys && keys[noteIdx]) {
                keys[noteIdx].classList.remove('midi-active');
            }
        }
        activeHighlights.clear();
        
        // 额外的清理：移除所有 midi-active 类（保险）
        document.querySelectorAll('.midi-active').forEach(el => {
            el.classList.remove('midi-active');
        });
    }

    // ---------- SMF MIDI 解析 ----------
    function parseMidi(buf) {
        const dv = new DataView(buf);
        if (dv.byteLength < 14 || dv.getUint32(0, false) !== 0x4D546864) return null;
        const ntrk = dv.getUint16(10, false);
        const div = dv.getUint16(12, false);
        const tempos = [];
        const tracks = [];
        let off = 14;

        for (let ti = 0; ti < ntrk; ti++) {
            if (off + 8 > dv.byteLength || dv.getUint32(off, false) !== 0x4D54726B) break;
            const len = dv.getUint32(off + 4, false);
            const end = Math.min(off + 8 + len, dv.byteLength);
            let p = off + 8,
                tick = 0,
                running = 0,
                name = '',
                prog = 0,
                ch = 0,
                cc7 = null,
                pan = null,
                rev = null,
                cho = null;
            const active = {};
            const notes = [];

            while (p < end) {
                let dt = 0,
                    b;
                do { b = dv.getUint8(p++);
                    dt = (dt << 7) | (b & 0x7f); } while (b & 0x80);
                tick += dt;
                b = dv.getUint8(p);
                let st;
                if (b < 0x80) { st = running; } else { st = b;
                    p++;
                    if (st < 0xF0) running = st; }
                const cmd = st & 0xF0;
                const chn = st & 0x0F;

                if (st === 0xFF) {
                    const typ = dv.getUint8(p++);
                    let l = 0,
                        bb;
                    do { bb = dv.getUint8(p++);
                        l = (l << 7) | (bb & 0x7f); } while (bb & 0x80);
                    if (typ === 0x03) {
                        const bytes = new Uint8Array(buf, p, l);
                        name = '';
                        for (let i = 0; i < bytes.length; i++) name += String.fromCharCode(bytes[i]);
                    } else if (typ === 0x51 && l >= 3) {
                        tempos.push([tick, dv.getUint8(p) * 65536 + dv.getUint8(p + 1) * 256 + dv.getUint8(p + 2)]);
                    }
                    p += l;
                    if (typ === 0x2F) break;
                } else if (st === 0xF0 || st === 0xF7) {
                    let l2 = 0,
                        bb2;
                    do { bb2 = dv.getUint8(p++);
                        l2 = (l2 << 7) | (bb2 & 0x7f); } while (bb2 & 0x80);
                    p += l2;
                } else if (cmd === 0xC0) { prog = dv.getUint8(p++);
                    ch = chn; } else if (cmd === 0x90) {
                    const n = dv.getUint8(p),
                        v = dv.getUint8(p + 1);
                    p += 2;
                    ch = chn;
                    if (v > 0) {
                        if (!active[n]) active[n] = [];
                        active[n].push([tick, v]);
                    } else if (active[n] && active[n].length) {
                        const a = active[n].shift();
                        notes.push([a[0], tick, n, a[1]]);
                    }
                } else if (cmd === 0x80) {
                    const n2 = dv.getUint8(p);
                    p += 2;
                    ch = chn;
                    if (active[n2] && active[n2].length) {
                        const a2 = active[n2].shift();
                        notes.push([a2[0], tick, n2, a2[1]]);
                    }
                } else if (cmd === 0xB0) {
                    const ccn = dv.getUint8(p),
                        ccv2 = dv.getUint8(p + 1);
                    p += 2;
                    if (ccn === 7 && cc7 === null) cc7 = ccv2;
                    else if (ccn === 10 && pan === null) pan = ccv2;
                    else if (ccn === 91 && rev === null) rev = ccv2;
                    else if (ccn === 93 && cho === null) cho = ccv2;
                } else if (cmd === 0xE0) { p += 2; } else { p += 1; }
            }

            let endTick = 0;
            for (const k in active) {
                const lst = active[k];
                for (let q = 0; q < lst.length; q++) {
                    if (lst[q][0] > endTick) endTick = lst[q][0];
                }
            }
            for (const k2 in active) {
                const lst2 = active[k2];
                for (let q2 = 0; q2 < lst2.length; q2++) {
                    notes.push([lst2[q2][0], endTick + 384, parseInt(k2, 10), lst2[q2][1]]);
                }
            }
            notes.sort((a, b) => a[0] - b[0]);
            if (notes.length) {
                tracks.push({
                    name: name,
                    ch: ch,
                    prog: prog,
                    vol: cc7 || 100,
                    pan: pan == null ? 64 : pan,
                    cho: cho || 0,
                    rev: rev || 0,
                    notes: notes
                });
            }
            off = end;
        }

        if (!tracks.length) return null;
        tempos.sort((a, b) => a[0] - b[0]);

        function tickSec(tick) {
            let us = tempos.length ? tempos[0][1] : 500000,
                prev = 0,
                s = 0;
            for (let i = 0; i < tempos.length; i++) {
                const tt = tempos[i][0];
                if (tick <= tt) break;
                s += (tt - prev) * us / 1000000 / div;
                prev = tt;
                us = tempos[i][1];
            }
            return s + (tick - prev) * us / 1000000 / div;
        }

        let endMax = 0;
        for (let i2 = 0; i2 < tracks.length; i2++) {
            const ns2 = tracks[i2].notes;
            for (let j = 0; j < ns2.length; j++) {
                const st = tickSec(ns2[j][0]),
                    en = tickSec(ns2[j][1]);
                ns2[j] = [Math.round(st * 100) / 100, Math.max(0.05, Math.round(Math.min(en - st, 30) * 100) / 100), ns2[j][2], ns2[j][3]];
                if (ns2[j][0] + ns2[j][1] > endMax) endMax = ns2[j][0] + ns2[j][1];
            }
        }
        return { division: div, dur: Math.round(endMax * 100) / 100, name: (tracks[0] && tracks[0].name) || '',
            tracks: tracks };
    }

    let tracks = [];

    // ---------- MIDI 调度 ----------
    function midiCurTime() {
        if (!audioCtx) return midiAnchorSong;
        return isPlaying ? midiAnchorSong + (audioCtx.currentTime - midiAnchorCtx) : midiAnchorSong;
    }

    function midiResetNext(t) {
        if (!midiSong) return;
        for (let i = 0; i < midiSong.tracks.length; i++) {
            const ns = midiSong.tracks[i].notes;
            let lo = 0,
                hi = ns.length;
            while (lo < hi) { const m = (lo + hi) >> 1; if (ns[m][0] < t) lo = m + 1;
                else hi = m; }
            midiNext[i] = lo;
        }
        if (midiSong && midiSong.dur > 0) {
            currentPercent = t / midiSong.dur;
        }
    }

    function midiLoop() {
        if (!isPlaying || !audioCtx || !midiSong) return;
        const now = audioCtx.currentTime;
        const tNow = midiCurTime();
        const trackCount = Math.min(midiSong.tracks.length, PIANO_COUNT);

        if (midiSong.dur > 0) {
            currentPercent = tNow / midiSong.dur;
        }

        for (let i = 0; i < trackCount; i++) {
            const tr = midiSong.tracks[i];
            const ns = tr.notes;
            while (midiNext[i] < ns.length && ns[midiNext[i]][0] <= tNow + MIDI_AHEAD) {
                const ev = ns[midiNext[i]++];
                const abs = midiAnchorCtx + (ev[0] - midiAnchorSong);
                if (abs >= now - 0.02) {
                    // ★★★ 使用新的 playMidiNote，传入音符时长 ★★★
                    playMidiNote(tr, abs, ev[1], ev[2], ev[3]);
                }
            }
        }

        if (tNow >= midiSong.dur) {
            midiAnchorSong = 0;
            midiResetNext(0);
            midiAnchorCtx = audioCtx.currentTime;
            currentPercent = 0;
            // ★★★ 播放结束，清理所有高亮 ★★★
            clearAllHighlights();
        }
    }

    // ---------- 核心修复：参考 PC-98 版逻辑 ----------
    function midiPlay() {
        if (!midiSong) return;
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        if (isPaused) {
            isPaused = false;
            isPlaying = true;
            window.midiIsPaused = false;
            midiAnchorCtx = ctx.currentTime;
            window.midiIsPlaying = true;
            const statusDisplay = document.getElementById('statusDisplay');
            if (statusDisplay) statusDisplay.textContent = '▶ Playing ...';
            if (midiTimer) clearInterval(midiTimer);
            midiTimer = setInterval(midiLoop, 20);
            return;
        }

        isPlaying = true;
        isPaused = false;
        window.midiIsPaused = false;
        midiAnchorCtx = ctx.currentTime;
        midiAnchorSong = 0;
        midiResetNext(0);
        window.midiIsPlaying = true;
        const statusDisplay = document.getElementById('statusDisplay');
        if (statusDisplay) statusDisplay.textContent = '▶ Playing ...';
        if (midiTimer) clearInterval(midiTimer);
        midiTimer = setInterval(midiLoop, 20);
    }

    function midiPause() {
        if (!isPlaying) return;
        isPlaying = false;
        isPaused = true;
        window.midiIsPaused = true;
        midiAnchorSong = midiCurTime();
        window.midiIsPlaying = false;
        if (midiTimer) { clearInterval(midiTimer);
            midiTimer = null; }
        const statusDisplay = document.getElementById('statusDisplay');
        if (statusDisplay) statusDisplay.textContent = '⏸ Paused';
    }

    function midiStop() {
        isPlaying = false;
        isPaused = false;
        window.midiIsPaused = false;
        midiAnchorSong = 0;
        currentPercent = 0;
        if (midiTimer) { clearInterval(midiTimer);
            midiTimer = null; }
        
        // ★★★ 停止时清理所有高亮 ★★★
        clearAllHighlights();
        
        const statusDisplay = document.getElementById('statusDisplay');
        if (statusDisplay) statusDisplay.textContent = '⏹ Stopped';
        window.midiIsPlaying = false;
    }

    // ---------- 加载MIDI文件 ----------
    function loadMidiFile(f) {
        const reader = new FileReader();
        reader.onload = function() {
            const song = parseMidi(reader.result);
            if (!song) {
                const statusDisplay = document.getElementById('statusDisplay');
                if (statusDisplay) statusDisplay.textContent = '❌ Invalid MIDI file';
                return;
            }
            midiStop();
            midiSong = song;
            tracks = song.tracks;

            const trackCount = Math.min(song.tracks.length, PIANO_COUNT);
            midiNext = [];
            midiActive = [];
            midiLevelArr = [];
            for (let i = 0; i < trackCount; i++) {
                midiNext.push(0);
                midiActive.push([]);
                midiLevelArr.push(new Float32Array(96));
            }

            window.midiIsLoaded = true;
            window.midiIsPaused = false;
            const statusDisplay = document.getElementById('statusDisplay');
            if (statusDisplay) statusDisplay.textContent = `📂 Loaded ${trackCount} tracks · ${song.dur.toFixed(1)}s`;
            midiPlay();
        };
        reader.readAsArrayBuffer(f);
    }

    // ---------- 构建钢琴 ----------
    if (container) {
        for (let p = 0; p < PIANO_COUNT; p++) {
            const row = document.createElement('div');
            row.className = 'piano-row';
            const label = document.createElement('div');
            label.className = 'piano-label';
            label.textContent = romanNumerals[p];
            row.appendChild(label);
            const wrapper = document.createElement('div');
            wrapper.className = 'keys-wrapper';

            const keyEls = [];
            keyData.forEach((k) => {
                const keyEl = document.createElement('div');
                keyEl.className = k.isBlack ? 'black-key' : 'white-key';
                const midi = k.midiNote;
                keyEl.dataset.midi = midi;
                keyEl.dataset.piano = p;

                keyEl.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    playNote(midi, p);
                });
                keyEl.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    playNote(midi, p);
                });
                wrapper.appendChild(keyEl);
                keyEls.push(keyEl);
            });

            row.appendChild(wrapper);
            container.appendChild(row);
            pianoKeys.push(keyEls);
        }
    }

    // ---------- UI 绑定 ----------
    const statusDisplay = document.getElementById('statusDisplay');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const midiFileInput = document.getElementById('midiFile');

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (!midiSong) {
                if (statusDisplay) statusDisplay.textContent = '⚠️ Please load a MIDI file first';
                return;
            }
            getAudioContext();
            midiPlay();
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (isPlaying) {
                midiPause();
            } else if (isPaused) {
                midiPlay();
            }
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            midiStop();
            document.querySelectorAll('.active, .midi-active').forEach(el => {
                el.classList.remove('active', 'midi-active');
            });
        });
    }

    if (midiFileInput) {
        midiFileInput.addEventListener('change', function(e) {
            const file = this.files[0];
            if (!file) return;
            getAudioContext();
            loadMidiFile(file);
            this.value = '';
        });
    }

    document.addEventListener('click', () => {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    });

    // ============================================================
    // ----- 暴露全局接口 -----
    // ============================================================
    window.midiIsLoaded = false;
    window.midiIsPlaying = false;

    window.loadMidiFromBuffer = function(arrayBuffer) {
        const song = parseMidi(arrayBuffer);
        if (!song) {
            window.midiIsLoaded = false;
            const statusDisplay = document.getElementById('statusDisplay');
            if (statusDisplay) statusDisplay.textContent = '❌ Invalid MIDI data';
            return;
        }
        
        midiStop();
        
        midiSong = song;
        tracks = song.tracks;
        
        const trackCount = Math.min(song.tracks.length, PIANO_COUNT);
        midiNext = [];
        midiActive = [];
        midiLevelArr = [];
        for (let i = 0; i < trackCount; i++) {
            midiNext.push(0);
            midiActive.push([]);
            midiLevelArr.push(new Float32Array(96));
        }
        
        window.midiIsLoaded = true;
        window.midiIsPlaying = false;
        window.midiIsPaused = false;
        currentPercent = 0;
        
        const audioPlayer = document.querySelector('.musicListFrame #audioPlayer');
        if (audioPlayer && !audioPlayer.paused) {
            midiPlay();
            window.midiIsPlaying = true;
        }
        
        const statusDisplay = document.getElementById('statusDisplay');
        if (statusDisplay) statusDisplay.textContent = `🎹 MIDI loaded ${trackCount} tracks · ${song.dur.toFixed(1)}s`;
    };

    window.midiPlay = midiPlay;
    window.midiPause = midiPause;
    window.midiStop = midiStop;

    window.midiSeek = function(percent) {
        if (!midiSong) return;
        
        percent = Math.max(0, Math.min(1, percent));
        currentPercent = percent;
        
        const targetTime = percent * midiSong.dur;
        midiAnchorSong = targetTime;
        if (audioCtx) {
            midiAnchorCtx = audioCtx.currentTime;
        }
        
        // ★★★ 跳转时清理所有高亮 ★★★
        clearAllHighlights();
        
        midiResetNext(targetTime);
        document.querySelectorAll('.midi-active').forEach(el => el.classList.remove('midi-active'));
        
        if (isPlaying) {
            if (midiTimer) {
                clearInterval(midiTimer);
                midiTimer = null;
            }
            midiTimer = setInterval(midiLoop, 20);
        }
        
        const statusDisplay = document.getElementById('statusDisplay');
        if (statusDisplay) {
            const currentTime = formatTime(targetTime);
            const totalTime = formatTime(midiSong.dur);
            statusDisplay.textContent = `⏩ Jump to ${currentTime} / ${totalTime}`;
        }
    };

    window.midiGetProgress = function() {
        return currentPercent;
    };

    // ★★★ 暴露清理函数 ★★★
    window.clearAllHighlights = clearAllHighlights;

    function formatTime(seconds) {
        if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    window.isMidiLoaded = function() {
        return window.midiIsLoaded;
    };
})();