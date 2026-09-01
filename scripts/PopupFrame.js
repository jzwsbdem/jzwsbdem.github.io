/**
 * ============================================================
 *  DisplayToggle 通用类 – 管理元素的显示/隐藏 (active类切换)
 *  支持自定义打开/关闭/切换，并触发事件。
 *  完全解耦，可用于任何元素 (弹窗、面板、下拉等)
 * ============================================================
 */
class DisplayToggle {
    /**
     * @param {Object} options
     * @param {string|HTMLElement} options.targetEl      - 目标元素 (或选择器)
     * @param {string}             [options.activeClass] - 切换用的类名，默认 'active'
     * @param {string|HTMLElement} [options.openTrigger] - 打开触发器 (或选择器)
     * @param {string|HTMLElement} [options.closeTrigger]- 关闭触发器 (或选择器)
     * @param {Function}           [options.onShow]      - 显示后回调
     * @param {Function}           [options.onHide]      - 隐藏后回调
     * @param {Function}           [options.onToggle]    - 切换后回调 (接收状态 boolean)
     * @param {boolean}            [options.closeOnOverlay] - 点击遮罩是否关闭 (默认 true)
     * @param {boolean}            [options.closeOnEsc]     - 按 ESC 是否关闭 (默认 true)
     */
    constructor(options = {}) {
        if (!options.targetEl) {
            throw new Error('DisplayToggle: 必须指定 targetEl (目标元素)');
        }

        // 解析目标元素
        this.target = typeof options.targetEl === 'string'
            ? document.querySelector(options.targetEl)
            : options.targetEl;

        if (!this.target) {
            throw new Error(`DisplayToggle: 目标元素 "${options.targetEl}" 不存在`);
        }

        this.activeClass = options.activeClass || 'active';
        this.onShow = options.onShow || null;
        this.onHide = options.onHide || null;
        this.onToggle = options.onToggle || null;
        this.closeOnOverlay = options.closeOnOverlay !== undefined ? options.closeOnOverlay : true;
        this.closeOnEsc = options.closeOnEsc !== undefined ? options.closeOnEsc : true;

        // 存储触发器
        this._openTriggers = [];
        this._closeTriggers = [];
        this._boundShow = this.show.bind(this);
        this._boundHide = this.hide.bind(this);
        this._boundToggle = this.toggle.bind(this);
        this._boundHandleOverlay = this._handleOverlayClick.bind(this);
        this._boundHandleEsc = this._handleEscKey.bind(this);

        // 如果提供了打开/关闭触发器，自动绑定
        if (options.openTrigger) {
            this.addOpenTrigger(options.openTrigger);
        }
        if (options.closeTrigger) {
            this.addCloseTrigger(options.closeTrigger);
        }

        // 自动绑定：从目标元素内部查找 [data-open], [data-close]
        this._autoBindTriggers();

        // 绑定遮罩点击关闭
        if (this.closeOnOverlay) {
            this.target.addEventListener('click', this._boundHandleOverlay);
        }

        // 绑定 ESC 键关闭
        if (this.closeOnEsc) {
            document.addEventListener('keydown', this._boundHandleEsc);
        }

        // 当前状态
        this._currentState = this.target.classList.contains(this.activeClass);
    }

    // ---------- 添加触发器 ----------
    addOpenTrigger(trigger) {
        const el = typeof trigger === 'string'
            ? document.querySelector(trigger)
            : trigger;
        if (!el) {
            console.warn(`DisplayToggle: 打开触发器 "${trigger}" 未找到`);
            return this;
        }
        if (this._openTriggers.includes(el)) return this;

        this._openTriggers.push(el);
        el.addEventListener('click', this._boundShow);
        return this;
    }

    addCloseTrigger(trigger) {
        const el = typeof trigger === 'string'
            ? document.querySelector(trigger)
            : trigger;
        if (!el) {
            console.warn(`DisplayToggle: 关闭触发器 "${trigger}" 未找到`);
            return this;
        }
        if (this._closeTriggers.includes(el)) return this;

        this._closeTriggers.push(el);
        el.addEventListener('click', this._boundHide);
        return this;
    }

    // 自动绑定：从目标元素内部查找 [data-open] [data-close]
    _autoBindTriggers() {
        const opens = this.target.querySelectorAll('[data-open]');
        opens.forEach(el => this.addOpenTrigger(el));

        const closes = this.target.querySelectorAll('[data-close]');
        closes.forEach(el => this.addCloseTrigger(el));
    }

    // ---------- 遮罩点击处理 (只响应点击遮罩本身，不响应子元素) ----------
    _handleOverlayClick(e) {
        if (e.target === this.target) {
            this.hide();
        }
    }

    // ---------- ESC 键处理 ----------
    _handleEscKey(e) {
        if (e.key === 'Escape' && this._currentState) {
            this.hide();
        }
    }

    // ---------- 核心方法 ----------
    show() {
        if (this._currentState) return;
        this.target.classList.add(this.activeClass);
        this._currentState = true;
        if (typeof this.onShow === 'function') this.onShow(this.target);
        if (typeof this.onToggle === 'function') this.onToggle(true);
        this._emitEvent('toggle:show');
        return this;
    }

    hide() {
        if (!this._currentState) return;
        this.target.classList.remove(this.activeClass);
        this._currentState = false;
        if (typeof this.onHide === 'function') this.onHide(this.target);
        if (typeof this.onToggle === 'function') this.onToggle(false);
        this._emitEvent('toggle:hide');
        return this;
    }

    toggle() {
        if (this._currentState) {
            this.hide();
        } else {
            this.show();
        }
        return this;
    }

    isVisible() {
        return this._currentState;
    }

    // ---------- 事件通知 ----------
    _emitEvent(type) {
        const evt = new CustomEvent(type, {
            detail: { target: this.target, state: this._currentState }
        });
        this.target.dispatchEvent(evt);
    }

    // ---------- 销毁：移除所有监听 (便于清理) ----------
    destroy() {
        [...this._openTriggers, ...this._closeTriggers].forEach(el => {
            el.removeEventListener('click', this._boundShow);
            el.removeEventListener('click', this._boundHide);
        });
        this._openTriggers = [];
        this._closeTriggers = [];

        if (this.closeOnOverlay) {
            this.target.removeEventListener('click', this._boundHandleOverlay);
        }
        if (this.closeOnEsc) {
            document.removeEventListener('keydown', this._boundHandleEsc);
        }
    }
}

// ============================================================
//  初始化
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const stateText = document.getElementById('stateText');

    const popupConfigs = [
        ['#friendlyLinks', '#friButton'],
        ['#miscellaneous', '#misButton'],
        ['#personalInformation', '#perButton'],
        ['#archives', '#arcButton'],
        ['#albums', '#albButton'],
        ['#storyPopup', '#storyTrigger']
    ];

    const popups = {};

    popupConfigs.forEach(([targetEl, openTrigger], index) => {
        try {
            if (document.querySelector(targetEl) && document.querySelector(openTrigger)) {
                popups[`popup${index + 1}`] = new DisplayToggle({
                    targetEl: targetEl,
                    activeClass: 'active',
                    openTrigger: openTrigger,
                });
            }
        } catch (e) {
        }
    });
    // ★★★ 暴露更新函数到全局 ★★★
    window.updateStoryPopupContent = function() {};
});