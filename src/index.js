import dotenv from "dotenv"
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`server is running at port : ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MOngo db connection failed!!" , err)
})







// import express from "express"
// const app = express()

// ;(async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on("errror" , (error)=>{
//             console.log("ERR :" , error);
//             throw error
//         })
//         app.listen(process.env.PORT , ()=>{
//             console.log(`App id listening on port ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.error("ERROR" , error)

//     }
// })()