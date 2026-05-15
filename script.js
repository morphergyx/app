const galleryProducts = [
  {
    name: 'The Headline Series',
    price: 2049,
    material: '100% Organic Cotton / 280 GSM',
    image: 'public/assets/product-tshirt-headline-1.jpg',
    detail: 'public/assets/product-tshirt-headline-1.jpg',
    note: 'A clean daily silhouette with architectural shoulder structure and a crisp drape.',
  },
  {
    name: 'The Tiger Series',
    price: 2049,
    material: 'Japanese Mercerized Cotton',
    image: 'public/assets/product-tshirt-tiger.jpg',
    detail: 'public/assets/product-tshirt-tiger.jpg',
    note: 'High contrast graphics sit over a dense cotton body built for repeated wear.',
  },
  {
    name: 'The Hummingbird Series',
    price: 2049,
    material: 'Technical Modal Blend',
    image: 'public/assets/product-tshirt-humming-1.jpg',
    detail: 'public/assets/product-tshirt-humming-1.jpg',
    note: 'A softer technical hand feel with a close neckline and subtle dimensional print.',
  },
  {
    name: 'The Spider Series',
    price: 2049,
    material: 'Heavyweight Ring-Spun',
    image: 'public/assets/product-tshirt-spider.jpg',
    detail: 'public/assets/product-tshirt-spider.jpg',
    note: 'The campaign anchor piece, styled for the permanent collection archive.',
  },
];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

function formatCurrencyINR(value) {
  return currencyFormatter.format(value);
}

function parseCurrencyValue(value) {
  return parseFloat(String(value).replace(/[^\d.]/g, '')) || 0;
}

function hasGsap() {
  return typeof window.gsap !== 'undefined';
}

function hasScrollTrigger() {
  return hasGsap() && typeof window.ScrollTrigger !== 'undefined';
}

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

class TunnelEffect {
  constructor() {
    this.container = document.getElementById('tunnel-container');
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.tunnels = [];
    this.scroll = { target: 0, current: 0 };
    this.rafId = 0;
    this.completed = false;
  }

  init() {
    if (!this.container) return;
    if (typeof window.THREE === 'undefined') {
      this.container.addEventListener('wheel', () => this.completeNow(), { passive: true });
      this.container.addEventListener('touchstart', () => this.completeNow(), { passive: true });
      this.container.addEventListener('pointerdown', () => this.completeNow(), { passive: true });
      setTimeout(() => this.completeNow(), 3000);
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      1,
      1000
    );
    this.camera.position.z = 1;

    this.scene = new THREE.Scene();

    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const isMobile = width < 768;

    const materialTop = this.getMaterial(isMobile ? 0 : 1);
    const materialBottom = this.getMaterial(isMobile ? 0 : 1);
    const materialLeft = this.getMaterial(3);
    const materialRight = this.getMaterial(2);

    const meshTop = new THREE.Mesh(geometry, materialTop);
    meshTop.position.y = height / 2;
    meshTop.rotation.x = Math.PI / 2;

    const meshBottom = new THREE.Mesh(geometry, materialBottom);
    meshBottom.position.y = -height / 2;
    meshBottom.rotation.x = -Math.PI / 2;

    const meshLeft = new THREE.Mesh(geometry, materialLeft);
    meshLeft.position.x = -width / 2;
    meshLeft.rotation.y = -Math.PI / 2;

    const meshRight = new THREE.Mesh(geometry, materialRight);
    meshRight.position.x = width / 2;
    meshRight.rotation.y = -Math.PI / 2;

    this.scene.add(meshTop, meshBottom, meshLeft, meshRight);
    this.tunnels = [meshTop, meshBottom, meshLeft, meshRight];

    this.container.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    this.container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    this.container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.container.addEventListener('pointerdown', () => this.completeNow(), { passive: true });
    window.addEventListener('resize', () => this.handleResize());

    this.render();
  }

