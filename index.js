const express = require("express");
const dotenv = require("dotenv");
const dbconnection = require("./src/db/database");
const authRouter = require("./router/authRouter");
const cartRouter = require("./router/cartRouter");

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/user", authRouter);
app.use("/api/cart", cartRouter); // ✅ GOOD

app.get("/", (req, res) => {
  res.send(`<h1>Welcome to Node Js</h1>`);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

dbconnection();
