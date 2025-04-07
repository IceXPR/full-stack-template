import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/database";
import userRoutes from "./routes/userRoutes";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
// app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

// Initialize TypeORM
AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });

// Routes
app.use("/api", userRoutes);

// Basic route
app.get("/", (_req, res) => {
    res.json({ message: "Welcome to the API" });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 