  completeNow() {
    if (this.completed) return;
    this.completed = true;
    this.scroll.target = 1;
    this.scroll.current = 1;
    this.tunnels.forEach((tunnel) => {
      tunnel.material.uniforms.uProgress.value = 1;
      tunnel.material.uniforms.uTime.value = performance.now() * 0.001;
    });
    this.container.style.transition = 'opacity 0.75s ease-out';
    this.container.style.opacity = '0';
    setTimeout(() => {
      this.container.classList.add('hidden');
      if (typeof window.tunnelComplete === 'function') {
        window.tunnelComplete();
      }
    }, 750);
  }

  getMaterial(direction) {
    const textureLoader = new THREE.TextureLoader();
    const tex1 = textureLoader.load('public/assets/tunnel-base.jpg');
    const tex2 = textureLoader.load('public/assets/hero-reveal.jpg');
    tex1.minFilter = THREE.LinearFilter;
    tex1.magFilter = THREE.LinearFilter;
    tex2.minFilter = THREE.LinearFilter;
    tex2.magFilter = THREE.LinearFilter;

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = direction < 2 ? this.getFragmentShaderWipe() : this.getFragmentShaderColor();

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uProgress: { value: 0.0 },
        uShift: { value: 0.0 },
        uDirection: { value: direction },
        uTexture: { value: tex1 },
        uTexture2: { value: tex2 },
        uColor1: { value: new THREE.Color('#FFFFFF') },
        uColor2: { value: new THREE.Color('#FFFFFF') },
      },
      transparent: false,
      side: THREE.DoubleSide,
    });
  }

  getFragmentShaderWipe() {
    return `
      precision highp float;
      uniform float uTime;
      uniform float uProgress;
      uniform float uShift;
      uniform float uDirection;
      uniform sampler2D uTexture;
      varying vec2 vUv;

      float expo(float x) {
        return x == 0.0 ? 0.0 : pow(2.0, 10.0 * x - 10.0);
      }

      void main() {
        float progress = uProgress;
        progress = expo(progress);
        float x = vUv.x;
        float y = vUv.y;

        if (uDirection == 0.0) {
          y = (y - 0.5) / ((1.0 - progress)) + 0.5;
        } else if (uDirection == 1.0) {
          x = (x - 0.5) / ((1.0 - progress)) + 0.5;
        } else if (uDirection == 2.0) {
          y = (y - 0.5) / ((1.0 - progress)) + 0.5;
        } else if (uDirection == 3.0) {
          x = (x - 0.5) / ((1.0 - progress)) + 0.5;
        }

        vec4 color = texture2D(uTexture, vec2(x, y));
        gl_FragColor = color;
      }
    `;
  }

  getFragmentShaderColor() {
    return `
      precision highp float;
      uniform float uTime;
      uniform float uProgress;
      uniform float uShift;
      uniform sampler2D uTexture;
      uniform sampler2D uTexture2;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying vec2 vUv;

      float expo(float x) {
        return x == 0.0 ? 0.0 : pow(2.0, 10.0 * x - 10.0);
      }

      float cubicOut(float t) {
        float f = t - 1.0;
        return f * f * f + 1.0;
      }

      void main() {
        float progress = uProgress;
        progress = expo(progress);
        float y = vUv.y;
        float x = vUv.x;

        float sine = sin((uTime * 0.2 + vUv.y) * 10.0) * uShift;
        float finalShift = mix(uShift, 0.0, progress) + mix(-0.2, 0.0, cubicOut(progress)) * sine;

        x += finalShift;
        y = 1.0 - y;
        x = mix(vUv.x, x, cubicOut(progress));

        vec4 color = texture2D(uTexture, vec2(x, y));
        vec4 color2 = texture2D(uTexture2, vec2(x, y));
        vec3 color1 = mix(uColor1, uColor2, vUv.y);

        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        vec3 grayscale = vec3(gray);
        color.rgb = mix(color.rgb, grayscale, progress);
        color = mix(color, color2, progress);
        gl_FragColor = color;
      }
    `;
  }

  handleWheel(e) {
    e.preventDefault();
    this.completeNow();
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    this.container._touchStartY = touch.clientY;
  }

  handleTouchMove(e) {
    e.preventDefault();
    this.completeNow();
  }

  handleResize() {
    if (!this.renderer || !this.camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.left = w / -2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = h / -2;
    this.camera.updateProjectionMatrix();

    if (this.tunnels.length >= 4) {
      this.tunnels[0].position.y = h / 2;
      this.tunnels[1].position.y = -h / 2;
      this.tunnels[2].position.x = -w / 2;
      this.tunnels[3].position.x = w / 2;
    }
  }

  render() {
    this.rafId = requestAnimationFrame(() => this.render());

    this.scroll.current += (this.scroll.target - this.scroll.current) * 0.05;
    let velocity = Math.min(this.scroll.current, 1);
    velocity = Math.max(velocity, 0);
    velocity *= 0.7;

    this.tunnels.forEach((tunnel) => {
      tunnel.material.uniforms.uProgress.value = velocity;
      tunnel.material.uniforms.uTime.value = performance.now() * 0.001;
    });

    this.renderer.render(this.scene, this.camera);

    if (this.scroll.current > 0.95 && !this.completed) {
      this.completed = true;
      this.container.style.transition = 'opacity 1s ease-out';
      this.container.style.opacity = '0';
      setTimeout(() => {
        this.container.classList.add('hidden');
        window.tunnelComplete();
      }, 1000);
    }
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

class Navigation {
  constructor() {
    this.nav = document.getElementById('navigation');
    this.menuToggle = document.getElementById('menu-toggle');
    this.mobileMenu = document.getElementById('mobile-menu');
    this.mobileMenuOpen = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    this.menuToggle.addEventListener('click', () => this.toggleMobileMenu());
    document.querySelectorAll('.mobile-nav-link').forEach((link) => {
      link.addEventListener('click', () => this.toggleMobileMenu());
    });
  }

  handleScroll() {
    if (window.scrollY > 80) {
      this.nav.classList.add('scrolled');
    } else {
      this.nav.classList.remove('scrolled');
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      this.mobileMenu.classList.add('open');
      const lines = this.menuToggle.querySelectorAll('.hamburger-line');
      lines[0].classList.add('open');
      lines[1].classList.add('open');
    } else {
      this.mobileMenu.classList.remove('open');
      const lines = this.menuToggle.querySelectorAll('.hamburger-line');
      lines[0].classList.remove('open');
      lines[1].classList.remove('open');
    }
  }

  show() {
    this.nav.classList.remove('hidden');
    this.nav.classList.add('visible');
  }
}

function updateCartCount(count) {
  const cartButton = document.querySelector('.nav-cart');
  const cartCount = document.querySelector('.cart-count');
  
  cartCount.textContent = count;
  
  if (count > 0) {
    cartButton.classList.add('has-items');
  } else {
    cartButton.classList.remove('has-items');
  }
}


function setupHeroAnimations() {
  if (!hasGsap()) return;
  if (hasScrollTrigger()) {
    gsap.registerPlugin(ScrollTrigger);
  }
  const heroTitle = document.querySelector('.hero-title');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  const heroImage = document.querySelector('.hero-image');
  const heroCta = document.querySelector('.hero-cta');

  const tl = gsap.timeline({ delay: 0.3 });

  tl.fromTo(
    heroTitle,
    { y: 60, opacity: 0, clipPath: 'inset(100% 0 0 0)' },
    { y: 0, opacity: 1, clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power3.out' }
  )
    .fromTo(
      heroSubtitle,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
      '-=0.6'
    )
    .fromTo(
      heroImage,
      { scale: 1.1, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.4, ease: 'power2.out' },
      '-=1'
    )
    .fromTo(
      heroCta,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      '-=0.4'
    );
}

function setupHeroInteractiveImage() {
  const heroImageWrapper = document.querySelector('.hero-image-container');
  const heroImage = heroImageWrapper?.querySelector('img');
  if (!heroImageWrapper || !heroImage) return;

  const maxTilt = 8;
  const maxShift = 8;

  function updateImageTransform(event) {
    const rect = heroImageWrapper.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const rotateY = (x - 0.5) * maxTilt;
    const rotateX = -(y - 0.5) * maxTilt;
    const translateX = (x - 0.5) * maxShift;
    const translateY = (y - 0.5) * maxShift;

    heroImage.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  }

  function resetImage() {
    heroImage.style.transform = 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) scale(1)';
  }

  heroImageWrapper.addEventListener('pointermove', updateImageTransform);
  heroImageWrapper.addEventListener('pointerleave', resetImage);
  heroImageWrapper.addEventListener('pointerenter', () => {
    heroImage.style.transition = 'transform 0.25s ease-out';
  });
}

function setupLaunchImageCarousels() {
  document.querySelectorAll('[data-launch-carousel]').forEach((carousel) => {
    const images = Array.from(carousel.querySelectorAll('.launch-visual-image'));
    const prevButton = carousel.querySelector('[data-carousel-prev]');
    const nextButton = carousel.querySelector('[data-carousel-next]');
    if (images.length < 2 || !prevButton || !nextButton) return;

    let activeIndex = images.findIndex((image) => image.classList.contains('active'));
    if (activeIndex < 0) activeIndex = 0;
    let pointerStartX = null;

    const dotContainer = document.createElement('div');
    dotContainer.className = 'launch-carousel-dots';
    dotContainer.setAttribute('aria-label', 'Carousel image pagination');
    const dots = images.map((_, dotIndex) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'launch-carousel-dot';
      dot.setAttribute('aria-label', `Show image ${dotIndex + 1}`);
      dot.addEventListener('click', (event) => {
        event.stopPropagation();
        setActiveImage(dotIndex);
      });
      dotContainer.appendChild(dot);
      return dot;
    });
    carousel.appendChild(dotContainer);

    function setActiveImage(index) {
      activeIndex = (index + images.length) % images.length;
      images.forEach((image, imageIndex) => {
        image.classList.toggle('active', imageIndex === activeIndex);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === activeIndex);
      });
    }

    function showPrevious() {
      setActiveImage(activeIndex - 1);
    }

    let previewTimeout = null;
    let previewActive = false;

    function clearPreview() {
      if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
      }
      previewActive = false;
    }

    function playPreview() {
      if (previewActive || images.length < 2) return;
      previewActive = true;
      const baseIndex = activeIndex;
      const previewIndex = (activeIndex + 1) % images.length;
      setActiveImage(previewIndex);
      previewTimeout = window.setTimeout(() => {
        setActiveImage(baseIndex);
        previewActive = false;
      }, 900);
    }

    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === carousel && entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          playPreview();
        }
      });
    }, {
      threshold: [0.35],
    });
    visibilityObserver.observe(carousel);

    function showNext() {
      clearPreview();
      setActiveImage(activeIndex + 1);
    }

    prevButton.addEventListener('click', (event) => {
      event.stopPropagation();
      clearPreview();
      showPrevious();
    });

    nextButton.addEventListener('click', (event) => {
      event.stopPropagation();
      clearPreview();
      showNext();
    });

    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPrevious();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNext();
      }
    });

    carousel.addEventListener('pointerdown', (event) => {
      pointerStartX = event.clientX;
    });

    carousel.addEventListener('pointerup', (event) => {
      if (pointerStartX === null) return;
      const distance = event.clientX - pointerStartX;
      pointerStartX = null;

      if (Math.abs(distance) < 42) return;
      if (distance > 0) {
        showPrevious();
      } else {
        showNext();
      }
    });

    carousel.setAttribute('tabindex', '0');
    setActiveImage(activeIndex);
  });
}

