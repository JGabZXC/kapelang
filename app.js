"use strict";

import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000; // Change mo nalang sa ENV kung san ka komportable

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public/"));
app.use(express.static("public/css"));
app.use(express.static("public/js"));
app.use(express.static("public/img"));

app.get("/", (req, res) => {
  const title = "Kapelang";
  res.status(200).render("../views/index.ejs", { pageTitle: title });
});

app.get("/menu", (req, res) => {
  res.send("this is menu page");
});

app.get("/cart", (req, res) => {
  res.send("this is cart page");
});

app.get("/login", (req, res) => {
  const title = "Login";
  res.render("../views/pages/login.ejs", { pageTitle: title });
});

app.get("/register", (req, res) => {
  res.send("this is a register");
});

app.get("*", (req, res) => {
  res.status(400).send("Error 404");
});

app.listen(port, () => {
  console.log(`Listening on Port: ${port}`);
});
