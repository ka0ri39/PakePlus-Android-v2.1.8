// 图片放大功能
function initImageZoom() {
    const overlay = document.createElement('div');
    overlay.className = 'image-zoom-overlay';
    overlay.innerHTML = `
        <div class="image-zoom-content">
            <img class="image-zoom-img" src="" alt="放大预览">
            <button type="button" class="image-zoom-close">×</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const zoomImg = overlay.querySelector('.image-zoom-img');
    const closeBtn = overlay.querySelector('.image-zoom-close');

    function closeOverlay() {
        overlay.classList.remove('show');
        zoomImg.removeAttribute('src');
    }

    closeBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeOverlay();
        }
    });

    document.addEventListener('click', function(e) {
        const target = e.target;
        if (!target || target.tagName !== 'IMG') {
            return;
        }
        if (!target.closest('.review-image-grid') && !target.classList.contains('review-image')) {
            return;
        }
        const src = target.getAttribute('src');
        if (!src) {
            return;
        }
        zoomImg.setAttribute('src', src);
        overlay.classList.add('show');
    }, true);
}