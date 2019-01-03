const board = document.getElementById('board');
const canvasMap = document.getElementById('Map');
const contextMap = canvasMap.getContext('2d');

document.addEventListener('keydown', (e) => {
    console.log("keydown");
    if (!e.repeat)
        console.log(`first keydown event. key property value is "${e.key}"`);
    else
        console.log(`keydown event repeats. key property value is "${e.key}"`);
});

let zoom = 1;


const socket = io.connect('http://localhost:1337');
const idGame = window.location.pathname.split("-")[1];
const idPlayer = window.location.pathname.split("-")[2];
const planetInfo = document.getElementById("planetInfo");

const actionAttack = document.getElementById("actionAttack");

const infoName = document.getElementById("infoName");
const infoPosition = document.getElementById("infoPosition");
const valueFer = document.getElementById("value-Fer");
const valueElec = document.getElementById("value-Elec");
const valueMoney = document.getElementById("value-Money");
const listConstruct = document.getElementById("construct");
const infoSize = document.getElementById("infoSize");
const listOrder = document.querySelectorAll(".order");
const Timer = document.getElementById('Timer');

const playerIron = document.getElementById("Res-Iron");
const playerElec = document.getElementById("Res-Elec");
const playerMoney = document.getElementById("Res-Money");
const playerPV = document.getElementById("Res-PV");

const startTurn = document.getElementById("startTurn");
const sendOrder = document.getElementById("sendOrder");


let Game = false;
let loading = false;
let me;
let Turn;
let inter = false;
const Tooltips = {
    "name": document.getElementById("nameBatiment"),
    "desc": document.getElementById("descBatiment"),
    "prize": {
        "main": document.getElementById("prize"),
        "iron": document.getElementById("prize-iron"),
        "elec": document.getElementById("prize-elec"),
        "money": document.getElementById("prize-money"),
    },
    "icon": document.getElementById("icon"),
    "main": document.getElementById("tooltipBatiment"),
    reset: function () {
        this.name.innerHTML = "Batiments";
        this.desc.innerHTML = "Passe ta souri sur un batiment pour en savoir plus";
        this.prize.iron.innerHTML = "";
        this.prize.elec.innerHTML = "";
        this.prize.money.innerHTML = "";
        this.prize.main.classList.value = "";
        this.icon.classList.value = "";
        this.main.classList.value = "neutre";
        actionAttack.style.display = "none";
    }
}

const Magic = {
    "main": document.getElementById("magic"),
    "deathRay": document.querySelector("#deathRay .nb"),
    "batiments": {
        attack: document.querySelector("#batiments #attack .nb"),
        explo: document.querySelector("#batiments #explo .nb"),
        commerce: document.querySelector("#batiments #commerce .nb"),
        megapole: document.querySelector("#batiments #megapole .nb"),
    },
};

const defBatiment = [{
    "key": 0,
    "name": "Attack",
    "type": "atack",
    "prize": {
        0: 150,
        1: 50,
        2: 50
    },
    "desc": "Permet de récolter le fer et +1 attack"
}, {
    "key": 1,
    "name": "Exploration",
    "type": "explo",
    "prize": {
        0: 50,
        1: 100,
        2: 100,

    },
    "desc": "Permet de récolter l'electricité et +2 rayon de vue"
}, {
    "key": 2,
    "name": "Commerce",
    "type": "commerce",
    "prize": {
        0: 125,
        1: 125,
        2: 50
    },
    "desc": "Permet de recolter la money"
}, {
    "key": 3,
    "name": "Megapole",
    "type": "megapole",
    "prize": {
        0: 1500,
        1: 1500,
        2: 1500
    },
    "desc": "Combinaison des trois batiment +5 attack de vue +100% recolte"
}]




function viewport() {
    var e = window,
        a = 'inner';
    if (!('innerWidth' in window)) {
        a = 'client';
        e = document.documentElement || document.body;
    }
    return {
        width: e[a + 'Width'],
        height: e[a + 'Height']
    }
}
/* socket.emit('OneTurn', idGame); */

