const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
// for cross site request forgery
const csrf = require('csurf')
// const expressHbs=require('express-handlebars');

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/error");
//import the sequelize object created in database file
// const sequelize = require("./util/database");
// const {mongoConnect} = require("./util/database");

const mongoose = require("mongoose");

// import models for assotiation
// const Product = require("./models/product");
const User = require("./models/user");
// const Cart = require("./models/cart");
// const CartItem = require("./models/cart-item");
// const Order = require("./models/order");
// const OrderItem = require("./models/order-item");

const MONGODB_URI = "mongodb+srv://root:38AzamslJAZXJ5Tx@cluster0.zgpxi.mongodb.net/shopping-app?retryWrites=true";


const app = express();

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

// fetched the middleware to protect from csrf attack
const csrfProtection = csrf();

//ejs templating engine
app.set("view engine", "ejs");

/**
 * handle bars templating engine (we are registering this templating engine beacuse it is not built in)
 * 
  app.engine('hbs',expressHbs({
    extname: "hbs",
    defaultLayout: "",
    layoutsDir: "",
  }));
  app.set('view engine','hbs');

  pug templating engine (kind of built in)
  app.set('view engine','pug');
  app.set('view', 'views')
*/

app.use(bodyParser.urlencoded({ extended: false }));

/**
 * secret : is used for assigning the hash
 * resave : (false) session will not be saved for every request that has been sent. It is saved only if something changed in session
 *  saveUninitialized : (false) ensures that no session saved for the request where it does not needed to be saved.
 * cookie: to configure a cookie.
*/
app.use(session({
  secret: "my secret", 
  resave: false,
  saveUninitialized: false,
  store: store
  // cookie: {maxAge: , expires:, }
}));

app.use(csrfProtection);

// add new temporary field to session for only one request.
app.use(flash());

// to serve the static file stored at public folder
app.use(express.static(path.join(__dirname, "public")));



app.use((req, res, next) => {
  if(!req.session.user)
    return next();
  User.findById(req.session.user._id)
  .then(user=>{
    req.user = user;
    next();
  })
});

app.use((req, res, next)=>{
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.use("/admin", adminRoutes.router);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

// mongoConnect((client)=>{
//   console.log(client);
//   app.listen(3000)
// });

mongoose.connect(MONGODB_URI)
.then(result=>{
  app.listen(3000);
  console.log("connected!!!")
});

/**
 * sequelize relations
  app.use((req, res, next) => {
      User.findByPk(1).then(user=>{
          req.user = user;
          next();
      });
  });
  Product.belongsTo(User, { constrains: true, onDelete: "CASCADE" });
  User.hasMany(Product);

  Cart.belongsTo(User);
  User.hasOne(Cart);

  Cart.belongsToMany(Product, {through: CartItem});
  Product.belongsToMany(Cart, {through: CartItem});

  Order.belongsTo(User);
  User.hasMany(Order);

  Order.belongsToMany(Product, {through: OrderItem});
  Product.belongsToMany(Order, {through: OrderItem});

  it will have a look at all the models(defined on the same sequelize object) defined and created tables for them.
  sequelize
      // .sync({ force: true })
    .sync()
    .then(() => {
      return User.findByPk(1);
    })
    .then((user) => {
      if (!user)
        return User.create({ userName: "Kuldeep", userEmail: "kul@gmail.com" });
      return user;
    })
    .then((user) => {
        return user.createCart();
    })
    .then(cart=>{
      app.listen(3000);
    })
    .catch((err) => {
      console.log(err);
    });
  */
