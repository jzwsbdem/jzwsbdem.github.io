(function() {
  // ============================================================
  // 数据
  // ============================================================
  let playlists = {};
  let albumTitleMap = {};
  let albumAuthorMap = {};
  let albumStoryMap = {};
  let currentPlaylistId = 0;
  let currentIndex = -1;
  let currentPlaylist = [];
  let isDragging = false;
  let albumStoriesCache = {};
  let isFirstLoad = true;

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
  const storyText = document.querySelector('#storyText');

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
  // 强制重置 MIDI
  // ============================================================
  function forceResetMidi() {
    if (window.midiStop) {
      window.midiStop();
    }
    
    window.midiSong = null;
    window.midiIsLoaded = false;
    window.midiIsPlaying = false;
    window.midiIsPaused = false;
    
    if (document.querySelectorAll) {
      document.querySelectorAll('.midi-active').forEach(el => {
        el.classList.remove('midi-active');
      });
      document.querySelectorAll('.active').forEach(el => {
        el.classList.remove('active');
      });
    }
    
    if (window.midiTimer) {
      clearInterval(window.midiTimer);
      window.midiTimer = null;
    }
    
    if (window.midiAnchorCtx !== undefined) {
      window.midiAnchorCtx = 0;
    }
    if (window.midiAnchorSong !== undefined) {
      window.midiAnchorSong = 0;
    }
    if (window.currentPercent !== undefined) {
      window.currentPercent = 0;
    }
    if (window.midiNext !== undefined) {
      window.midiNext = [];
    }
    
    const statusDisplay = document.getElementById('statusDisplay');
    if (statusDisplay) {
      statusDisplay.textContent = '⏹ MIDI Stopped';
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

      albumAuthorMap = {};
      albumStoryMap = {};
      for (const [id, info] of Object.entries(albumTitleMap)) {
        if (info && info.author) {
          albumAuthorMap[id] = info.author;
        } else {
          albumAuthorMap[id] = 'Unknown Author';
        }
        
        if (info && info.storyFile) {
          albumStoryMap[id] = info.storyFile;
        } else {
          albumStoryMap[id] = `Story/${id}.txt`;
        }
      }

      if (Object.keys(playlists).length === 0) {
        return;
      }

      init();
    } catch (error) {
      // 静默处理
    }
  }

  // ============================================================
  // 故事加载
  // ============================================================
  async function loadAlbumStories(albumId) {
    if (!storyText) return null;
    
    if (albumStoriesCache[albumId] !== undefined) {
      return albumStoriesCache[albumId];
    }

    const storyFilePath = albumStoryMap[String(albumId)];
    if (!storyFilePath || storyFilePath === '/') {
      albumStoriesCache[albumId] = null;
      return null;
    }

    try {
      const response = await fetch(`../datas/${storyFilePath}`);
      if (!response.ok) {
        albumStoriesCache[albumId] = null;
        return null;
      }
      const text = await response.text();
      
      const stories = {};
      const regex = /---\s*(\d+)\s*---\s*([\s\S]*?)(?=---\s*\d+\s*---|$)/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const index = parseInt(match[1]);
        const content = match[2] ? match[2].trim() : '';
        stories[index] = content || '（**暫無故事內容**）';
      }
      
      albumStoriesCache[albumId] = stories;
      return stories;
    } catch (error) {
      albumStoriesCache[albumId] = null;
      return null;
    }
  }

  function getStoryText(albumId, trackIndex) {
    const stories = albumStoriesCache[albumId];
    if (!stories) return '（**暫時沒有故事哦**）';
    return stories[trackIndex] || '（**暫時沒有故事哦**）';
  }

  async function displayStoryForTrack(albumId, trackIndex) {
    if (!storyText) return;
    
    storyText.textContent = '（**故事快來了哦**）';
    
    await loadAlbumStories(albumId);
    
    const storyContent = getStoryText(albumId, trackIndex);
    storyText.textContent = storyContent;
    
    updateStoryPopupContent();
  }

  // ============================================================
  // MIDI 加载（修改：保护专辑弹窗和曲目高亮）
  // ============================================================
  function loadMidi(midiPath) {
    // ★ 保护专辑弹窗
    const albumPopup = document.getElementById('albums');
    let wasAlbumOpen = false;
    if (albumPopup && albumPopup.classList.contains('active')) {
      wasAlbumOpen = true;
      albumPopup.classList.remove('active');
    }

    // ★ 保存当前选中的曲目索引
    const currentTrackIndex = currentIndex;

    forceResetMidi();

    if (wasAlbumOpen && albumPopup) {
      albumPopup.classList.add('active');
    }

    // ★ 恢复曲目列表高亮
    if (currentTrackIndex >= 0) {
      updateActiveButton(currentTrackIndex);
    }

    if (!midiPath || midiPath === '/') {
      return;
    }

    fetch(midiPath)
      .then(response => {
        if (!response.ok) {
          return null;
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        if (buffer && window.loadMidiFromBuffer) {
          window.loadMidiFromBuffer(buffer);
        }
      })
      .catch(() => {});
  }

  // ============================================================
  // 更新故事弹窗内容
  // ============================================================
  function updateStoryPopupContent() {
    var popupText = document.getElementById('storyPopupText');
    var popupIndex = document.getElementById('storyPopupTrackIndex');
    var popupName = document.getElementById('storyPopupTrackName');

    if (!popupText || !popupIndex || !popupName) return;

    if (currentIndex < 0 || currentIndex >= currentPlaylist.length) {
      popupText.textContent = '（**當前沒有播放歌曲**）';
      popupIndex.textContent = 'No.--';
      popupName.textContent = '--';
      return;
    }

    var track = currentPlaylist[currentIndex];
    var stories = albumStoriesCache[currentPlaylistId];

    popupIndex.textContent = 'No.' + (currentIndex + 1);
    popupName.textContent = track.name || '未命名曲目';
    
    if (stories && stories[currentIndex] !== undefined && stories[currentIndex] !== '') {
      popupText.textContent = stories[currentIndex];
    } else {
      popupText.textContent = '（**暫時沒有故事哦**）';
    }
  }

  // ============================================================
  // 曲目列表渲染（添加 stopPropagation）
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

  // ============================================================
  // 更新右侧标题
  // ============================================================
  function updateRightTitle(index) {
    const indexElement = document.querySelector('.rightFrame #rightTitleIndex');
    const nameElement = document.querySelector('.rightFrame #rightTitleName');
    
    if (!indexElement || !nameElement) return;

    if (index < 0 || index >= currentPlaylist.length) {
      indexElement.textContent = '';
      nameElement.textContent = '';
      return;
    }

    const track = currentPlaylist[index];
    indexElement.textContent = `No.${index + 1}`;
    nameElement.textContent = track.name;
  }

  // ============================================================
  // 专辑信息更新
  // ============================================================
  function updateAlbumTitle(playlistId) {
    const albButton = document.querySelector('#albButton');
    const authorElement = document.querySelector('#albumAuthor');

    if (albButton) {
      const info = albumTitleMap[String(playlistId)];
      let title = 'Album';
      if (typeof info === 'string') {
        title = info;
      } else if (info && info.title) {
        title = info.title;
      }
      albButton.textContent = title;
    }

    if (authorElement) {
      const author = albumAuthorMap[String(playlistId)] || 'Unknown Author';
      authorElement.textContent = `Author: ${author}`;
    }
  }

  function updateAlbumButtonActive(activeId) {
    albumButtons.forEach((btn) => {
      const playlistId = parseInt(btn.dataset.playlist);
      btn.classList.toggle('active', playlistId === activeId);
    });
  }

  // ============================================================
  // 播放控制（修改：保护逻辑放在正确位置）
  // ============================================================
  function playTrackByIndex(index) {
    if (index < 0 || index >= currentPlaylist.length) return;

    const track = currentPlaylist[index];
    const url = buildMusicUrl(track.id);

    const isSameTrack = (currentIndex === index && audio.src === url);
    const isLoaded = (audio.src !== '' && audio.readyState > 0);
    
    // ★ 如果是同一首歌，直接切换播放/暂停，不执行后续逻辑
    if (isSameTrack && isLoaded && !isFirstLoad) {
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      return;
    }

    isFirstLoad = false;

    // ★ 只有在真正切换歌曲时才保护弹窗
    const albumPopup = document.getElementById('albums');
    let wasAlbumOpen = false;
    if (albumPopup && albumPopup.classList.contains('active')) {
      wasAlbumOpen = true;
      albumPopup.classList.remove('active');
    }

    forceResetMidi();

    if (wasAlbumOpen && albumPopup) {
      albumPopup.classList.add('active');
    }

    errorDisplay.style.display = 'none';
    audio.src = url;
    audio.load();

    currentIndex = index;
    updateActiveButton(index);
    updateRightTitle(index);
    
    displayStoryForTrack(currentPlaylistId, index);

    if (track.midi && track.midi !== '/') {
      loadMidi(track.midi);
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        progressFill.style.width = '0%';
        errorDisplay.style.display = 'none';
      }).catch(() => {
        errorDisplay.style.display = 'block';
        errorDisplay.textContent = '❌ Playback failed, check network';
      });
    }
  }

  // ============================================================
  // 专辑切换（修改：保护弹窗）
  // ============================================================
  function switchPlaylist(playlistId) {
    if (!playlists[playlistId]) {
      return;
    }

    // ★ 保护专辑弹窗
    const albumPopup = document.getElementById('albums');
    let wasAlbumOpen = false;
    if (albumPopup && albumPopup.classList.contains('active')) {
      wasAlbumOpen = true;
      albumPopup.classList.remove('active');
    }

    forceResetMidi();

    if (wasAlbumOpen && albumPopup) {
      albumPopup.classList.add('active');
    }

    currentPlaylistId = playlistId;
    currentPlaylist = playlists[playlistId];
    currentIndex = -1;

    audio.pause();
    audio.currentTime = 0;
    audio.src = '';
    
    isFirstLoad = true;
    
    if (storyText) {
      storyText.textContent = '（加载故事...）';
    }

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

      displayStoryForTrack(playlistId, 0);

      if (firstTrack.midi && firstTrack.midi !== '/') {
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
    if (window.midiIsLoaded && !window.midiIsPlaying && window.midiPlay) {
      window.midiPlay();
    }
  });

  audio.addEventListener('pause', function() {
    playBtn.textContent = '▶';
    if (window.midiPause) {
      window.midiPause();
    }
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
      if (window.midiSeek && window.midiIsLoaded) {
        window.midiSeek(percent);
      }
    }
  });

  progressBar.addEventListener('mousedown', function(e) {
    isDragging = true;
    const rect = this.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audio.duration && isFinite(audio.duration)) {
      audio.currentTime = percent * audio.duration;
      progressFill.style.width = percent * 100 + '%';
      if (window.midiSeek && window.midiIsLoaded) {
        window.midiSeek(percent);
      }
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (isDragging) {
      const rect = progressBar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (audio.duration && isFinite(audio.duration)) {
        audio.currentTime = percent * audio.duration;
        progressFill.style.width = percent * 100 + '%';
        if (window.midiSeek && window.midiIsLoaded) {
          window.midiSeek(percent);
        }
      }
    }
  });

  document.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      if (!audio.paused && window.midiIsLoaded) {
        if (window.midiPlay && !window.midiIsPlaying) {
          window.midiPlay();
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
  // 专辑按钮事件（添加 stopPropagation）
  // ============================================================
  albumButtons.forEach((btn) => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
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
    forceResetMidi();
    
    const firstPlaylistId = Object.keys(playlists)[0];
    if (firstPlaylistId) {
      switchPlaylist(parseInt(firstPlaylistId));
    }

    volumeFill.style.width = (audio.volume * 100) + '%';
    updateVolumeIcon(audio.volume);
  }

  // ============================================================
  // ★★★ 暴露到全局 ★★★
  // ============================================================
  window.updateStoryPopupContent = updateStoryPopupContent;

  // ============================================================
  // 启动
  // ============================================================
  loadData();
})();