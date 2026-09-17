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
      if (heroBgLogo && e.scroll < 900) {
        heroBgLogo.style.transform = `translate3d(0, ${e.scroll * 0.28}px, 0)`;
      }
    });
  } else {
    // Fallback Scroll Parallax
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (heroBgLogo && scrolled < 900) {
        heroBgLogo.style.transform = `translate3d(0, ${scrolled * 0.28}px, 0)`;
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
});
