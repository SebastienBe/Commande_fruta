/* ============================================
   SKELETON LOADERS - États de chargement élégants
   ============================================ */

const SkeletonLoader = {
    /**
     * Génère une card skeleton
     */
    createSkeletonCard() {
        return `
            <div class="skeleton-card">
                <div class="skeleton-header">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-badge"></div>
                </div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text-sm"></div>
                <div class="skeleton skeleton-btn"></div>
            </div>
        `;
    },

    /**
     * Affiche N skeleton cards dans un container
     * @param {HTMLElement} container - Container où injecter les skeletons
     * @param {number} count - Nombre de skeletons à afficher
     */
    showSkeletons(container, count = 6) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            container.insertAdjacentHTML('beforeend', this.createSkeletonCard());
        }
    },

    /**
     * Retire les skeletons avec une animation fadeOut
     * @param {HTMLElement} container - Container contenant les skeletons
     */
    hideSkeletons(container) {
        const skeletons = container.querySelectorAll('.skeleton-card');
        skeletons.forEach((skeleton, index) => {
            setTimeout(() => {
                skeleton.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => skeleton.remove(), 300);
            }, index * 50);
        });
    }
};

console.log('✅ Module Skeleton Loaders chargé');