socket.on('turnStart', (Turn, Game) => {
    Turn = Turn;
    Game = Game;
    setTimer(Turn.start, Turn.end);
});
socket.on('stopTurn', (GamefromServer) => {
    Game = GamefromServer;
    setTimeout(() => {
        clearOrders();
        drawGame(Game);
    }, (500 + (500 * me.key)));

});

socket.emit('getGame', idGame);

socket.on('setGame', function (GamefromServer) {
    Game = GamefromServer;
    loading = true;
    canvasMap.width = ((700 * Game.size) - (50) * zoom) * zoom;
    canvasMap.height = ((350 * Game.size)) * zoom;
    contextMap.scale(zoom, zoom);
    drawGame(Game);

});
startTurn.addEventListener('click', (event) => {
    socket.emit('newTurn', idGame);
});
sendOrder.addEventListener('click', (event) => {
    socket.emit('sendOrder', idGame, compilOrder());
    clearInterval(inter);

});

function drawGame(Game) {
    contextMap.clearRect(0, 0, (viewport().width) * zoom, (viewport().height) * zoom);

    for (let key in Game.playerIn) {
        if (Game.playerIn[key].id === idPlayer) {
            me = Game.playerIn[key];
            me.key = key;
            console.log(me);

            switch (parseInt(key)) {
                case 0:
                    canvasMap.style.border = `5px solid red`;
                    break;
                case 1:
                    canvasMap.style.border = `5px solid blue`;
                    break;
                case 2:
                    canvasMap.style.border = `5px solid green`;
                    break;
                case 3:
                    canvasMap.style.border = `5px solid yellow`;
                    break;
            }
            playerIron.innerHTML = me.Res.Iron;
            playerElec.innerHTML = me.Res.Elec;
            playerMoney.innerHTML = me.Res.Money;
            playerPV.innerHTML = me.Res.PV;
            Magic.deathRay.innerHTML = me.Res.magic.deathRay;
            Magic.batiments.attack.innerHTML = me.stat.batiment.attack;
            Magic.batiments.explo.innerHTML = me.stat.batiment.explo;
            Magic.batiments.commerce.innerHTML = me.stat.batiment.commerce;
            Magic.batiments.megapole.innerHTML = me.stat.batiment.megapole;
        }
    }

    for (idPlanete in Game.galaxy) {
        if (searchConnect(Game.galaxy[idPlanete].position[0], Game.galaxy[idPlanete].position[1],
                exploration(me.key, Game.galaxy)) === true) {
            Game.galaxy[idPlanete].connect = true;
            drawPlanete(Game.galaxy[idPlanete]);
        }
    }

}

function setTimer(start, end) {

    end = end - (me.key * 500);
    let timer = (end - start);

    inter = setInterval(() => {
        if (start >= end) {
            socket.emit('sendOrder', idGame, compilOrder());
            clearInterval(inter);
        }
        let pourcent = Math.floor(100 - (((end - start) * 100) / timer));
        Timer.style.width = pourcent + '%';
        Timer.innerHTML = Math.floor(((end - start) / 1000) + 1) + 's';
        start += 100;
    }, 100);

}

function compilOrder() {
    let orders = [];
    [].forEach.call(listOrder, (order) => {
        if (order.value != "") {
            orders.push(order.value);
        }
    })
    return {
        player: me,
        orders: orders,
    }
}

function exploration(playerKey, galaxy) {
    let result = [];
    for (let keyPlanet in galaxy) {
        if (galaxy[keyPlanet].construct[1].player == playerKey) {
            result.push(findConnectPlanet(galaxy[keyPlanet].position[0], galaxy[keyPlanet].position[1]))
        }

    }
    let wait = [];
    for (let key in result) {
        for (let id in result[key]) {
            wait.push(result[key][id])
        }
    }
    return wait;
}

function clearOrders() {
    console.log("DELETES ALL ORDERS");
    let inputs = document.querySelectorAll('input.order');
    for (let key in inputs) {
        if (typeof key != "number" && key.length == 1) {
            /* deleteOrder(parseInt(key) + 1); */
            inputs[key].value = "";
        }
    }
}


