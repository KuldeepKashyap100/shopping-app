const mongodb = require('mongodb');
const {getDb} = require('../util/database');
const Product = require('./product');
class User {
    constructor(userName, password, email, id, cart) {
        this.userName = userName;
        this.password = password;
        this.email = email;
        this._id = id? new mongodb.ObjectId(id): null,
        this.cart = cart;
    }

    save() {
        const db = getDb();
        return db.collection('users')
        .insertOne(this);
    }

    addToCart(product) {
        const db = getDb();
        const cartProductIndex = this.cart.items.findIndex(item=>item.productId.toString()===product._id.toString());
        let newQuantity = 1;
        const updatedCartItems = [...this.cart.items];
        if(cartProductIndex>=0) {
            newQuantity = this.cart.items[cartProductIndex].quantity+1;
            updatedCartItems[cartProductIndex].quantity = newQuantity;
        }
        else {
            updatedCartItems.push({productId: new mongodb.ObjectId(product._id), quantity: newQuantity});
        }
        const updatedCart = {
            items: updatedCartItems
        };
        return db.collection('users')
        .updateOne({_id: new mongodb.ObjectId(this._id)}, {$set: {cart: updatedCart}});
    }

    getCart() {
        const db = getDb();
        return db.collection('products')
        .find({_id: {$in: this.cart.items.map(item=>item.productId)}})
        .toArray()
        .then(products=>{
            return products.map(product => {
                return {
                    ...product,
                    quantity: this.cart.items.find(item=>item.productId.toString()===product._id.toString()).quantity
                }
            })
        })
    }

    addOrder() {
        const db = getDb();
        return this.getCart()
        .then(products=>{
            const order = {
                items: products,
                user: {
                    _id: new mongodb.ObjectId(this._id),
                    name: this.userName,
                    email: this.email
                }
            };
            return db.collection('orders').insertOne(order);
        })
        .then((result)=>{
            this.cart.items = [];
            return db.collection('users')
            .updateOne({_id: this._id}, {$set: {cart: {items: []}}});
        });
    }

    getOrders() {
        const db = getDb();
        return db.collection('orders').find({'user._id': this._id})
        .toArray();

    }

    deleteCartItem(productId) {
        const db = getDb();
        const updatedCartItems = this.cart.items.filter(item=>item.productId.toString()!==productId);
        return db.collection('users').
        updateOne({_id: this._id}, {$set: {cart: {items: updatedCartItems}}});
    }

    static findById(id) {
        const db = getDb();
        return db.collection('users')
        .findOne({_id: new mongodb.ObjectId(id)});
    }
}

module.exports = User;

/**
 *  Sequelize model
 *
const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const User = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    userName: Sequelize.STRING,
    userEmail: Sequelize.STRING
});

module.exports = User;

*/