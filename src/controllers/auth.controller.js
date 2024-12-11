import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import UserModel from "../models/user.model.js";
import { JWT_SECRET, SMTP_USER } from "../config/constants.js"
import transporter from "../config/nodemailer.js";
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from "../config/emailTemplates.js"



//  USER REGISTER CONTROLLER
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    // check all fields include data.
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required !" })
    };

    try {
        // check user exist or not
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User email already exist !" });
        };

        // password hashed
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new UserModel({
            name,
            email,
            password: hashedPassword
        });

        // save the user
        await user.save();

        // generate token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        // set cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE.ENV === "production" ? true : false,
            samesite: process.env.NODE.ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // mail data
        const mailOptions = {
            from: SMTP_USER,
            to: email,
            subject: "Welcome to MERN_Auth",
            text: "Mail activation text",
            html: `<h1>Well come to Mern Auth</h1>`
        };

        // send mail
        await transporter.sendMail(mailOptions);

        // send to the response
        return res.status(201).json({
            success: true,
            message: "Send a email for user verification."
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

    // check all fields include data.
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required !" });
    };

    try {
        // check user exist or not
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found !" });
        };

        // trying match the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Password doesn,t match !" });
        };

        // generate token and sign in the token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        // set the cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE.ENV === "production" ? true : false,
            samesite: process.env.NODE.ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // send to the response
        return res.status(200).json({
            success: true,
            message: "User logged in successfully."
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
        // clear cookie from the response object
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE.ENV === "production" ? true : false,
            samesite: process.env.NODE.ENV === "production" ? "none" : "strict",
        });

        // send to the response
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

        // generate 6 dixit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // generate OTP save to the verifyOtp
        user.verifyOtp = otp;
        // create a fixed expired time
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        // prepare mail data for account verification
        const mailOptions = {
            from: SMTP_USER,
            to: user.email,
            subject: "Account Verification OTP",
            // text: `Your OTP is ${otp} Verify your account using this OTP.`,
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        };
        // send to the mail
        await transporter.sendMail(mailOptions);

        // send to the response
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

    // check all fields include data
    if (!userId || !otp) {
        return res.status(400).json({ success: false, message: "All fields are required !" })
    };

    try {
        // check user exist or not
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        };

        // check in the db has otp
        if (user.verifyOtp === "" || user.verifyOtp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP !" })
        };

        // check OTP expired time
        if (user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP Expired !" })
        };

        // change status on the db
        user.isAccountVerified = true;
        user.verifyOtp = ""
        user.verifyOtpExpireAt = 0;

        // user info save to the db.
        await user.save();

        // send to the response
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
        // just check user authenticate or not
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

    // check email field data are include
    if (!email) {
        return res.status(400).json({ success: false, message: "Email fields are required !" })
    };

    try {
        // check user exist or not
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found !" })
        };

        // generate six digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // change to the status in the db
        user.resetOtp = otp;
        // create expired time for reset OTP
        user.resetOtpExpireAt = Date.now() + 5 * 60 * 1000;

        // save to the db
        await user.save();

        // prepare mail data
        const mailOptions = {
            from: SMTP_USER,
            to: user.email,
            subject: "Passwod Reset OTP",
            // text: `Your OTP is ${otp} reset your password using this OTP.`,
            html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        };

        // send to the meail
        await transporter.sendMail(mailOptions);

        // send to the response
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

    // check all fields are include data
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "All fields are required !" })
    };

    try {
        // check user exist or not
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!." })
        };

        // check to the db reset OTP status
        if (user.resetOtp === "" || user.resetOtp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP !" })
        };

        // check reset password OTP expired time
        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP Expired !" })
        };

        // hashed to the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // change to the db reset OTP status
        user.password = hashedPassword;
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;

        // save to the db
        await user.save();

        // send to the response
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