function deleteOrder(nbInput) {

    let Order = document.getElementById(`order-${nbInput}`);
    if (Order.value.length > 0) {
        Order.parse = Order.value.split(' - ');
        Order.parse[2] = Order.parse[1].split(',').pop();
        Order.parse[1] = Order.parse[1].split(',').shift();

        const keyPlanet = findKeyPlanete(Order.parse[1], Order.parse[2]);

        Game.galaxy[keyPlanet].construct[Order.parse[0]].player = null;

        drawPlanete(Game.galaxy[keyPlanet]);
        me.Res.Iron += defBatiment[Order.parse[0]].prize[0];
        me.Res.Elec += defBatiment[Order.parse[0]].prize[1];
        me.Res.Money += defBatiment[Order.parse[0]].prize[2];
        RefreshRes();
        Order.value = "";
    }


}




function drawPlanete(planete) {
    contextMap.clearRect(planete.position[0] - 30, planete.position[1] - 30, 100, 100);
    contextMap.beginPath();
    const img = new Image();

    img.src = `img/planets/${planete.size}.png`;
    img.onload = function () {
        contextMap.drawImage(img, planete.position[0] - 30, planete.position[1] - 30, 40 + planete.size, 40 +
            planete.size);
        addBatiment(planete);
    };
}

function findKeyPlanete(positionX, positionY) {
    for (let key in Game.galaxy) {
        if (positionX == Game.galaxy[key].position[0] && positionY == Game.galaxy[key].position[1]) {
            return key;
        }
    }
}

function addBatiment(planete) {
    for (let key in planete.construct) {
        if (planete.construct[key].player !== null) {
            const img = new Image();
            switch (planete.construct[key].type) {
                case 'atack':
                    img.src = `img/batiments/${planete.construct[key].player}/attack.png`;
                    img.onload = function () {
                        contextMap.drawImage(img, planete.position[0] - 25, planete.position[1] - 10, 25, 25);
                    };
                    break;
                case 'explo':
                    img.src = `img/batiments/${planete.construct[key].player}/explo.png`;
                    img.onload = function () {
                        contextMap.drawImage(img, planete.position[0], planete.position[1] - 25, 25, 25);
                    };
                    break;
                case 'commerce':
                    img.src = `img/batiments/${planete.construct[key].player}/commerce.png`;
                    img.onload = function () {
                        contextMap.drawImage(img, planete.position[0], planete.position[1] + 5, 25, 25);
                    };
                    break;
                case 'megapole':
                    img.src = `img/batiments/${planete.construct[key].player}/megapole.png`;
                    img.onload = function () {
                        contextMap.drawImage(img, planete.position[0] - 40, planete.position[1] - 40, 80, 80);
                    };
                    break;
            }
        }
    }

}

function searchConnect(positionX, positionY, myArray) {
    for (var i = 0; i < myArray.length; i++) {
        if (myArray[i].x === positionX && myArray[i].y === positionY) {
            return true;
        }
    }
    return false;
}


function findConnectPlanet(positionX = 250, positionY = 350) {

    let minX = positionX - 200;
    let maxX = positionX + 200;
    let result = [];
    result[0] = {
        x: minX,
        y: (positionY + 100)
    };
    result[1] = {
        x: minX,
        y: positionY
    };
    result[2] = {
        x: minX,
        y: (positionY - 100)
    };
    result[3] = {
        x: (minX + 100),
        y: (positionY + 50)
    };
    result[4] = {
        x: (minX + 100),
        y: (positionY + 150)
    };
    result[5] = {
        x: (minX + 100),
        y: (positionY - 50)
    };
    result[6] = {
        x: (minX + 100),
        y: (positionY - 150)
    };
    result[7] = {
        x: positionX,
        y: (positionY + 100)
    };
    result[8] = {
        x: positionX,
        y: (positionY + 200)
    };
    result[9] = {
        x: positionX,
        y: (positionY - 100)
    };
    result[10] = {
        x: positionX,
        y: (positionY - 200)
    };
    result[11] = {
        x: (maxX - 100),
        y: (positionY - 50)
    };
    result[12] = {
        x: (maxX - 100),
        y: (positionY - 150)
    };
    result[13] = {
        x: (maxX - 100),
        y: (positionY + 50)
    };
    result[14] = {
        x: (maxX - 100),
        y: (positionY + 150)
    };
    result[15] = {
        x: maxX,
        y: (positionY + 100)
    };
    result[16] = {
        x: maxX,
        y: positionY
    };
    result[17] = {
        x: maxX,
        y: (positionY - 100)
    };
    result[18] = {
        x: positionX,
        y: positionY
    };
    return result;

}

