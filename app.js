const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
// const expressHbs=require('express-handlebars');

const adminRoutes = require("./routes/admin");
const shopRouter = require("./routes/shop");
const errorController = require("./controllers/error");
//import the sequelize object created in database file
const sequelize = require("./util/database");

//import models for relation
const Product = require("./models/product");
const User = require("./models/user");
const Cart = require("./models/cart");
const CartItem = require("./models/cart-item");
const Order = require("./models/order");
const OrderItem = require("./models/order-item");

const app = express();

//ejs templating engine
app.set("view engine", "ejs");

//handle bars templating engine (we are registering this templating engine beacuse it is not built in)
// app.engine('hbs',expressHbs({
//     extname: "hbs",
//     defaultLayout: "",
//     layoutsDir: "",
//  }));
// app.set('view engine','hbs');

//pug templating engine (kind of built in)
// app.set('view engine','pug');
// app.set('view', 'views')

app.use(bodyParser.urlencoded({ extended: false }));
// to serve the static file stored at public folder
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    User.findByPk(1).then(user=>{
        req.user = user;
        next();
    });
});

app.use("/admin", adminRoutes.router);

app.use(shopRouter);

app.use(errorController.get404);

//sequelize relations
Product.belongsTo(User, { constrains: true, onDelete: "CASCADE" });
User.hasMany(Product);

Cart.belongsTo(User);
User.hasOne(Cart);

Cart.belongsToMany(Product, {through: CartItem});
Product.belongsToMany(Cart, {through: CartItem});

Order.belongsTo(User);
User.hasMany(Order);

Order.belongsToMany(Product, {through: OrderItem});
// Product.belongsToMany(Order, {through: OrderItem});

// it will have a look at all the models(defined on the same sequelize object) defined and created tables for them.
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
