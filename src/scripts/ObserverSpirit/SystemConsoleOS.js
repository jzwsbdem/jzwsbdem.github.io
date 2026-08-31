(function() {
    "use strict";

    // ---------- DOM 元素 ----------
    const output = document.getElementById('logOutput');
    if (!output) {
        console.warn('日志容器 #logOutput 未找到');
        return;
    }

    // ---------- 配置 ----------
    const PRINT_INTERVAL = 1000;     // 毫秒
    const MAX_LOGS = 20;            // 保留条数（备用上限）

    // ---------- 日志数据池 ----------
    const logPool = [
        { msg: 'User session established', level: 'info' },
        { msg: 'Cache hit rate 87%', level: 'debug' },
        { msg: 'API response 200 OK', level: 'success' },
        { msg: 'Memory usage 1.2GB / 4GB', level: 'info' },
        { msg: 'New device connected: 192.168.1.24', level: 'info' },
        { msg: 'SSL certificate expires in 23 days', level: 'warn' },
        { msg: 'Database query took 42ms', level: 'debug' },
        { msg: 'WebSocket connection stable', level: 'success' },
        { msg: 'File upload complete: screenshot.png', level: 'success' },
        { msg: 'GC reclaimed 230MB', level: 'info' },
        { msg: 'Request rate limit exceeded (429)', level: 'error' },
        { msg: 'Task queue backlog: 3 items', level: 'warn' },
        { msg: 'DNS resolution 8.8.8.8 successful', level: 'debug' },
        { msg: 'User logged out (session: a7f3)', level: 'info' },
        { msg: 'Configuration reload complete', level: 'success' },
        { msg: 'Disk I/O wait 12ms', level: 'debug' },
        { msg: 'Authentication token about to expire', level: 'warn' },
        { msg: 'Exception caught: TypeError', level: 'error' },
        { msg: 'Service health check passed', level: 'success' },
        { msg: 'Received 1.2KB data packet', level: 'debug' },
    ];
    const levelList = ['info', 'warn', 'error', 'success', 'debug'];

    // ---------- 辅助函数 ----------
    function getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // 生成随机日志对象
    function generateRandomLog() {
        let base;
        if (Math.random() < 0.8) {
            base = getRandomItem(logPool);
        } else {
            const actions = ['Calculate', 'Render', 'Sync', 'Parse', 'Compress', 'Encrypt'];
            const targets = ['Index', 'Cache', 'Queue', 'Session', 'Module', 'DataStream'];
            const randomMsg = `${getRandomItem(actions)} ${getRandomItem(targets)} · ${Math.floor(Math.random() * 100)}%`;
            const randomLevel = getRandomItem(levelList);
            base = { msg: randomMsg, level: randomLevel };
        }

        let finalLevel = base.level;
        if (Math.random() < 0.15) {
            finalLevel = getRandomItem(levelList);
        }

        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        return {
            time: timeStr,
            level: finalLevel,
            message: base.msg,
        };
    }

    // 追加一条日志到 DOM，并确保不超出父容器
    function appendLogLine(logObj) {
        const line = document.createElement('div');
        line.className = `log-line level-${logObj.level}`;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = logObj.time;
        line.appendChild(timeSpan);

        const levelSpan = document.createElement('span');
        levelSpan.className = 'log-level';
        levelSpan.textContent = logObj.level.toUpperCase();
        line.appendChild(levelSpan);

        const msgSpan = document.createElement('span');
        msgSpan.className = 'log-message';
        msgSpan.textContent = logObj.message;
        line.appendChild(msgSpan);

        output.appendChild(line);

        // ----- 核心修改：超出父容器高度时清除最早日志 -----
        trimLogsByHeight();

        // 滚动到底部
        output.scrollTop = output.scrollHeight;
    }

    // 根据父容器高度修剪日志（超出则移除最早条目）
    function trimLogsByHeight() {
        // 获取父容器的高度（实际内容区域）
        const containerHeight = output.clientHeight;
        if (containerHeight === 0) return;

        // 如果内容高度超出容器，移除最早的日志直到不超出
        let attempts = 0;
        const maxAttempts = 200; // 防止死循环
        while (output.scrollHeight > containerHeight && output.children.length > 0 && attempts < maxAttempts) {
            output.removeChild(output.firstChild);
            attempts++;
        }

        // 额外安全措施：如果日志数量超过 MAX_LOGS，强制修剪
        while (output.children.length > MAX_LOGS) {
            output.removeChild(output.firstChild);
        }
    }

    // ---------- 定时打印 ----------
    let timer = null;

    function printLog() {
        const log = generateRandomLog();
        appendLogLine(log);
    }

    function startTimer() {
        if (timer) clearInterval(timer);
        timer = setInterval(printLog, PRINT_INTERVAL);
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    // ---------- 初始化 ----------
    function init() {
        output.innerHTML = '';
        startTimer();
    }

    init();

    // 页面卸载时清理定时器
    window.addEventListener('beforeunload', function() {
        stopTimer();
    });

    // 窗口大小变化时重新修剪（适配容器尺寸变化）
    window.addEventListener('resize', function() {
        trimLogsByHeight();
    });

})();