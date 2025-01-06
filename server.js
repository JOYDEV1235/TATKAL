const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose.connect("mongodb+srv://joydevrana529:pLpWljgd0QkghreX@joydev.dl53k.mongodb.net/?retryWrites=true&w=majority&appName=JOYDEV", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Schema
const PassengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  sex: { type: String, required: true, enum: ["male", "female", "other"] },
  berth: { type: String, required: true },
  food: { type: String, required: true },
  nationality: { type: String, required: true },
  passportNo: String,
  isChild: { type: Boolean, default: false },
  isSenior: { type: Boolean, default: false },
  needsBed: { type: Boolean, default: false },
});

const BookingSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  journeyDate: { type: Date, required: true },
  bdgPt: { type: String, required: true },
  trainNo: { type: String, required: true },
  trainType: { type: String, required: true },
  class: {
    type: String,
    required: true,
    enum: ["sleeper", "ac3", "ac2", "1A", "3E", "2E", "2S", "CC", "EC"],
  },
  quota: {
    type: String,
    required: true,
    enum: ["general", "tatkal"],
  },
  passengers: {
    type: [PassengerSchema],
    required: true,
    validate: [arrayMinLength, "At least one passenger is required"],
  },
  phone: { type: String, required: true },
  epId: { type: String, required: true },
  paymentUtr: { type: String, required: true },
  // paymentScreenshot: { type: String }, // Commented out this field since we are not handling file uploads
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Validation function for minimum passengers
function arrayMinLength(val) {
  return val.length >= 1;
}

const Booking = mongoose.model("Booking", BookingSchema);

// 📌 Removed multer configuration
// const multer = require("multer");
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowedMimeTypes = [
//     "image/jpeg",
//     "image/jpg",
//     "image/png",
//     "application/pdf",
//     "application/msword",
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   ];

//   if (allowedMimeTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(
//       new Error(
//         "Invalid file type. Only JPEG, PNG, PDF, and DOC files are allowed."
//       ),
//       false
//     );
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
// });

// API Routes
app.post("/api/bookings", async (req, res) => {
  try {
    let bookingData;

    // Parse the incoming request body if it's a string
    if (typeof req.body === "string") {
      bookingData = JSON.parse(req.body);
    } else {
      bookingData = req.body;
    }

    // Map the payload fields to the schema's field names
    const booking = new Booking({
      from: bookingData.from,
      to: bookingData.to,
      journeyDate: new Date(bookingData.date), // Convert date string to a Date object
      bdgPt: bookingData["bdg-pt"],
      trainNo: bookingData["train-no"],
      trainType: bookingData["train-type"],
      class: bookingData.class,
      quota: bookingData.quota,
      passengers: JSON.parse(bookingData.passengers), // Parse the passengers string
      phone: bookingData.phone,
      epId: bookingData["ep-id"],
      paymentUtr: bookingData["payment-utr"],
      // paymentScreenshot: req.file ? req.file.filename : undefined,  // Commented out
      status: "pending", // Default status
      createdAt: new Date(),
    });

    // Save the booking to the database
    await booking.save();

    res.status(201).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Error creating booking",
    });
  }
});

app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .select("-__v"); // Exclude version key

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching bookings",
    });
  }
});

// 📌 Removed the static file serving for uploads directory
// app.use("/uploads", express.static("uploads"));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    success: false,
    error: error.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
