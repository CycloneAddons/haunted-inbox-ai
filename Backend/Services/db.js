import mongoose from "mongoose"

let isConn = false


export async function connectDB() {
    if(mongoose.connection.readyState == 1) {
        return mongoose.connection;
    }

    if(!process.env.MONGO_URI) {
        throw new Error("mongodb uri missing");
    }

    if(isConn) {
        await new Promise((resolve, reject) => {
            mongoose.connection.once("connected", resolve);
            mongoose.connection.once("error", reject);
        })

        return mongoose.connection;
    }

    isConn = true;

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB COnnected");
        return mongoose.connection;
    } catch (error) {
        console.error("mongo connecting err", error.message)
        throw error;
    } finally {
        isConn = false;
    }


}
export default connectDB;