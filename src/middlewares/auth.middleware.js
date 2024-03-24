import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model";

export const verifyJwt = asyncHandler(async(req , res , next)=> 
{
    try{
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer" , "")

    if(!token)
    {
        throw new ApiError(401 , "Unauthorized request")
    }

    const decodedToken = jwt.verify(token , process.enc.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if(!user)
    {
        // next: discuss about frontend
        throw new ApiError(401 , "Invalid access token")
    }
    req.user = user;
    next();
    }
    catch(error)
    {
        throw new ApiError(401 , error?.message ||"Invalid access token")
    }
    
})