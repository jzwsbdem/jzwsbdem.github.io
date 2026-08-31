(function() {
    // ============================================================
    //  CONFIG
    // ============================================================
    const CONFIG = {
        sizeRange: [140, 240],
        alphaRange: [0.25, 0.70],
        speedRange: [7.5, 12.5],
        speedMultiplier: 1.0,
        rotationSpeedRange: [0.05, 0.1],
        spawnRate: 0.025,
        borderOffset: 50,
        baseFPS: 60
    };
    // 冻结配置，防止外部修改
    Object.freeze(CONFIG);
    // ============================================================

    const canvas = document.getElementById('shapeCanvas');
    const ctx = canvas.getContext('2d');

    const FRAME_WIDTH = 960;
    const FRAME_HEIGHT = 600;
    
    let width, height;
    let lastTimestamp = 0;

    function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = width;
        canvas.height = height;
    }

    function scaleX(x) { return (x / FRAME_WIDTH) * width; }
    function scaleY(y) { return (y / FRAME_HEIGHT) * height; }
    function scaleSize(s) {
        const scale = (width / FRAME_WIDTH + height / FRAME_HEIGHT) / 2;
        return s * scale;
    }

    const SHAPE_TYPES = ['square', 'triangle', 'pentagon', 'hexagon'];

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
    function getCurrentSize() { return randInt(CONFIG.sizeRange[0], CONFIG.sizeRange[1]); }
    function getCurrentAlpha() { return rand(CONFIG.alphaRange[0], CONFIG.alphaRange[1]); }
    function getCurrentSpeed() { return rand(CONFIG.speedRange[0], CONFIG.speedRange[1]) * CONFIG.speedMultiplier; }
    function getCurrentRotationSpeed() { return rand(CONFIG.rotationSpeedRange[0], CONFIG.rotationSpeedRange[1]); }

    // ---------- 工具：限制数值范围 ----------
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    class Shape {
        constructor() {
            this.type = SHAPE_TYPES[randInt(0, SHAPE_TYPES.length - 1)];
            this.size = getCurrentSize();
            this.alpha = getCurrentAlpha();
            this.rotation = rand(0, Math.PI * 2);
            this.rotationSpeed = getCurrentRotationSpeed();
            
            const margin = this.size + 20;
            this.x = rand(0, FRAME_WIDTH);
            this.y = -margin - rand(0, 100);
            
            const speed = getCurrentSpeed();
            const angle = rand(-Math.PI * 0.4, Math.PI * 0.4);
            this.vx = Math.sin(angle) * speed * 0.7;
            this.vy = Math.cos(angle) * speed * 0.9 + 0.5;
            
            this.active = true;
            this.hasEntered = false;
        }

        // 更新方法，接受时间增量（秒）
        update(deltaTime) {
            if (!this.active) return;
            
            // 基于时间增量更新位置和旋转
            // 60 是基准帧率，确保速度在不同刷新率下保持一致
            const timeScale = deltaTime * CONFIG.baseFPS;
            
            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;
            this.rotation += this.rotationSpeed * timeScale;

            const margin = this.size * 0.5;
            
            // ----- 左右边界反弹（使用 CONFIG 中的 borderOffset）-----
            const borderOffset = CONFIG.borderOffset;
            if (this.x < margin - borderOffset) { 
                this.x = margin - borderOffset; 
                this.vx = Math.abs(this.vx);
            }
            if (this.x > FRAME_WIDTH - margin + borderOffset) { 
                this.x = FRAME_WIDTH - margin + borderOffset; 
                this.vx = -Math.abs(this.vx);
            }

            // ----- 进入视口检测 -----
            const halfSize = this.size * 0.6;
            if (!this.hasEntered) {
                if (this.x > halfSize && this.x < FRAME_WIDTH - halfSize &&
                    this.y > halfSize && this.y < FRAME_HEIGHT - halfSize) {
                    this.hasEntered = true;
                }
                return;
            }

            // ----- 上下边界（顶部反弹，底部消失）-----
            if (this.y < margin) { 
                this.y = margin; 
                this.vy = Math.abs(this.vy); 
            }
            if (this.y > FRAME_HEIGHT + this.size + 50) { 
                this.active = false; 
                return; 
            }

            // 随机扰动（同样基于时间增量）
            if (Math.random() < 0.002 * timeScale) {
                this.vx += rand(-0.05, 0.05) * timeScale;
                this.vy += rand(-0.05, 0.05) * timeScale;
                const maxSpeed = 4.5 * CONFIG.speedMultiplier;
                let sp = Math.hypot(this.vx, this.vy);
                if (sp > maxSpeed) { 
                    this.vx = (this.vx / sp) * maxSpeed; 
                    this.vy = (this.vy / sp) * maxSpeed; 
                }
            }
        }

        drawPath(context, s) {
            context.beginPath();
            switch(this.type) {
                case 'square': {
                    const half = s / 2;
                    context.rect(-half, -half, s, s);
                    break;
                }
                case 'triangle': {
                    const r = s * 0.65;
                    for (let i = 0; i < 3; i++) {
                        const a = (i * 2 * Math.PI / 3) - Math.PI / 2;
                        const px = Math.cos(a) * r, py = Math.sin(a) * r;
                        i === 0 ? context.moveTo(px, py) : context.lineTo(px, py);
                    }
                    context.closePath();
                    break;
                }
                case 'pentagon': {
                    const r = s * 0.58;
                    for (let i = 0; i < 5; i++) {
                        const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
                        const px = Math.cos(a) * r, py = Math.sin(a) * r;
                        i === 0 ? context.moveTo(px, py) : context.lineTo(px, py);
                    }
                    context.closePath();
                    break;
                }
                case 'hexagon': {
                    const r = s * 0.58;
                    for (let i = 0; i < 6; i++) {
                        const a = (i * 2 * Math.PI / 6) - Math.PI / 2;
                        const px = Math.cos(a) * r, py = Math.sin(a) * r;
                        i === 0 ? context.moveTo(px, py) : context.lineTo(px, py);
                    }
                    context.closePath();
                    break;
                }
            }
        }

        drawBorder(context) {
            if (!this.active) return;
            const px = scaleX(this.x), py = scaleY(this.y), ps = scaleSize(this.size);
            context.save();
            context.translate(px, py);
            context.rotate(this.rotation);
            context.globalAlpha = this.alpha * 0.3;
            this.drawPath(context, ps);
            context.shadowBlur = 0;
            context.fillStyle = `rgba(200, 160, 255, ${this.alpha * 0.1})`;
            context.fill();
            context.restore();
        }

        drawMask(context) {
            if (!this.active) return;
            const px = scaleX(this.x), py = scaleY(this.y), ps = scaleSize(this.size);
            context.save();
            context.translate(px, py);
            context.rotate(this.rotation);
            this.drawPath(context, ps);
            context.fillStyle = '#ffffff';
            context.fill();
            context.restore();
        }

        isActive() { return this.active; }
    }

    // ---------- 形状管理 ----------
    let shapes = [];

    function initShapes() {
        shapes = [];
        // 初始生成 5 个
        for (let i = 0; i < 5; i++) {
            shapes.push(new Shape());
        }
    }

    function maintainShapeCount() {
        // 清理失效的形状（真正移除）
        shapes = shapes.filter(s => s.isActive());
        
        // 每帧持续生成新形状（永不停止）
        if (Math.random() < CONFIG.spawnRate) {
            const shape = new Shape();
            shapes.push(shape);
        }
        
        // 如果太少，紧急补充
        if (shapes.length < 3) {
            for (let i = 0; i < 4; i++) {
                shapes.push(new Shape());
            }
        }
    }

    // ---------- FPS 监控（可选）----------
    let frameCount = 0;
    let fpsCheckTime = 0;
    let currentFPS = 0;

    function updateFPS(timestamp) {
        frameCount++;
        if (timestamp - fpsCheckTime >= 1000) {
            currentFPS = frameCount;
            frameCount = 0;
            fpsCheckTime = timestamp;
            /*// 如果 FPS 异常高或低，在控制台输出警告
            if (currentFPS > 90 || currentFPS < 30) {
                console.log(`📊 当前帧率: ${currentFPS} FPS (速度已自动适配)`);
            }*/
        }
    }

    // ---------- 动画 ----------
    function animate(timestamp) {
        // 计算时间增量（秒）
        const deltaTime = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0.016;
        lastTimestamp = timestamp;
        
        // 限制最大增量，防止切换标签页后跳帧导致爆炸
        const delta = Math.min(deltaTime, 0.05);
        
        // FPS 监控
        updateFPS(timestamp);

        ctx.clearRect(0, 0, width, height);

        // 重心在正中心
        const cx = width * 0.5;
        const cy = height * 0.5;
        const radius = Math.hypot(width, height) * 0.7;
        
        const grad = ctx.createRadialGradient(
            cx, cy, 0,
            cx, cy, radius
        );
        
        grad.addColorStop(0, '#320167');
        grad.addColorStop(0.35, '#320167');
        grad.addColorStop(1, '#600060');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 更新形状（传入时间增量）
        for (let shape of shapes) {
            shape.update(delta);
        }

        // 挖洞
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        for (let shape of shapes) shape.drawMask(ctx);
        ctx.restore();

        // 绘制填充
        for (let shape of shapes) shape.drawBorder(ctx);

        maintainShapeCount();

        requestAnimationFrame(animate);
    }

    // ---------- 启动 ----------
    function start() {
        resizeCanvas();
        initShapes();
        lastTimestamp = 0;
        frameCount = 0;
        fpsCheckTime = 0;
        animate(0);
    }

    let timer;
    window.addEventListener('resize', function() {
        clearTimeout(timer);
        timer = setTimeout(resizeCanvas, 100);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    // 暴露一些调试信息到控制台
    window.__shapeDebug = {
        getFPS: () => currentFPS,
        getShapeCount: () => shapes.length,
        getConfig: () => ({ ...CONFIG }),
        getSpeedMultiplier: () => CONFIG.speedMultiplier
    };
})();