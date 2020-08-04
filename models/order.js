const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    products: [{
        product: {type: Object, required: true},
        quantity: {type: Number, required: true}
    }],
    user: {
        name: {type: String, required: true},
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        }
    }
});

module.exports = mongoose.model('Order', orderSchema);
/**
 * sequelize model

const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Order = sequelize.define('order', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    }
});

module.exports = Order;
*/