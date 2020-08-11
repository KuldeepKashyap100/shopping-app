const path = require('path');

const express = require('express');

const rootDir = require('../util/path');
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// we can add as many handlers as we want and the request will be funneled through from left to right.
router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/products', isAuth, adminController.getProducts);

router.post('/add-product', isAuth, adminController.postAddProduct);

router.get('/edit-product/:id', isAuth, adminController.getEditProduct);

router.post('/edit-product', isAuth, adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.deleteProduct);

exports.router = router;