const Product = require("../models/product");
const Cart = require("../models/cart");
const Order = require("../models/order");

exports.getProducts = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render("shop/product-list", {
        products: products,
        title: "All Products",
        path: "/products",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const id = req.params.id;
  Product.findAll({ where: { id: id } })
    .then(([product]) => {
      res.render("shop/product-details", {
        product: product,
        title: product.title,
        path: "/products/" + id,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render("shop/index", {
        products: products,
        title: "shop",
        path: "/",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then((cart) => {
      return cart.getProducts();
    })
    .then((cartProducts) => {
      res.render("shop/cart", {
        path: "/cart",
        title: "Your Cart",
        products: cartProducts,
      });
    })
    .catch((err) => {
      console.log(err);
    });

  // Cart.getCart((cart) => {
  //   Product.fetchAll((products) => {
  //     const cartProducts = [];
  //     for (let product of products) {
  //       const cartProductData = cart.products.find(
  //         (prod) => prod.id === product.id
  //       );
  //       if (cartProductData) {
  //           cartProducts.push({
  //           productData: product,
  //           qty: cartProductData.qty,
  //         });
  //       }
  //     }
  //     res.render("shop/cart", {
  //       path: "/cart",
  //       title: "Your Cart",
  //       products: cartProducts
  //     });
  //   });
  // });
};

exports.postCart = (req, res, next) => {
  const id = parseInt(req.body.id);
  let fetchedCart;
  let newQuantity = 1;

  req.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart;
      return cart.getProducts({ where: { id: id } });
    })
    .then((products) => {
      let product;
      if (products.length > 0) {
        product = products[0];
      }
      if (product) {
        const oldQuantity = product.cartItem.quantity;
        newQuantity = oldQuantity + 1;
        return Promise.resolve(product);
      }
      return Product.findByPk(id);
    })
    .then((product) => {
      return fetchedCart.addProduct(product, {
        through: { quantity: newQuantity },
      });
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
    });

  // Product.findById(id, (product) => {
  //   Cart.addProduct(id, product.price);
  //   res.redirect("/");
  // });
};

exports.deleteCartItem = (req, res, next) => {
  const id = parseInt(req.body.id);
  req.user
    .getCart()
    .then((cart) => {
      return cart.getProducts({ where: { id: id } });
    })
    .then((products) => {
      let product = products[0];
      return product.cartItem.destroy();
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
    });

  // Product.findById(id, (product) => {
  //   Cart.deleteProduct(id, product.price);
  //   res.redirect("/cart");
  // });
};

exports.postOrder = (req, res, next) => {
  let products;
  let fetchedCart;
  req.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart;
      return cart.getProducts();
    })
    .then((fetchedProducts) => {
      products = fetchedProducts;
      return req.user.createOrder();
    })
    .then((order) => {
      return order.addProducts(
        products.map((product) => {
          product.orderItem = { quantity: product.cartItem.quantity };
          return product;
        })
      );
    })
    .then((result) => {
      return fetchedCart.setProducts(null);
    })
    .then((result) => {
      res.redirect("/orders");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getOrders = (req, res, next) => {
  //include here is used for eager loading but it not currently working so i have written
  //alternate solution
  req.user
    .getOrders({ inclue: ["products"] })
    .then((orders) => {
      return Promise.all(orders.map(order=>{
        return order.getProducts().then((products) => {
          order.products = products;
          return order;
        });
      }));    
    })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        title: "Your Orders",
        orders: orders,
      });
    });
};

// const Product = require("../models/product");
// const Cart = require("../models/cart");

// exports.getProducts = (req, res, next) => {
//   Product.fetchAll((products) => {
//     res.render("shop/product-list", {
//       products: products,
//       title: "All Products",
//       path: "/products",
//     });
//   });
//   // res.sendFile(path.join(__dirname,'..','views','shop.html'));
//   // res.sendFile(path.join(rootDir,'views','shop.html'));
// };

// exports.getProduct = (req, res, next) => {
//   const id = parseInt(req.params.id);
//   Product.findById(id, (product) => {
//     res.render("shop/product-details", {
//       product: product,
//       title: product.title,
//       path: "/products/" + id,
//     });
//   });
// };

// exports.getIndex = (req, res, next) => {
//   Product.fetchAll((products) => {
//     res.render("shop/index", { products: products, title: "shop", path: "/" });
//   });
// };

// exports.getCart = (req, res, next) => {
//   Cart.getCart((cart) => {
//     Product.fetchAll((products) => {
//       const cartProducts = [];
//       for (let product of products) {
//         const cartProductData = cart.products.find(
//           (prod) => prod.id === product.id
//         );
//         if (cartProductData) {
//             cartProducts.push({
//             productData: product,
//             qty: cartProductData.qty,
//           });
//         }
//       }
//       res.render("shop/cart", {
//         path: "/cart",
//         title: "Your Cart",
//         products: cartProducts
//       });
//     });
//   });
// };

// exports.postCart = (req, res, next) => {
//   const id = parseInt(req.body.id);
//   Product.findById(id, (product) => {
//     Cart.addProduct(id, product.price);
//     res.redirect("/");
//   });
// };

// exports.deleteCartItem = (req, res, next) => {
//     const id = parseInt(req.body.id);
//     Product.findById(id, product=>{
//         Cart.deleteProduct(id, product.price);
//         res.redirect('/cart');
//     });
// };

// exports.getOrders = (req, res, next) => {
//   res.render("shop/orders", {
//     path: "/orders",
//     title: "Orders",
//   });
// };

// exports.getCheckOut = (req, res, next) => {
//   res.render("shop/checkout", {
//     path: "/checkout",
//     title: "Checkout",
//   });
// };
