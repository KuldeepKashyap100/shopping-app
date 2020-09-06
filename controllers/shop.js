const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const Product = require("../models/product");
const Order = require("../models/order");

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const pageNumber = +req.query.page || 1;
  let totalProductCount;
  Product.countDocuments()
  .then(totalProduct=>{
    totalProductCount = totalProduct;
    return Product.find()
            .skip((pageNumber-1)*ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);
  })
  .then((products) => {
    res.render("shop/product-list", {
      products: products,
      title: "All Products",
      path: "/products",
      totalProductCount: totalProductCount,
      currentPage: pageNumber,
      previousPage: pageNumber - 1,
      nextPage: pageNumber + 1,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: ITEMS_PER_PAGE * pageNumber < totalProductCount,
      lastPage: Math.ceil(totalProductCount/ITEMS_PER_PAGE)
    });
  })
  .catch((err) => {
    console.log(err);
  });
};

exports.getProduct = (req, res, next) => {
  const id = req.params.id;
  Product.findById(id)
    .then((product) => {
      res.render("shop/product-details", {
        product: product,
        title: product.title,
        path: "/products/" + id
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getIndex = (req, res, next) => {
  const pageNumber = +req.query.page || 1;
  let totalProductCount;
  Product.countDocuments()
  .then(totalProduct=>{
    totalProductCount = totalProduct;
    return Product.find()
            .skip((pageNumber-1)*ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);
  })
  .then((products) => {
    res.render("shop/index", {
      products: products,
      title: "Shop",
      path: "/",
      totalProductCount: totalProductCount,
      currentPage: pageNumber,
      previousPage: pageNumber - 1,
      nextPage: pageNumber + 1,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: ITEMS_PER_PAGE * pageNumber < totalProductCount,
      lastPage: Math.ceil(totalProductCount/ITEMS_PER_PAGE)
    });
  })
  .catch((err) => {
    console.log(err);
  });
};

exports.getCart = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  //populate doesn't return a promise that's why we are calling this function
  .execPopulate()
  .then(user=>{
    const products = user.cart.items;
    res.render("shop/cart", {
      path: "/cart",
      title: "Your Cart",
      products: products
    });
  })
};

exports.postCart = (req, res, next) => {
  Product.findById(req.body.id)
  .then(product=>{
    return req.user.addToCart(product);
  })
  .then(result=>{
    res.redirect("/cart");
  })
};

exports.deleteCartItem = (req, res, next) => {
  req.user
    .deleteCartItem(req.body.id)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCheckout = (req, res, next) => {
  let products, totalPrice;
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then(user=>{
    products = user.cart.items;
    totalPrice = products.reduce((acc, prod) => acc+prod.quantity*prod.productId.price, 0);

    return stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: products.map((product)=>{
        return {
          name: product.productId.title,
          description: product.productId.description,
          amount: product.productId.price * 100,
          currency: 'usd',
          quantity: product.quantity
        };
      }),
      success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
      cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
    });
  })
  .then((session)=>{
    res.render("shop/checkout", {
      path: "/checkout",
      title: "Checkout",
      products: products,
      totalPrice: totalPrice,
      sessionId: session.id
    });
  })
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then(user=>{
    const products = user.cart.items.map(item=>{
      return {quantity: item.quantity, product: {...item.productId}}
    });
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user
      },
      products: products
    });
    return order.save()
  })
  .then(()=>{
    return req.user.clearCart();
  })
  .then((result) => {
    res.redirect("/orders");
  })
  .catch((err) => {
    console.log(err);
  });
};

exports.postOrder = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then(user=>{
    const products = user.cart.items.map(item=>{
      return {quantity: item.quantity, product: {...item.productId}}
    });
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user
      },
      products: products
    });
    return order.save()
  })
  .then(()=>{
    return req.user.clearCart();
  })
  .then((result) => {
    res.redirect("/orders");
  })
  .catch((err) => {
    console.log(err);
  });
};

exports.getOrders = (req, res, next) => {
  Order.find({"user.userId": req.user._id})
  .then((orders) => {
    res.render("shop/orders", {
      path: "/orders",
      title: "Your Orders",
      orders: orders
    });
  });
};

