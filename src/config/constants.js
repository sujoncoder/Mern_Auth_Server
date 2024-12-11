import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT;
export const DB_URL = process.env.DB_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASS = process.env.SMTP_PASS || "";

export const SENDER_MAIL = "iamsujonsheikh@gmail.com";
