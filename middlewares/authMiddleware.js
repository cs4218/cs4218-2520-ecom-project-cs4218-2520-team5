import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if (!token || (typeof token === "string" && token.trim() === "")) {
            return res.status(401).send({
                success: false,
                message: "Unauthorized: authentication token required",
            });
        }
        if (typeof token === "string" && token.startsWith("Bearer ")) {
            token = token.slice(7).trim();
        }
        const decode = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).send({
            success: false,
            message: "Unauthorized: invalid or expired token",
            error: "Invalid or missing token",
        });
    }
};

//admin access
export const isAdmin = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user._id);
        if(user.role !== 1) {
            return res.status(401).send({
                success: false,
                message: "UnAuthorized Access",
            });
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(401).send({
            success: false,
            error,
            message: "Error in admin middleware",
        });
    }
};