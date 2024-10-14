"use strict";

import express from "express";
import bodyParser from "body-parser";
import db from "./db.js";
import bcrypt from "bcrypt";

const saltRounds = 10; // Times to hash password

const app = express();
const port = 3000; // Change mo nalang sa ENV kung san ka komportable

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public/"));
app.use(express.static("public/css"));
app.use(express.static("public/js"));
app.use(express.static("public/img"));

let login = false;

// Replace user first name and last name first letter to upper case
const correctName = function (first, last) {
  const fName = first.toLowerCase();
  const lName = last.toLowerCase();
  const fullName = `${fName[0].toUpperCase() + fName.slice(1)} ${
    lName[0].toUpperCase() + lName.slice(1)
  }`;
  return fullName;
};

app.get("/", (req, res) => {
  const title = "Kapelang";
  res.status(200).render("../views/index.ejs", { pageTitle: title, login });
});

app.get("/menu", (req, res) => {
  const title = "Kapelang | Menu";
  res
    .status(200)
    .render("../views/pages/menu.ejs", { pageTitle: title, login });
});

app.get("/cart", (req, res) => {
  res.status(200).send("this is cart page");
});

app.get("/login", (req, res) => {
  const title = "Login";

  if (login) {
    return res.redirect("/");
  }

  res
    .status(200)
    .render("../views/pages/login.ejs", { pageTitle: title, login });
});

// Submit Login
app.post("/login/submit", async (req, res) => {
  const { uEmail, uPass } = req.body;
  const checkAcc = await db.query(
    "SELECT email, password FROM users WHERE email = $1",
    [uEmail]
  );

  if (checkAcc.rows.length === 0) {
    res.send(`Email does not exist`);
  } else {
    const [{ email, password }] = checkAcc.rows;

    const compare = await bcrypt.compare(uPass, password); // Comparing hashed password, returns true or false
    if (compare) {
      login = true;
      res.redirect("/");
    } else {
      res.json({ message: "incorrect password" });
    }
  }
});

// Logout
app.get("/logout", (req, res) => {
  login = false;
  res.redirect("/");
});

// app.use("/", router);

app.get("/register", (req, res) => {
  const title = "Register";

  if (login) {
    return res.redirect("/"); // Need to use return to ensure it exits before redirecting to '/'
  }

  res
    .status(200)
    .render("../views/pages/register.ejs", { pageTitle: title, login });
});

// Submit Register
app.post("/register/submit", async (req, res) => {
  const title = "Register";
  const { uEmail, uPass, uRePass, uAddress, uFName, uLName } = req.body;
  const checkEmail = await db.query(
    "SELECT email FROM users WHERE email = $1",
    [uEmail]
  );

  if (checkEmail.rows.length > 0) {
    const regError = "Email already exist!";
    const data = {
      fName: uFName,
      lName: uLName,
      email: uEmail,
      pass: uPass,
      repass: uRePass,
      address: uAddress,
    };
    res.render("../views/pages/register.ejs", {
      pageTitle: title,
      regError,
      data,
    });
  } else if (uPass === uRePass) {
    const fullName = correctName(uFName, uLName);
    const is_admin = false;
    const hashedPassword = await bcrypt.hash(uPass, saltRounds); // This hashed password will be stored in database
    const insert = await db.query(
      "INSERT INTO users (email, password, address, full_name, is_admin) VALUES ($1, $2, $3, $4, $5)",
      [uEmail, hashedPassword, uAddress, fullName, is_admin]
    );
    if (insert.rowCount > 0) {
      const title = "Login";
      res.render("../views/pages/login.ejs", {
        pageTitle: title,
        login,
        registerSucc: "Register Successfully. You can now sign in!",
      });
    } else {
      res.status(500).send("Error, your data was not sent to the database");
    }
  } else {
    const regError = "Your password does not match";
    const data = {
      fName: uFName,
      lName: uLName,
      email: uEmail,
      pass: uPass,
      repass: uRePass,
      address: uAddress,
    };
    res.render("../views/pages/register.ejs", {
      pageTitle: title,
      regError,
      data,
    });
  }
});

app.get("*", (req, res) => {
  res.status(400).send(`Error 404 <a href="/">Go back <a/>`);
});

app.listen(port, () => {
  console.log(`Listening on Port: ${port}`);
});
