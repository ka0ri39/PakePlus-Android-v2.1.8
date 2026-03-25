/**
 * 前端通用工具库
 * 包含防抖、节流、Toast提示、主题管理等功能
 */

// ===== 防抖函数 =====
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== 节流函数 =====
function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== Toast 提示 =====
const Toast = {
    show(message, type = 'info', duration = 3000) {
        // 移除现有的toast
        const existing = document.querySelector('.toast');
        if (existing) {
            existing.remove();
        }

        // 创建新toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(message, duration) {
        this.show(message, 'success', duration);
    },

    error(message, duration) {
        this.show(message, 'error', duration);
    },

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }
};

// ===== 暗黑模式管理 =====
const ThemeManager = {
    init() {
        // 从localStorage读取主题设置
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark-mode');
        }
        
        // 绑定切换按钮
        const toggleBtn = document.querySelector('.dark-mode-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
            this.updateIcon();
        }
    },

    toggle() {
        document.documentElement.classList.toggle('dark-mode');
        const isDark = document.documentElement.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateIcon();
    },

    updateIcon() {
        const toggleBtn = document.querySelector('.dark-mode-toggle');
        if (!toggleBtn) return;
        
        const isDark = document.documentElement.classList.contains('dark-mode');
        toggleBtn.textContent = isDark ? '☀️' : '🌙';
    }
};

// ===== 图片懒加载 =====
const ImageLoader = {
    init() {
        // 使用Intersection Observer API实现懒加载
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            // 观察所有带data-src的图片
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    },

    // 为动态添加的图片启用懒加载
    observe(img) {
        if ('IntersectionObserver' in window && img.dataset.src) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });
            imageObserver.observe(img);
        } else {
            // 降级方案：直接加载
            if (img.dataset.src) {
                img.src = img.dataset.src;
            }
        }
    }
};

// ===== 格式化日期 =====
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // 1分钟内
    if (diff < 60000) {
        return '刚刚';
    }
    
    // 1小时内
    if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
    }
    
    // 今天
    if (date.toDateString() === now.toDateString()) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 其他
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

// ===== 本地存储管理 =====
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }
};

// ===== 用户名管理 =====
const UserManager = {
    get() {
        return Storage.get('username', '');
    },

    set(username) {
        Storage.set('username', username);
    },

    prompt() {
        const saved = this.get();
        if (saved) return saved;
        
        const username = window.prompt('请输入你的名字：', '');
        if (username && username.trim()) {
            this.set(username.trim());
            return username.trim();
        }
        return '';
    }
};

// ===== 初始化时自动执行 =====
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    ImageLoader.init();
});
