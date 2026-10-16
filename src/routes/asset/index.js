const express = require('express');
const router = express.Router();
const assetController = require('../../controllers/asset');

// POST /assets/add_asset.php
router.post(['/add_asset.php', '/add_asset'], assetController.addAsset);

// GET & POST /assets/get_asset.php
router.get(['/get_asset.php', '/get_asset'], assetController.getAsset);
router.post(['/get_asset.php', '/get_asset'], assetController.getAsset);

// POST /assets/issue_asset.php
router.post(['/issue_asset.php', '/issue_asset'], assetController.issueAsset);

// GET & POST /assets/get_issue_asset.php
router.get(['/get_issue_asset.php', '/get_issue_asset'], assetController.getIssueAsset);
router.post(['/get_issue_asset.php', '/get_issue_asset'], assetController.getIssueAsset);

// POST /assets/update_asset_status.php
router.post(['/update_asset_status.php', '/update_asset_status'], assetController.updateAssetStatus);

module.exports = router;
