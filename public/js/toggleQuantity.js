"use strict";

function inputDOM(id, totalId, totalPriceId, price) {
  const quantityInput = document.querySelector(`#${id}`);
  const totalDisplay = document.querySelector(`#${totalId}`);
  const totalPriceDisplay = document.querySelector(`#${totalPriceId}`);

  const quantity = quantityInput.value || 0;
  const totalPrice = quantity * Number(price);

  totalDisplay.style.display = quantity > 0 ? "inline" : "none";
  totalDisplay.textContent = `Total: ₱${totalPrice}`;
  totalPriceDisplay.value = `${totalPrice}`;
}

function toggleQuantity(id, totalId, totalPriceId, price) {
  inputDOM(id, totalId, totalPriceId, price);
  const quantityInput = document.querySelector(`#${id}`);
  const totalDisplay = document.querySelector(`#${totalId}`);
  const totalPriceDisplay = document.querySelector(`#${totalPriceId}`);
  quantityInput.value = 1;
  if (quantityInput.style.display === "block") {
    quantityInput.style.display = "none";
  } else {
    quantityInput.style.display = "block";
    quantityInput.value = 1;
    const quantity = quantityInput.value || 0;
    const totalPrice = quantity * Number(price);

    totalDisplay.style.display = quantity > 0 ? "inline" : "none";
    totalDisplay.textContent = `Total: ₱${totalPrice}`;
    totalPriceDisplay.value = `${totalPrice}`;
  }
}

function updateTotal(inputId, price, totalId, totalPriceId) {
  inputDOM(inputId, totalId, totalPriceId, price);
}
