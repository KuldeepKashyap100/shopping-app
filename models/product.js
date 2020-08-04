const mongoose = require('mongoose');
const { Double } = require('mongodb');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageURL:{
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema);

/**
 * Using mongoclient to do data operations

const mongodb = new require('mongodb');
const { getDb } = require("../util/database");

class Product {
    constructor(title,imageURL,description,price, id, userId) {
        this.title = title;
        this.imageURL = imageURL;
        this.description = description;
        this.price = price;
        this._id = id ? new mongodb.ObjectId(id): null;
        this.userId = userId;
    }
    save(){
        const db = getDb();
        if(!this._id) {
            return db.collection('products').insertOne(this)
            .then(result=>{
                return result;
            })
            .catch();
        }
        return db.collection('products')
        .updateOne({_id: new mongodb.ObjectId(this._id)},{
            $set: this
        } );
    }
    static fetchAll(){
        const db = getDb();
        return db.collection('products')
        .find() // it will return cursor which we can iterate to get one document at a time. it will reduce network load as there could be millions of document.
        .toArray() 
        .then(products=>products)
        .catch();
    }
    static findById(id) {
        const db = getDb();
        return db.collection('products')
        .find({_id: new mongodb.ObjectId(id)}) // mongodb doesn't know how many documents even though we are providing id filter.
        .next() // it will return the last document in returned by find.
        .then(product=>product)
        .catch();
    }

    static deleteProduct(id) {
        const db = getDb();
        return db.collection('products')
        .deleteOne({_id: new mongodb.ObjectId(id)});
    }
}
module.exports = Product;

*/

/**
 * Using sequelize to do data operations
 */

// const Sequelize = require('sequelize');

// const sequelize = require('../util/database');

// const Product = sequelize.define('product', {
//     id: {
//         type: Sequelize.INTEGER,
//         autoIncrement: true,
//         allowNull: false,
//         primaryKey: true
//     },
//     title: {
//         type: Sequelize.STRING,
//         allowNull: false
//     },
//     price: {
//         type: Sequelize.DOUBLE,
//         allowNull: false
//     },
//     imageURL: {
//         type: Sequelize.STRING,
//         allowNull: false
//     },
//     description: {
//         type: Sequelize.STRING,
//         allowNull: false
//     }
// });

// module.exports = Product;

/**
 * Using mysql queries to do data operations
 */
// const db = require("../util/database");

// const cart = require("./cart");

// module.exports = class Product {
//   constructor(id, title, imageURL, description, price) {
//     this.id = id;
//     this.title = title;
//     this.imageURL = imageURL;
//     this.description = description;
//     this.price = price;
//   }
//   save() {
//     return db.execute(
//       `insert into products (title, description, price, imageURL) values (?, ?, ?, ?)`,
//       [this.title,this.description, this.price, this.imageURL]
//     );
//   }
//   static deleteProduct(id) {
//     return db.execute(`delete from products where id=${id}`);
//   }
//   static findById(id) {
//     return db.execute(`select * from products where id = ?`,[id]);
//   }
//   static fetchAll(cb) {
//     return db.execute("select * from products");
//   }
// };

/** Using fileSystem to store the data */
// const fs = require('fs');
// const path = require('path');

// const cart = require('./cart');
// // const products = [];

// const productsPath = path.join(path.dirname(process.mainModule.filename), 'data', 'products.json');
// const getProductsFromFile = (cb) => {
//     fs.readFile(productsPath, (err, fileContent) => {
//         if (err) {
//             cb([]);
//             return;
//         }
//         cb(JSON.parse(fileContent));
//     })
// }

// module.exports = class Product {
//     constructor(id, title,imageURL,description,price) {
//         this.id = id;
//         this.title = title;
//         this.imageURL = imageURL;
//         this.description = description;
//         this.price = price;
//     }
//     save() {
//         getProductsFromFile((products)=>{
//             if(this.id) {
//                 const existingIndex = products.findIndex(product=>product.id===this.id);
//                 const updatedProducts = [...products];
//                 updatedProducts[existingIndex] = this;
//                 fs.writeFile(productsPath, JSON.stringify(updatedProducts), (err) => {
//                     console.log(err);
//                 });
//             }
//             else {
//                 this.id = Math.random().toString();
//                 products.push(this);
//                 fs.writeFile(productsPath, JSON.stringify(products), (err) => {
//                     console.log(err);
//                 });
//             }

//         });
//     }
//     static deleteProduct(id, cb) {
//         getProductsFromFile((products)=>{
//             const updatedProducts = products.filter(product=> product.id !== id);
//             const product = products.find(product=>product.id===id);
//             fs.writeFile(productsPath, JSON.stringify(updatedProducts), err=>{
//                 cart.deleteProduct(id, product.price);
//                 cb();
//             });
//         });
//     }
//     static findById(id, cb) {
//         getProductsFromFile((products)=>{
//             const product = products.find(product=>product.id===id);
//             cb(product);
//         });
//     }
//     static fetchAll(cb) {
//         getProductsFromFile(cb);
//     }
// }
 