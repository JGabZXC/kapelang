"use strict";

function inputDOM(id, totalId, totalPriceId, price, idx) {
  const quantityInput = document.querySelector(`#${id}`);
  const totalDisplay = document.querySelector(`#${totalId}`);
  const totalPriceDisplay = document.querySelector(`#${totalPriceId}`);
  const addToCart = document.querySelector(`#button${idx}`);

  const quantity = quantityInput.value || 0;
  const totalPrice = quantity * Number(price);

  if (quantityInput.value <= 0) {
    addToCart.textContent = "Add to cart";
    quantityInput.style.display = "none";
    quantityInput.value = 0;
    totalDisplay.style.display = "none";
  }

  totalDisplay.style.display = quantity > 0 ? "inline" : "none";
  totalDisplay.textContent = `Total: ₱${totalPrice}`;
  totalPriceDisplay.value = `${totalPrice}`;
}

function toggleQuantity(id, totalId, totalPriceId, price, idx) {
  inputDOM(id, totalId, totalPriceId, price, idx);
  const quantityInput = document.querySelector(`#${id}`);
  const totalDisplay = document.querySelector(`#${totalId}`);
  const totalPriceDisplay = document.querySelector(`#${totalPriceId}`);
  quantityInput.value = 1;

  const addToCart = document.querySelector(`#button${idx}`);
  if (quantityInput.style.display === "block") {
    addToCart.textContent = "Add to cart";
    quantityInput.style.display = "none";
    quantityInput.value = 0;
    totalDisplay.style.display = "none";
  } else {
    addToCart.textContent = "Remove to cart";
    quantityInput.style.display = "block";
    quantityInput.value = 1; // Preset to 1, so everytime add to cart was clicked it automatically set to 1
    const quantity = quantityInput.value;
    const totalPrice = quantity * Number(price);

    totalDisplay.style.display = "inline";
    totalDisplay.textContent = `Total: ₱${totalPrice}`;
    totalPriceDisplay.value = `${totalPrice}`;
  }
}

function updateTotal(inputId, price, totalId, totalPriceId, idx) {
  inputDOM(inputId, totalId, totalPriceId, price, idx);
}
