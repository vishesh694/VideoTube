// src/index.js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


connectDB()
.then(()=>{
    app.on("error", (error) => {
        console.error("MongoDB connection error:", error);
        throw error;
    });
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.error("MongoDB connection error:", error);
})



/*
import express from "express";
const app = express();
(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.error("MongoDB connection error:", error);
            throw error;
        });
        app.listen(process.env.PORT,()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR",error);
        throw error;
    }
})()
*/