(function() {
  'use strict';

  // ============================================
  // 独立音乐播放器
  // ============================================

  let playlist = [];
  const audio = new Audio();
  audio.style.display = 'none';
  document.body.appendChild(audio);

  const playButton = document.querySelector('.playButton');
  const playText = document.querySelector('.playText');
  let currentIndex = 0;

  // ============================================
  // 加载JSON
  // ============================================

  function loadPlaylist() {
    return fetch('../datas/MusicOSData.json')
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(data => {
        playlist = data.playlist || [];
        return playlist;
      })
      .catch(() => {
        playlist = [];
        return playlist;
      });
  }

  // ============================================
  // 滚动控制
  // ============================================

  function startScroll() {
    if (!playText) return;
    if (audio.paused) return;

    playText.style.animation = 'scrollRight2 8s linear infinite';
    playText.style.transform = 'translateX(0)';
  }

  function stopScroll() {
    if (!playText) return;
    playText.style.animation = 'none';
    playText.style.transform = 'translateX(0)';
  }

  // ============================================
  // 更新界面
  // ============================================

  function updateUI() {
    if (playText) {
      if (audio.paused) {
        playText.textContent = '已暫停...';
        stopScroll();
      } else {
        const text = '正在播放：' + (playlist[currentIndex]?.name + ' — 點我切換音樂');
        playText.textContent = text;
        setTimeout(function() {
          stopScroll();
          startScroll();
        }, 50);
      }
    }

    if (playButton) {
      if (audio.paused) {
        playButton.textContent = '▶ 播放音樂';
      } else {
        playButton.textContent = '⏸ 暫停音樂';
      }
    }
  }

  // ============================================
  // 播放控制
  // ============================================

  function play(index) {
    if (!playlist.length) return;
    if (index >= playlist.length) index = 0;
    if (index < 0) index = playlist.length - 1;
    
    currentIndex = index;
    const track = playlist[currentIndex];
    
    audio.src = track.url;
    audio.load();
    audio.play()
      .then(() => updateUI())
      .catch(() => updateUI());
  }

  function toggle() {
    if (!playlist.length) return;

    if (audio.paused) {
      if (audio.src) {
        audio.play().then(() => updateUI());
      } else {
        play(0);
      }
    } else {
      audio.pause();
      updateUI();
    }
  }

  function next() {
    if (!playlist.length) return;
    stopScroll();
    play((currentIndex + 1) % playlist.length);
  }

  function prev() {
    if (!playlist.length) return;
    stopScroll();
    play((currentIndex - 1 + playlist.length) % playlist.length);
  }

  // ============================================
  // 音频事件
  // ============================================

  audio.addEventListener('play', updateUI);
  audio.addEventListener('pause', updateUI);
  audio.addEventListener('ended', function() {
    stopScroll();
    next();
  });
  audio.addEventListener('error', updateUI);

  // ============================================
  // 绑定按钮
  // ============================================

  if (playButton) {
    playButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    });
  }

  // ============================================
  // 键盘控制
  // ============================================

  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.code === 'Space') {
      e.preventDefault();
      toggle();
    }
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      next();
    }
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  });

  // ============================================
  // data-playlist 切换功能
  // ============================================

  function handlePlaylistClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const index = parseInt(this.getAttribute('data-playlist'), 10);
    
    if (isNaN(index) || index < 0 || index >= playlist.length) return;
    
    play(index);
  }

  function bindDataPlaylist() {
    const items = document.querySelectorAll('[data-playlist]');
    items.forEach(function(item) {
      item.removeEventListener('click', handlePlaylistClick);
      item.addEventListener('click', handlePlaylistClick);
    });
  }

  function observeDataPlaylist() {
    const observer = new MutationObserver(function() {
      bindDataPlaylist();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    return observer;
  }

  // ============================================
  // 暴露接口
  // ============================================

  window.musicPlayer = {
    toggle: toggle,
    next: next,
    prev: prev,
    play: play,
    getState: () => ({
      current: playlist[currentIndex] || null,
      isPlaying: !audio.paused,
      index: currentIndex
    }),
    getPlaylist: () => playlist,
    bindDataPlaylist: bindDataPlaylist
  };

  // ============================================
  // 启动 - 进入页面自动播放
  // ============================================

  loadPlaylist().then(() => {
    if (playlist.length) {
      audio.src = playlist[0].url;
      audio.load();
      currentIndex = 0;
      // 自动播放第一首歌
      audio.play().then(() => {
        updateUI();
      }).catch(() => {
        updateUI();
      });
    } else {
      updateUI();
    }
    
    bindDataPlaylist();
    observeDataPlaylist();
  });

})();