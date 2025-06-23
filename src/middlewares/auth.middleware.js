import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asynchandler( async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization").replace("Bearer ", "") // cookie access given by cookie-parser
    
        if (!token) {
            throw new ApiError(401, "Access token is required");
        }
    
        const decodedToken = jwt.verify( token, process.env.ACCESS_TOKEN_SECRET )
    
        const user = await User.findById(decodedToken._id).select(
            "-password -refreshToken"
        )
    
        if (!user) {
            throw new ApiError(404, "User not found");
        }
    
        req.user = user; // attach user to request object
        next();                                     //Middleware passes control to the next middleware or route handler
    } catch (error) {
        throw new ApiError(401, "Invalid access token");
    }

}) 