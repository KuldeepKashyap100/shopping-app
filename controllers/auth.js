const crypto = require("crypto");

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator/check");

const User = require("../models/user");

/**
 * nodejs server need third party mailing server to send mail.
 * we need transporter telling node server how emails will be delivered.
 * sendGridTransport function will return a configuration that nodemailer can use sendgrid
 */
const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  message = message.length > 0 ? message[0] : null;
  res.render("auth/login", {
    path: "/login",
    title: "Login",
    errorMessage: message,
    validationErrors: [],
    oldInput: {
      email: "",
      password: ""
    }
  });
};

exports.postLogin = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      title: "Login",
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      oldInput: {
        email: req.body.email,
        password: req.body.password
      }
    });
  }
  User.findOne({ email: req.body.email }).then((user) => {
    if (!user) {
      return res.status(422).render("auth/login", {
        path: "/login",
        title: "Login",
        errorMessage: "Invalid email or password.",
        oldInput: {
          email: req.body.email,
          password: req.body.password
        }
      });
    }
    bcrypt.compare(req.body.password, user.password).then((doMatch) => {
      if (doMatch) {
        req.session.isLoggedIn = true;
        req.session.user = user;
        /**
         * It takes couple of milliseconds for above lines to save the session to db.
         *  meanwhile page is redirected so we have to wait until session is saved.
         * */
        return req.session.save((err) => {
          res.redirect("/");
        });
      }
      return res.status(422).render("auth/login", {
        path: "/login",
        title: "Login",
        errorMessage: "Email and password do not match.",
        oldInput: {
          email: req.body.email,
          password: req.body.password
        }
      });
    });
  });

  /**
   * multiple attributes we can use while setting cookie (Expires-In: "date", Max-Age: "milliseconds",
   * domain: "send only to paricular domain,
   * secure(if this attribute added then this cookie will only be set if the page is served via https)")
   * HttpOnly (if this attribute is present we cannot access this cookie using client side javascript. it protects us from cross-site scripting attacks)
   * */
  // res.setHeader('Set-Cookie', "loggedIn=true; Max-Age=10");
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

exports.getSignUp = (req, res, next) => {
  let message = req.flash("error");
  message = message.length > 0 ? message[0] : null;
  res.render("auth/signup", {
    path: "signup",
    title: "Signup",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: ""
    },
    validationErrors: []
  });
};

exports.postSignUp = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      title: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }
  bcrypt
    .hash(req.body.password, 12)
    .then((hashedPassword) => {
      const newUser = new User({
        email: req.body.email,
        password: hashedPassword,
      });
      return newUser.save();
    })
    .then((result) => {
      res.redirect("/login");
      return transporter
        .sendMail({
          from: "kuldeepkashyap100@gmail.com",
          to: req.body.email,
          subject: "Signup succeeded!!!",
          html: "<h1>You successfully signed up!!!</h1>",
        })
        .catch((err) => {
          console.log(err);
        });
    });
};

exports.getResetPassword = (req, res, next) => {
  let message = req.flash("error");
  message = message.length > 0 ? message[0] : null;
  res.render("auth/reset-password", {
    path: "/reset-password",
    title: "Reset Password",
    errorMessage: message,
  });
};

exports.postResetPassword = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) return res.redirect("/reset-password");

    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) return res.redirect("/reset-password");
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 2 * 60 * 60 * 1000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        transporter.sendMail({
          from: "kuldeepkashyap100@gmail.com",
          to: req.body.email,
          subject: "Reset Password!!!",
          html: `
                <p>You request a password reset.</p>
                <p>Click this <a href="http://localhost:3000/new-password/${token}">link</a> to reset password.</p>
                `,
        });
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  }).then((user) => {
    if (!user) {
      req.flash("error", "Time Expired");
    }
    let message = req.flash("error");
    message = message.length > 0 ? message[0] : null;
    res.render("auth/new-password", {
      path: "/new-password",
      title: "New Password",
      errorMessage: message,
      userId: user._id.toString(),
      resetToken: token,
    });
  });
};

exports.postNewPassword = (req, res, next) => {
  let resetUser;
  User.findOne({
    resetToken: req.body.resetToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: req.body.userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(req.body.password, 12);
    })
    .then((hashedPassword) => {
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      resetUser.password = hashedPassword;
      return resetUser.save();
    })
    .then((result) => {
      if (result) res.redirect("/login");
    });
};
