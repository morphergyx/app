const productCatalog = {
  tiger: {
    seriesLabel: 'SERIES 01 — LIMITED',
    name: 'TIGER',
    subtitle: 'Apex Predator Edition',
    price: 2049,
    material: 'Japanese Mercerized Cotton',
    fabric: 'Heavyweight 340gsm premium cotton',
    note: 'High contrast graphics sit over a dense cotton body built for repeated wear.',
    images: [
      'public/assets/product-tshirt-tiger.jpg',
      'public/assets/product-tshirt-tiger.jpg',
      'public/assets/product-tshirt-tiger.jpg',
    ],
  },
  hummingbird: {
    seriesLabel: 'SERIES 02 — LIMITED',
    name: 'HUMMINGBIRD',
    subtitle: 'Aerial Drift Edition',
    price: 2049,
    material: 'Technical Modal Blend',
    fabric: 'Feather-soft textile with suspended geometry',
    note: 'A lightweight construction inspired by the subtle motion of a hummingbird in flight.',
    images: [
      'public/assets/product-tshirt-humming-1.jpg',
      'public/assets/product-tshirt-humming-2.jpg',
      'public/assets/product-tshirt-humming-1.jpg',
    ],
  },
  spider: {
    seriesLabel: 'SERIES 03 — LIMITED',
    name: 'SPIDER',
    subtitle: 'The Spider Series',
    price: 2049,
    material: 'Heavyweight Ring-Spun',
    fabric: 'Tensile weave structure with shadow-layered texture',
    note: 'Forged from tensile weave structures and engineered silhouettes.',
    images: [
      'public/assets/product-tshirt-spider.jpg',
      'public/assets/product-tshirt-spider.jpg',
      'public/assets/product-tshirt-spider.jpg',
    ],
  },
  headline: {
    seriesLabel: 'SERIES 04 — LIMITED',
    name: 'HEADLINE',
    subtitle: 'Wear The Edition',
    price: 2049,
    material: '100% Organic Cotton / 280 GSM',
    fabric: 'Crisp structure with premium organic cotton',
    note: 'A study in contrast and concealment, built for late-night city rituals.',
    images: [
      'public/assets/product-tshirt-headline-3.jpg',
      'public/assets/product-tshirt-headline-2.jpg',
      'public/assets/product-tshirt-headline-4.jpg',
    ],
  },
};

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

function getProductKey() {
  const searchParams = new URLSearchParams(window.location.search);
  return String(searchParams.get('product') || 'headline').toLowerCase();
}

function getCurrentProduct() {
  const productKey = getProductKey();
  return productCatalog[productKey] || productCatalog.headline;
}

function renderProduct() {
  const product = getCurrentProduct();
  let activeImageIndex = 0;

  const heroImage = document.getElementById('productHeroImage');
  const thumbList = document.getElementById('productThumbList');
  const seriesLabel = document.getElementById('productSeriesLabel');
  const productName = document.getElementById('productName');
  const productSubtitle = document.getElementById('productSubtitle');
  const productPrice = document.getElementById('productPrice');
  const productMaterial = document.getElementById('productMaterial');
  const productNote = document.getElementById('productNote');
  const productFabric = document.getElementById('productFabric');

  heroImage.src = product.images[0];
  heroImage.alt = `${product.name} product view`;
  seriesLabel.textContent = product.seriesLabel;
  productName.textContent = product.name;
  productSubtitle.textContent = product.subtitle;
  productPrice.textContent = formatCurrencyINR(product.price);
  productMaterial.textContent = product.material;
  productNote.textContent = product.note;
  productFabric.textContent = product.fabric;
  thumbList.innerHTML = '';

  const showProductImage = (index) => {
    activeImageIndex = (index + product.images.length) % product.images.length;
    const src = product.images[activeImageIndex];

    heroImage.src = src;
    heroImage.alt = `${product.name} gallery image ${activeImageIndex + 1}`;
    document.querySelectorAll('.product-thumb').forEach((thumb, thumbIndex) => {
      thumb.classList.toggle('active', thumbIndex === activeImageIndex);
      thumb.setAttribute('aria-pressed', thumbIndex === activeImageIndex ? 'true' : 'false');
    });
  };

  product.images.forEach((src, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `product-thumb ${index === 0 ? 'active' : ''}`;
    button.setAttribute('aria-label', `Show image ${index + 1}`);
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    button.innerHTML = `<img src="${src}" alt="Thumbnail ${index + 1}" />`;
    button.addEventListener('click', () => showProductImage(index));
    thumbList.appendChild(button);
  });

  let touchStartX = 0;
  let touchStartY = 0;

  heroImage.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  heroImage.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    showProductImage(activeImageIndex + (deltaX < 0 ? 1 : -1));
  }, { passive: true });
}

