(function() {
    // 判断横竖屏：宽高比 ≤ 1 为竖屏，> 1 为横屏
    const isPortrait = window.innerWidth / window.innerHeight <= 1;
    
    // 获取现有的 viewport
    const vp = document.querySelector('meta[name=viewport]');
    
    const scale = isPortrait ? 0.4 : 1.0;
    
    // 更新 viewport
    vp.content = `width=device-width, initial-scale=${scale}`;
})();