function getBatiment(type, planete) {
    position = planete.split(',')
    const listInput = listOrder;
    let verifOrder = false;
    for (let key in listOrder) {
        if (listOrder[key].tagName === 'INPUT') {
            if (listInput[key].value === '' && verifOrder === false) {
                let verifRes = RefreshRes(type);
                if (verifRes == true) {
                    listOrder[key].value = type + " - " + planete
                    verifOrder = true;
                } else {
                    verifOrder = verifRes;
                }

            }
        }
    }

    if (verifOrder === true) {
        for (let key in Game.galaxy) {
            if (Game.galaxy[key].position[0] == position[0] && Game.galaxy[key].position[1] == position[1]) {
                Game.galaxy[key].construct[type].player = me.key;
                planetInfo.style.display = "none";
                drawPlanete(Game.galaxy[key]);
            }
        }
    }
}


function RefreshRes(type = null) {
    let result = false;
    if (type != null) {
        if ((me.Res.Iron - defBatiment[type].prize[0]) >= 0 && (me.Res.Elec - defBatiment[type].prize[1]) >= 0 && (me.Res.Money - defBatiment[type].prize[2]) >= 0) {
            me.Res.Iron -= defBatiment[type].prize[0];
            me.Res.Elec -= defBatiment[type].prize[1];
            me.Res.Money -= defBatiment[type].prize[2];
            result = true;
        }
    }

    playerIron.innerHTML = me.Res.Iron;
    playerElec.innerHTML = me.Res.Elec;
    playerMoney.innerHTML = me.Res.Money;
    return result;
}

function writeMessage(canvas, message) {
    /*     var contextMap = canvas.getContext('2d');
        contextMap.clearRect(0, 0, 600, 30);
        contextMap.font = '18pt Calibri';
        contextMap.fillStyle = 'white';
        contextMap.fillText(message, 10, 25); */
}

function checkMouse(positionX, positionY) {
    let result = false;
    for (let idPlanete in Game.galaxy) {
        if (positionX >= Game.galaxy[idPlanete].position[0] - 20 &&
            positionX <= Game.galaxy[idPlanete].position[0] + 20) {
            if (positionY >= Game.galaxy[idPlanete].position[1] - 20 &&
                positionY <= Game.galaxy[idPlanete].position[1] + 20) {
                result = Game.galaxy[idPlanete];
            }
        }
    }
    return result;
}


function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / zoom,
        y: (evt.clientY - rect.top) / zoom
    };
}

/* canvasMap.addEventListener('mousewheel', function (evt) {
    console.log(evt.deltaY);
    console.log(zoom);

    if (evt.deltaY > 0) {
        console.log("ZOOM OUT");
        zoom -= 0.05;
    } else {
        console.log('ZOOM IN');
        zoom += 0.05;
    }
    console.log(zoom);
    contextMap.scale(zoom, zoom);
    drawGame(Game);

}); */

