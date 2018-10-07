const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const axios = require('axios');
const fs = require('fs');
const md5 = require('md5');
const session = require('express-session');
const users = {};
const games = {};
const server = {
  id: makeid(10),
  pseudo: 'Server',
  md5: md5('Server'),
  color: '#F5F5F5',
};

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({
  secret: 'cerynnaroxx',
  name: 'spacialGame',
  proxy: true,
  resave: true,
  saveUninitialized: true
}));

require('./routes.js')(app, games);

function makeid(stringLength) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < stringLength; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function random_rgba() {
  const o = Math.round;
  const r = Math.random;
  const s = 255;
  const red = o(r() * s);
  const green = o(r() * s);
  const blue = o(r() * s);

  const rgb = 'rgb(' + red + ',' + green + ',' + blue + ')';

  return {
    "red": red,
    "green": green,
    "blue": blue,
    "rgb": rgb
  };

}






function getGalaxy() {
  let Planetes = [];
  let y = 1;
  for (let i = 50; i < 1200; i += 100) {
    let u = 100
    if (y % 2) {
      u = 50;
    }
    for (u; u < 700; u += 100) {
      const randomValue = random_rgba();
      let construct = [{
          "type": "atack",
          "player": null,
        },
        {
          "type": "explo",
          "player": null,
        },
        {
          "type": "commerce",
          "player": null,
        },
        {
          "type": "megapole",
          "player": null,
        }
      ];
      const Planete = {
        "name": i + " - " + u + " - " + y,
        "size": Math.floor((Math.random() + 1) * 10),
        "position": [i, u],
        "color": randomValue.rgb,
        "construct": construct,
        "connect": false,
        "value": {
          "fer": randomValue.red,
          "elec": randomValue.blue,
          "money": randomValue.green,
        }
      };



      Planetes.push(Planete);
    }
    y++;
  }

  return Planetes;
}

io.on('connection', (socket) => {
  io.emit('refreshUnivers', games);
  const userId = makeid(10);
  let user = {
    id: userId,
    pseudo: '',
    md5: md5(userId),
    color: getRandomColor(),
    Res: {
      "Iron": 255,
      "Elec": 255,
      "Money": 255
    },
    base: {}
  };
  socket.on('join', (pseudo) => {
    user.pseudo = pseudo;
    users[user.id] = user;
    io.emit('playerNew', users, userId, pseudo);
    io.emit('newMessage', '** Bienvenue ' + pseudo + ' ! **', server, makeid(10));

  });
  socket.on('disconnect', function () {
    if (typeof user.id !== 'undefined') {
      delete users[user.id];
      io.emit('playerLeave', user.id);
      for (let idGame in games) {
        if (games[idGame].whoCreate.id === user.id) {
          delete games[idGame]
        }
      }
    }
  });

  socket.on('inviteGame', (idPlayer, whoSend) => {
    io.emit('notifInvite', idPlayer, whoSend);
  });

  socket.on('acceptedInvite', (whoAccept, whoSend) => {
    for (let idGame in games) {
      if (games[idGame].whoCreate.id === whoSend) {
        const key = Object.keys(games[idGame].playerIn).length
        games[idGame].playerIn[key] = whoAccept;
        if (games[idGame].size == Object.keys(games[idGame].playerIn).length) {
          io.emit('gameStart', games[idGame].playerIn, games[idGame]);
          io.emit('newMessage', '** Une parti va débuter (' + games[idGame].name + ') **', server, makeid(10));

        }
      }
    }
    io.emit('refreshUnivers', games);
  });

  socket.on('sendMessage', (message, whoSendMessage) => {
    let idMessage = makeid(10);
    io.emit('newMessage', message, whoSendMessage, idMessage);
  });

  socket.on('createNewGame', (whoCreate, game) => {
    let whoCanCreate = true;
    for (let idGame in games) {
      if (games[idGame].whoCreate.id === whoCreate.id) {
        whoCanCreate = false;
      }
    }
    if (whoCanCreate === true) {
      game.id = makeid(14);
      game.whoCreate = whoCreate;
      game.date = {
        create: Date.now(),
      }
      game.playerIn = {
        0: whoCreate,
      };
      games[game.id] = game;
      io.emit('refreshUnivers', games);
      io.emit('newMessage', "** " + whoCreate.pseudo + " viens de crée un nouvelle Univers  !!! **", server, makeid(10));
    } else {
      io.emit('error', 'Vous avez déjà un Univers de créer');
    }
  });

  socket.on('createGalaxy', (Game) => {
    Game.galaxy = getGalaxy();

    // POSITION DE DEPART
    for (key in Game.playerIn) {
      let keyBase;
      switch (key) {
        case '0':
          Game.playerIn[key].base = [250, 350];
          keyBase = findKeyPlanete(250, 350, Game.galaxy);
          Game.galaxy[keyBase].value.fer = 255;
          Game.galaxy[keyBase].value.elec = 255;
          Game.galaxy[keyBase].value.money = 255;
          Game.galaxy[keyBase].construct = [{
              "type": "atack",
              "player": key,
            },
            {
              "type": "explo",
              "player": key,
            },
            {
              "type": "commerce",
              "player": key,
            },
            {
              "type": "megapole",
              "player": null,
            }
          ];
          break;
        case '1':
          Game.playerIn[key].base = [850, 350];
          keyBase = findKeyPlanete(850, 350, Game.galaxy);
          Game.galaxy[keyBase].value.fer = 255;
          Game.galaxy[keyBase].value.elec = 255;
          Game.galaxy[keyBase].value.money = 255;
          Game.galaxy[keyBase].construct = [{
              "type": "atack",
              "player": key,
            },
            {
              "type": "explo",
              "player": key,
            },
            {
              "type": "commerce",
              "player": key,
            },
            {
              "type": "megapole",
              "player": null,
            }
          ];
          break;
      }
    }

    Game.date.start = Date.now();

    fs.appendFile("Games/" + Game.id + ".json", JSON.stringify(Game), function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("Galaxy create !!!");
    });
  });

  socket.on('getGame', (idGame) => {
    var Game = JSON.parse(fs.readFileSync('Games/' + idGame + '.json', 'utf8'));
    io.emit('setGame', Game);
  });



});

function findKeyPlanete(positionX, positionY, Galaxy) {
  for (let key in Galaxy) {
    if (positionX == Galaxy[key].position[0] && positionY == Galaxy[key].position[1]) {
      return key;
    }
  }
}

http.listen(1337, function () {
  console.log('listening on *:1337');

});