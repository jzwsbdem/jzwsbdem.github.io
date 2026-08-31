// #region WebsiteLaunchDate
(function() {
    "use strict";

    // ---------- 配置 ----------
    // 建站起始时间 (年, 月, 日, 时, 分, 秒) 
    // 注意: 月份从 0 开始 (0=一月), 所以 1 月 = 0
    const START_DATE = new Date(2026, 7, 21, 23, 14, 0);

    // DOM 元素
    const fullTimeDisplay = document.getElementById('launchDateText2');

    // ---------- 辅助函数 ----------
    function padZero(num) {
        return String(num).padStart(2, '0');
    }

    // 格式化起始日期（完整中文格式）
    function formatStartDate(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = padZero(date.getHours());
        const minutes = padZero(date.getMinutes());
        const seconds = padZero(date.getSeconds());
        return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
    }

    // 计算两个日期之间的完整时间差
    function getTimeDifference(start, end) {
        const diffMs = end.getTime() - start.getTime();
        
        if (diffMs < 0) {
            return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        // 计算总秒数
        const totalSeconds = Math.floor(diffMs / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        // 简化版本：不计算年和月，直接显示总天数
        return { days, hours, minutes, seconds };
    }

    // 格式化完整时间显示
    function formatFullTime(diff) {
        const parts = [];
        
        if (diff.years > 0) parts.push(`${diff.years}年`);
        if (diff.months > 0) parts.push(`${diff.months}月`);
        if (diff.days > 0) parts.push(`${diff.days}日`);
        if (diff.hours > 0) parts.push(`${diff.hours}時`);
        if (diff.minutes > 0) parts.push(`${diff.minutes}分`);
        if (diff.seconds > 0) parts.push(`${diff.seconds}秒`);
        
        return `已運行: ${parts.join(' ')}`;
    }

    // 核心: 更新时间显示
    function updateTimer() {
        const now = new Date();
        
        // 计算完整时间差
        const diff = getTimeDifference(START_DATE, now);
        
        // 更新完整时间显示
        fullTimeDisplay.textContent = formatFullTime(diff);
    }

    // ---------- 初始化 ----------
    function init() {

        // 立即更新一次
        updateTimer();

        // 每 1000ms 更新一次
        setInterval(updateTimer, 1000);
    }

    // 等 DOM 完全加载后启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
// #endregion

// #region VisitorCount
const SITE_SLUG = 'republic-of-narcissus.icu';

(async function() {
    const el = document.getElementById('visitorCountText');
    const url = `https://i.arimuraromi.com/api/utils/view/${SITE_SLUG}`;

    try {
        // 上报访问 (POST)
        await fetch(url, { method: 'POST' });
        // 获取最新数据 (GET)
        const res = await fetch(url);
        const data = await res.json();
        el.textContent = `總訪問數: ${data.count}` || `總訪問數: 0`;
    } catch(error) {
        el.textContent = 'LOADING';
        console.error('Error fetching visitor count:', error);
    }
})();
// #endregion

// #region CurrentTime
(function() {
  "use strict";

  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const dateEl = document.getElementById('dateDisplay');

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  function padZero(num) {
    return String(num).padStart(2, '0');
  }

  function updateClock() {
    const now = new Date();

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    hoursEl.textContent = padZero(hours);
    minutesEl.textContent = padZero(minutes);
    secondsEl.textContent = padZero(seconds);

    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekday = weekdays[now.getDay()];

    dateEl.textContent = `${year}年${padZero(month)}月${padZero(day)}日 星期${weekday}`;
  }

  updateClock();
  setInterval(updateClock, 1000);

  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      updateClock();
    }
  });

  if (document.readyState === 'complete') {
    updateClock();
  } else {
    window.addEventListener('load', updateClock);
  }

})();