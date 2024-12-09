import nodemailer from "nodemailer";

import { SMTP_USER, SMTP_PASS } from "../config/constants.js";


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});


export const sendEmail = async (email) => {
    const mailOptions = {
        from: SMTP_USER,
        to: email,
        subject: "Welcome to MERN_Auth",
        text: "Mail activation text",
        html: `<h1>Well come to Mern Auth</h1>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, info };
    } catch (error) {
        return { success: false, message: error.message };
    }
};