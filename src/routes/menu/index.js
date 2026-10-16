const express = require('express');
const router = express.Router();
const menuController = require('../../controllers/menu');

// POST /menu/add_checkpoints.php
router.post(['/add_checkpoints.php', '/add_checkpoints'], menuController.addCheckpoints);

// POST /menu/add_menus.php
router.post(['/add_menus.php', '/add_menus'], menuController.addMenus);

// POST /menu/add_transaction.php
router.post(['/add_transaction.php', '/add_transaction'], menuController.addTransaction);

// GET & POST /menu/get_checkpoints.php
router.get(['/get_checkpoints.php', '/get_checkpoints'], menuController.getCheckpoints);
router.post(['/get_checkpoints.php', '/get_checkpoints'], menuController.getCheckpoints);

// GET & POST /menu/get_menu.php
router.get(['/get_menu.php', '/get_menu'], menuController.getMenu);
router.post(['/get_menu.php', '/get_menu'], menuController.getMenu);

// GET & POST /menu/get_transaction.php
router.get(['/get_transaction.php', '/get_transaction'], menuController.getTransaction);
router.post(['/get_transaction.php', '/get_transaction'], menuController.getTransaction);

// GET & POST /menu/get_types.php
router.get(['/get_types.php', '/get_types'], menuController.getTypes);
router.post(['/get_types.php', '/get_types'], menuController.getTypes);

// GET & POST /menu/get_type_ext.php
router.get(['/get_type_ext.php', '/get_type_ext'], menuController.getTypeExt);
router.post(['/get_type_ext.php', '/get_type_ext'], menuController.getTypeExt);

module.exports = router;
