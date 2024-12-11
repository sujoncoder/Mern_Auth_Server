import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/constants.js";


// TOKEN VERIFY
const tokenVerify = async (req, res, next) => {
    const { token } = req.cookies;

    // check toen exist or not
    if (!token) {
        return res.status(404).json({ success: false, message: "Not authorized, Login again !" })
    };

    try {
        // trying token decode
        const tokenDecode = jwt.verify(token, JWT_SECRET);
        if (tokenDecode.id) {
            req.body.userId = tokenDecode.id
        } else {
            return res.status(400).json({ success: false, message: "Not authorized, Login again !" })
        };

        // call the next function
        next();

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
};

export default tokenVerify;