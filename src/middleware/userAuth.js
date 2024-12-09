import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/constants.js";


const userAuth = async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(404).json({ success: false, message: "Not authorized, Login again" })
    };

    try {
        const tokenDecode = jwt.verify(token, JWT_SECRET);
        if (tokenDecode.id) {
            req.body.userId = tokenDecode.id
        } else {
            return res.status(404).json({ success: false, message: "Not authorized, Login again" })
        };

        next();

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
};

export default userAuth;