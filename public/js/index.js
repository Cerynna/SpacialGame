let me = false;
let Games = false;
const socket = io.connect('http://localhost:1337');
const divMain = document.getElementById('main');
const inputPseudo = document.getElementById('inputPseudo');
const inputMessage = document.getElementById('inputMessage');
const divMessage = document.getElementById('message');
const divModal = document.getElementById('modal');
const divChoisePseudo = document.getElementById('choisePseudo');
const divNewInvite = document.getElementById('newInvite');
const divNewGame = document.getElementById('newGame');
const divError = document.getElementById('error');
const divListPlayer = document.getElementById('listPlayer');


inputPseudo.focus();
divModal.style.display = 'block';
divChoisePseudo.style.display = 'block';

document.getElementById("sendPseudo").addEventListener("click", (event) => {
    socket.emit('join', inputPseudo.value);
    inputMessage.focus();
});

document.getElementById("acceptInvite").addEventListener("click", (event) => {
    socket.emit('acceptedInvite', me, document.getElementById('invitTitle').dataset.usersend);
    divNewInvite.style.display = 'none';
    divModal.style.display = 'none';
});
document.getElementById("refuseInvite").addEventListener("click", (event) => {
    divNewInvite.style.display = 'none';
    divModal.style.display = 'none';
});

function CreateGame() {
    divNewGame.style.display = 'block';
    divModal.style.display = 'block';
    document.getElementById("GameName").value = "Univer de " + me.pseudo;
};


document.getElementById("validGame").addEventListener("click", (event) => {

    const game = {
        "name": document.getElementById("GameName").value,
        "size": document.getElementById("GameSize").value,
    };

    socket.emit('createNewGame', me, game);
    divNewGame.style.display = 'none';
    divModal.style.display = 'none';

});
document.getElementById("closeCreateGame").addEventListener("click", (event) => {
    divNewGame.style.display = 'none';
    divModal.style.display = 'none';

});


function SendInvite(idPlayer) {
    socket.emit('inviteGame', idPlayer, me);
};

document.addEventListener('keypress', (event) => {
    const touche = event.key;
    if (touche === 'Enter') {
        if (event.target.id === 'inputPseudo') {
            socket.emit('join', inputPseudo.value);
        }
        if (event.target.id === 'inputMessage') {
            socket.emit('sendMessage', inputMessage.value, me);
            inputMessage.value = "";
        }
    }
});

socket.on('playerNew', function (listPlayer, whoIam) {
    if (me === false) {
        me = listPlayer[whoIam];
    }
    divListPlayer.innerHTML = '';
    for (let idPlayer in listPlayer) {
        if (whoIam === idPlayer) {
            if (listPlayer[idPlayer].pseudo === "" || listPlayer[idPlayer].pseudo.length === 0) {
                divModal.style.display = 'block';
                inputPseudo.focus();
                divMain.style.display = 'none';
            }
        }
        divListPlayer.innerHTML += '<div id="' + idPlayer + '" class="playerInList">' +
            '<div id="avatar-' + idPlayer + '"></div>' +
            '<div id="pseudo-' + idPlayer + '">' + listPlayer[idPlayer].pseudo + '</div>' +
            '</div>';

        document.getElementById("avatar-" + idPlayer).style.background = 'url("https://robohash.org/' +
            idPlayer + '.png?set=set2") no-repeat';
        document.getElementById("avatar-" + idPlayer).style.backgroundSize = 'contain';
        document.getElementById("pseudo-" + idPlayer).style.color = listPlayer[idPlayer].color;

        if (me.id !== idPlayer) {
            document.getElementById(idPlayer).innerHTML += '<div class="tools">' +
                '<div class="btn mini btnInvite" id="invite-' + idPlayer + '" onclick="SendInvite(\'' +
                idPlayer + '\')">' +
                '<i class="fas fa-plus"></i>' +
                '</div>' +
                '</div>';
        }
    }
    divModal.style.display = 'none';
    divChoisePseudo.style.display = 'none';
    divMain.style.display = 'block';

})

socket.on('notifInvite', (idPlayer, whoSend) => {
    if (me.id === idPlayer) {
        const title = document.getElementById('invitTitle');
        title.innerHTML = whoSend.pseudo + ' vous invite.';
        title.dataset.usersend = whoSend.id;
        divNewInvite.style.display = 'block';
        divModal.style.display = 'block';
    }

});

socket.on('newMessage', function (message, whoSendMessage, idMessage) {
    if (message !== "") {
        divMessage.innerHTML += '<li>' +
            '<div class="row">' +
            '<div class="col-xs who">' +
            '[ <span style="color:' + whoSendMessage.color + ';">' +
            whoSendMessage.pseudo + '</span> ] : ' +
            /* '<div id="avatar-' + idMessage + '">' +
            '</div>' + */
            '</div>' +
            '<div class="col-xs-10 message">' +
            message +
            '</div>' +
            '</div>' +
            '</li>';
        /* document.getElementById("avatar-" + idMessage).style.background =
            'url("https://robohash.org/' + whoSendMessage.id + '.png?set=set2") no-repeat';
            document.getElementById("avatar-" + idMessage).style.backgroundSize = 'contain'; */
        divMessage.scrollTop = divMessage.scrollHeight;
    }
});

socket.on('refreshUnivers', function (games) {
    document.getElementById('listGame').innerHTML =
        '<li><div class="Univers" onclick="CreateGame()"><h4>New Game</h4></div></li>'

    for (let idGame in games) {
        document.getElementById('listGame').innerHTML += '<li>' +
            '<div class="Univers">' +
            '<h4>' + games[idGame].name + '</h4>' +
            '<div>' + Object.keys(games[idGame].playerIn).length + '/' + games[idGame].size + '</div>' +
            '</div>' +
            '</li>';
    }
    Games = games;
});

socket.on('gameStart', function (Players, Game) {
    for (let key in Players) {
        if (me.id === Players[key].id) {
            if (me.id === Game.whoCreate.id) {
                socket.emit('createGalaxy', Game);
            }

            console.log("ON LANCE LA GAME");
            document.location.href = "/game-" + Game.id;
        }
    }
});

socket.on('error', function (message) {
    divModal.style.display = 'block';
    divError.style.display = 'block';
    document.getElementById('messageError').innerHTML = message;

    setTimeout(() => {
        divModal.style.display = 'none';
        divError.style.display = 'none';
        document.getElementById('messageError').innerHTML = "";
    }, 2500)

});

socket.on('playerLeave', function (idPlayer) {
    console.log('Un Joueur a Leave');
    const divToDelete = document.getElementById(idPlayer);
    divListPlayer.removeChild(divToDelete);
});