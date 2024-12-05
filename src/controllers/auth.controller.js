import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import UserModel from "../models/user.model.js";
import { JWT_SECRET } from "../config/constants.js"



//  USER REGISTER CONTROLLER
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: true, message: "All fields are required." })
    };

    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User email already exist." });
        };

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new UserModel({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE.ENV === "production" ? true : false,
            samesite: process.env.NODE.ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            success: true,
            message: "User account created successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.mesage
        });
    };
};

// USER LOGIN CONTROLLER
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    };

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found." });
        };

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Password doesn,t match." });
        };

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE.ENV === "production" ? true : false,
            samesite: process.env.NODE.ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "User logged in successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: error.mesage
        });
    }
};



// USER LOG OUT CONTROLLER
export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE.ENV === "production" ? true : false,
            samesite: process.env.NODE.ENV === "production" ? "none" : "strict",
        });

        return res.status(200).json({
            success: true,
            message: "User logout successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.mesage
        });
    };
};