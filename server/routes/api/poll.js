//Dependencies
const express = require("express");
const mongoDb = require("mongodb");

//Init Router
const router = express.Router();

//Model 
const Poll = require("./../../models/Poll");

//DB Connection
const URL = "mongodb+srv://AmadoJunior:Amaditin4000041776@cluster0-s3lnp.mongodb.net/test?retryWrites=true&w=majority";

//DB Getter
const getCollection = async (collectionName) => {
    const client = await mongoDb.MongoClient.connect(URL, {useNewUrlParser: true, useUnifiedTopology: true});
    return client.db("PublicPollApp").collection(collectionName);
}

function Router(io) {
    //Router Methods
    //Get entire data base as array of objects
    router.get("/", async (req, res) => {
        console.log("GET");
        const pollsCollection = await getCollection("Polls");
        res.send(await pollsCollection.find({}).toArray());
    })
    //Post a new poll
    router.post("/", async (req, res) => {
        console.log("POST");
        const newPoll = new Poll(req.body.title, req.body.options)
        const pollsCollection = await getCollection("Polls");
        pollsCollection.insertOne(newPoll);

        io.emit("newPoll");

        res.send({message: "Sucessfully added poll to collection"})
    })
    //Post a vote to certain poll 
    router.post("/:id", async (req, res) => {
        const pollsCollection = await getCollection("Polls");
        const ID = new mongoDb.ObjectID(req.params.id)
        const optionTitle = req.body.optionTitle;

        try{
            await pollsCollection.updateOne(
                {_id: ID}, 
                {$inc: {'options.$[element].votes': 1}},
                {arrayFilters: [ {"element.title": optionTitle}]}
            )
            res.send({message: "Updated"})
            const pollArray = await pollsCollection.find({}).toArray();
            io.emit("voteCasted", pollArray)
            console.log("votedCasted")
        } catch(err){
            console.log(err);
        }
        
    })
    return router;
}

//Exports
module.exports = Router;