import UserModel from "../models/user.model.js";


// GET A USER DETAILS
export const getUser = async (req, res) => {
    try {
        const { userId } = req.body;

        // check user using user id
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found !" })
        };

        // send to the response
        return res.status(200).json({
            success: true,
            userData: {
                name: user.name,
                isAccountVerified: user.isAccountVerified
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    };
};