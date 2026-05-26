/**
 * Imobiliária Extremo Oriente — Landing Page
 *
 * Main JavaScript module.
 * Security: No use of innerHTML, eval, document.write, or dynamic code execution.
 * All DOM manipulation uses safe APIs (textContent, createElement, classList, etc.)
 * per JS-XSS-001, JS-XSS-002, JS-XSS-003 security guidelines.
 */

import './style.css';

// ═══════════════════════════════════════════════════════════
// HEADER SCROLL EFFECT
// ═══════════════════════════════════════════════════════════
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ═══════════════════════════════════════════════════════════
// MOBILE NAV TOGGLE
// ═══════════════════════════════════════════════════════════
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelector('.nav__links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    navLinks.classList.toggle('open');
  });

  // Close nav when a link is clicked
  const links = navLinks.querySelectorAll('.nav__link');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    });
  });

  // Close nav on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      toggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      toggle.focus();
    }
  });
}

// ═══════════════════════════════════════════════════════════
// COUNTER ANIMATION (Stats in Hero)
// ═══════════════════════════════════════════════════════════
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length === 0) return;

  const duration = 2000; // ms

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;

    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(eased * target);

      // Use textContent (safe API per JS-XSS-001)
      el.textContent = currentValue.toLocaleString('pt-BR');

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

// ═══════════════════════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════════════════════
function initScrollReveal() {
  // Mark elements for reveal animation
  const revealSelectors = [
    '.benefit-card',
    '.property-card',
    '.review-card',
    '.section__header',
    '.download__content',
    '.download__image',
  ];

  const elements = document.querySelectorAll(revealSelectors.join(', '));
  elements.forEach((el) => el.classList.add('reveal'));

  // Add stagger containers
  const grids = document.querySelectorAll('.benefits__grid, .catalog__grid');
  grids.forEach((grid) => grid.classList.add('reveal-stagger'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════
// REVIEWS CAROUSEL
// ═══════════════════════════════════════════════════════════
function initReviewsCarousel() {
  const track = document.getElementById('reviews-track');
  const prevBtn = document.getElementById('reviews-prev');
  const nextBtn = document.getElementById('reviews-next');
  const dotsContainer = document.getElementById('reviews-dots');
  if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

  const cards = track.querySelectorAll('.review-card');
  const totalCards = cards.length;
  let currentIndex = 0;
  let cardsPerView = getCardsPerView();
  let autoPlayInterval = null;

  function getCardsPerView() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function getMaxIndex() {
    return Math.max(0, totalCards - cardsPerView);
  }

  function buildDots() {
    // Use safe DOM APIs instead of innerHTML (JS-XSS-001)
    while (dotsContainer.firstChild) {
      dotsContainer.removeChild(dotsContainer.firstChild);
    }

    const maxIndex = getMaxIndex();
    for (let i = 0; i <= maxIndex; i++) {
      const dot = document.createElement('button');
      dot.className = 'reviews__dot' + (i === currentIndex ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Ir para avaliação ' + (i + 1));
      dot.setAttribute('aria-selected', String(i === currentIndex));

      const dotIndex = i;
      dot.addEventListener('click', () => goTo(dotIndex));
      dotsContainer.appendChild(dot);
    }
  }

  function updateCarousel() {
    const gap = parseInt(getComputedStyle(track).gap, 10) || 24;
    const cardWidth = cards[0].offsetWidth;
    const offset = currentIndex * (cardWidth + gap);
    track.style.transform = 'translateX(-' + offset + 'px)';

    // Update dots
    const dots = dotsContainer.querySelectorAll('.reviews__dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
      dot.setAttribute('aria-selected', String(i === currentIndex));
    });
  }

  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, getMaxIndex()));
    updateCarousel();
    resetAutoPlay();
  }

  function goNext() {
    goTo(currentIndex >= getMaxIndex() ? 0 : currentIndex + 1);
  }

  function goPrev() {
    goTo(currentIndex <= 0 ? getMaxIndex() : currentIndex - 1);
  }

  function resetAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(goNext, 5000);
  }

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);

  // Keyboard navigation (web-design-guidelines: interactive elements need keyboard handlers)
  prevBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goPrev();
    }
  });

  nextBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goNext();
    }
  });

  // Pause autoplay on hover
  track.addEventListener('mouseenter', () => {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
  });

  track.addEventListener('mouseleave', resetAutoPlay);

  // Handle resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      cardsPerView = getCardsPerView();
      currentIndex = Math.min(currentIndex, getMaxIndex());
      buildDots();
      updateCarousel();
    }, 200);
  });

  buildDots();
  updateCarousel();
  resetAutoPlay();
}

// ═══════════════════════════════════════════════════════════
// GOLD PARTICLES (Hero background effect)
// ═══════════════════════════════════════════════════════════
function initParticles() {
  // Respect prefers-reduced-motion (web-design-guidelines)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = document.getElementById('hero-particles');
  if (!container) return;

  const particleCount = 20;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
    const animDuration = Math.random() * 8 + 6;
    const delay = Math.random() * 10;

    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = left + '%';
    particle.style.animationDuration = animDuration + 's';
    particle.style.animationDelay = delay + 's';
    particle.style.opacity = '0';

    container.appendChild(particle);
  }
}

// ═══════════════════════════════════════════════════════════
// SMOOTH SCROLL for anchor links
// ═══════════════════════════════════════════════════════════
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      // Only valid same-page anchors (JS-URL-001: no javascript: URLs)
      if (!href || href === '#') return;

      const target = document.getElementById(href.substring(1));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════
// INITIALIZE ALL
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileNav();
  initCounters();
  initScrollReveal();
  initReviewsCarousel();
  initParticles();
  initSmoothScroll();
});
