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