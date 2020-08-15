const express = require("express");
const { check, body } = require("express-validator/check");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);
router.post(
  "/login",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .normalizeEmail()
      .trim()
  ],
  authController.postLogin
);
router.post("/logout", authController.postLogout);
router.get("/signup", authController.getSignUp);
router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .normalizeEmail()
      .trim()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        // if (value === "kk@kk.com")
        //   throw new Error("This email address is forbidden.");
        // return true;

        // asyn validation
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject(
              "Email exists already, please use another email address."
            );
          }
        });
      }),
    body("password", "Please enter a valid password")
      .isLength({ min: 5, max: 9 })
      .isAlphanumeric(),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password)
        throw new Error("Passwords do not match.");
      return true;
    }),
  ],
  authController.postSignUp
);
router.get("/reset-password", authController.getResetPassword);
router.post("/reset-password", authController.postResetPassword);
router.get("/new-password/:token", authController.getNewPassword);
router.post("/new-password", authController.postNewPassword);

module.exports = router;
