const express = require("express");
// // // const app = express();
// // // const http = require("http").Server(app);
// // // const io = require("socket.io")(http);

// // var app = express();
// // var server = app.listen(3000);
// // var io = require('socket.io').listen(server);
// // var http = require('http');


// var express = require('express'),
//     http = require('http');
// var app = express();
// var server = http.createServer(app);
// var io = require('socket.io').listen(server);

// server.listen(3000);


const app = express();
const socketIO = require('socket.io');

const server = express()
  .use(app)
  .listen(3000, () => console.log(`Listening Socket on 3000`));

const io = socketIO(server);


const axios = require("axios");
const fs = require("fs");
const md5 = require("md5");
const session = require("express-session");
const Tools = require("./public/js/tools");

const users = [];
const games = [];
// const server = {
//   id: Tools.makeID(10),
//   pseudo: "Server",
//   md5: md5("Server"),
//   color: "#F5F5F5"
// };
const timerTurm = {
  order: 60 * 1000,
  wait: 10 * 1000
};

// console.log(Tools)
// let game = Tools.CreateGame();

// console.log(game)

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(
  session({
    secret: "cerynnaroxx",
    name: "spacialGame",
    proxy: true,
    resave: true,
    saveUninitialized: true
  })
);

require("./routes.js")(app, games);


io.on("connection", socket => {
  console.log("connection");
  let CurrentUser = {
    id: Tools.makeID(10),
    pseudo: "",
    md5: md5(Tools.makeID(10)),
    color: Tools.randomRGB(),
    socket: socket.id,
    Res: {
      Iron: 0,
      Elec: 0,
      Money: 0
    },
    base: {}
  };
  // socket.emit("devGalaxy", Tools.RecupGame("OSxQuFQhUXb6"));
  socket.emit(
    "devGalaxy",
    Tools.CreateGame(
      { size: 2, name: "TEST GALAXY" },
      {
        id: "4ESMfqHwXL",
        pseudo: "Hystérias",
        md5: "6362a9d480ce9ec03af5916f0b07fb01",
        color: "#473D48",
        Res: { Iron: 0, Elec: 0, Money: 0 },
        base: {}
      }
    )
  );

  socket.on("join", pseudo => {
    let verifUser = users.filter(userIn => {
      // console.log("userIn", userIn.pseudo, pseudo);
      return userIn.pseudo === pseudo;
    });
    // console.log(verifUser.length);
    if (verifUser.length === 0) {
      CurrentUser.pseudo = pseudo;
      console.log("join", CurrentUser);

      users.push(CurrentUser);
      io.emit("playerNew", users, CurrentUser);
      io.emit(
        "newMessage",
        "** Bienvenue " + CurrentUser.pseudo + " ! **",
        // server,
        Tools.makeID(10)
      );
      io.emit("refreshUnivers", games);
    } else {
    }

    // console.log(users);
  });
  socket.on("devNewGame", (Game)=>{
    console.log("devNewGame")

// Tools.SaveGame(Game)


  })

  socket.on("createNewGame", (whoCreate, game) => {
    // console.log("createNewGame", whoCreate, game);

    Tools.CreateGame(game, whoCreate);

  });

  socket.on("disconnect", function() {
    console.log("disconnect");
  });
});
