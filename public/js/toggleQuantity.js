"use strict";

const cart = []; // Front end cart session after restart this will be cleared
const form = document.querySelector(".form-order");

function toggleQuantity(id, price, itemName) {
  const inputQuantity = document.querySelector(`#quantity_${id}`);
  const labelQuantity = document.querySelector(`#total_${id}`);
  const btnCart = document.querySelector(`.btn-to-cart${id}`);

  inputQuantity.style.display === "none"
    ? ((inputQuantity.style.display = "block"),
      (labelQuantity.style.display = "block"),
      (inputQuantity.value = 1),
      (btnCart.textContent = "Remove from cart"))
    : ((inputQuantity.style.display = "none"),
      (labelQuantity.style.display = "none"),
      (inputQuantity.value = ""),
      (btnCart.textContent = "Add to cart"));

  const checkItem = cart.find((item) => Number(item.id) === Number(id));
  if (!checkItem) {
    cart.push({
      id: Number(id),
      itemName: itemName,
      price: Number(price),
      quantity: Number(inputQuantity.value),
    });
  } else {
    const checkIndex = cart.findIndex((item) => Number(item.id) === Number(id));
    // Removing the item in cart based on index
    if (checkIndex !== -1) {
      cart.splice(checkIndex, 1);
    }
  }
}

function updateTotal(id, price) {
  const inputQuantity = document.querySelector(`#quantity_${id}`);
  const labelQuantity = document.querySelector(`#total_${id}`);

  labelQuantity.textContent = `Total: ₱${
    Number(inputQuantity.value) * Number(price)
  }`;

  const checkItem = cart.find((item) => Number(item.id) === Number(id));
  if (checkItem) {
    checkItem.quantity = Number(inputQuantity.value);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault(); // Preventing from submitting immediately

  fetch("/order/check2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // This can be changed to x-wwww-urlencoded but you can still use this, just use express.json() or bodyParser.json()
    },
    body: JSON.stringify({ cart: cart }), // Transforming cart to JSON format
  })
    .then((response) => {
      if (response.ok) {
        if (response.redirected) {
          window.location.href = response.url; // Use the redirection based on the server
        }
      } else {
        console.error("Request failed:", response.status);
      }
    })
    .catch((err) => {
      console.error("Error during fetch:", err);
      window.location.href = "/";
    });
});

// function inputDOM(id, totalId, totalPriceId, price, idx) {
//   const quantityInput = document.querySelector(`#${id}`);
//   const totalDisplay = document.querySelector(`#${totalId}`);
//   const totalPriceDisplay = document.querySelector(`#${totalPriceId}`);
//   const addToCart = document.querySelector(`#button${idx}`);

//   const quantity = quantityInput.value || 0;
//   const totalPrice = quantity * Number(price);

//   if (quantityInput.value <= 0) {
//     addToCart.textContent = "Add to cart";
//     quantityInput.style.display = "none";
//     quantityInput.value = 0;
//     totalDisplay.style.display = "none";
//   }

//   totalDisplay.style.display = quantity > 0 ? "inline" : "none";
//   totalDisplay.textContent = `Total: ₱${totalPrice}`;
//   totalPriceDisplay.value = `${totalPrice}`;
// }

// function toggleQuantity(id, totalId, totalPriceId, price, idx) {
//   inputDOM(id, totalId, totalPriceId, price, idx);
//   const quantityInput = document.querySelector(`#${id}`);
//   const totalDisplay = document.querySelector(`#${totalId}`);
//   const totalPriceDisplay = document.querySelector(`#${totalPriceId}`);
//   quantityInput.value = 1;

//   const addToCart = document.querySelector(`#button${idx}`);
//   if (quantityInput.style.display === "block") {
//     addToCart.textContent = "Add to cart";
//     quantityInput.style.display = "none";
//     quantityInput.value = 0;
//     totalDisplay.style.display = "none";
//   } else {
//     addToCart.textContent = "Remove to cart";
//     quantityInput.style.display = "block";
//     quantityInput.value = 1; // Preset to 1, so everytime add to cart was clicked it automatically set to 1
//     const quantity = quantityInput.value;
//     const totalPrice = quantity * Number(price);

//     totalDisplay.style.display = "inline";
//     totalDisplay.textContent = `Total: ₱${totalPrice}`;
//     totalPriceDisplay.value = `${totalPrice}`;
//   }
// }

// function updateTotal(inputId, price, totalId, totalPriceId, idx) {
//   inputDOM(inputId, totalId, totalPriceId, price, idx);
// }
