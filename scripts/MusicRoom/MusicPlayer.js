(function() {
  // ============================================================
  // 数据
  // ============================================================
  let playlists = {};
  let albumTitleMap = {};
  let currentPlaylistId = 0;
  let currentIndex = -1;
  let currentPlaylist = [];
  let isDragging = false;

  // ============================================================
  // DOM 元素
  // ============================================================
  const container = document.querySelector('.musicListFrame #trackListContainer');
  const audio = document.querySelector('.musicListFrame #audioPlayer');
  const errorDisplay = document.querySelector('.musicListFrame #errorDisplay');
  const playBtn = document.querySelector('.musicListFrame #playBtn');
  const progressBar = document.querySelector('.musicListFrame #progressBar');
  const progressFill = document.querySelector('.musicListFrame #progressFill');
  const timeDisplay = document.querySelector('.musicListFrame #timeDisplay');
  const volumeBar = document.querySelector('.musicListFrame #volumeBar');
  const volumeFill = document.querySelector('.musicListFrame #volumeFill');
  const volumeIcon = document.querySelector('.musicListFrame #volumeIcon');
  const prevAlbumBtn = document.querySelector('#prevAlbumBtn');
  const nextAlbumBtn = document.querySelector('#nextAlbumBtn');
  const albumButtons = document.querySelectorAll('.innerButton');

  if (!container || !audio || !errorDisplay) {
    return;
  }

  // ============================================================
  // 工具函数
  // ============================================================
  function buildMusicUrl(id) {
    return `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function updateTimeDisplay() {
    const current = formatTime(audio.currentTime);
    const total = formatTime(audio.duration);
    timeDisplay.textContent = `${current} / ${total}`;
  }

  function updateVolumeIcon(volume) {
    if (volume === 0 || audio.muted) {
      volumeIcon.textContent = '🔇';
    } else if (volume < 0.5) {
      volumeIcon.textContent = '🔉';
    } else {
      volumeIcon.textContent = '🔊';
    }
  }

  // ============================================================
  // 数据加载
  // ============================================================
  async function loadData() {
    try {
      const response = await fetch('../datas/MusicRoomData.json');
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      playlists = data.playlists || {};
      albumTitleMap = data.albumTitleMap || {};
      
      if (Object.keys(playlists).length === 0) {
        return;
      }
      
      init();
    } catch (error) {
      // 静默处理
    }
  }

  // ============================================================
  // MIDI 控制 - 修复暂停恢复问题
  // ============================================================
  function loadMidi(midiPath) {
    if (!midiPath) {
      if (window.midiStop) {
        window.midiStop();
      }
      return;
    }

    fetch(midiPath)
      .then(response => {
        if (!response.ok) {
          if (window.midiStop) {
            window.midiStop();
          }
          return null;
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        if (buffer && window.loadMidiFromBuffer) {
          window.loadMidiFromBuffer(buffer);
        }
      })
      .catch(() => {
        if (window.midiStop) {
          window.midiStop();
        }
      });
  }

  function playMidi() {
    if (!window.midiIsLoaded) return;
    
    if (window.midiIsPaused) {
      if (window.midiPlay) {
        window.midiPlay();
      }
      return;
    }
    
    if (audio.duration > 0 && audio.currentTime >= 0) {
      const percent = Math.min(1, Math.max(0, audio.currentTime / audio.duration));
      if (window.midiSeek) {
        window.midiSeek(percent);
      }
    }
    
    if (window.midiPlay && !window.midiIsPlaying) {
      window.midiPlay();
    }
  }

  function pauseMidi() {
    if (window.midiPause) {
      window.midiPause();
    }
  }

  function stopMidi() {
    if (window.midiStop) {
      window.midiStop();
    }
  }

  function seekMidi(percent) {
    if (window.midiSeek && window.midiIsLoaded) {
      window.midiSeek(percent);
    }
  }

  // ============================================================
  // 曲目列表渲染（已移除钢琴图标）
  // ============================================================
  function renderTracks() {
    container.innerHTML = '';
    
    currentPlaylist.forEach((track, index) => {
      const btn = document.createElement('button');
      btn.className = 'track-item';
      if (index === currentIndex) {
        btn.classList.add('active');
      }

      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'No. ' + (index + 1);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = track.name;

      btn.appendChild(badge);
      btn.appendChild(nameSpan);

      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        playTrackByIndex(index);
      });

      container.appendChild(btn);
    });
  }

  function updateActiveButton(activeIndex) {
    const items = container.querySelectorAll('.track-item');
    items.forEach((item, idx) => {
      item.classList.toggle('active', idx === activeIndex);
    });
  }

  function updateRightTitle(index) {
    const rightTitle = document.querySelector('.rightFrame #rightTitle');
    if (!rightTitle) return;
    
    if (index < 0 || index >= currentPlaylist.length) {
      rightTitle.textContent = '';
      return;
    }
    
    const track = currentPlaylist[index];
    rightTitle.textContent = `No.${index + 1} ${track.name}`;
  }

  function updateAlbumTitle(playlistId) {
    const albButton = document.querySelector('#albButton');
    if (albButton) {
      const title = albumTitleMap[String(playlistId)] || 'External Album Select';
      albButton.textContent = title;
    }
  }

  function updateAlbumButtonActive(activeId) {
    albumButtons.forEach((btn) => {
      const playlistId = parseInt(btn.dataset.playlist);
      btn.classList.toggle('active', playlistId === activeId);
    });
  }

  // ============================================================
  // 播放控制
  // ============================================================
  function playTrackByIndex(index) {
    if (index < 0 || index >= currentPlaylist.length) return;

    const track = currentPlaylist[index];
    const url = buildMusicUrl(track.id);
    
    if (currentIndex === index && audio.src === url) {
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      return;
    }

    errorDisplay.style.display = 'none';
    audio.src = url;
    audio.load();
    
    if (track.midi) {
      loadMidi(track.midi);
    } else {
      stopMidi();
    }
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        currentIndex = index;
        updateActiveButton(index);
        updateRightTitle(index);
        progressFill.style.width = '0%';
        errorDisplay.style.display = 'none';
      }).catch(() => {
        errorDisplay.style.display = 'block';
        errorDisplay.textContent = '❌ Playback failed, check network';
        currentIndex = index;
        updateActiveButton(index);
        updateRightTitle(index);
      });
    }
  }

  // ============================================================
  // 专辑切换
  // ============================================================
  function switchPlaylist(playlistId) {
    if (!playlists[playlistId]) {
      return;
    }

    currentPlaylistId = playlistId;
    currentPlaylist = playlists[playlistId];
    currentIndex = -1;
    
    audio.pause();
    audio.currentTime = 0;
    audio.src = '';
    stopMidi();
    
    errorDisplay.style.display = 'none';
    playBtn.textContent = '▶';
    progressFill.style.width = '0%';
    timeDisplay.textContent = '0:00 / 0:00';
    
    renderTracks();
    
    if (currentPlaylist.length > 0) {
      const firstTrack = currentPlaylist[0];
      audio.src = buildMusicUrl(firstTrack.id);
      audio.load();
      currentIndex = 0;
      updateActiveButton(0);
      updateRightTitle(0);
      
      if (firstTrack.midi) {
        loadMidi(firstTrack.midi);
      }
    }
    
    updateAlbumButtonActive(playlistId);
    updateAlbumTitle(playlistId);
  }

  function getOrderedAlbumIds() {
    return Object.keys(albumTitleMap)
      .map(Number)
      .sort((a, b) => a - b);
  }

  function switchToPrevAlbum() {
    const albumIds = getOrderedAlbumIds();
    if (albumIds.length === 0) return;
    
    let currentIdx = albumIds.indexOf(currentPlaylistId);
    if (currentIdx === -1) currentIdx = 0;
    else currentIdx = (currentIdx - 1 + albumIds.length) % albumIds.length;
    
    switchPlaylist(albumIds[currentIdx]);
  }

  function switchToNextAlbum() {
    const albumIds = getOrderedAlbumIds();
    if (albumIds.length === 0) return;
    
    let currentIdx = albumIds.indexOf(currentPlaylistId);
    if (currentIdx === -1) currentIdx = 0;
    else currentIdx = (currentIdx + 1) % albumIds.length;
    
    switchPlaylist(albumIds[currentIdx]);
  }

  // ============================================================
  // 音频事件监听
  // ============================================================
  audio.addEventListener('timeupdate', function() {
    if (!isDragging) {
      const percent = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = (isNaN(percent) ? 0 : percent) + '%';
    }
    updateTimeDisplay();
  });

  audio.addEventListener('loadedmetadata', function() {
    updateTimeDisplay();
    volumeFill.style.width = (audio.volume * 100) + '%';
  });

  audio.addEventListener('play', function() {
    playBtn.textContent = '⏸';
    playMidi();
  });

  audio.addEventListener('pause', function() {
    playBtn.textContent = '▶';
    pauseMidi();
  });

  audio.addEventListener('ended', function() {
    playBtn.textContent = '▶';
    if (currentPlaylist.length === 0) return;
    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    playTrackByIndex(nextIndex);
  });

  audio.addEventListener('error', function() {
    if (currentIndex >= 0 && currentIndex < currentPlaylist.length) {
      errorDisplay.style.display = 'block';
      errorDisplay.textContent = '❌ Audio load failed';
    }
  });

  // ============================================================
  // 控件事件绑定
  // ============================================================
  playBtn.addEventListener('click', function() {
    if (audio.paused) {
      audio.play().catch(() => {
        errorDisplay.style.display = 'block';
        errorDisplay.textContent = '❌ Playback failed, check network';
      });
    } else {
      audio.pause();
    }
  });

  progressBar.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audio.duration && isFinite(audio.duration)) {
      audio.currentTime = percent * audio.duration;
      seekMidi(percent);
    }
  });

  progressBar.addEventListener('mousedown', function(e) {
    isDragging = true;
    const rect = this.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audio.duration && isFinite(audio.duration)) {
      audio.currentTime = percent * audio.duration;
      progressFill.style.width = percent * 100 + '%';
      seekMidi(percent);
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (isDragging) {
      const rect = progressBar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (audio.duration && isFinite(audio.duration)) {
        audio.currentTime = percent * audio.duration;
        progressFill.style.width = percent * 100 + '%';
        seekMidi(percent);
      }
    }
  });

  document.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      if (!audio.paused && window.midiIsLoaded) {
        if (window.midiPlay && !window.midiIsPlaying) {
          playMidi();
        }
      }
    }
  });

  volumeBar.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.volume = percent;
    audio.muted = false;
    volumeFill.style.width = percent * 100 + '%';
    updateVolumeIcon(percent);
  });

  volumeIcon.addEventListener('click', function() {
    audio.muted = !audio.muted;
    if (audio.muted) {
      volumeFill.style.width = '0%';
      volumeIcon.textContent = '🔇';
    } else {
      volumeFill.style.width = (audio.volume * 100) + '%';
      updateVolumeIcon(audio.volume);
    }
  });

  // ============================================================
  // 专辑按钮事件
  // ============================================================
  albumButtons.forEach((btn) => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const playlistId = parseInt(this.dataset.playlist);
      if (!isNaN(playlistId)) {
        switchPlaylist(playlistId);
      }
    });
  });

  if (prevAlbumBtn) {
    prevAlbumBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      switchToPrevAlbum();
    });
  }

  if (nextAlbumBtn) {
    nextAlbumBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      switchToNextAlbum();
    });
  }

  // ============================================================
  // 键盘快捷键
  // ============================================================
  document.addEventListener('keydown', function(e) {
    if (e.target.matches('input, textarea, button, select')) return;
    
    switch(e.key) {
      case 'ArrowLeft':
        switchToPrevAlbum();
        e.preventDefault();
        break;
      case 'ArrowRight':
        switchToNextAlbum();
        e.preventDefault();
        break;
      case ' ':
        e.preventDefault();
        if (audio.paused) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
        break;
    }
  });

  // ============================================================
  // 初始化
  // ============================================================
  function init() {
    const firstPlaylistId = Object.keys(playlists)[0];
    if (firstPlaylistId) {
      switchPlaylist(parseInt(firstPlaylistId));
    }
    
    volumeFill.style.width = (audio.volume * 100) + '%';
    updateVolumeIcon(audio.volume);
  }

  // ============================================================
  // 启动
  // ============================================================
  loadData();
})();