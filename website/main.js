/* Scroll-triggered fade-in animations */
document.addEventListener('DOMContentLoaded', function () {
    var targets = document.querySelectorAll('.fade-up');
    if (!targets.length) return;

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        targets.forEach(function (el) { observer.observe(el); });
    } else {
        targets.forEach(function (el) { el.classList.add('visible'); });
    }
});
