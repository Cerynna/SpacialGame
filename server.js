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
const timerTurm = {
  order: 60 * 1000,
  wait: 10 * 1000,
}

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

function getGalaxy(size = 2) {
  let Planetes = [];
  let y = 1;
  let moyenIron = 0;
  let moyenElec = 0;
  let moyenMoney = 0;
  for (let i = 50; i < ((700 * size) - 50); i += 100) {
    let u = 100
    if (y % 2) {
      u = 50;
    }
    for (u; u < (350 * size); u += 100) {
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
      const size = Math.floor((Math.random() + 1) * 10);
      const Planete = {
        "name": i + " - " + u + " - " + y,
        "size": size,
        "position": [i, u],
        "color": randomValue.rgb,
        "construct": construct,
        "connect": false,
        "value": {
          "fer": Math.floor((randomValue.red * size) / 8),
          "elec": Math.floor((randomValue.blue * size) / 8),
          "money": Math.floor((randomValue.green * size) / 20),
        }
      };
      moyenIron += Math.floor((randomValue.red * size) / 8);
      moyenElec += Math.floor((randomValue.blue * size) / 8);
      moyenMoney += Math.floor((randomValue.green * size) / 20);
      Planetes.push(Planete);
    }
    y++;
  }
  console.log(Planetes.length);

  console.log(Math.floor(moyenIron / Planetes.length));
  console.log(Math.floor(moyenElec / Planetes.length));
  console.log(Math.floor(moyenMoney / Planetes.length));

  return Planetes;
}

function findKeyPlanete(positionX, positionY, Galaxy) {
  for (let key in Galaxy) {
    if (positionX == Galaxy[key].position[0] && positionY == Galaxy[key].position[1]) {
      return key;
    }
  }
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
      "Iron": 0,
      "Elec": 0,
      "Money": 0
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
    Game.galaxy = getGalaxy(Game.size);

    // POSITION DE DEPART
    for (key in Game.playerIn) {
      let keyBase;
      switch (key) {
        case '0':
          Game.playerIn[key].base = [250, 350];
          keyBase = findKeyPlanete(250, 350, Game.galaxy);
          Game.galaxy[keyBase].size = 22;
          Game.galaxy[keyBase].color = "red";
          Game.galaxy[keyBase].value.fer = 250;
          Game.galaxy[keyBase].value.elec = 250;
          Game.galaxy[keyBase].value.money = 150;
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
          Game.playerIn[key].base = [1050, 350];
          keyBase = findKeyPlanete(1050, 350, Game.galaxy);
          Game.galaxy[keyBase].size = 22;
          Game.galaxy[keyBase].color = "blue";
          Game.galaxy[keyBase].value.fer = 250;
          Game.galaxy[keyBase].value.elec = 250;
          Game.galaxy[keyBase].value.money = 150;
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

      getRes(Game.id).forEach((playerRes, key) => {
        Game.playerIn[key].Res.Iron += playerRes.fer;
        Game.playerIn[key].Res.Elec += playerRes.elec;
        Game.playerIn[key].Res.Money += playerRes.money;
        Game.playerIn[key].Res.PV = playerRes.pv;
        Game.playerIn[key].Res.magic = playerRes.magic;
        Game.playerIn[key].stat = playerRes.stat;
      });
      SaveGame(Game.id, Game);
    });
  });

  socket.on('getGame', (idGame) => {
    var Game = JSON.parse(fs.readFileSync('Games/' + idGame + '.json', 'utf8'));
    io.emit('setGame', Game);

  });

  socket.on('newTurn', (idGame) => {
    var Game = JSON.parse(fs.readFileSync('Games/' + idGame + '.json', 'utf8'));

    if (Game.turn == undefined) {
      Game.turn = []
    }

    var time = new Date();
    let Turn = {
      id: Game.turn.length,
      start: Date.now(),
      end: time.setSeconds(time.getSeconds() + (timerTurm.order / 1000)),
      order: [],
    }
    Game.turn.push(Turn);
    SaveGame(idGame, Game)

    io.emit('turnStart', Turn, Game);
  });

  socket.on('sendOrder', (idGame, order) => {
    var Game = JSON.parse(fs.readFileSync('Games/' + idGame + '.json', 'utf8'));
    if (Game.turn[Game.turn.length - 1].order.length < Game.size) {
      Game.turn[Game.turn.length - 1].order.push(order)
      Game.playerIn[order.player.key] = order.player;
    }
    if (Game.turn[Game.turn.length - 1].order.length == Game.size) {
      console.log("****************************************\nFULL ORDER !!!!!\n****************************************\n")
      Game.turn[Game.turn.length - 1].order.forEach(playerOrder => {
        playerOrder.orders.forEach(orderPlayer => {
          OrderParse = orderPlayer.split(' - ');
          OrderParse[2] = OrderParse[1].split(',').pop();
          OrderParse[1] = OrderParse[1].split(',').shift();
          console.log(OrderParse);
          const keyPlanet = findKeyPlanete(OrderParse[1], OrderParse[2], Game.galaxy);
          Game.galaxy[keyPlanet].construct[OrderParse[0]].player = playerOrder.player.key;

        });

      });
      console.table(getRes(idGame));
      getRes(idGame).forEach((playerRes, key) => {
        Game.playerIn[key].Res.Iron += playerRes.fer;
        Game.playerIn[key].Res.Elec += playerRes.elec;
        Game.playerIn[key].Res.Money += playerRes.money;
        Game.playerIn[key].Res.PV = playerRes.pv;
        Game.playerIn[key].Res.magic = playerRes.magic;
        Game.playerIn[key].stat = playerRes.stat;
      })
      io.emit('stopTurn', Game);
    }
    SaveGame(idGame, Game);
  });

  function getRes(idGame) {
    var Game = JSON.parse(fs.readFileSync('Games/' + idGame + '.json', 'utf8'));
    let results = [];
    Game.galaxy.forEach(planet => {
      planet.construct.forEach(batiment => {
        if (batiment.player != null) {

          if (results[batiment.player] == undefined) {
            results[batiment.player] = {
              fer: 0,
              elec: 0,
              money: 0,
              pv: 0,
              magic: {
                deathRay: 0,
              },
              stat: {
                batiment: {
                  attack: 0,
                  explo: 0,
                  commerce: 0,
                  megapole:0,
                }
              },
            };
          }
          switch (batiment.type) {
            case "atack":
              results[batiment.player].fer += planet.value.fer;
              results[batiment.player].pv += 1;
              results[batiment.player].stat.batiment.attack += 1;
              break;
            case "explo":
              results[batiment.player].elec += planet.value.elec;
              results[batiment.player].pv += 1;
              results[batiment.player].stat.batiment.explo += 1;
              break;
            case "commerce":
              results[batiment.player].money += planet.value.money;
              results[batiment.player].pv += 1;
              results[batiment.player].stat.batiment.commerce += 1;
              break;
            case "megapole":
              results[batiment.player].fer += planet.value.fer;
              results[batiment.player].elec += planet.value.elec;
              results[batiment.player].money += planet.value.money;
              results[batiment.player].pv += 10;
              results[batiment.player].magic.deathRay += 1;
              results[batiment.player].stat.batiment.megapole += 1;
              break;

          }
        }
      })

    });
    return results;

  }



  function SaveGame(idGame, Game) {

    fs.writeFile("Games/" + idGame + ".json", JSON.stringify(Game), (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  }

});





http.listen(3000, function () {
  console.log('listening on *:3000');

});