exports.getOrderInvoice = (req, res, next) => {
  Order.findById(req.params.orderId)
  .then((order)=>{
    if(!order) return next(new Error('Invalid Order'));
    if(order.user.userId.toString() !== req.user._id.toString()) return next(new Error('Unauthorized user'));

    const orderId = req.params.orderId;
    const invoiceName = 'invoice'+'-'+orderId+'.pdf'
    const invoicePath = path.join('data', 'invoice', invoiceName);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="'+invoiceName+'"');
    

    const invoicePDF = new PDFDocument();

    invoicePDF.pipe(fs.createWriteStream(invoicePath));
    invoicePDF.pipe(res);

    invoicePDF.fontSize(26).text("Invoice", {underline: true});
    invoicePDF.fontSize(20).text("--------------------------");
    let totalPrice = 0;
    order.products.forEach(product => {
      totalPrice+= product.quantity * product.product.price;
      invoicePDF.fontSize(14).text(`${product.product.title} - ${product.quantity} x $${product.product.price}`);
    });
    invoicePDF.fontSize(20).text("--------------------------");
    invoicePDF.fontSize(16).text(`Total Price: $${totalPrice}`);

    invoicePDF.end();


    // node will read file in chunks
    //const fileStream = fs.createReadStream(invoicePath);
    
    // forward the data that is read in to res, because res object is writable stream.
    // we can readable streams to pipe their output to writable stream.
    // and then the response will be streamed to the browser.
    // and the data will be downloaded by the browser step by step.
    //fileStream.pipe(res);

    /**
     * If we read file like this node will read the entire content into the memory.
     * which will take time to load into memory and it can overflow easily and then
     * it is sent over the network, instead we should stream this data.
     fs.readFile(invoicePath, (err, data)=>{
      if(err){
        return next(err);
      }
      res.setHeader('Content-Type', 'application-pdf');
      // open pdf in browser
      // res.setHeader('Content-Disposition', 'inline');
      // open download popup
      res.setHeader('Content-Disposition', 'attachment; filename="'+ invoiceName + '"');
      res.send(data);
    });
    */
  })
  .catch(err=>next(err));
};

/**
 * used mongodb
 
const Product = require("../models/product");
const User = require("../models/user");
// const Cart = require("../models/cart");
// const Order = require("../models/order");

exports.getProducts = (req, res, next) => {
  Product.fetchAll()
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
  Product.fetchAll()
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
  req.user.getCart()
  .then(products=>{
    res.render("shop/cart", {
      path: "/cart",
      title: "Your Cart",
      products: products
    });
  })
  // by using promise approach
  // const cartItems = req.user.cart.items;
  // const cartProducts = cartItems.map(item => {
  //   return Product.findById(item.productId).then(product=>{
  //     product.quantity = item.quantity;
  //     return product;
  //   })
  // });
  // Promise.all(cartProducts)
  // .then(products=>{
  //   res.render("shop/cart", {
  //     path: "/cart",
  //     title: "Your Cart",
  //     products: products
  //   });
  // })
  // .catch((err) => {
  //   console.log(err);
  // });
};

exports.postCart = (req, res, next) => {
  Product.findById(req.body.id)
  .then(product=>{
    return req.user.addToCart(product);
  })
  .then(result=>{
    res.redirect("/cart");
  })
  // req.user
  //   .getCart()
  //   .then((cart) => {
  //     fetchedCart = cart;
  //     return cart.getProducts({ where: { id: id } });
  //   })
  //   .then((products) => {
  //     let product;
  //     if (products.length > 0) {
  //       product = products[0];
  //     }
  //     if (product) {
  //       const oldQuantity = product.cartItem.quantity;
  //       newQuantity = oldQuantity + 1;
  //       return Promise.resolve(product);
  //     }
  //     return Product.findByPk(id);
  //   })
  //   .then((product) => {
  //     return fetchedCart.addProduct(product, {
  //       through: { quantity: newQuantity },
  //     });
  //   })
  //   .then((result) => {
  //     res.redirect("/cart");
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });

  // Product.findById(id, (product) => {
  //   Cart.addProduct(id, product.price);
  //   res.redirect("/");
  // });
};

exports.deleteCartItem = (req, res, next) => {
  req.user
    .deleteCartItem(req.body.id)
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
    .addOrder()
    .then((result) => {
      res.redirect("/orders");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders()
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        title: "Your Orders",
        orders: orders,
      });
    });
};

*/

/**
 * used sequelize
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

*/

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
