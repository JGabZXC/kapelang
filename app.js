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

// If admin
function isAdmin(req, res, next) {
  if (req.user && req.user.is_admin) {
    return next();
  } else {
    return res.redirect("/");
  }
}

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
  res.status(200).render("index.ejs", { pageTitle: title, user: req.user });
});

app.get("/menu", async (req, res) => {
  const title = "Kapelang | Menu";
  const menu = await db.query("SELECT * FROM items ORDER BY type ASC, id ASC");
  const data = menu.rows;
  res.render("pages/menu.ejs", { pageTitle: title, data, user: req.user });
});

app.get("/login", (req, res) => {
  const title = "Login";

  if (req.isAuthenticated()) {
    return res.redirect("/");
  } else {
    res.status(200).render("pages/login.ejs", {
      pageTitle: title,
      message: req.flash("error"),
      user: req.user,
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
      return res.redirect("/");
    });
  });
});

// Routes for authenticated pages only

app.get("/order", async (req, res) => {
  const title = "Kapelang | Order";
  if (req.isAuthenticated()) {
    const result = await db.query("SELECT * FROM items ORDER BY id ASC");
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
    if (quantity > 0) {
      const updateOrder = await db.query(
        "UPDATE items SET total_order = total_order + $1 WHERE item_name = $2",
        [quantity, itemName]
      );
      if (updateOrder.rowCount > 0) {
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

  // Check if items index 1 contains orders object
  if (items[1]?.orders?.orderQuantity > 0) {
    req.session.items = items;
    const query = await db.query("SELECT order_id FROM orders");
    const queryRows = query.rows;
    const map = queryRows.map((item) => item.order_id);
    const set = new Set(map);
    const length = [...set];
    const lengthFinal = length[length.length - 1] + 1;

    const userID = req.user.id;
    const userFullName = req.user.full_name;
    items.filter(async (item) => {
      if (item?.orders) {
        const order_id = lengthFinal || 1; // If there's no order in the db then the default is 1
        const item_name = item.orders.item_name;
        const quantity = Number(item.orders.orderQuantity);
        const price = Number(item.orders.price);
        const total_price = Number(item.orders.totalPrice);
        const placed_by_id = Number(userID);
        const placed_by_name = userFullName;

        await db.query(
          `INSERT INTO orders (order_id, item_name, quantity, price, total_price, placed_by_id, placed_by_name) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            order_id,
            item_name,
            quantity,
            price,
            total_price,
            placed_by_id,
            placed_by_name,
          ]
        );
      }
    });

    const resultX = await db.query(
      "SELECT * FROM orders where placed_by_id = $1",
      [Number(user_id)]
    );
    const itemX = resultX.rows;
    req.session.items = itemX;

    return res.redirect("/profile");
  } else {
    return res.redirect("/");
  }
});

app.get("/profile", async (req, res) => {
  const title = "Profile";
  const user_id = req.user.id;
  const resultX = await db.query(
    "SELECT * FROM orders where placed_by_id = $1",
    [Number(user_id)]
  );
  const items = resultX.rows;
  req.session.items = items;

  // console.log(items);
  if (req.isAuthenticated()) {
    res.render("pages/profile.ejs", {
      pageTitle: title,
      user: req.user,
      cart: items,
    });
  } else {
    return res.redirect("/login");
  }
});

app.post("/profile/change-password", async (req, res) => {
  const title = "Profile";
  if (req.isAuthenticated()) {
    const { user_id, passwordOld, passwordNew, passwordReNew } = req.body;
    const checkAcc = await db.query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);
    const user = checkAcc.rows[0];
    const hashedPassword = user.password;
    const compare = await bcrypt.compare(passwordOld, hashedPassword);
    // If passwordOld is equal to db password
    const passwordFormStyle = "block";
    if (compare) {
      // Check if passwordNew and passwordOld have value
      if (passwordNew && passwordOld) {
        // Compare password if they are same
        if (passwordNew === passwordReNew) {
          const hashedPassword = await bcrypt.hash(passwordNew, saltRounds);
          const update = await db.query(
            "UPDATE users SET password = $1 WHERE id = $2",
            [hashedPassword, user_id]
          );
          // Success update
          if (update.rowCount > 0) {
            res.render("pages/profile.ejs", {
              pageTitle: title,
              user: req.user,
              message: "Password change",
              style: "none",
            });
          } else {
            res.send("Db error");
          }
        } else {
          res.render("pages/profile.ejs", {
            pageTitle: title,
            user: req.user,
            message: "New password does not match",
            style: passwordFormStyle,
          });
        }
      } else {
        res.render("pages/profile.ejs", {
          pageTitle: title,
          user: req.user,
          message: "Please enter a new password",
          style: passwordFormStyle,
        });
      }
    } else {
      res.render("pages/profile.ejs", {
        pageTitle: title,
        user: req.user,
        message: "Wrong password",
        style: passwordFormStyle,
      });
    }
  } else {
    return res.redirect("/profile");
  }
});

// Routes for Admin
app.get("/dashboard", isAdmin, (req, res) => {
  return res.send("welcome admin");
});

app.get("/menu-edit", isAdmin, async (req, res) => {
  const title = "Menu Dashboard";
  const result = await db.query("SELECT * FROM items ORDER BY id ASC");
  const data = result.rows;

  const resultDB = await db.query(`SELECT * FROM items`);
  const typesDB = resultDB.rows.map((type) => type.type);
  const typesSet = new Set(typesDB);
  const typesFDB = [...typesSet];

  return res.render("pages/menu-add.ejs", {
    pageTitle: title,
    data,
    typesFDB,
    user: req.user,
  });
});

app.get("/menu-edit/edit:id", isAdmin, async (req, res) => {
  const title = "Edit Item";
  const { id } = req.params;

  const check = await db.query("SELECT * FROM items WHERE id = $1", [id]);
  const data = check.rows[0];
  return res.render("pages/menu-edit.ejs", {
    pageTitle: title,
    data,
    user: req.user,
  });
});

app.post("/menu-edit/edit:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const { updateItemName, updateItemPrice, updateItemType } = req.body;

  const insert = await db.query(
    "UPDATE items SET item_name = $1, price = $2, type = $3 WHERE id = $4 RETURNING *",
    [updateItemName, updateItemPrice, updateItemType, id]
  );

  if (insert.rowCount > 0) {
    res.redirect("/menu-edit");
  } else {
    res.redirect("/");
  }
});

// Sorting
app.post("/menu-edit/sort", isAdmin, async (req, res) => {
  const { type, sort, only } = req.body;
  const title = "Menu Dashboard";
  const sortByType = await db.query(
    `SELECT * FROM items ${
      only ? `WHERE type = $2` : ""
    } ORDER BY type = $1 DESC, id ${sort}`,
    only ? [type, only] : [type]
  );

  const data = sortByType.rows;

  const result = await db.query(`SELECT * FROM items`);
  const typesDB = result.rows.map((type) => type.type);
  const typesSet = new Set(typesDB);
  const typesFDB = [...typesSet];

  return res.render("pages/menu-add.ejs", {
    pageTitle: title,
    data,
    typesFDB,
    user: req.user,
    message: `Item sorted by ${type} and id ${sort}`,
  });
});

app.post("/menu-edit/create", isAdmin, async (req, res) => {
  const title = "Menu Dashboard";
  const { newItemName, newPrice, newType } = req.body;
  const result = await db.query("SELECT * FROM items ORDER BY id DESC");
  const data = result.rows;

  // Trim string
  const trim = newItemName.trim();
  // Check if input is empty
  if (trim === "") {
    return res.render("pages/menu-add.ejs", {
      pageTitle: title,
      data: data,
      user: req.user,
      message: "Not a valid name!",
    });
  }

  if (newItemName.length > 2 && newPrice && newType.length > 2) {
    const add = await db.query(
      "INSERT INTO items (item_name, price, type, total_order) VALUES ($1, $2, $3, $4) RETURNING *;",
      [newItemName, Number(newPrice), newType, 0]
    );

    if (add.rowCount > 0) {
      const result = await db.query("SELECT * FROM items ORDER BY id ASC");
      const data = result.rows;
      return res.render("pages/menu-add.ejs", {
        pageTitle: title,
        data: data,
        user: req.user,
        message: "Item added",
      });
    } else {
      res.send("Error on DB");
    }
  } else {
    return res.render("pages/menu-add.ejs", {
      pageTitle: title,
      data,
      user: req.user,
      message: "Fill up the requirements",
    });
  }
});

app.get("/menu-edit/delete:id", isAdmin, async (req, res) => {
  const { id } = req.params;

  const del = await db.query("DELETE FROM items WHERE id = $1", [id]);
  if (del.rowCount > 0) {
    res.redirect("/menu-edit");
  } else {
    console.log("error");
    res.redirect("/");
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

        const compare = await bcrypt.compare(password, hashedPassword); // Comparing hashed password, return true or false
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