class GalleryCarousel {
  constructor() {
    this.carousel = document.getElementById('gallery-carousel');
    this.galleryData = document.getElementById('gallery-data');
    this.items = [];
    this.dataItems = [];
    this.offset = 0;
    this.speed = 0.8;
    this.rafId = 0;
    this.setupCarousel();
    this.setupGalleryData();
    this.startAnimation();
  }

  setupCarousel() {
    galleryProducts.forEach((product, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `
        <div class="gallery-item-image">
          <img src="${product.detail}" alt="${product.name}" />
        </div>
      `;
      this.carousel.appendChild(item);
      this.items.push(item);
    });

    this.items.forEach((item, index) => {
      item.style.transform = `translate3d(${index * 344}px, -50%, 0)`;
    });
  }

  setupGalleryData() {
    galleryProducts.forEach((product, index) => {
      const dataElement = document.createElement('div');
      dataElement.className = `gallery-item-data${index === 0 ? ' active' : ''}`;
      dataElement.innerHTML = `
        <div class="gallery-item-data-header">
          <div>
            <h3 class="gallery-item-name">${product.name}</h3>
            <p class="gallery-item-material">${product.material}</p>
            <p class="gallery-item-note">${product.note}</p>
          </div>
          <div>
            <p class="gallery-item-price">${formatCurrencyINR(product.price)}</p>
            <p class="gallery-item-usd">INR</p>
          </div>
        </div>
        <div class="gallery-item-divider"></div>
      `;
      dataElement.addEventListener('mouseenter', () => this.setActive(index));
      dataElement.addEventListener('focus', () => this.setActive(index));
      dataElement.addEventListener('click', () => this.setActive(index));
      this.galleryData.appendChild(dataElement);
      this.dataItems.push(dataElement);
    });

    if (!hasGsap()) return;

    gsap.fromTo(
      '.gallery-item-data',
      { x: 40, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.gallery-section',
          start: 'top 80%',
          end: 'top 40%',
          scrub: false,
          once: true,
        },
      }
    );
  }

  setActive(index) {
    this.dataItems.forEach((item, itemIndex) => {
      item.classList.toggle('active', itemIndex === index);
    });
    const itemWidth = this.getItemWidth();
    this.offset = index * itemWidth;
  }

  startAnimation() {
    window.addEventListener('scroll', () => this.updateSpeed(), { passive: true });
    this.render();
  }

  updateSpeed() {
    const section = document.querySelector('.gallery-section');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const sectionCenter = rect.top + rect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const dist = Math.abs(sectionCenter - viewportCenter);
    const maxDist = window.innerHeight + rect.height;
    const normalized = 1 - Math.min(dist / maxDist, 1);
    this.speed = 0.5 + normalized * 1.5;
  }

  getX(element) {
    const rect = element.getBoundingClientRect();
    return (rect.left + rect.right) / 2 + window.scrollX;
  }

  render() {
    this.rafId = requestAnimationFrame(() => this.render());
    if (!this.items.length) return;
    const containerRect = this.carousel.getBoundingClientRect();
    const center = containerRect.width / 2;
    const itemWidth = this.getItemWidth();
    const totalWidth = itemWidth * this.items.length;
    this.offset += this.speed;

    this.items.forEach((item, index) => {
      let x = (index * itemWidth - this.offset) % totalWidth;
      if (x < -itemWidth) x += totalWidth;
      if (x > containerRect.width + itemWidth) x -= totalWidth;

      const itemCenter = x + item.offsetWidth / 2;
      const dist = Math.abs(center - itemCenter);
      const normalized = Math.min(dist / Math.max(containerRect.width, 1), 1);
      const scale = 1 - normalized * 0.18;
      const rotate = (center - itemCenter) * 0.035;
      const z = -normalized * 120;

      item.style.opacity = normalized > 0.92 ? '0.58' : '1';
      item.style.filter = normalized > 0.72 ? 'saturate(0.65)' : 'saturate(1)';
      item.style.transform = `translate3d(${x}px, -50%, ${z}px) rotateY(${rotate}deg) scale(${scale})`;
    });
  }

  getItemWidth() {
    const firstItem = this.items[0];
    return (firstItem ? firstItem.offsetWidth : 320) + 24;
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
  }
}

