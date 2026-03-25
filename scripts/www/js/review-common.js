/**
 * 测评页面共享逻辑
 * milk-tea.html, convenience.html, travel.html 共用
 * 依赖: utils.js, api.js, image-zoom.js
 */

const ReviewCommon = (() => {
    const UPLOAD_URL = window.CONFIG.UPLOAD_URL;
    const BASE_URL = window.CONFIG.BASE_URL;

    // ===== 评分工具 =====
    function formatRating(value) {
        if (value === null || value === undefined || value === '') return '0';
        const num = Number(value);
        return isNaN(num) ? '0' : num.toString();
    }

    function getRatingClass(value) {
        const num = Number(value);
        if (isNaN(num) || num === 0) return 'rating-zero';
        if (num >= 7) return 'rating-high';
        if (num >= 4) return 'rating-medium';
        if (num >= 1) return 'rating-low';
        return 'rating-zero';
    }

    function isValidRating(value) {
        if (value === null || value === undefined || value === '') return false;
        const num = Number(value);
        return !isNaN(num) && num >= 1 && num <= 10;
    }

    // ===== 图片工具 =====
    function normalizeImageUrl(url) {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        if (url.startsWith('/uploads/')) return UPLOAD_URL + url;
        return UPLOAD_URL + '/uploads/' + url.replace(/^\/+/, '');
    }

    function normalizeImageList(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean).map(normalizeImageUrl);
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) return [];
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.filter(Boolean).map(normalizeImageUrl);
            } catch (e) {
                return [normalizeImageUrl(trimmed)];
            }
            return [normalizeImageUrl(trimmed)];
        }
        return [];
    }

    function deleteUploadedImages(urls) {
        if (!urls || urls.length === 0) return;
        fetch(`${BASE_URL}/upload/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls })
        }).catch(() => {});
    }

    // ===== 图片预览管理器 =====
    function createImageManager(previewEl, hiddenInput) {
        function getList() {
            return normalizeImageList(hiddenInput.value);
        }

        function setList(list) {
            const safe = Array.isArray(list) ? list.filter(Boolean) : [];
            hiddenInput.value = JSON.stringify(safe);
            render(safe);
        }

        function render(list) {
            if (!list || list.length === 0) {
                previewEl.innerHTML = '';
                return;
            }
            previewEl.innerHTML = list.map((src, i) => `
                <div class="review-image-card">
                    <img src="${src}" alt="测评图片 ${i + 1}" loading="lazy">
                    <button type="button" class="review-image-remove" data-index="${i}" aria-label="删除图片">×</button>
                </div>
            `).join('');

            previewEl.querySelectorAll('.review-image-remove').forEach(btn => {
                btn.addEventListener('click', function () {
                    const idx = parseInt(this.dataset.index, 10);
                    if (Number.isNaN(idx)) return;
                    const current = getList();
                    const removed = current.splice(idx, 1);
                    setList(current);
                    if (removed.length) deleteUploadedImages(removed);
                });
            });
        }

        return { getList, setList, render };
    }

    // ===== 图片上传绑定 =====
    function bindImageUpload(fileInput, uploadBtn, removeBtn, imageManager) {
        uploadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', function (e) {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;
            const currentList = imageManager.getList();
            const maxCount = 9;
            const slots = Math.max(0, maxCount - currentList.length);
            const next = files.slice(0, slots);
            if (next.length === 0) {
                Toast.warning(`最多只能上传 ${maxCount} 张图片`);
                fileInput.value = '';
                return;
            }
            const formData = new FormData();
            next.forEach(f => formData.append('files', f));
            fetch(`${BASE_URL}/upload`, { method: 'POST', body: formData })
                .then(r => r.json())
                .then(result => {
                    if (result.code !== 200) throw new Error(result.message || '上传失败');
                    const urls = (result.data && result.data.urls) ? result.data.urls : [];
                    imageManager.setList(currentList.concat(urls));
                    fileInput.value = '';
                })
                .catch(err => {
                    Toast.error('上传失败: ' + err.message);
                    fileInput.value = '';
                });
        });

        removeBtn.addEventListener('click', function () {
            fileInput.value = '';
            const current = imageManager.getList();
            imageManager.setList([]);
            deleteUploadedImages(current);
        });
    }

    // ===== 状态徽章 =====
    function updateStatus(badgeEl, iconEl, textEl, type, message) {
        badgeEl.className = 'status-badge';
        const icons = { success: '✅', error: '❌', warning: '⚠️' };
        if (type in icons) {
            badgeEl.classList.add(type);
            iconEl.innerText = icons[type];
        } else {
            iconEl.innerText = '🔄';
        }
        textEl.innerText = message;
    }

    // ===== 评分选择器 =====
    function initRatingSelector(containerEl, hiddenInput) {
        let html = '<div class="rating-line">';
        for (let i = 1; i <= 5; i++) html += `<span class="rating-number" data-rating="${i}">${i}</span>`;
        html += '</div><div class="rating-line">';
        for (let i = 6; i <= 10; i++) html += `<span class="rating-number" data-rating="${i}">${i}</span>`;
        html += '</div>';
        containerEl.innerHTML = html;

        function setRating(value) {
            hiddenInput.value = value;
            containerEl.querySelectorAll('.rating-number').forEach(n => {
                n.classList.toggle('active', parseInt(n.dataset.rating) === value);
            });
        }

        containerEl.querySelectorAll('.rating-number').forEach(n => {
            n.addEventListener('click', function () {
                setRating(parseInt(this.dataset.rating));
            });
        });

        return { setRating };
    }

    // ===== 排序 =====
    function sortData(data, mode, ratingField, timeField) {
        if (!Array.isArray(data)) return data;
        const copy = [...data];
        switch (mode) {
            case 'high-to-low':
                copy.sort((a, b) => (Number(b[ratingField]) || 0) - (Number(a[ratingField]) || 0));
                break;
            case 'low-to-high':
                copy.sort((a, b) => (Number(a[ratingField]) || 0) - (Number(b[ratingField]) || 0));
                break;
            default:
                copy.sort((a, b) => (Date.parse(b[timeField]) || 0) - (Date.parse(a[timeField]) || 0));
        }
        return copy;
    }

    // ===== 排序下拉菜单初始化 =====
    function initSortDropdown(toggleBtn, dropdownEl, onSortChange) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownEl.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!dropdownEl.contains(e.target) && !toggleBtn.contains(e.target)) {
                dropdownEl.classList.remove('show');
            }
        });
        dropdownEl.querySelectorAll('.sort-dropdown-item').forEach(item => {
            item.addEventListener('click', function () {
                dropdownEl.querySelectorAll('.sort-dropdown-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                dropdownEl.classList.remove('show');
                onSortChange(this.dataset.sort);
            });
        });
    }

    // ===== 模态框关闭逻辑（防拖拽误触） =====
    function bindModalClose(modalEl, closeFn) {
        let mouseDownOnBg = false;
        modalEl.addEventListener('mousedown', (e) => { mouseDownOnBg = (e.target === modalEl); });
        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) { e.stopPropagation(); e.preventDefault(); }
            if (mouseDownOnBg && e.target === modalEl) closeFn();
            mouseDownOnBg = false;
        }, false);
        const content = modalEl.querySelector('.modal-content');
        if (content) {
            content.addEventListener('click', (e) => e.stopPropagation(), false);
            content.addEventListener('mousedown', (e) => e.stopPropagation(), false);
        }
    }

    // ===== 详情图片加载处理 =====
    function bindDetailImages(containerSelector) {
        setTimeout(() => {
            document.querySelectorAll(`${containerSelector} .review-img`).forEach(img => {
                img.onload = function () {
                    this.style.display = 'block';
                    const ph = this.parentElement.querySelector('.image-error-placeholder');
                    if (ph) ph.style.display = 'none';
                };
                img.onerror = function () {
                    if (!this.parentElement.classList.contains('image-failed')) {
                        this.parentElement.classList.add('image-failed');
                        this.style.display = 'none';
                        const ph = this.parentElement.querySelector('.image-error-placeholder');
                        if (ph) ph.style.display = 'block';
                    }
                };
                if (img.complete) {
                    if (img.naturalHeight !== 0) img.onload?.();
                    else img.onerror?.();
                }
            });
        }, 0);
    }

    // ===== 生成详情图片 HTML =====
    function buildImageHtml(imageList) {
        if (!imageList || imageList.length === 0) return '';
        return `
            <div class="detail-item">
                <div class="detail-label">测评图片</div>
                <div class="detail-value">
                    <div class="review-image-grid">
                        ${imageList.map((src, i) => `
                            <div class="review-image-card" data-index="${i}">
                                <img src="${src}" alt="测评图片 ${i + 1}" loading="lazy" class="review-img">
                                <div class="image-error-placeholder" style="display:none;">图片加载失败</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // ===== 搜索防抖绑定 =====
    function bindSearch(inputEl, onSearch, onClear) {
        const debouncedSearch = debounce((keyword) => {
            if (keyword === '') onClear();
            else onSearch(keyword);
        }, 300);
        inputEl.addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));
    }

    // ===== 名称 CSS 类 =====
    function getNameClass(name) {
        return (name && name.length > 5) ? 'cell-name-long' : 'cell-name';
    }

    // ===== 公开 API =====
    return {
        formatRating,
        getRatingClass,
        isValidRating,
        normalizeImageUrl,
        normalizeImageList,
        deleteUploadedImages,
        createImageManager,
        bindImageUpload,
        updateStatus,
        initRatingSelector,
        sortData,
        initSortDropdown,
        bindModalClose,
        bindDetailImages,
        buildImageHtml,
        bindSearch,
        getNameClass,
        BASE_URL,
        UPLOAD_URL
    };
})();
