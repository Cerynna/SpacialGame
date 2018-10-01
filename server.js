const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const axios = require('axios');
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



io.on('connection', (socket) => {
  io.emit('refreshUnivers', games);
  const userId = makeid(10);
  let user = {
    id: userId,
    pseudo: '',
    md5: md5(userId),
    color: getRandomColor(),
  };
  socket.on('join', (pseudo) => {
    user.pseudo = pseudo;
    users[user.id] = user;
    io.emit('playerNew', users, userId);
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
          io.emit('gameStart', games[idGame].playerIn);
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


});


http.listen(1337, function () {
  console.log('listening on *:1337');

  let Planetes = [];
  for (let i = 50; i < 1200; i += 100) {
    for (let u = 50; u < 700; u += 100) {

      const Planete = [
        i,
        u,
      ]
      Planetes.push(Planete);
    }
  }
  console.log(Planetes);

});