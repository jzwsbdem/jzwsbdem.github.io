// 存储所有拖动实例的状态
const dragInstances = [];

/**
 * 创建可拖动窗口
 * @param {string} cubeId - 子元素ID
 * @param {string} containerId - 父容器ID
 */
function createDraggable(cubeId, containerId) {
  const container = document.getElementById(containerId);
  const win = document.getElementById(cubeId);
  
  if (!container || !win) {
    console.error('元素不存在:', cubeId, containerId);
    return;
  }

  // 每个实例独立的状态
  const state = {
    container: container,
    win: win,
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    startLeft: 0,
    startTop: 0
  };

  // 鼠标按下
  win.addEventListener('mousedown', (e) => {
    // 只响应左键
    if (e.button !== 0) return;
    
    state.isDragging = true;
    state.startLeft = win.offsetLeft;
    state.startTop = win.offsetTop;
    
    const containerRect = container.getBoundingClientRect();
    state.offsetX = e.clientX - containerRect.left - state.startLeft;
    state.offsetY = e.clientY - containerRect.top - state.startTop;
    
    win.classList.add('dragging');
    win.style.zIndex = 100;
    
    e.preventDefault();
  });

  // 存储引用以便在全局事件中查找
  dragInstances.push(state);
}

// 全局鼠标移动（处理所有实例）
document.addEventListener('mousemove', (e) => {
  dragInstances.forEach((state) => {
    if (!state.isDragging) return;
    
    const containerRect = state.container.getBoundingClientRect();
    
    // 计算新位置
    let newX = e.clientX - containerRect.left - state.offsetX;
    let newY = e.clientY - containerRect.top - state.offsetY;
    
    // 边界限制
    const maxX = containerRect.width - state.win.offsetWidth;
    const maxY = containerRect.height - state.win.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    state.win.style.left = newX + 'px';
    state.win.style.top = newY + 'px';
  });
});

// 全局鼠标松开（停止所有拖动）
document.addEventListener('mouseup', () => {
  dragInstances.forEach((state) => {
    if (state.isDragging) {
      state.isDragging = false;
      state.win.classList.remove('dragging');
      state.win.style.zIndex = '';
    }
  });
});

// ============ 创建多个实例 ============
createDraggable('frameCube', 'frameCharacter');
createDraggable('frameMemory', 'frameCharacter');
createDraggable('frameAvatar', 'frameCharacter');
createDraggable('frameSecretCode', 'frameCharacter');
createDraggable('frameSmile', 'frameSystemConsole');