"use strict";

function toggleQuantity(id, totalId, totalPriceId, price) {
  const quantityInput = document.querySelector(`#${id}`);
  const totalDisplay = document.querySelector(`#${totalId}`);
  const totalPriceDisplay = document.querySelector(`#${totalPriceId}`);

  if (quantityInput.style.display === "none") {
    quantityInput.style.display = "block";

    const quantity = 1;
    const totalPrice = quantity * Number(price);
    quantityInput.value = quantity;

    totalDisplay.style.display = quantity > 0 ? "inline" : "none";
    totalDisplay.textContent = `Total: ₱${totalPrice}`;
    totalPriceDisplay.value = `${totalPrice}`;
    quantityInput.focus();
  } else {
    quantityInput.style.display = "none";
    totalDisplay.style.display = "none";
    quantityInput.value = "";
  }
}

function updateTotal(inputId, price, totalId, totalPriceId) {
  const quantityInput = document.querySelector(`#${inputId}`);
  const totalDisplay = document.querySelector(`#${totalId}`);
  const totalPriceDisplay = document.querySelector(`#${totalPriceId}`);

  const quantity = quantityInput.value || 0;
  const totalPrice = quantity * Number(price);

  totalDisplay.style.display = quantity > 0 ? "inline" : "none";
  totalDisplay.textContent = `Total: ₱${totalPrice}`;
  totalPriceDisplay.value = `${totalPrice}`;
}