function setupNewsletter() {
  const form = document.getElementById('newsletter-form');
  const input = document.getElementById('newsletter-input');
  const button = form.querySelector('.newsletter-btn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
      const originalText = button.textContent;
      button.textContent = 'JOINED';
      input.value = '';
      setTimeout(() => {
        button.textContent = originalText;
      }, 3000);
    }
  });
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (link.hasAttribute('data-cart-add')) return;
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  window.startLenis = function () {};
}

function setupSizeSelectors() {
  document.querySelectorAll('.launch-sizes').forEach((container) => {
    const buttons = Array.from(container.querySelectorAll('.size-option'));
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const wasActive = button.classList.contains('active');
        
        if (wasActive) {
          // Deselect if already selected
          button.classList.remove('active');
          button.setAttribute('aria-pressed', 'false');
        } else {
          // Select this button and deselect others
          buttons.forEach((option) => {
            option.classList.toggle('active', option === button);
            option.setAttribute('aria-pressed', option === button ? 'true' : 'false');
          });
        }
        
        const addButton = container.closest('.launch-copy-body')?.querySelector('[data-cart-add]');
        if (addButton) {
          const hasSelection = container.querySelector('.size-option.active');
          if (hasSelection) {
            addButton.classList.remove('disabled');
            addButton.removeAttribute('aria-disabled');
          } else {
            addButton.classList.add('disabled');
            addButton.setAttribute('aria-disabled', 'true');
          }
        }
      });
    });
  });
}

