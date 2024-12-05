import mongoose from "mongoose";

import { DB_URL } from "./constants.js";


const connectDB = async () => {
    try {
        const db = await mongoose.connect(DB_URL);
        if (db) {
            console.log("Database Connection Successfully.😎")
        };
    } catch (error) {
        console.log("Database Connection Failed.🔥")
        process.exit(1);
    }
};

export default connectDB;