const jwt=require("jsonwebtoken");
const User =require("../models/user.model")
require('dotenv').config();
// const cookieSecret=process.env.COOKIE_SECRET;
const jwtSecret=process.env.JWT_SECRET;

const Authenticate=async(req,res,next)=>{
    try{
    // console.log(req.cookies.HareKrishna);
    const token=req.cookies.HareKrishna;
  
    const verifyToken=jwt.verify(token,jwtSecret);
    const rootUser=await User.findOne({_id:verifyToken.id})
    // console.log(rootUser)
    if(!rootUser){throw new Error("User not found!")};
    req.token=token;
    req.rootUser=rootUser;
    req.userID=rootUser._id;
    next();
}
    catch(err){
        res.status(401).send("Unauthorized: No token provided.");
        console.log(err);
        next();
    }
}
module.exports=Authenticate;