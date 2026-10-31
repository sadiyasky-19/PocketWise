
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

const Expense = require("./models/Expense");
const Budget = require("./models/Budget");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get("/", (req, res) => {
  res.send("PocketWise backend is running!");
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "PocketWise API is working!",
    success: true
  });
});

// Save monthly budget
app.post("/api/budget", async (req, res) => {
  try {
    const { month, amount } = req.body;

    if (!month || amount === undefined || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget details"
      });
    }

    const budget = await Budget.findOneAndUpdate(
      { month },
      { amount: Number(amount) },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Budget saved successfully!",
      budget: budget.amount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get monthly budget
app.get("/api/budget/:month", async (req, res) => {
  try {
    const budget = await Budget.findOne({ month: req.params.month });

    res.json({
      success: true,
      budget: budget ? budget.amount : 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new expense
app.post("/api/expenses", async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (!title || !category || !date || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid expense details"
      });
    }

    const expense = await Expense.create({
      title,
      amount: Number(amount),
      category,
      date
    });

    res.status(201).json({
      success: true,
      message: "Expense added successfully!",
      expense: {
        id: expense._id.toString(),
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all expenses
app.get("/api/expenses", async (req, res) => {
  try {
    const records = await Expense.find().sort({ _id: -1 });

    const expenses = records.map(expense => ({
      id: expense._id.toString(),
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date
    }));

    res.json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete expense
app.delete("/api/expenses/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      });
    }

    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      });
    }

    res.json({
      success: true,
      message: "Expense deleted successfully!"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get expenses by month
app.get("/api/expenses/month/:month", async (req, res) => {
  try {
    const month = req.params.month;

    const records = await Expense.find({
      date: { $regex: "^" + month }
    });

    const expenses = records.map(expense => ({
      id: expense._id.toString(),
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date
    }));

    const total = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    res.json({
      success: true,
      month,
      totalExpenses: total,
      expenses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 404 middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Connect MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`PocketWise backend running at http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error("MongoDB connection error:", error.message);
  });
