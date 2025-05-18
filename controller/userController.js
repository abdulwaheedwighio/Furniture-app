const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
require("dotenv").config(); // Load environment variables
const nodeMailer = require("nodemailer");

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ User Registration Function
const userRegister = async (req, res) => {
  try {
    console.log("📩 Request Body:", req.body);
    console.log("🖼️ File Info:", req.file);

    const { name, email, address, dateOfBirth, phoneNumber, password, role } =
      req.body;

    // ✅ Validate required fields
    if (
      !name ||
      !email ||
      !address ||
      !dateOfBirth ||
      !phoneNumber ||
      !password ||
      !req.file
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all fields including image" });
    }

    // ✅ Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    // ✅ Format DateOfBirth
    const formattedDateOfBirth = formatDate(dateOfBirth);

    // ✅ Hash Password for Security
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Assign Role (First user becomes "admin", others get "user" role)
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? "admin" : role || "user";

    // ✅ Validate role input (Allowed roles: "VIP", "Admin", "User")
    const validRoles = ["vip", "admin", "user"];
    if (!validRoles.includes(assignedRole)) {
      return res
        .status(400)
        .json({ message: "Invalid role! Allowed roles: VIP, Admin, User" });
    }

    // ✅ Upload Image to Cloudinary
    const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
      folder: "user_images",
      use_filename: true,
      unique_filename: false,
    });

    // ✅ Create User Record in Database
    const newUser = await User.create({
      name,
      email,
      address,
      dateOfBirth: formattedDateOfBirth,
      phoneNumber,
      password: hashedPassword,
      role: assignedRole,
      image: uploadedImage.secure_url,
    });

    const message =
      assignedRole === "vip"
        ? "🎉 VIP User registered successfully!"
        : "User registered successfully!";
    return res.status(201).json({
      success: true,
      message,
      user: { id: newUser._id, name, email, role },
    });
  } catch (error) {
    console.error("🔥 Registration Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message || "Unexpected error occurred",
    });
  }
};

// ✅ User Login Function
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and Password are required" });
    }

    // ✅ Check if User Exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
        image: user.image,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("🔥 Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message || "Unexpected error occurred",
    });
  }
};

// ✅ Format Date for Consistency (`YYYY-MM-DD` format recommended)
const formatDate = (date) => {
  const parsedDate = new Date(date);
  return isNaN(parsedDate)
    ? date
    : `${parsedDate.getFullYear()}-${("0" + (parsedDate.getMonth() + 1)).slice(
        -2
      )}-${("0" + parsedDate.getDate()).slice(-2)}`;
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send({ message: "Please Provide Email" });
    }

    const checkUser = await User.findOne({ email });
    if (!checkUser) {
      return res
        .status(400)
        .send({ message: "User not found, please register" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const transporter = nodeMailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    const reciever = {
      from: process.env.MY_GMAIL,
      to: email,
      subject: "Password Reset Request",
      text: `Click this link to reset your password:\n${process.env.CLIENT_URL}/reset-password/${token}`,
    };

    await transporter.sendMail(reciever);

    return res.status(201).send({
      message: "Password reset link sent successfully!",
      token: token, // ← include this line
    });
  } catch (error) {
    console.error("Forget Password Error:", error.message);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).send({ message: "Please provide Password" });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode.email) {
      return res.status(400).send({ message: "Invalid token payload" });
    }

    const user = await User.findOne({ email: decode.email });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    user.password = hashedPass;
    await user.save();

    return res.status(200).send({ message: "Password Reset Successfully...!" });
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    // ✅ Safe access to userId
    const userId = req?.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    // ✅ Fetch user without password field
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(201).json({
      success: true,
      message: "User profile fetched successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        image: user.image,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("🔥 Get Profile Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  userRegister,
  userLogin,
  forgetPassword,
  resetPassword,
  getUserProfile,
};
