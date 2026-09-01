  const clocks = [
    { id: 'clockChina', timeZone: 'Asia/Shanghai' },
    { id: 'clockFinland', timeZone: 'Europe/Helsinki' }
  ];

  function updateClock() {
    const now = new Date();
    clocks.forEach(({ id, timeZone }) => {
      const timeStr = now.toLocaleTimeString('zh-CN', {
        timeZone: timeZone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
        });
        document.getElementById(id).textContent = timeStr;
    });
  }

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  function getDateStr(timeZone) {
    const now = new Date();
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: timeZone }));
    const month = MONTHS[localTime.getMonth()];
    const day = localTime.getDate();
    return day + ' ' + month;
  }

  function updateDates() {
    const chinaEl = document.getElementById('dateChina');
    const finlandEl = document.getElementById('dateFinland');

    if (chinaEl) chinaEl.textContent = getDateStr('Asia/Shanghai');
    if (finlandEl) finlandEl.textContent = getDateStr('Europe/Helsinki');
  }

  updateDates();
  setInterval(updateDates, 60000);  // 每分钟更新一次

  updateClock();
  setInterval(updateClock, 1000);