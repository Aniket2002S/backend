import { asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCLoudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async(req , res)=>
{
    const {fullname, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.file && Array.isArray(req.files.coverImage) && req.file.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath)
    {
        throw new ApiError(400 , "Avatar file is requires");
    }

    const avatar = await uploadOnCLoudinary(avatarLocalPath)
    const coverImage = await uploadOnCLoudinary(coverImageLocalPath)

    if(!avatar)
    {
        throw new ApiError(400 , "Avatar file is required")
    }
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser)
    {
        throw new ApiError(500 , "something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registeed successfully")
    )
})



export {
    registerUser,
}