// Raquel Guzzi — Interactive Features & Lenis Inertia Scrolling

document.addEventListener('DOMContentLoaded', () => {
  const heroBgLogo = document.getElementById('heroBgLogo');

  // 1. Lenis Smooth Inertia Scrolling Integration
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Scroll-only Parallax for Hero Background Logo synced with Lenis frame
    lenis.on('scroll', (e) => {
      const wrapper = document.querySelector('.hero-bg-logo-wrapper');
      if (wrapper && e.scroll < 900) {
        const isMobile = window.innerWidth <= 576;
        const offset = e.scroll * 0.28;
        if (isMobile) {
          wrapper.style.transform = `translate(50%, calc(-50% + ${offset}px))`;
        } else {
          wrapper.style.transform = `translateY(calc(-50% + ${offset}px))`;
        }
      }
    });
  } else {
    // Fallback Scroll Parallax
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const wrapper = document.querySelector('.hero-bg-logo-wrapper');
      if (wrapper && scrolled < 900) {
        const isMobile = window.innerWidth <= 576;
        const offset = scrolled * 0.28;
        if (isMobile) {
          wrapper.style.transform = `translate(50%, calc(-50% + ${offset}px))`;
        } else {
          wrapper.style.transform = `translateY(calc(-50% + ${offset}px))`;
        }
      }
    }, { passive: true });
  }

  // 2. IntersectionObserver for Reveal on Scroll
  const revealElements = document.querySelectorAll('.reveal');
  
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -30px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('active'));
  }

  // 3. Trajetória Modal Interaction
  const btnTrajetoria = document.getElementById('btnTrajetoria');
  const modalTrajetoria = document.getElementById('modalTrajetoria');
  const modalClose = document.getElementById('modalClose');

  if (btnTrajetoria && modalTrajetoria) {
    btnTrajetoria.addEventListener('click', (e) => {
      e.preventDefault();
      modalTrajetoria.classList.add('active');
      if (lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
    });

    const closeModal = () => {
      modalTrajetoria.classList.remove('active');
      if (lenis) lenis.start();
      document.body.style.overflow = '';
    };

    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    modalTrajetoria.addEventListener('click', (e) => {
      if (e.target === modalTrajetoria) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalTrajetoria.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // 4. Touch Drag Control for Infinite Carousel
  const carouselWrapper = document.querySelector('.carousel-track-wrapper');
  const carouselTrack  = document.querySelector('.carousel-track');

  if (carouselWrapper && carouselTrack) {
    let isDragging   = false;
    let isJSMode     = false; // once true, JS drives the scroll forever
    let currentX     = 0;
    let velocity     = 0;
    let lastX        = 0;
    let lastTime     = 0;
    let animationId  = null;

    // ~1.2 px/frame ≈ matches the 28s CSS animation at 60fps
    const AUTO_SPEED = -1.2;

    function getHalfWidth() {
      return carouselTrack.scrollWidth / 2;
    }

    // Keep position within the seamless loop range
    function wrap(x) {
      const half = getHalfWidth();
      if (x > 0)     x -= half;
      if (x <= -half) x += half;
      return x;
    }

    // Read the live translateX from the CSS animation
    function getComputedX() {
      const matrix = new DOMMatrixReadOnly(window.getComputedStyle(carouselTrack).transform);
      return matrix.m41;
    }

    // Switch from CSS animation to JS-driven scroll (one-time)
    function enterJSMode() {
      if (isJSMode) return;
      currentX = wrap(getComputedX());
      carouselTrack.style.animation = 'none';
      carouselTrack.style.transform = `translateX(${currentX}px)`;
      isJSMode = true;
    }

    function stopRAF() {
      if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    }

    // Continuous auto-scroll (replaces CSS animation permanently after first touch)
    function startAutoScroll() {
      stopRAF();
      function tick() {
        if (isDragging) return;
        currentX = wrap(currentX + AUTO_SPEED);
        carouselTrack.style.transform = `translateX(${currentX}px)`;
        animationId = requestAnimationFrame(tick);
      }
      animationId = requestAnimationFrame(tick);
    }

    // Momentum glide after finger is lifted, then hands off to auto-scroll
    function startMomentum() {
      stopRAF();
      let vel = velocity;
      function tick() {
        if (Math.abs(vel) < 0.2) {
          startAutoScroll();
          return;
        }
        currentX = wrap(currentX + vel);
        carouselTrack.style.transform = `translateX(${currentX}px)`;
        vel *= 0.94; // friction
        animationId = requestAnimationFrame(tick);
      }
      animationId = requestAnimationFrame(tick);
    }

    // ── Touch events ──────────────────────────────────────────
    carouselWrapper.addEventListener('touchstart', (e) => {
      enterJSMode();
      stopRAF();
      isDragging = true;
      lastX      = e.touches[0].clientX;
      lastTime   = Date.now();
      velocity   = 0;
    }, { passive: true });

    carouselWrapper.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const x   = e.touches[0].clientX;
      const now = Date.now();
      const dt  = Math.max(now - lastTime, 1);

      const delta = x - lastX;
      velocity    = (delta / dt) * 16; // normalize to ~60fps frame
      currentX    = wrap(currentX + delta);
      carouselTrack.style.transform = `translateX(${currentX}px)`;

      lastX    = x;
      lastTime = now;
    }, { passive: true });

    carouselWrapper.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      startMomentum();
    }, { passive: true });

    carouselWrapper.addEventListener('touchcancel', () => {
      isDragging = false;
      startAutoScroll();
    }, { passive: true });

    // ── Hover pause (desktop) — works in both CSS and JS modes ─
    carouselWrapper.addEventListener('mouseenter', () => {
      if (isJSMode) stopRAF();
      // CSS mode: handled by the existing :hover rule in CSS
    });
    carouselWrapper.addEventListener('mouseleave', () => {
      if (isJSMode && !isDragging) startAutoScroll();
    });
  }
});