function getSelectedProductSize() {
  return document.querySelector('.product-sizes .size-option.active')?.dataset.size || '';
}

function setupProductSizeSelectors() {
  document.querySelectorAll('.product-sizes').forEach((container) => {
    const buttons = Array.from(container.querySelectorAll('.size-option'));
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const wasActive = button.classList.contains('active');

        buttons.forEach((option) => {
          const isActive = !wasActive && option === button;
          option.classList.toggle('active', isActive);
          option.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
      });
    });
  });
}

class ProductCart {
  constructor() {
    this.items = [];
    this.sidebar = document.getElementById('cart-sidebar');
    this.cartButton = document.querySelector('.nav-cart');
    this.closeButton = document.getElementById('cart-close');
    this.overlay = this.sidebar?.querySelector('.cart-overlay');
    this.cartItemsContainer = document.getElementById('cart-items');
    this.cartEmpty = document.getElementById('cart-empty');
    this.cartFooter = document.getElementById('cart-footer');
    this.cartSubtotal = document.getElementById('cart-subtotal');
    this.cartCount = document.querySelector('.cart-count');
    this.addButton = document.getElementById('productAddToCart');
    this.buyButton = document.getElementById('productBuyNow');
    this.checkoutButton = document.getElementById('cartCheckout');

    this.setupEventListeners();
    this.loadCart();
  }

  setupEventListeners() {
    this.cartButton?.addEventListener('click', () => this.openCart());
    this.closeButton?.addEventListener('click', () => this.closeCart());
    this.overlay?.addEventListener('click', () => this.closeCart());
    this.checkoutButton?.addEventListener('click', () => {
      window.location.href = 'checkout.html';
    });

    this.addButton?.addEventListener('click', () => {
      this.addCurrentProduct(this.addButton);
    });

    this.buyButton?.addEventListener('click', () => {
      const added = this.addCurrentProduct(this.buyButton, { openCart: false, showFeedback: false });
      if (added) {
        window.location.href = 'checkout.html';
      }
    });
  }

  getCurrentCartProduct() {
    const product = getCurrentProduct();
    const selectedSize = getSelectedProductSize();

    if (!selectedSize) {
      alert('Please select a size before adding this item to the cart.');
      return null;
    }

    return {
      name: product.name,
      price: formatCurrencyINR(product.price),
      image: product.images[0],
      size: selectedSize,
    };
  }

  addCurrentProduct(button, options = {}) {
    const product = this.getCurrentCartProduct();
    if (!product) {
      return false;
    }

    this.addItem(product, button, options);
    return true;
  }

