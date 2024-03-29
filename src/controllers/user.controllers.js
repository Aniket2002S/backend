import { asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCLoudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const generateAccessAndRefreshTokens = async(userId)=>
{
    try{
        const user = await User.findById(userId)
        const accessToken  = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
    }
    catch{
        throw new ApiError(500 , "something went wrong while generating access and refresh token")
    }
}

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


const loginUser = asyncHandler(async , (req , res) => {
    const {email , username , password} = req.body
    if(!username || !email)
    {
        throw new ApiError(400 , "username or password is required")
    }
    const user = await User.findOne({
        $or :[{username} , {email}]
    })

    if(!user)
    {
        throw new ApiError(404 , "user doesnot exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user credentials")
    }
    const {accessToken , refreshToken} = await
    generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
    select("-password -resfreshToken")

    const options = {
        httpOnly : true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" ,refreshToken ,  options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser , accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req , res)=>
{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken :undefined
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly : true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , {} , "User logged out Successfully"))
})

export {
    registerUser,
    loginUser, 
    logoutUser
}