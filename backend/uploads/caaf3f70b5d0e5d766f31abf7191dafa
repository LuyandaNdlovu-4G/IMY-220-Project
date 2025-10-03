const { MongoClient, ObjectId } = require("mongodb");
require ("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);
const dbName = "IMY220_D2";

let db;

async function connectDB() {
    if(db) return db; //db already connected
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        throw error;
    }
}

function getCollection(collectionName) {
    if(!db) {
        throw new Error("Database not connected. Call connectDB first.");
    }
    return db.collection(collectionName);
}

module.exports = { connectDB, getCollection, ObjectId};