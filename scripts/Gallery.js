(function() {
    // ------------------------------------------------------------
    // 1. 从JSON加载图片数据
    // ------------------------------------------------------------
    let currentItems = [];
    let currentRowHeight = 120;
    let isManualMode = false;
    const grid = document.getElementById('gridContainer');
    const countDisplay = document.getElementById('countDisplay');
    const rowHeightSlider = document.getElementById('rowHeightSlider');
    const heightDisplay = document.getElementById('heightDisplay');

    // 根据序号生成图片路径
    function generateImagePath(index) {
        return `../images/yinArt/yinArt (${index}).webp`;
    }

    // 加载图片数据
    function loadImageData() {
        fetch('../datas/YinArt.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load.');
                }
                return response.json();
            })
            .then(data => {
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid JSON format');
                }
                const imageList = data.imageList;
                if (!Array.isArray(imageList) || imageList.length === 0) {
                    throw new Error('Invalid or empty image data');
                }
                const validItems = imageList.filter(item => {
                    return typeof item === 'number' && item > 0;
                });
                if (validItems.length === 0) {
                    throw new Error('No valid image data found');
                }
                currentItems = validItems.map(index => ({
                    path: generateImagePath(index),
                    width: 200,
                    height: currentRowHeight
                }));
                renderGrid();
                if (!isManualMode) {
                    setTimeout(autoAdjustRowHeight, 100);
                }
            })
            .catch(error => {
                console.error('Failed to load image data:', error);
                grid.innerHTML = '';
                const errorMsg = document.createElement('div');
                errorMsg.style.cssText = `
                    width: 100%;
                    text-align: center;
                    padding: 60px 20px;
                    color: #d32f2f;
                    font-size: 1.1rem;
                    background: #fafbfc;
                    margin: 10px 0;
                `;
                errorMsg.textContent = `❌ Failed to load images: ${error.message}`;
                grid.appendChild(errorMsg);
                countDisplay.textContent = 'Total: 0';
            });
    }

    // ------------------------------------------------------------
    // 2. 渲染网格
    // ------------------------------------------------------------
    function renderGrid() {
        grid.innerHTML = '';

        if (currentItems.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = `
                width: 100%;
                text-align: center;
                padding: 60px 20px;
                color: #8a9aa8;
                font-size: 1.2rem;
                background: #fafbfc;
                margin: 10px 0;
            `;
            emptyMsg.textContent = '✨ No images';
            grid.appendChild(emptyMsg);
            countDisplay.textContent = 'Total: 0';
            return;
        }

        const fragment = document.createDocumentFragment();

        currentItems.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'grid-item';
            card.style.height = currentRowHeight + 'px';
            card.style.flex = '1 0 auto';
            card.style.minWidth = '80px';
            card.style.maxWidth = '400px';

            const img = document.createElement('img');
            img.src = item.path;
            img.alt = `Image ${index + 1}`;
            img.loading = 'lazy';
            img.onerror = function() {
                this.style.backgroundColor = '#d0d7de';
                this.alt = 'Load failed';
                console.error(`Image load failed: ${item.path}`);
            };

            card.appendChild(img);
            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
        countDisplay.textContent = `Total: ${currentItems.length}`;
    }

    // ------------------------------------------------------------
    // 3. 更新行高
    // ------------------------------------------------------------
    function updateRowHeight(newHeight) {
        isManualMode = true;
        currentRowHeight = newHeight;
        heightDisplay.textContent = newHeight;
        rowHeightSlider.value = newHeight;
        
        const min = parseInt(rowHeightSlider.min);
        const max = parseInt(rowHeightSlider.max);
        const percent = ((newHeight - min) / (max - min)) * 100;
        rowHeightSlider.style.background = `linear-gradient(to right, purple 0%, purple ${percent}%, #d0d7de ${percent}%, #d0d7de 100%)`;
        
        renderGrid();
    }

    // ------------------------------------------------------------
    // 4. 自适应行高
    // ------------------------------------------------------------
    function autoAdjustRowHeight() {
        if (isManualMode) return;
        if (currentItems.length === 0) return;

        const containerWidth = grid.offsetWidth || window.innerWidth - 24;
        const gap = 6;
        const minWidth = 80;
        const itemsPerRow = Math.floor((containerWidth + gap) / (minWidth + gap));
        const totalItems = currentItems.length;
        const estimatedRows = Math.ceil(totalItems / Math.max(itemsPerRow, 1));
        
        let targetHeight = 120;
        if (estimatedRows > 8) {
            targetHeight = 80 + (8 / estimatedRows) * 40;
        } else if (estimatedRows <= 3) {
            targetHeight = 160 + (3 - estimatedRows) * 20;
        } else {
            targetHeight = 120 + (6 - estimatedRows) * 10;
        }
        
        targetHeight = Math.max(80, Math.min(200, Math.round(targetHeight)));
        
        if (Math.abs(targetHeight - currentRowHeight) > 3) {
            currentRowHeight = targetHeight;
            rowHeightSlider.value = targetHeight;
            heightDisplay.textContent = targetHeight;
            
            const min = parseInt(rowHeightSlider.min);
            const max = parseInt(rowHeightSlider.max);
            const percent = ((targetHeight - min) / (max - min)) * 100;
            rowHeightSlider.style.background = `linear-gradient(to right, purple 0%, purple ${percent}%, #d0d7de ${percent}%, #d0d7de 100%)`;
            
            renderGrid();
        }
    }

    // ------------------------------------------------------------
    // 5. 初始化
    // ------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function() {
        currentRowHeight = parseInt(rowHeightSlider.value);
        heightDisplay.textContent = currentRowHeight;
        
        const min = parseInt(rowHeightSlider.min);
        const max = parseInt(rowHeightSlider.max);
        const percent = ((currentRowHeight - min) / (max - min)) * 100;
        rowHeightSlider.style.background = `linear-gradient(to right, purple 0%, purple ${percent}%, #d0d7de ${percent}%, #d0d7de 100%)`;
        
        loadImageData();

        // input 事件只更新数值显示和滑块背景，不更新行高
        rowHeightSlider.addEventListener('input', function() {
            const val = parseInt(this.value);
            heightDisplay.textContent = val;
            
            const min = parseInt(this.min);
            const max = parseInt(this.max);
            const percent = ((val - min) / (max - min)) * 100;
            this.style.background = `linear-gradient(to right, purple 0%, purple ${percent}%, #d0d7de ${percent}%, #d0d7de 100%)`;
        });

        // change 事件才更新行高（松手后）
        rowHeightSlider.addEventListener('change', function() {
            const val = parseInt(this.value);
            updateRowHeight(val);
        });

        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(autoAdjustRowHeight, 200);
        });

        const observer = new MutationObserver(function() {
            autoAdjustRowHeight();
        });
        observer.observe(grid, { childList: true, subtree: true });

        setTimeout(autoAdjustRowHeight, 500);
        setTimeout(autoAdjustRowHeight, 1000);
        setTimeout(autoAdjustRowHeight, 2000);
    });

    window.__imageWall = {
        getItems: () => [...currentItems],
        getRowHeight: () => currentRowHeight,
        setRowHeight: updateRowHeight,
        autoAdjust: autoAdjustRowHeight,
        reload: loadImageData,
        setManualMode: (mode) => { isManualMode = mode; },
    };

})();