  openCart() {
    this.sidebar?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeCart() {
    this.sidebar?.classList.remove('open');
    document.body.style.overflow = '';
  }

  addItem(product, button, options = {}) {
    const { openCart = true, showFeedback = true } = options;
    const existingItem = this.items.find((item) => item.name === product.name && item.size === product.size);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({
        ...product,
        quantity: 1,
        id: Date.now(),
      });
    }

    this.saveCart();
    this.render();

    if (openCart) {
      this.openCart();
    }

    if (showFeedback && button) {
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
    this.items = this.items.filter((item) => item.id !== id);
    this.saveCart();
    this.render();
  }

  updateQuantity(id, change) {
    const item = this.items.find((cartItem) => cartItem.id === id);
    if (!item) {
      return;
    }

    item.quantity += change;
    if (item.quantity <= 0) {
      this.removeItem(id);
      return;
    }

    this.saveCart();
    this.render();
  }

  calculateSubtotal() {
    return this.items.reduce((total, item) => {
      return total + (parseCurrencyValue(item.price) * item.quantity);
    }, 0);
  }

  render() {
    this.updateCartCount();

    if (this.items.length === 0) {
      this.cartEmpty?.classList.remove('hidden');
      this.cartItemsContainer?.classList.remove('visible');
      this.cartFooter?.classList.remove('visible');
      if (this.cartItemsContainer) {
        this.cartItemsContainer.innerHTML = '';
      }
      return;
    }

    this.cartEmpty?.classList.add('hidden');
    this.cartItemsContainer?.classList.add('visible');
    this.cartFooter?.classList.add('visible');

    if (this.cartItemsContainer) {
      this.cartItemsContainer.innerHTML = this.items.map((item) => `
        <div class="cart-item">
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}" />
          </div>
          <div class="cart-item-details">
            <div class="cart-item-header">
              <h3 class="cart-item-name">${item.name}</h3>
              <button class="cart-item-remove" type="button" data-cart-remove="${item.id}">REMOVE</button>
            </div>
            <p class="cart-item-material">PREMIUM COTTON</p>
            ${item.size ? `<p class="cart-item-size">SIZE: ${item.size}</p>` : ''}
            <div class="cart-item-footer">
              <div class="cart-item-quantity">
                <button class="cart-item-qty-btn" type="button" data-cart-quantity="${item.id}" data-cart-change="-1">−</button>
                <span class="cart-item-qty-value">${item.quantity}</span>
                <button class="cart-item-qty-btn" type="button" data-cart-quantity="${item.id}" data-cart-change="1">+</button>
              </div>
              <span class="cart-item-price">${item.price}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    if (this.cartSubtotal) {
      this.cartSubtotal.textContent = formatCurrencyINR(this.calculateSubtotal());
    }
  }

  updateCartCount() {
    const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    if (this.cartCount) {
      this.cartCount.textContent = totalItems;
    }
    this.cartButton?.classList.toggle('has-items', totalItems > 0);
  }

  saveCart() {
    localStorage.setItem('bllugCart', JSON.stringify(this.items));
  }

  loadCart() {
    const saved = localStorage.getItem('bllugCart');
    if (saved) {
      try {
        this.items = JSON.parse(saved).map((item) => ({
          ...item,
          price: formatCurrencyINR(parseCurrencyValue(item.price)),
        }));
      } catch (error) {
        this.items = [];
      }
    }
    this.render();
  }
}

function setupProductNavigation() {
  const nav = document.getElementById('navigation');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!nav || !menuToggle || !mobileMenu) {
    return;
  }

  const setMobileMenuOpen = (isOpen) => {
    mobileMenu.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    menuToggle.querySelectorAll('.hamburger-line').forEach((line) => {
      line.classList.toggle('open', isOpen);
    });
  };

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });

  menuToggle.addEventListener('click', () => {
    setMobileMenuOpen(!mobileMenu.classList.contains('open'));
  });

  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => setMobileMenuOpen(false));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupProductNavigation();
  renderProduct();
  setupProductSizeSelectors();
  window.cart = new ProductCart();

  document.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-cart-remove]');
    if (removeButton) {
      window.cart.removeItem(Number(removeButton.dataset.cartRemove));
      return;
    }

    const quantityButton = event.target.closest('[data-cart-quantity]');
    if (quantityButton) {
      window.cart.updateQuantity(
        Number(quantityButton.dataset.cartQuantity),
        Number(quantityButton.dataset.cartChange)
      );
    }
  });
});
