// ─── PASTE YOUR DEPLOYED APPS SCRIPT URL HERE ───────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwCxDWvyjFN4zVIUjp_ADWBPnJJz5XdrWKmDOptYmKDn4UrcbQR63trHq6948js-PXK/exec";
// ────────────────────────────────────────────────────────────

let currentStep = 1;
const totalSteps = 4;

const formData = {
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India'
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

// Initialize checkout
document.addEventListener('DOMContentLoaded', function() {
  loadCartSummary();
  setupFormListeners();
  updateProgressBar();
});

function setupFormListeners() {
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', (e) => {
      formData[e.target.id] = e.target.value;
    });
    input.addEventListener('blur', (e) => {
      validateField(e.target);
    });
  });
}

function validateField(field) {
  const value = field.value.trim();
  let isValid = true;

  if (field.id === 'email' && value) {
    isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  if (field.id === 'phone' && value) {
    isValid = /^[\d\s+\-()]+$/.test(value) && value.replace(/\D/g, '').length >= 10;
  }
  if (field.id === 'postalCode' && value) {
    isValid = /^\d{5,6}$/.test(value);
  }

  field.style.borderColor = isValid || !value ? 'var(--subtlegray)' : '#ff4757';
  return isValid;
}

function nextStep() {
  if (validateCurrentStep()) {
    if (currentStep === 3) {
      completeOrder();
    } else if (currentStep < totalSteps) {
      currentStep++;
      updateUI();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

function previousStep() {
  if (currentStep > 1) {
    currentStep--;
    updateUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function validateCurrentStep() {
  const fields = getStepFields(currentStep);
  let isValid = true;

  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const value = field.value.trim();
    if (!value) {
      isValid = false;
      field.style.borderColor = '#ff4757';
    } else if (!validateField(field)) {
      isValid = false;
    }
  });

  if (!isValid) {
    showNotification('Please complete all required fields correctly');
  }

  return isValid;
}

function getStepFields(step) {
  switch(step) {
    case 1: return ['email', 'phone'];
    case 2: return ['firstName', 'lastName', 'address', 'city', 'state', 'postalCode', 'country'];
    case 3: return [];
    default: return [];
  }
}

function updateUI() {
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });
  document.getElementById(`step-${currentStep}`).classList.add('active');
  updateProgressBar();
  updateNavigationButtons();
}

function updateProgressBar() {
  document.querySelectorAll('.progress-step').forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.remove('active', 'completed');
    if (stepNum === currentStep) {
      step.classList.add('active');
    } else if (stepNum < currentStep) {
      step.classList.add('completed');
    }
  });
}

function updateNavigationButtons() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const formNav = document.getElementById('formNav');

  prevBtn.style.display = currentStep === 1 ? 'none' : 'flex';
  nextBtn.textContent = currentStep === 3 ? 'COMPLETE ORDER' : 'CONTINUE';
  formNav.style.display = currentStep === 4 ? 'none' : 'flex';

  // Show loading state on nextBtn when submitting
  if (currentStep === 3) {
    nextBtn.dataset.defaultText = 'COMPLETE ORDER';
  }
}

function loadCartSummary() {
  const cartItems = getCartItems();
  const summaryContainer = document.getElementById('summaryItems');
  const subtotalElement = document.getElementById('summarySubtotal');
  const totalElement = document.getElementById('summaryTotal');

  if (!cartItems || cartItems.length === 0) {
    summaryContainer.innerHTML = '<div class="empty-cart-message"><p>YOUR CART IS EMPTY</p></div>';
    subtotalElement.textContent = '₹0.00';
    totalElement.textContent = '₹0.00';
    return;
  }

  summaryContainer.innerHTML = cartItems.map(item => `
    <div class="summary-item">
      <div class="summary-item-image">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div class="summary-item-details">
        <div class="summary-item-name">${item.name}</div>
        <div class="summary-item-material">PREMIUM COTTON</div>
        <div class="summary-item-footer">
          <div class="summary-item-qty">QTY: ${item.quantity}</div>
          <div class="summary-item-price">${item.price}</div>
        </div>
      </div>
    </div>
  `).join('');

  const subtotal = calculateSubtotal(cartItems);
  subtotalElement.textContent = formatCurrencyINR(subtotal);
  totalElement.textContent = formatCurrencyINR(subtotal);
}

function getCartItems() {
  const cart = localStorage.getItem('bllugCart');
  if (!cart) return [];
  return JSON.parse(cart).map((item) => ({
    ...item,
    price: formatCurrencyINR(parseCurrencyValue(item.price)),
  }));
}

function getRawCartItems() {
  // Returns cart items with numeric prices for the API payload
  const cart = localStorage.getItem('bllugCart');
  if (!cart) return [];
  return JSON.parse(cart).map((item) => ({
    ...item,
    priceRaw: parseCurrencyValue(item.price),
    price: formatCurrencyINR(parseCurrencyValue(item.price)),
  }));
}

function calculateSubtotal(items) {
  return items.reduce((total, item) => {
    const price = parseCurrencyValue(item.price);
    return total + (price * item.quantity);
  }, 0);
}

async function completeOrder() {
  const nextBtn = document.getElementById('nextBtn');
  nextBtn.textContent = 'SENDING...';
  nextBtn.disabled = true;

  try {
    const cartItems = getRawCartItems();
    const subtotal  = calculateSubtotal(cartItems);

    // Sync all field values into formData (in case input events were missed)
    ['email','phone','firstName','lastName','address','city','state','postalCode','country']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) formData[id] = el.value.trim();
      });

    const payload = {
      ...formData,
      items:    cartItems,
      subtotal: subtotal,
      total:    subtotal,   // No extra charges — free shipping
    };

    const response = await fetch(APPS_SCRIPT_URL, {
      method:  'POST',
      // Apps Script requires no-cors OR a CORS-enabled endpoint.
      // Using no-cors means we can't read the response body, which is fine —
      // the email sends either way. Switch to 'cors' if you enable CORS in the script.
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    // With no-cors mode response is opaque — treat any response as success.
    onOrderSuccess();

  } catch (err) {
    console.error('Order submission error:', err);
    showNotification('Something went wrong. Please try again.');
    nextBtn.textContent = 'COMPLETE ORDER';
    nextBtn.disabled = false;
  }
}

function onOrderSuccess() {
  currentStep = 4;
  updateUI();

  document.getElementById('confirmEmail').textContent = formData.email;
  localStorage.removeItem('bllugCart');
  showNotification('Order placed! Check your email for the payment link.');
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
