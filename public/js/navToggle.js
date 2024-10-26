"use strict";

const header = document.querySelector("header");
const hamburger = document.querySelector(".hamburger");
hamburger.addEventListener("click", () => {
  console.log("click");
  header.classList.toggle("active");
  hamburger.classList.toggle("active");
});

const menuEl = document.querySelectorAll(".list");

menuEl.forEach((li) => {
  li.addEventListener("click", function () {
    header.classList.remove("active");
    hamburger.classList.remove("active");
  });
});
