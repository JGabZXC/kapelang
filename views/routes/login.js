"use strict";

import express from "express";
import bodyParser from "body-parser";

const router = express.Router();
const app = express();

const login = false;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

router.get("/login", (req, res) => {
  const title = "Login";
  console.log(req.body);
  res.render("../views/pages/login.ejs", { pageTitle: title, login });
});

router.post("/login/check", (req, res) => {
  const { uEmail, uPass } = req.body;
  console.log(req);
  console.log(uEmail);
  res.send(uEmail);
});

export default router;
