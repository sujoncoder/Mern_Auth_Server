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

export default transporter;