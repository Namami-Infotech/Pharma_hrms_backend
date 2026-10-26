const express = require('express');
const router = express.Router();
const productController = require('../../controllers/product');

// GET & POST list of products: /product/get_products.php, /product/list, /product/
router.get(['/get_products.php', '/get_products', '/list_products.php', '/list_products', '/list', '/'], productController.getProducts);
router.post(['/get_products.php', '/get_products', '/list_products.php', '/list_products', '/list'], productController.getProducts);

// GET & POST view single product: /product/view_product.php, /product/:id
router.get(['/view_product.php', '/view_product', '/:id'], productController.getProductById);
router.post(['/view_product.php', '/view_product'], productController.getProductById);

// POST add product: /product/add_product.php, /product/create_product.php, /product/add, /product/create
router.post(['/add_product.php', '/add_product', '/create_product.php', '/create_product', '/add', '/create'], productController.addProduct);

// POST update product: /product/update_product.php, /product/edit_product.php, /product/update, /product/:id
router.post(['/update_product.php', '/update_product', '/edit_product.php', '/edit_product', '/update'], productController.updateProduct);
router.put(['/:id', '/update/:id'], productController.updateProduct);

// POST delete product: /product/delete_product.php, /product/delete, /product/:id
router.post(['/delete_product.php', '/delete_product', '/delete'], productController.deleteProduct);
router.delete(['/:id', '/delete/:id'], productController.deleteProduct);

module.exports = router;
