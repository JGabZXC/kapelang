"use strict";

const header = document.querySelector("header");
const hamburger = document.querySelector(".hamburger");
hamburger.addEventListener("click", () => {
  console.log("click");
  header.classList.toggle("active");
  hamburger.classList.toggle("active");

  if (hamburger.classList.contains("active")) {
    document.body.style.position = "fixed";
  } else {
    document.body.style.position = "static";
  }
});

const menuEl = document.querySelectorAll(".list");

menuEl.forEach((li) => {
  li.addEventListener("click", function () {
    header.classList.remove("active");
    hamburger.classList.remove("active");
  });
});
