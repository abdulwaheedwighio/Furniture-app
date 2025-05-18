const Cart = require("../model/cartModel");
const Product = require("../model/productModel");

// controllers/cartController.js

exports.getCartItems = async (req, res) => {
  try {
    const { userId } = req.params;

    // Assuming a Cart model with userId and productId reference
    // Also assuming product details are referenced inside productId
    const cartItems = await Cart.find({ userId })
      .populate("productId") // populate product details
      .sort({ createdAt: -1 });

    // Map cart items to simplified objects for response
    const simplifiedItems = cartItems.map((item) => ({
      cartItemId: item._id,
      productId: item.productId._id,
      category: item.productId.category,
      productName: item.productId.productName,
      description: item.productId.description,
      price: item.productId.price,
      imageUrl: item.productId.imageUrl,
      addedAt: item.createdAt,
    }));

    // Group by category
    const cartItemsByCategory = simplifiedItems.reduce((acc, item) => {
      const category = item.category || "Others";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    res.json({
      userId,
      cartItemsByCategory,
    });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
