//Dependencies
const express = require("express");
const app = express();
const http = require("http");
const socketio = require("socket.io");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

//CORS
app.use(cors());

//Middleware
app.use(bodyParser.json());
app.use(cookieParser());

//Setting up IO
const server = http.Server(app);
const io = socketio(server);
//Listening on SocketIO
io.on("connection", (socket) => {
    console.log("New user connected");

    socket.on("disconnect", () => {
        console.log("User has disconnected");
    })
})

//Routes
const poll = require("./routes/api/poll.js")(io);
app.use("/api/poll", poll);


//SPA
if(process.env.NODE_ENV === "production"){
    app.use(express.static(__dirname + "/public/"));
    app.get(/.*/, (req, res) => {

        res.sendFile(__dirname + "/public/index.html");
    })
}


//Port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})