const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");
const User = require("./models/User");
const Message = require("./models/Message");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection (Removed deprecated options)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ User Registration
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Error in registration:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ User Login
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "1h" });

        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("❌ Error in login:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ WebSocket Setup (Fixed Room Handling)
io.on("connection", (socket) => {
    console.log("⚡ New user connected");

    socket.on("joinRoom", ({ username, room }) => {
        socket.join(room);
        io.to(room).emit("message", { user: "Server", text: `${username} joined ${room}!` });
    });

    socket.on("sendMessage", async ({ username, message, room }) => {
        if (room) {
            const newMessage = new Message({ username, message, room });
            await newMessage.save();
            io.to(room).emit("message", { user: username, text: message });
        }
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected");
    });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
