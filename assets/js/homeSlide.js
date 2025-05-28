const slideContainer = document.querySelector('.slides');
let slides;
let currentIndex = 1;
let autoSlide;
let totalSlides;

const allSlides = [
  {
    type: 'landscape',
    src: 'images/ads/Benefit_Landscape.png',
    alt: 'Benefit_Landscape.png',
  },
  {
    type: 'portrait',
    src: 'images/ads/Benefit_Portrait.png',
    alt: 'Benefit_Portrait.png',
  },
  {
    type: 'landscape',
    src: 'images/ads/Benefit_0_Landscape.png',
    alt: 'Benefit_0_Landscape.png',
  },
  {
    type: 'portrait',
    src: 'images/ads/Benefit_0_Portrait.png',
    alt: 'Benefit_0_Portrait.png',
  }
];

function buildSlides() {
  const isMobile = window.innerWidth <= 1024;
  const filtered = allSlides.filter(s => isMobile ? s.type === 'portrait' : s.type === 'landscape');

  slideContainer.innerHTML = '';

  filtered.forEach(slide => {
    const div = document.createElement('div');
    div.classList.add('slide', slide.type);
    const img = document.createElement('img');
    img.src = slide.src;
    img.alt = slide.alt;
    
    img.style.width = '100%';
    img.style.height = 'auto';

    div.appendChild(img);
    slideContainer.appendChild(div);
  });

  slides = document.querySelectorAll('.slide');
  if (slides.length > 0) {
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    firstClone.id = 'first-clone';
    lastClone.id = 'last-clone';
    slideContainer.appendChild(firstClone);
    slideContainer.insertBefore(lastClone, slides[0]);
  }

  slides = document.querySelectorAll('.slide');
  totalSlides = slides.length;
  currentIndex = 1;
  resetSlidePosition();
  startAutoSlide();
}

function updateSlidePosition() {
  slideContainer.style.transition = 'transform 0.5s ease-in-out';
  slideContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
}

function resetSlidePosition() {
  slideContainer.style.transition = 'none';
  slideContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
}

document.querySelector('.next').addEventListener('click', () => {
  if (currentIndex >= totalSlides - 1) return;
  currentIndex++;
  updateSlidePosition();
});

document.querySelector('.prev').addEventListener('click', () => {
  if (currentIndex <= 0) return;
  currentIndex--;
  updateSlidePosition();
});

slideContainer.addEventListener('transitionend', () => {
  if (slides[currentIndex].id === 'first-clone') {
    currentIndex = 1;
    resetSlidePosition();
  } else if (slides[currentIndex].id === 'last-clone') {
    currentIndex = totalSlides - 2;
    resetSlidePosition();
  }
});

function startAutoSlide() {
  stopAutoSlide();
  autoSlide = setInterval(() => {
    if (currentIndex < totalSlides - 1) {
      currentIndex++;
      updateSlidePosition();
    }
  }, 4000);
}

function stopAutoSlide() {
  clearInterval(autoSlide);
}

function setupHoverPause() {
  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('mouseenter', stopAutoSlide);
    img.addEventListener('mouseleave', startAutoSlide);
  });
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    buildSlides();
    setupHoverPause();
  }, 300);
});

buildSlides();
setupHoverPause();
