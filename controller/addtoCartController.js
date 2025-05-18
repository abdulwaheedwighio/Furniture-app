const Product = require("../model/productModel");
const Cart = require("../model/cartModel");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.addToCart = async (req, res) => {
  try {
    const { userId, category, productName, description, price } = req.body;

    // Validate input
    if (!userId || !category || !productName || !price) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }

    // Check if product already exists with same name and category
    let existingProduct = await Product.findOne({ productName, category });

    // If not exist, create it
    if (!existingProduct) {
      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "cart_products",
        use_filename: true,
        unique_filename: false,
      });

      const imageUrl = uploadedImage.secure_url;

      const newProduct = new Product({
        category,
        productName,
        description,
        price,
        imageUrl,
      });

      existingProduct = await newProduct.save();
    }

    // Check if product is already in the user's cart
    const existingCartItem = await Cart.findOne({
      userId,
      productId: existingProduct._id,
    });

    if (existingCartItem) {
      return res
        .status(400)
        .json({ message: "Product already exists in cart." });
    }

    // Add to cart
    const newCartItem = new Cart({
      userId,
      productId: existingProduct._id,
    });

    await newCartItem.save();

    return res.status(200).json({
      message: "Product added to cart successfully.",
      product: existingProduct,
    });
  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
