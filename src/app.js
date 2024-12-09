import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173/",
    credentials: true
}));


// ROOT ROUTE
app.get("/", (req, res) => {
    return res.status(200).send('Hello, We are working with mern auth.')
});

// APPLICATION ROUTE
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);


export default app;