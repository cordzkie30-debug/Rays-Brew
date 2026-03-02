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

function getCart() {
  return JSON.parse(localStorage.getItem("raysBrewCart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("raysBrewCart", JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = totalItems;
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

function renderCart() {
  const cartItemsContainer = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  if (!cartItemsContainer || !totalElement) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
    totalElement.textContent = "₱0.00";
    return;
  }

  let total = 0;
  cartItemsContainer.innerHTML = cart
    .map((item) => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;

      return `
        <div class="cart-row">
          <p>${item.name} x ${item.qty}</p>
          <p>₱${itemTotal.toFixed(2)}</p>
        </div>
      `;
    })
    .join("");

  totalElement.textContent = `₱${total.toFixed(2)}`;
}

function renderCheckout() {
  const summaryContainer = document.getElementById("checkout-summary");
  const totalElement = document.getElementById("checkout-total");
  const checkoutForm = document.getElementById("checkout-form");
  if (!summaryContainer || !totalElement) return;

  const cart = getCart();

  if (cart.length === 0) {
    summaryContainer.innerHTML = "<p>No items in cart yet.</p>";
    totalElement.textContent = "₱0.00";
  } else {
    let total = 0;
    summaryContainer.innerHTML = cart
      .map((item) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        return `
          <div class="cart-row">
            <p>${item.name} x ${item.qty}</p>
            <p>₱${itemTotal.toFixed(2)}</p>
          </div>
        `;
      })
      .join("");

    totalElement.textContent = `₱${total.toFixed(2)}`;
  }

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (getCart().length === 0) {
        showToast("Your cart is empty.", "error");
        return;
      }

      showToast("Order placed successfully. Thank you for ordering from Ray's Brew!", "success");
      saveCart([]);
      updateCartCount();
      checkoutForm.reset();
      renderCheckout();
    });
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
});
