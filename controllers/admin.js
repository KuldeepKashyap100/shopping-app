const { validationResult } = require("express-validator/check");
const mongoose = require("mongoose");

const Product = require("../models/product");
const fileHelper = require('../util/files');


exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    title: "Add Product",
    path: "/admin/add-product",
    editing: false,
    errorMessage: null,
    hasError: false
  });
};

exports.postAddProduct = (req, res, next) => {
  const errors = validationResult(req);
  const image = req.file;
  if(!errors.isEmpty() || !image) {
    return res.status(422).render("admin/edit-product", {
      title: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      errorMessage: !image? "Attached file is not an image.": errors.array()[0].msg,
      product: {
        title: req.body.title,
        imageURL: req.file && req.file.path,
        price: req.body.price,
        description: req.body.description
      }
    });
  }
  // if(!image) {
  //   return res.status(422).render("admin/edit-product", {
  //     title: "Add Product",
  //     path: "/admin/add-product",
  //     editing: false,
  //     hasError: true,
  //     errorMessage: "Attached file is not an image.",
  //     product: {
  //       title: req.body.title,
  //       imageURL: req.file.path,
  //       price: req.body.price,
  //       description: req.body.description
  //     }
  //   });
  // }
  const product = new Product({
    title: req.body.title,
    imageURL: req.file.path,
    description: req.body.description,
    price: req.body.price,
    //mongoos will automatically pick up userId from user object
    userId: req.user
  });
  product.save()
  .then((results) => {
    console.log(results);
    res.redirect("/admin/products");
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit === "true" ? true : false;
  if (!editMode) return res.redirect("/");
  Product.findById(req.params.id)
    .then((product) => {
      if(product.userId.toString() !== req.user._id.toString()) return res.redirect("/products");
      if (!product) return res.redirect("/");
      res.render("admin/edit-product", {
        title: "Edit Product",
        path: "/admin/edit-product",
        hasError: false,
        editing: editMode,
        product: product,
        errorMessage: null
      });
    })
    .catch(err=>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      title: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      errorMessage: errors.array()[0].msg,
      product: {
        title: req.body.title,
        imageURL: req.body.imageURL,
        price: req.body.price,
        description: req.body.description,
        _id: req.body.id
      }
    });
  }
  const body = req.body;
  Product.findById(body.id)
  .then(product=>{
    product.title = body.title;
    if(req.file) {
      deleteFile(product.imageURL);
      product.imageURL = req.file.path;
    }
    product.description = body.description;
    product.price = body.price;
    return product.save();
  })
  .then(result=>{
    if(result)
      res.redirect("/admin/products");
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.deleteProduct = (req, res, next) => {
  Product.findById({_id: req.params.productId})
  .then(product => {
    if(!product)
      return next(new Error('Product not found.'));
    fileHelper.deleteFile(product.imageURL);
    return Product.deleteOne({_id: req.params.productId, userId: req.user._id})
  })
  .then(result=>{
    res.status(200).json({message: "Deleted SuccessFully!"});
  })
  .catch(err=>{
    res.status(500).json({message: "Delete Product failed."});
  });
};

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id})
  //fetch specific fields by using select method
  //.select('title price -_id')
  // poulate will tell mongoose to use _ids present in the object and fetch data for those _ids as well
  //.populate('userId', 'name email -password')
  .then((products) => {
    res.render("admin/products", {
      products: products,
      title: "Admin Products",
      path: "/admin/products"
    });
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};



/**
 * used mongodb 

const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    title: "Add Product",
    path: "/admin/add-product",
    editing: false,
  });
};

exports.postAddProduct = (req, res, next) => {
  const product = new Product(
    req.body.title,
    req.body.imageURL,
    req.body.description,
    req.body.price,
    null,
    req.user._id
  )
  product.save()
  .then((results) => {
    console.log(results);
    res.redirect("/admin/products");
  });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit === "true" ? true : false;
  if (!editMode) return res.redirect("/");
  Product.findById(req.params.id)
    .then((product) => {
      if (!product) return res.redirect("/");
      res.render("admin/edit-product", {
        title: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postEditProduct = (req, res, next) => {
  const body = req.body;
  const product = new Product(body.title, body.imageURL, body.description, body.price, body.id);
  product.save()
  .then(result=>{
    if(result)
      res.redirect("/admin/products");
  }).catch((err) => {
      console.log(err);
  });
  // Product.update(
  //   {
  //     title: body.title,
  //     imageURL: body.imageURL,
  //     description: body.description,
  //     price: body.price,
  //   },
  //   { where: { id: body.id } }
  // )
  //   .then((result) => {
  //     if(result[0])
  //       res.redirect("/admin/products");
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
};

exports.deleteProduct = (req, res, next) => {
  Product.deleteProduct(req.body.id)
  .then(result=>{
    if(result)
      res.redirect("/admin/products");
  })
  .catch(err=>{
      console.log(err);
  });
  // Product.destroy({where: {
  //   id: req.body.id
  // }}).then(result=>{
  //   if(result)
  //     res.redirect("/admin/products");
  // }).catch(err=>{
  //   console.log(err);
  // });
};

exports.getProducts = (req, res, next) => {
  Product.fetchAll()
  .then((products) => {
    res.render("admin/products", {
      products: products,
      title: "Admin Products",
      path: "/admin/products",
    });
  });
};

*/




/**
 * used sequelize
const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    title: "Add Product",
    path: "/admin/add-product",
    editing: false,
  });
};

exports.postAddProduct = (req, res, next) => {
  req.user.createProduct({
    title: req.body.title,
    price: req.body.price,
    imageURL: req.body.imageURL,
    description: req.body.description
  }).then((results) => {
    console.log(results);
    res.redirect("/");
  });;
  // Product.create({
  //   title: req.body.title,
  //   price: req.body.price,
  //   imageURL: req.body.imageURL,
  //   description: req.body.description,
  //   userId: req.user.id
  // }).then((results) => {
  //   console.log(results);
  //   res.redirect("/");
  // });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit === "true" ? true : false;
  if (!editMode) return res.redirect("/");
  const id = parseInt(req.params.id);
  Product.findByPk(id)
    .then((product) => {
      if (!product) return res.redirect("/");
      res.render("admin/edit-product", {
        title: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postEditProduct = (req, res, next) => {
  const body = req.body;
  Product.findByPk(body.id).then(product=>{
    product.title = body.title;
    product.imageURL = body.imageURL;
    product.description = body.description;
    product.price = body.price;
    return product.save()
  }).then(result=>{
    if(result)
      res.redirect("/admin/products");
  }).catch((err) => {
      console.log(err);
  });
  // Product.update(
  //   {
  //     title: body.title,
  //     imageURL: body.imageURL,
  //     description: body.description,
  //     price: body.price,
  //   },
  //   { where: { id: body.id } }
  // )
  //   .then((result) => {
  //     if(result[0])
  //       res.redirect("/admin/products");
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
};

exports.deleteProduct = (req, res, next) => {
  Product.findByPk(req.body.id)
  .then(product=>product.destroy())
  .then(result=>{
    if(result)
      res.redirect("/admin/products");
  })
  .catch(err=>{
      console.log(err);
  });
  // Product.destroy({where: {
  //   id: req.body.id
  // }}).then(result=>{
  //   if(result)
  //     res.redirect("/admin/products");
  // }).catch(err=>{
  //   console.log(err);
  // });
};

exports.getProducts = (req, res, next) => {
  req.user.getProducts()
  .then((products) => {
    res.render("admin/products", {
      products: products,
      title: "Admin Products",
      path: "/admin/products",
    });
  });
};
*/