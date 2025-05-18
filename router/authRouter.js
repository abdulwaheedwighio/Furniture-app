const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/middleware");

const {
  userRegister,
  userLogin,
  forgetPassword,
  resetPassword,
  getUserProfile,
} = require("../controller/userController");
const upload = require("../middleware/multer");

router.post("/register", upload.single("image"), userRegister);
router.post("/login", userLogin);
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:token", resetPassword);

// ✅ Fix: Auth middleware should come first!
router.get("/user-profile", authenticateUser, getUserProfile);

module.exports = router;
