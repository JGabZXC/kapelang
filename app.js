"use strict";

import express from "express";
import bodyParser from "body-parser";
import db from "./db.js";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import flash from "connect-flash";

const app = express();
const port = 3000; // Change mo nalang sa ENV kung san ka komportable
const saltRounds = 10; // Times to hash password
const pgSession = connectPgSimple(session);

const store = new pgSession({
  pool: db, // Your DB
  tableName: "user_session", // Table name for sessions
  createTableIfMissing: true, // If table is missing it will automatically create one in db
  pruneSessionInterval: 60, // Automatically delete expired sessions every 60 seconds
});

// Middlewares
app.use(
  session({
    secret: "SIGNEDCOOKIES",
    resave: false,
    saveUninitialized: false,
    store: store, // Store in DB
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(express.static("public/css"));
app.use(express.static("public/js"));
app.use(express.static("public/img"));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// If user is logged in, show the logout button
app.use((req, res, next) => {
  res.locals.login = req.isAuthenticated();
  if (req.isAuthenticated()) {
    res.locals.profile = req.user;
    req.user = req.user;
  } else {
    req.user = null;
  }
  next();
});

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
  res.status(200).render("index.ejs", { pageTitle: title });
});

app.get("/menu", async (req, res) => {
  const title = "Kapelang | Menu";
  const menu = await db.query("SELECT * FROM items ORDER BY id ASC");
  const data = menu.rows;
  res.render("pages/menu.ejs", { pageTitle: title, data });
});

app.get("/login", (req, res) => {
  const title = "Login";

  if (req.isAuthenticated()) {
    return res.redirect("/");
  } else {
    res.status(200).render("pages/login.ejs", {
      pageTitle: title,
      message: req.flash("error"),
    });
  }
});

// Submit Login
app.post(
  "/login/submit",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// app.use("/", router);

app.get("/register", (req, res) => {
  const title = "Register";

  if (req.isAuthenticated()) {
    return res.redirect("/"); // Need to use return to ensure it exits before redirecting to '/'
  } else {
    res.status(200).render("pages/register.ejs", { pageTitle: title });
  }
});

// Submit Register
app.post("/register/submit", async (req, res) => {
  const title = "Register";
  const { uEmail, uPass, uRePass, uAddress, uFName, uLName } = req.body;
  const checkEmail = await db.query(
    "SELECT email FROM users WHERE email = $1",
    [uEmail]
  );

  if (checkEmail.rowCount > 0) {
    const regError = "Email already exist!";
    const data = {
      fName: uFName,
      lName: uLName,
      email: uEmail,
      pass: uPass,
      repass: uRePass,
      address: uAddress,
    };
    res.render("pages/register.ejs", {
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
      res.render("pages/login.ejs", {
        pageTitle: title,
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
    res.render("pages/register.ejs", {
      pageTitle: title,
      regError,
      data,
    });
  }
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) next(err);
      res.redirect("/");
    });
  });
});

// Routes for authenticated pages only

app.get("/order", async (req, res) => {
  const title = "Kapelang | Order";
  if (req.isAuthenticated()) {
    const result = await db.query("SELECT * FROM items");
    const data = result.rows;
    res.render("pages/order.ejs", { pageTitle: title, data, user: req.user });
  } else {
    return res.redirect("/login");
  }
});

app.post("/order/check", async (req, res) => {
  const items = [];
  const { user_id, order_by } = req.body;
  items.push({
    user_id,
    order_by,
  });
  for (const key in req.body) {
    const itemID = key.split("_")[2];
    const itemName = req.body[key];
    const quantityKey = `quantity_${itemName.replaceAll(" ", "_")}`;
    const quantity = req.body[quantityKey];
    const priceKey = `item_price_${itemID}`;
    const price = req.body[priceKey];
    const totalPriceKey = `total_price_${itemID}`;
    const totalPrice = req.body[totalPriceKey];
    if (quantity) {
      const updateOrder = await db.query(
        "UPDATE items SET total_order = total_order + $1 WHERE item_name = $2",
        [quantity, itemName]
      );
      if (updateOrder.rowCount > 1) {
        items.push({
          orders: {
            item_name: itemName,
            orderQuantity: quantity,
            price: price,
            totalPrice: totalPrice,
          },
        });
      } else {
        res.send("Error!");
      }
    }
  }
  console.log(items);
  res.json({ items });
});

app.get("/profile", (req, res) => {
  if (req.isAuthenticated()) {
    return res.send("You have access in this page");
  } else {
    return res.redirect("/login");
  }
});

// Handle any unrouted pages
app.get("*", (req, res) => {
  res.status(400).send(`Error 404 <a href="/">Go back <a/>`);
});

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const checkAcc = await db.query("SELECT * FROM users WHERE email = $1", [
        username,
      ]);

      if (checkAcc.rows.length === 0) {
        return cb(null, false, { message: "Wrong Email." });
      } else {
        const user = checkAcc.rows[0];
        const hashedPassword = user.password;

        const compare = await bcrypt.compare(password, hashedPassword); // Comparing hashed password, returns true or false
        if (compare) {
          return cb(null, user);
        } else {
          return cb(null, false, { message: "Wrong Password." });
        }
      }
    } catch (error) {
      return cb(error);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Listening on Port: ${port}`);
});
