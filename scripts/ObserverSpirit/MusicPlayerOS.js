(function() {
  // ----- 音乐列表 -----
  let playlist = [];

  // DOM 元素
  const container = document.querySelector('.frameMusic #trackListContainer');
  const audio = document.querySelector('.frameMusic #audioPlayer');
  const nowLabel = document.querySelector('.frameMusic #nowPlayingLabel');
  const errorDisplay = document.querySelector('.frameMusic #errorDisplay');
  const statusEl = document.querySelector('.status-text');
  const remainingDisplay = document.querySelector('.inf2Text3');

  // 自定义控件元素
  const playBtn = document.querySelector('.frameMusic #playBtn');
  const progressBar = document.querySelector('.frameMusic #progressBar');
  const progressFill = document.querySelector('.frameMusic #progressFill');
  const timeDisplay = document.querySelector('.frameMusic #timeDisplay');
  const volumeBar = document.querySelector('.frameMusic #volumeBar');
  const volumeFill = document.querySelector('.frameMusic #volumeFill');
  const volumeIcon = document.querySelector('.frameMusic #volumeIcon');

  if (!container || !audio || !nowLabel || !errorDisplay) {
    return;
  }

  let currentIndex = -1;
  let isDragging = false;

  // ----- 加载 JSON 数据 -----
  function loadPlaylistFromJSON() {
    return fetch('../datas/MusicOSData.json')
      .then(response => {
        if (!response.ok) {
          return;
        }
        return response.json();
      })
      .then(data => {
        if (data && data.playlist && Array.isArray(data.playlist)) {
          playlist = data.playlist;
        }
        return playlist;
      });
  }

  // ----- 音频事件绑定 -----
  audio.addEventListener('timeupdate', function() {
    if (!isDragging) {
      const percent = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = percent + '%';
    }
    updateTimeDisplay();
  });

  audio.addEventListener('loadedmetadata', function() {
    updateTimeDisplay();
    volumeFill.style.width = (audio.volume * 100) + '%';
  });

  audio.addEventListener('play', function() {
    playBtn.textContent = '⏸';
    if (currentIndex >= 0) {
      updateStatusDot(currentIndex, 'playing');
    }
  });

  audio.addEventListener('pause', function() {
    playBtn.textContent = '▶';
  });

  audio.addEventListener('ended', function() {
    playBtn.textContent = '▶';
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    playTrackByIndex(nextIndex);
  });

  audio.addEventListener('error', function(e) {
    if (currentIndex >= 0 && currentIndex < playlist.length) {
      updateStatusDot(currentIndex, 'error');
      errorDisplay.style.display = 'block';
    }
  });

  // ----- 自定义控件事件 -----
  playBtn.addEventListener('click', function() {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  progressBar.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audio.duration) {
      audio.currentTime = percent * audio.duration;
    }
  });

  progressBar.addEventListener('mousedown', function(e) {
    isDragging = true;
    const rect = this.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audio.duration) {
      audio.currentTime = percent * audio.duration;
      progressFill.style.width = percent * 100 + '%';
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (isDragging) {
      const rect = progressBar.getBoundingClientRect();
      let percent = (e.clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      if (audio.duration) {
        audio.currentTime = percent * audio.duration;
        progressFill.style.width = percent * 100 + '%';
      }
    }
  });

  document.addEventListener('mouseup', function() {
    isDragging = false;
  });

  volumeBar.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    audio.volume = percent;
    volumeFill.style.width = percent * 100 + '%';
    updateVolumeIcon(percent);
  });

  volumeIcon.addEventListener('click', function() {
    if (audio.muted) {
      audio.muted = false;
      volumeFill.style.width = (audio.volume * 100) + '%';
      updateVolumeIcon(audio.volume);
    } else {
      audio.muted = true;
      volumeFill.style.width = '0%';
      volumeIcon.textContent = '🔇';
    }
  });

  function updateVolumeIcon(volume) {
    if (volume === 0) {
      volumeIcon.textContent = '🔇';
    } else if (volume < 0.5) {
      volumeIcon.textContent = '🔉';
    } else {
      volumeIcon.textContent = '🔊';
    }
  }

  // ----- 辅助函数 -----
  function updateTimeDisplay() {
    const current = formatTime(audio.currentTime);
    const total = formatTime(audio.duration);
    const remaining = formatRemainingTime(audio.duration - audio.currentTime);
    timeDisplay.textContent = `${current} / ${total}`;
    if (remainingDisplay) {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        remainingDisplay.textContent = remaining;
      } else {
        remainingDisplay.textContent = '00:00';
      }
    }
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatRemainingTime(seconds) {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '00:00';
    seconds = Math.max(0, seconds);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ----- 曲目列表渲染 -----
  function renderTracks() {
    container.innerHTML = '';
    playlist.forEach((track, index) => {
      const btn = document.createElement('button');
      btn.className = 'track-item';
      if (index === currentIndex) {
        btn.classList.add('active');
      }

      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = index + 1;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = track.name;

      const dot = document.createElement('span');
      dot.className = 'status-dot';
      dot.textContent = '●';
      dot.dataset.index = index;

      btn.appendChild(badge);
      btn.appendChild(nameSpan);
      btn.appendChild(dot);

      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        playTrackByIndex(index);
      });

      container.appendChild(btn);
    });
  }

  function updateStatusDot(index, status) {
    const items = container.querySelectorAll('.track-item');
    if (items[index]) {
      const dot = items[index].querySelector('.status-dot');
      if (dot) {
        dot.className = 'status-dot';
        if (status === 'playing') {
          dot.classList.add('playing');
          dot.textContent = '●';
        } else if (status === 'error') {
          dot.classList.add('error');
          dot.textContent = '✕';
        } else {
          dot.textContent = '●';
        }
      }
    }
  }

  function updateActiveButton(activeIndex) {
    const items = container.querySelectorAll('.track-item');
    items.forEach((item, idx) => {
      item.classList.toggle('active', idx === activeIndex);
    });
  }

  // ----- 播放核心逻辑 -----
  function playTrackByIndex(index) {
    if (index < 0 || index >= playlist.length) return;

    const track = playlist[index];
    
    if (currentIndex === index && audio.src === track.url) {
      if (audio.paused) {
        audio.play().catch(() => {});
      }
      return;
    }

    errorDisplay.style.display = 'none';
    audio.src = track.url;
    audio.load();
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        currentIndex = index;
        nowLabel.textContent = `${track.name}`;
        updateActiveButton(index);
        updateStatusDot(index, 'playing');
        playlist.forEach((_, i) => {
          if (i !== index) updateStatusDot(i, 'idle');
        });
        errorDisplay.style.display = 'none';
        progressFill.style.width = '0%';
      }).catch(() => {
        updateStatusDot(index, 'error');
        errorDisplay.style.display = 'block';
        currentIndex = index;
        updateActiveButton(index);
      });
    }
  }

  function updateStatus() {
    if (audio.paused) {
      statusEl.textContent = 'PAUSING';
      statusEl.classList.add('paused');
    } else {
      statusEl.textContent = 'PLAYING';
      statusEl.classList.remove('paused');
    }
  }

  audio.addEventListener('play', updateStatus);
  audio.addEventListener('pause', updateStatus);
  audio.addEventListener('ended', updateStatus);
  audio.addEventListener('playing', updateStatus);

  // ----- 初始化 -----
  function init() {
    loadPlaylistFromJSON().then(() => {
      renderTracks();
      if (playlist.length > 0) {
        const first = playlist[0];
        audio.src = first.url;
        audio.load();
        currentIndex = 0;
        updateActiveButton(0);
        nowLabel.textContent = `${first.name}`;
        updateStatusDot(0, 'idle');
        volumeFill.style.width = (audio.volume * 100) + '%';
        updateVolumeIcon(audio.volume);
      }
      updateStatus();
    });
  }

  init();
})();