canvasMap.addEventListener('click', function (evt) {
    var mousePos = getMousePos(canvasMap, evt);
    var message = 'Mouse position: ' + Math.floor(mousePos.x) + ',' + Math.floor(mousePos.y);

    const planete = checkMouse(mousePos.x, mousePos.y);

    if (planete !== false) {
        if (planete.connect === true) {
            planetInfo.style.top = (evt.pageY - 30) + "px";
            planetInfo.style.left = (evt.pageX - 30) + "px";
            planetInfo.style.display = "block";
            infoName.innerHTML = planete.name


            if (planete.construct[0].player !== null) {
                valueFer.parentElement.classList.value =
                    `col-xs-3 value player${planete.construct[1].player}`;
            }
            valueFer.innerHTML = planete.value.fer;

            if (planete.construct[1].player !== null) {
                valueElec.parentElement.classList.value =
                    `col-xs-3 value player${planete.construct[1].player}`;
            }
            valueElec.innerHTML = planete.value.elec;

            if (planete.construct[2].player !== null) {
                valueMoney.parentElement.classList.value =
                    `col-xs-3 value player${planete.construct[2].player}`;
            }
            valueMoney.innerHTML = planete.value.money;



            listConstruct.innerHTML = `<div class="col-xs-11"><h3>Batiments</h3></div>`;
            const megapole = planete.construct[3];
            delete planete.construct[3];
            for (let key in planete.construct) {
                if (planete.construct[key].player === null) {
                    listConstruct.innerHTML +=
                        `<div class="col-xs-2 batiment" onclick="getBatiment('${key}','${planete.position}' )">
                                <div class="${planete.construct[key].type}" onmouseover="viewTooltip('${key}','${planete.position}','neutre')"></div>
                                </div>`;
                } else {
                    listConstruct.innerHTML +=
                        `<div class="col-xs-2 batiment player${planete.construct[key].player}">
                                <div class="${planete.construct[key].type}" onmouseover="viewTooltip('${key}','${planete.position}', 'player${planete.construct[key].player}')"></div>
                                </div>`;
                }
            }

            if (megapole.player !== null) {
                listConstruct.innerHTML =
                    `<div class="col-xs-11"><h3>Batiments</h3></div>
                        <div class="col-xs-2 batiment player${megapole.player}">
                                <div class="${megapole.type}" onmouseover="viewTooltip('3','${planete.position}', 'player${megapole.player}')"></div>
                                </div>`;
            } else if (megapole.player == me.key) {
                console.log("LA");
            } else {

                if (planete.construct[0].player == me.key && planete.construct[1].player == me.key &&
                    planete.construct[2].player ==
                    me.key) {
                    listConstruct.innerHTML +=
                        `<div class="col-xs-11"><h3>Pallier Sup</h3></div>
                            <div class="col-xs-2 batiment" onclick="getBatiment('3','${planete.position}' )">
                                <div class="${megapole.type}" onmouseover="viewTooltip('3','${planete.position}','neutre')"></div>
                                </div>`;
                }
            }
            planete.construct[3] = megapole;
        }
    }

    writeMessage(canvasMap, message);
}, false);

planetInfo.addEventListener("mouseleave", (evt) => {
    planetInfo.style.display = "none";

    Tooltips.reset();

    valueFer.parentElement.classList.value = 'col-xs-3 value';
    valueElec.parentElement.classList.value = 'col-xs-3 value';
    valueMoney.parentElement.classList.value = 'col-xs-3 value';
});

function viewTooltip(key, position, nameClass) {
    Tooltips.reset();
    Tooltips.main.classList.value = nameClass;
    if (nameClass != "neutre") {
        Tooltips.prize.main.classList.value = "hidden";

        if ("player" + me.key != nameClass) {
            console.log("ATTACK");
            actionAttack.style.display = "block";
            /* console.log(nameClass);
            console.log(key);
            console.log(position); */
        }
    }

    Tooltips.icon.classList.value = defBatiment[key].type;

    Tooltips.desc.innerHTML = defBatiment[key].desc;
    Tooltips.name.innerHTML = defBatiment[key].name;

    Tooltips.prize.iron.innerHTML = defBatiment[key].prize[0];
    Tooltips.prize.elec.innerHTML = defBatiment[key].prize[1];
    Tooltips.prize.money.innerHTML = defBatiment[key].prize[2];


}