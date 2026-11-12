/* ==========================================================================
   Equita Modern Motion: Three.js 3D Globe, GSAP ScrollTrigger, Lenis & 3D Tilt
   ========================================================================== */

(function () {
  'use strict';

  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.appendChild(bar);

    function updateProgress() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct.toFixed(2) + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  function initLenis() {
    if (typeof window.Lenis === 'undefined') return;
    var lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true
    });

    if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  function init3DTilt() {
    var selectors = [
      '.features .feature-panel',
      '.cases-standard .case-item',
      '.blog-grid .blog-entry',
      '.blog-standard .blog-entry',
      '.services .service-panel',
      '.team .team-member',
      '.awards .award',
      '.testimonial-panel',
      '.about .about-card'
    ];
    var cards = document.querySelectorAll(selectors.join(','));

    cards.forEach(function (card) {
      card.classList.add('tilt-card');

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = rect.width / 2;
        var cy = rect.height / 2;

        var rotateX = ((y - cy) / cy) * -6;
        var rotateY = ((x - cx) / cx) * 6;

        card.style.setProperty('--mouse-x', (x / rect.width) * 100 + '%');
        card.style.setProperty('--mouse-y', (y / rect.height) * 100 + '%');
        card.style.transform =
          'perspective(1000px) rotateX(' +
          rotateX.toFixed(2) +
          'deg) rotateY(' +
          rotateY.toFixed(2) +
          'deg) translateY(-4px)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

  function initMagneticButtons() {
    var buttons = document.querySelectorAll('.slider-1 .btn, .header .module-container .btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.18).toFixed(1) + 'px, ' + (y * 0.18).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  function initThreeGlobe() {
    if (typeof window.THREE === 'undefined') return;
    var hero = document.getElementById('slider-1');
    if (!hero) return;

    var wrap = document.createElement('div');
    wrap.id = 'hero-globe-wrap';
    var canvas = document.createElement('canvas');
    canvas.id = 'hero-globe-canvas';
    wrap.appendChild(canvas);
    hero.appendChild(wrap);

    var THREE = window.THREE;
    var width = wrap.clientWidth || 480;
    var height = wrap.clientHeight || 480;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.z = 3.15;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Wireframe sphere
    var sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    var wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    globeGroup.add(new THREE.Mesh(sphereGeo, wireMat));

    // Dotted surface particles
    var dotsGeo = new THREE.SphereGeometry(1.005, 42, 42);
    var dotsMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.016,
      transparent: true,
      opacity: 0.65
    });
    globeGroup.add(new THREE.Points(dotsGeo, dotsMat));

    // Glowing equatorial & orbital rings
    var ringGeo = new THREE.RingGeometry(1.18, 1.195, 96);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xe11d48,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    ring.rotation.y = 0.25;
    globeGroup.add(ring);

    // Shipping Route Arcs between global ports
    function latLonToVec3(lat, lon, radius) {
      var phi = (90 - lat) * (Math.PI / 180);
      var theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    var routes = [
      [[40.7, -74.0], [51.5, -0.1]],   // New York -> London
      [[51.5, -0.1], [25.2, 55.3]],    // London -> Dubai
      [[25.2, 55.3], [1.3, 103.8]],    // Dubai -> Singapore
      [[1.3, 103.8], [31.2, 121.5]],   // Singapore -> Shanghai
      [[31.2, 121.5], [34.0, -118.2]], // Shanghai -> Los Angeles
      [[34.0, -118.2], [40.7, -74.0]], // LA -> New York
      [[-23.5, -46.6], [51.5, -0.1]]   // Sao Paulo -> London
    ];

    var nodeGeo = new THREE.SphereGeometry(0.024, 12, 12);
    var nodeMat = new THREE.MeshBasicMaterial({ color: 0xfb7185 });

    routes.forEach(function (pair, idx) {
      var start = latLonToVec3(pair[0][0], pair[0][1], 1.01);
      var end = latLonToVec3(pair[1][0], pair[1][1], 1.01);
      var mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(1.36);

      var curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      var points = curve.getPoints(48);
      var arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      var arcMat = new THREE.LineBasicMaterial({
        color: idx % 2 === 0 ? 0xe11d48 : 0x38bdf8,
        transparent: true,
        opacity: 0.78
      });
      globeGroup.add(new THREE.Line(arcGeo, arcMat));

      var n1 = new THREE.Mesh(nodeGeo, nodeMat);
      n1.position.copy(start);
      globeGroup.add(n1);
    });

    // Interactive mouse parallax + drag
    var targetX = 0;
    var targetY = 0;
    var isDragging = false;
    var prevX = 0;
    var prevY = 0;

    canvas.addEventListener('mousedown', function (e) {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    });

    window.addEventListener('mouseup', function () {
      isDragging = false;
    });

    window.addEventListener('mousemove', function (e) {
      if (isDragging) {
        var dx = e.clientX - prevX;
        var dy = e.clientY - prevY;
        globeGroup.rotation.y += dx * 0.008;
        globeGroup.rotation.x += dy * 0.005;
        prevX = e.clientX;
        prevY = e.clientY;
      } else {
        targetX = (e.clientX / window.innerWidth - 0.5) * 0.35;
        targetY = (e.clientY / window.innerHeight - 0.5) * 0.25;
      }
    });

    window.addEventListener('resize', function () {
      var w = wrap.clientWidth;
      var h = wrap.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });

    function animate() {
      requestAnimationFrame(animate);
      if (!isDragging) {
        globeGroup.rotation.y += 0.0028;
        globeGroup.rotation.x += (targetY - globeGroup.rotation.x) * 0.03;
      }
      ring.rotation.z += 0.002;
      renderer.render(scene, camera);
    }
    animate();
  }

  function initGSAPAnimations() {
    if (typeof window.gsap === 'undefined') return;
    var gsap = window.gsap;

    if (typeof window.ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(window.ScrollTrigger);
    }

    // Hero entrance choreography
    gsap.from('.slider-1 .slide-content .slide-headline', {
      y: 42,
      opacity: 0,
      duration: 1.0,
      ease: 'power3.out',
      delay: 0.25
    });

    gsap.from('.slider-1 .slide-content .slide-desc', {
      y: 28,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      delay: 0.45
    });

    gsap.from('.slider-1 .slide-content .slide-buttons', {
      y: 22,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.out',
      delay: 0.62
    });

    if (typeof window.ScrollTrigger === 'undefined') return;

    // Sleek modern scroll intro animations across ALL sections & cards
    var revealGroups = [
      '.services-bar .services-bar-card',
      '.features .feature-panel',
      '.cases-standard .case-item',
      '.clients .client',
      '.blog-grid .blog-entry',
      '.services .service-panel',
      '.team .team-member',
      '.awards .award'
    ];

    revealGroups.forEach(function (selector) {
      var els = document.querySelectorAll(selector);
      if (!els.length) return;
      gsap.from(els, {
        y: 38,
        scale: 0.96,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: els[0],
          start: 'top 88%',
          once: true
        }
      });
    });

    // Section headings & content blocks sleek reveal
    document.querySelectorAll('.heading .heading-subtitle, .heading .heading-title, .heading .heading-desc, .about-block, .cta .contact-card, .vp-footer-grid > div').forEach(function (el) {
      gsap.from(el, {
        y: 28,
        opacity: 0,
        duration: 0.78,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true
        }
      });
    });

    // About section parallax
    var aboutImg = document.querySelector('.about-img-warp');
    if (aboutImg) {
      gsap.to(aboutImg, {
        y: -28,
        ease: 'none',
        scrollTrigger: {
          trigger: '.about',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }
  }

  function initTestimonialCarousel() {
    if (!window.jQuery || !window.jQuery.fn || !window.jQuery.fn.owlCarousel) return;
    var $ = window.jQuery;
    var $carousels = $('.testimonial-carousel');
    if (!$carousels.length) return;

    $carousels.each(function () {
      var $el = $(this);
      if ($el.data('owl.carousel')) {
        $el.trigger('destroy.owl.carousel');
      }
      $el.find('.owl-item.cloned').remove();
      $el.removeClass('owl-loaded owl-drag owl-hidden');
      $el.owlCarousel({
        items: 1,
        stagePadding: 0,
        loop: true,
        margin: 0,
        dots: true,
        nav: false,
        autoplay: true,
        autoplayTimeout: 3200,
        autoplaySpeed: 700,
        smartSpeed: 700,
        autoplayHoverPause: true
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initLenis();
    init3DTilt();
    initMagneticButtons();
    initGSAPAnimations();
  });

  window.addEventListener('load', initTestimonialCarousel);
})();

