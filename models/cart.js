const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Cart = sequelize.define('cart', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  }
});

module.exports = Cart;

/**
 * Using fileSystem to do the data operations
 */
// const fs = require("fs");
// const path = require("path");

// const Product = require("./product");

// const cartPath = path.join(
//   path.dirname(process.mainModule.filename),
//   "data",
//   "cart.json"
// );
// module.exports = class Cart {

//   static addProduct(id, productPrice) {
//     let cart = { products: [], totalPrice: 0 };
//     fs.readFile(cartPath, (err, fileContent) => {
//       if (!err) {
//         cart = JSON.parse(fileContent);
//       }
//       const existingProductIndex = cart.products.findIndex(
//         (product) => product.id === id
//       );
//       const existingProduct = cart.products[existingProductIndex];
//       let updatedProduct;
//       if (existingProduct) {
//         updatedProduct = { ...existingProduct, qty: existingProduct.qty + 1 };
//         cart.products = [...cart.products];
//         cart.products[existingProductIndex] = updatedProduct;
//       } else {
//         updatedProduct = { id: id, qty: 1 };
//         cart.products = [...cart.products, updatedProduct];
//       }
//       cart.totalPrice = +cart.totalPrice + +productPrice;

//       fs.writeFile(cartPath, JSON.stringify(cart), (err) => {
//         if (err) console.log(err);
//       });
//     });
//   }

//   static deleteProduct(id, price) {
//     fs.readFile(cartPath, (err, fileContent) => {
//         if(err)
//             return;
//         let updatedCart = {...JSON.parse(fileContent)};
//         let product = updatedCart.products.find(product=>product.id===id);
//         if(!product)
//           return;
//         let produtQty = product.qty;
//         updatedCart.totalPrice = updatedCart.totalPrice - +price*produtQty;
//         updatedCart.products = updatedCart.products.filter(product=>product.id!==id);
//       fs.writeFile(cartPath, JSON.stringify(updatedCart), (err) => {
//         console.log(err);
//       });
//     });
//   }

//   static getCart(cb) {
//     fs.readFile(cartPath, (err, fileContent)=>{
//       if(err)
//         return cb(null);
//       const cart = {...JSON.parse(fileContent)};
//       cb(cart);
//     });
//   }
// };
