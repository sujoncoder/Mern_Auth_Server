import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import UserModel from "../models/user.model.js";
import { JWT_SECRET, SMTP_USER } from "../config/constants.js"
import transporter from "../config/nodemailer.js";



//  USER REGISTER CONTROLLER
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required." })
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

        const mailOptions = {
            from: SMTP_USER,
            to: email,
            subject: "Welcome to MERN_Auth",
            text: "Mail activation text",
            html: `<h1>Well come to Mern Auth</h1>`
        };

        await transporter.sendMail(mailOptions);

        return res.status(201).json({
            success: true,
            message: "Send a mail for user verification."
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
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

// SEND VERIFICATION OTP TO THE USER MAIL
export const sendVerifyOTP = async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await UserModel.findById(userId);
        if (user.isAccountVerified) {
            return res.status(400).json({
                success: false, message: "Account already verified"
            });
        };

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        const mailOptions = {
            from: SMTP_USER,
            to: user.email,
            subject: "Account Verification OTP",
            text: `Your OTP is ${otp} Verify your account using this OTP.`,
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: "Verification OTP send this on Email."
        });
    } catch (error) {
        return res.status(500).json({
            message: error.mesage
        });
    }
};

//  VERIFY EMAIL USIN OTP
export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
        return res.status(400).json({ success: false, message: "All fields are required." })
    }
    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        };

        if (user.verifyOtp === "" || user.verifyOtp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" })
        };

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP Expired!" })
        };

        user.isAccountVerified == true;
        user.verifyOtp = ""
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successsfully."
        });
    } catch (error) {
        return res.status(500).json({
            message: error.mesage
        });
    };
};

// CHECK IS LOGGEDIN
export const isAuthenticated = (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "User Authenticated."
        });
    } catch (error) {
        return res.status(500).json({
            message: error.mesage
        });
    }
};

// SEND RESET OTP FOR PASSWORD RESET
export const sendResetOTP = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email fields are required!." })
    };
    try {

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!." })
        };

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 5 * 60 * 1000;

        await user.save();

        const mailOptions = {
            from: SMTP_USER,
            to: user.email,
            subject: "Passwod Reset OTP",
            text: `Your OTP is ${otp} reset your password using this OTP.`,
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: "Send to your password reset OTP on your email."
        });

    } catch (error) {
        return res.status(500).json({
            message: error.mesage
        });
    };
};


// RESET YOUR PASSWORD
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "All fields are required!." })
    };

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!." })
        };

        if (user.resetOtp === "" || user.resetOtp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP !." })
        };

        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP Expired !." })
        };

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully."
        });

    } catch (error) {
        return res.status(500).json({
            message: error.mesage
        });
    };
};