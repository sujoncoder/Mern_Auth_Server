import express from "express";
import { getUser } from "../controllers/user.controller.js";
import userAuth from "../middleware/userAuth.js";

const userRouter = express.Router();

userRouter.get("/data", userAuth, getUser);


export default userRouter;