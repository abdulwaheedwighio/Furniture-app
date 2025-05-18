const express = require("express");
const router = express.Router();

const upload = require("../middleware/multer");
const { addToCart } = require("../controller/addtoCartController"); // correct spelling and case

// Add this line to import cartController:
const cartController = require("../controller/getCartItem");

// POST route to add product to cart
router.post("/add-cart", upload.single("photo"), addToCart);

// GET route to get cart items for a user
router.get("/get-cart/:userId", cartController.getCartItems);
router.get("/get-all-cart", cartController.getAllCartItems);

module.exports = router;
