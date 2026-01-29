const slides = Array.from(document.querySelectorAll('.slide'));
const indicator = document.getElementById('slide-indicator');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

let current = 0;

function updateSlides(nextIndex) {
    slides.forEach((slide, idx) => {
        slide.classList.toggle('is-active', idx === nextIndex);
    });
    current = nextIndex;
    if (indicator) {
        indicator.textContent = `${current + 1} / ${slides.length}`;
    }
}

function goNext() {
    const nextIndex = (current + 1) % slides.length;
    updateSlides(nextIndex);
}

function goPrev() {
    const prevIndex = (current - 1 + slides.length) % slides.length;
    updateSlides(prevIndex);
}

if (prevBtn) prevBtn.addEventListener('click', goPrev);
if (nextBtn) nextBtn.addEventListener('click', goNext);

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        goNext();
    }
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        goPrev();
    }
});

updateSlides(0);
