const PRODUCTS = [
  { id: "classic", name: "Classic Pearl Milk Tea", price: 39.5 },
  { id: "brownsugar", name: "Brown Sugar Boba", price: 38 },
  { id: "matcha", name: "Matcha Milk Tea", price: 28 },
  { id: "taro", name: "Taro Milk Tea", price: 32.75 },
  { id: "wintermelon", name: "Wintermelon Milk Tea", price: 31 },
  { id: "okinawa", name: "Okinawa Milk Tea", price: 36 },
  { id: "cookies", name: "Cookies and Cream Milk Tea", price: 35.5 },
  { id: "thai", name: "Thai Milk Tea", price: 30.5 },
  { id: "strawberry", name: "Strawberry Milk Tea", price: 40.5 }
];
const DELIVERY_FEE = 50;

function getCart() {
  return JSON.parse(localStorage.getItem("raysBrewCart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("raysBrewCart", JSON.stringify(cart));
}

function normalizePhilippineMobile(value) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("09") && digits.length === 11) {
    return digits;
  }

  if (digits.startsWith("639") && digits.length === 12) {
    return "0" + digits.slice(2);
  }

  return "";
}

function formatPhilippineMobile(value) {
  const normalized = normalizePhilippineMobile(value);
  if (!normalized) return value.replace(/[^\d+]/g, "").slice(0, 13);

  return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 11)}`;
}

function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  document.querySelectorAll(".cart-count").forEach((el) => {
    const previous = Number(el.dataset.count || 0);
    el.textContent = totalItems;
    el.dataset.count = totalItems;

    if (totalItems !== previous) {
      el.classList.remove("cart-badge-pop");
      void el.offsetWidth;
      el.classList.add("cart-badge-pop");
    }
  });
}

function showToast(message, type) {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type || "info"}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(function () {
    toast.classList.add("show");
  }, 10);

  setTimeout(function () {
    toast.classList.remove("show");
    setTimeout(function () {
      toast.remove();
    }, 250);
  }, 2600);
}

function addToCart(productId, quantity) {
  const product = PRODUCTS.find((item) => item.id === productId);
  if (!product) return;
  const safeQuantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;

  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.qty += safeQuantity;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: safeQuantity });
  }

  saveCart(cart);
  updateCartCount();
  showToast(product.name + " added to cart.", "success");
}

function decreaseCartItem(productId) {
  const cart = getCart();
  const index = cart.findIndex((item) => item.id === productId);
  if (index === -1) return;

  cart[index].qty -= 1;

  if (cart[index].qty <= 0) {
    const removedName = cart[index].name;
    cart.splice(index, 1);
    showToast(removedName + " removed from cart.", "info");
  }

  saveCart(cart);
  updateCartCount();
  renderCart();
}

function removeCartItem(productId) {
  const cart = getCart();
  const index = cart.findIndex((item) => item.id === productId);
  if (index === -1) return;

  const removedName = cart[index].name;
  cart.splice(index, 1);
  saveCart(cart);
  updateCartCount();
  renderCart();
  showToast(removedName + " removed from cart.", "info");
}

function increaseCartItem(productId) {
  const cart = getCart();
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;

  item.qty += 1;
  saveCart(cart);
  updateCartCount();
  renderCart();
}

function renderCart() {
  const cartItemsContainer = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  if (!cartItemsContainer || !totalElement) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
    totalElement.textContent = "\u20b10.00";
    return;
  }

  let total = 0;
  cartItemsContainer.innerHTML = cart
    .map((item) => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;

      return `
        <div class="cart-row">
          <div class="cart-item-meta">
            <p>${item.name} x ${item.qty}</p>
            <div class="cart-item-actions">
              <button type="button" class="cart-action-btn" data-action="decrease" data-product-id="${item.id}" aria-label="Decrease quantity of ${item.name}">-</button>
              <button type="button" class="cart-action-btn" data-action="increase" data-product-id="${item.id}" aria-label="Increase quantity of ${item.name}">+</button>
              <button type="button" class="cart-action-btn cart-remove-btn" data-action="remove" data-product-id="${item.id}" aria-label="Remove ${item.name} from cart">Remove</button>
            </div>
          </div>
          <p>\u20b1${itemTotal.toFixed(2)}</p>
        </div>
      `;
    })
    .join("");

  totalElement.textContent = `\u20b1${total.toFixed(2)}`;
}

function renderCheckout() {
  const summaryContainer = document.getElementById("checkout-summary");
  const totalElement = document.getElementById("checkout-total");
  const subtotalElement = document.getElementById("checkout-subtotal");
  const deliveryElement = document.getElementById("checkout-delivery");
  const checkoutForm = document.getElementById("checkout-form");
  const orderTypeSelect = document.getElementById("order-type");
  const addressInput = document.getElementById("customer-address");
  const addressLabel = document.querySelector('label[for="customer-address"]');
  const contactInput = document.getElementById("customer-contact");
  if (!summaryContainer || !totalElement) return;

  const cart = getCart();
  let subtotal = 0;

  function updateCheckoutTotal() {
    const isDelivery = orderTypeSelect && orderTypeSelect.value === "Deliver";
    const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
    const finalTotal = subtotal + deliveryFee;
    if (subtotalElement) {
      subtotalElement.textContent = `\u20b1${subtotal.toFixed(2)}`;
    }
    if (deliveryElement) {
      deliveryElement.textContent = `\u20b1${deliveryFee.toFixed(2)}`;
    }
    totalElement.textContent = `\u20b1${finalTotal.toFixed(2)}`;
  }

  function updateAddressState() {
    if (!orderTypeSelect || !addressInput) return;

    const isDelivery = orderTypeSelect.value === "Deliver";
    addressInput.required = isDelivery;

    if (addressLabel) {
      addressLabel.style.display = isDelivery ? "" : "none";
    }

    addressInput.style.display = isDelivery ? "" : "none";
    if (!isDelivery) {
      addressInput.value = "";
    }
  }

  if (cart.length === 0) {
    summaryContainer.innerHTML = "<p>No items in cart yet.</p>";
    subtotal = 0;
    updateCheckoutTotal();
  } else {
    summaryContainer.innerHTML = cart
      .map((item) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        return `
          <div class="cart-row">
            <p>${item.name} x ${item.qty}</p>
            <p>\u20b1${itemTotal.toFixed(2)}</p>
          </div>
        `;
      })
      .join("");

    updateCheckoutTotal();
  }

  if (orderTypeSelect && !orderTypeSelect.dataset.bound) {
    orderTypeSelect.addEventListener("change", function () {
      updateCheckoutTotal();
      updateAddressState();
    });
    orderTypeSelect.dataset.bound = "true";
  }

  if (contactInput && !contactInput.dataset.bound) {
    contactInput.addEventListener("input", function () {
      const cursorAtEnd = contactInput.selectionStart === contactInput.value.length;
      const formatted = formatPhilippineMobile(contactInput.value);
      contactInput.value = formatted;
      if (cursorAtEnd) {
        contactInput.setSelectionRange(contactInput.value.length, contactInput.value.length);
      }
    });

    contactInput.addEventListener("blur", function () {
      contactInput.value = formatPhilippineMobile(contactInput.value);
    });

    contactInput.dataset.bound = "true";
  }

  updateAddressState();

  if (checkoutForm && !checkoutForm.dataset.bound) {
    checkoutForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (getCart().length === 0) {
        showToast("Your cart is empty.", "error");
        return;
      }

      if (contactInput) {
        const normalizedContact = normalizePhilippineMobile(contactInput.value);
        if (!normalizedContact) {
          showToast("Please enter a valid PH mobile number (0912 345 6789).", "error");
          contactInput.focus();
          return;
        }

        contactInput.value = formatPhilippineMobile(normalizedContact);
      }

      showToast("Order placed successfully. Thank you for ordering from Ray's Brew!", "success");
      saveCart([]);
      updateCartCount();
      checkoutForm.reset();
      renderCheckout();
    });
    checkoutForm.dataset.bound = "true";
  }
}

function setupLightbox() {
  const images = document.querySelectorAll("img");
  if (!images.length) return;

  let lightbox = document.getElementById("lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.className = "lightbox";
    lightbox.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="Close image">&times;</button>
      <div class="lightbox-content">
        <img class="lightbox-image" src="" alt="">
        <p class="lightbox-caption"></p>
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  const lightboxImage = lightbox.querySelector(".lightbox-image");
  const lightboxCaption = lightbox.querySelector(".lightbox-caption");
  const closeButton = lightbox.querySelector(".lightbox-close");

  function openLightbox(src, alt) {
    lightboxImage.src = src;
    lightboxImage.alt = alt || "Product image";
    lightboxCaption.textContent = alt || "";
    lightbox.classList.add("open");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightboxImage.src = "";
  }

  images.forEach((image) => {
    image.addEventListener("click", function () {
      openLightbox(image.src, image.alt);
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && lightbox.classList.contains("open")) {
      closeLightbox();
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  updateCartCount();

  document.querySelectorAll("[data-product-id]").forEach((button) => {
    button.addEventListener("click", function () {
      const productCard = button.closest(".product-card");
      const quantityInput = productCard ? productCard.querySelector(".qty-input") : null;
      const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

      if (quantityInput && (!Number.isInteger(quantity) || quantity < 1)) {
        showToast("Please enter a valid quantity.", "error");
        quantityInput.value = 1;
        return;
      }

      addToCart(button.getAttribute("data-product-id"), quantity);
    });
  });

  renderCart();
  renderCheckout();
  setupLightbox();

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-action][data-product-id]");
    if (!trigger) return;

    const action = trigger.getAttribute("data-action");
    const productId = trigger.getAttribute("data-product-id");
    if (!productId) return;

    if (action === "decrease") {
      decreaseCartItem(productId);
    }

    if (action === "increase") {
      increaseCartItem(productId);
    }

    if (action === "remove") {
      removeCartItem(productId);
    }
  });
});


