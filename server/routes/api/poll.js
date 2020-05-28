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
        try{
            const pollsCollection = await getCollection("Polls");
            const pollArray = await pollsCollection.find({}).toArray();
            res.send(pollArray);
            io.emit("pollListSent", req.cookies.marked);
        } catch(err) {
            console.log("Mongo Error: " + err);
        }
        
    })
    //Post a new poll
    router.post("/", async (req, res) => {
        console.log("POST");
        const newPoll = new Poll(req.body.title, req.body.options)
        const pollsCollection = await getCollection("Polls");
        pollsCollection.insertOne(newPoll);
        
        res.send({message: "Sucessfully added poll to collection"})
        const pollArr = await pollsCollection.find({}).toArray();
        io.emit("newPoll", pollArr);
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
            
            //Marked Poll Cookies
            const cookies = req.cookies;
            let farFuture = new Date(new Date().getTime() + (1000*60*60*24*365*10));
            let dup = false;
            if(cookies.marked !== undefined){
                const tempArr = JSON.parse(cookies.marked);
                for(let id of tempArr){
                    if(id === ID){
                        dup = true;
                        break;
                    }
                }
                if(!dup){
                    tempArr.push(ID);
                    res.cookie("marked", JSON.stringify(tempArr), {expires: farFuture, httpOnly: true, secure: true});
                }
                
            } else {
                res.cookie("marked", JSON.stringify([ID]), {expires: farFuture, httpOnly: true, secure: true});
            }

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