function getSelectedSize(button) {
  const section = button.closest('.launch-copy-body');
  return section?.querySelector('.size-option.active')?.dataset.size || '';
}

let cart;

function init() {
  if (document.body.classList.contains('intro-active')) {
    window.scrollTo(0, 0);
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  const navigation = new Navigation();

  window.tunnelComplete = function () {
    document.body.classList.remove('intro-active');
    if (navigation) {
      navigation.show();
    }
    const mainContent = document.getElementById('main-content');
    mainContent.classList.add('visible');
    if (window.startLenis) {
      window.startLenis();
    }
    setTimeout(() => {
      setupHeroAnimations();
      setupHeroInteractiveImage();
    }, 100);
  };

  setupSmoothScroll();
  const tunnel = new TunnelEffect();
  tunnel.init();
  setupLaunchImageCarousels();
  setupSizeSelectors();
  const galleryCarousel = new GalleryCarousel();
  setupNewsletter();

  // Initialize cart
  cart = new ShoppingCart();
  window.cart = cart;

  setTimeout(() => {
    if (tunnel && !tunnel.completed) {
      tunnel.completeNow();
    }
  }, 4500);

  window.addEventListener('beforeunload', () => {
    if (galleryCarousel) {
      galleryCarousel.destroy();
    }
  });
}

// Cart functionality
class ShoppingCart {
  constructor() {
    this.items = [];
    this.sidebar = document.getElementById('cart-sidebar');
    this.cartButton = document.querySelector('.nav-cart');
    this.closeButton = document.getElementById('cart-close');
    this.overlay = this.sidebar.querySelector('.cart-overlay');
    this.cartItemsContainer = document.getElementById('cart-items');
    this.cartEmpty = document.getElementById('cart-empty');
    this.cartFooter = document.getElementById('cart-footer');
    this.cartSubtotal = document.getElementById('cart-subtotal');
    this.cartCount = document.querySelector('.cart-count');
     
    this.setupEventListeners();
    this.loadCart();
   
  }
  
  setupEventListeners() {
    this.cartButton.addEventListener('click', () => this.openCart());
    this.closeButton.addEventListener('click', () => this.closeCart());
    this.overlay.addEventListener('click', () => this.closeCart());
    
    // Add to cart buttons
    document.addEventListener('click', (e) => {
      const launchButton = e.target.closest('[data-cart-add]');
      if (launchButton) {
        e.preventDefault();
        const selectedSize = getSelectedSize(launchButton);
        if (!selectedSize) {
          alert('Please select a size before adding this item to the cart.');
          return;
        }
        this.addItem({
          name: launchButton.dataset.name,
          price: launchButton.dataset.price,
          image: launchButton.dataset.image,
          size: selectedSize,
        }, launchButton);
        return;
      }

      if (e.target.classList.contains('product-add-btn')) {
        const card = e.target.closest('.product-card');
        const name = card.querySelector('.product-name').textContent;
        const price = card.querySelector('.product-price').textContent;
        const image = card.querySelector('.product-image').src;
        
        this.addItem({ name, price, image }, e.target);
      }
    });
  }

  openCart() {
    this.sidebar.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeCart() {
    this.sidebar.classList.remove('open');
    document.body.style.overflow = '';
  }

  addItem(product, button) {
    const existingItem = this.items.find(item => item.name === product.name);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({
        ...product,
        quantity: 1,
        id: Date.now()
      });
    }
    
    this.saveCart();
    this.render();
    this.openCart();
    
    // Show feedback
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'ADDED';
      button.style.backgroundColor = '#28a745';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
      }, 1000);
    }
  }

  removeItem(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.saveCart();
    this.render();
  }

  updateQuantity(id, change) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      item.quantity += change;
      if (item.quantity <= 0) {
        this.removeItem(id);
      } else {
        this.saveCart();
        this.render();
      }
    }
  }

  calculateSubtotal() {
    return this.items.reduce((total, item) => {
      const price = parseCurrencyValue(item.price);
      return total + (price * item.quantity);
    }, 0);
  }

  render() {
    this.updateCartCount();
    
    if (this.items.length === 0) {
      this.cartEmpty.classList.remove('hidden');
      this.cartItemsContainer.classList.remove('visible');
      this.cartFooter.classList.remove('visible');
      return;
    }
    
    this.cartEmpty.classList.add('hidden');
    this.cartItemsContainer.classList.add('visible');
    this.cartFooter.classList.add('visible');
    
    this.cartItemsContainer.innerHTML = this.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <div class="cart-item-details">
          <div class="cart-item-header">
            <h3 class="cart-item-name">${item.name}</h3>
            <button class="cart-item-remove" onclick="cart.removeItem(${item.id})">REMOVE</button>
          </div>
          <p class="cart-item-material">PREMIUM COTTON</p>
          ${item.size ? `<p class="cart-item-size">SIZE: ${item.size}</p>` : ''}
          <div class="cart-item-footer">
            <div class="cart-item-quantity">
              <button class="cart-item-qty-btn" onclick="cart.updateQuantity(${item.id}, -1)">−</button>
              <span class="cart-item-qty-value">${item.quantity}</span>
              <button class="cart-item-qty-btn" onclick="cart.updateQuantity(${item.id}, 1)">+</button>
            </div>
            <span class="cart-item-price">${item.price}</span>
          </div>
        </div>
      </div>
    `).join('');
    
    const subtotal = this.calculateSubtotal();
    this.cartSubtotal.textContent = formatCurrencyINR(subtotal);
  }

  updateCartCount() {
    const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.cartCount.textContent = totalItems;
    
    if (totalItems > 0) {
      this.cartButton.classList.add('has-items');
    } else {
      this.cartButton.classList.remove('has-items');
    }
  }

  saveCart() {
    localStorage.setItem('bllugCart', JSON.stringify(this.items));
  }

  loadCart() {
    const saved = localStorage.getItem('bllugCart');
    if (saved) {
      this.items = JSON.parse(saved).map((item) => ({
        ...item,
        price: formatCurrencyINR(parseCurrencyValue(item.price)),
      }));
      this.render();
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

