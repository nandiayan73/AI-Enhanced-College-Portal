const mongoose=require("mongoose");
require('dotenv').config();
const password=process.env.DB_PASS;
const name=process.env.DB_NAME;
const connectDB=async()=>{
try{
        const conn=await mongoose.connect("mongodb+srv://"+name+":"+password+"@projectcluster.t3vfk.mongodb.net/CollegePortal",{
            // useNewUrlParser: true,
          
    });
    console.log("MongoDB connected:"+conn.connection.host)
    }
    catch(error){
        console.log(error)
    }
}
module.exports=connectDB;