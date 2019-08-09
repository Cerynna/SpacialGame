// const fs = require("fs");
var diff = require("deep-diff").diff;
var observableDiff = require("deep-diff").observableDiff;
var applyChange = require("deep-diff").applyChange;
const Tools = {
  init: () => {
    console.log("INIT TOOLS");
  },
  fs: require("fs"),
  // : require("deep-diff").diff(),
  getRandomArbitrary: (min, max) => {
    return Math.random() * (max - min) + min;
  },
  getRandomInt: (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  generateCoord: (sizeGame = 2) => {
    let random = Tools.getRandomInt(500, sizeGame * 500);
    // console.log("RANDOM", ((Math.random() * 10) / 5))
    let theta =
      Tools.getRandomInt(2, 4) * Math.PI * Tools.getRandomArbitrary(1, 3);
    let phi = Math.acos(1 - Tools.getRandomArbitrary(0, 2));
    let x = Math.sin(phi) * Math.cos(theta) * random;
    let y = Math.sin(phi) * Math.sin(theta) * random;
    let z = Math.cos(phi) * random;

    return {
      x: x,
      y: y,
      z: z
    };
  },
  rgbToHex: rgb => {
    var hex = Number(rgb).toString(16);
    if (hex.length < 2) {
      hex = "0" + hex;
    }
    return hex;
  },
  randomRGB: () => {
    const red = Tools.getRandomInt(1, 255);
    const green = Tools.getRandomInt(1, 255);
    const blue = Tools.getRandomInt(1, 255);

    const rgb = "rgb(" + red + "," + green + "," + blue + ")";

    return {
      red: red,
      green: green,
      blue: blue,
      rgb: rgb
    };
  },
  SaveGame: Game => {
    const path = "Games/" + Game.id + ".json";
    Tools.fs.access(path, Tools.fs.F_OK, err => {
      if (err) {
        console.error("NEWGAME");
        Tools.fs.writeFile(path, JSON.stringify(Game), err => {
          if (err) throw err;
          console.log("New Galaxy " + Game.id + " created");
        });

      }
      let lhs = Game;
      let rhs = Tools.RecupGame(Game.id);
      let differences = diff(lhs, rhs);
      if (differences) {
        observableDiff(lhs, rhs, d => {
          if (d.path.indexOf('construct') < 0) {
            applyChange(lhs, rhs, d);
          } else {
            console.log(d)
            if (rhs === null) {
              applyChange(lhs, rhs, d);
            }
          }

        });
        Tools.fs.writeFile(path, JSON.stringify(lhs), err => {
          if (err) throw err;
          console.log("Update Galaxy " + lhs.id + " !!");
        });
      }
    });
    return Game;
  },
  RecupGame: idGme => {
    const Game = JSON.parse(Tools.fs.readFileSync("Games/" + idGme + ".json"));

    //  console.log(Game)
    return Game;
  },
  CreateGame: (data, Creator) => {
    // = {
    //   id: "4ESMfqHwXL",
    //   pseudo: "RSLEQID",
    //   md5: "6362a9d480ce9ec03af5916f0b07fb01",
    //   color: "#473D48",
    //   Res: { Iron: 0, Elec: 0, Money: 0 },
    //   base: {}
    // }
    let Planetes = [];

    const originPlanets = [];

    let nbPlanetes = data.size * 25;
    let moyenIron = 0;
    let moyenElec = 0;
    let moyenMoney = 0;
    // let hiddenBase = [];

    for (let index = 0; index < data.size; index++) {
      let indexPlanet = Tools.getRandomInt(0, nbPlanetes);
      // hiddenBase.push(0);
      if (originPlanets.indexOf(indexPlanet) > 0) {
        indexPlanet = Tools.getRandomInt(0, nbPlanetes - 1);
      }
      originPlanets.push(indexPlanet);
    }

    for (let index = 0; index < nbPlanetes; index++) {
      const randomValue = Tools.randomRGB();
      let hiddenBase = [];

      for (let index = 0; index < data.size; index++) {
        hiddenBase.push(0);
      }

      // console.log('ORIGIN',originPlanets, originPlanets.indexOf(index));
      let construct = [{
          type: "atack",
          player: null
        },
        {
          type: "explo",
          player: null
        },
        {
          type: "commerce",
          player: null
        },
        {
          type: "megapole",
          player: null
        }
      ];

      //   console.log("construct", construct);
      const sizePlanet = Math.floor((Math.random() + 1) * 10) * 1.8;

      const position = Tools.generateCoord(data.size);
      // console.log(Math.floor(position.x + position.y + position.z));
      const Planete = {
        name: Tools.nameGenerator(1),
        size: sizePlanet,
        position: position,
        color: randomValue.rgb,
        construct: construct,
        index: index,
        texture: Tools.getRandomInt(0, 29),
        hidden: hiddenBase,
        connect: null,
        value: {
          fer: Math.floor((randomValue.red * sizePlanet) / 8),
          elec: Math.floor((randomValue.blue * sizePlanet) / 8),
          money: Math.floor((randomValue.green * sizePlanet) / 20)
        }
      };
      moyenIron += Math.floor((randomValue.red * sizePlanet) / 8);
      moyenElec += Math.floor((randomValue.blue * sizePlanet) / 8);
      moyenMoney += Math.floor((randomValue.green * sizePlanet) / 20);
      // console.log(originPlanets.indexOf(index));
      if (originPlanets.indexOf(index) >= 0) {
        // console.log("ORIGIN", originPlanets, originPlanets.indexOf(index));
        const playerId = originPlanets.indexOf(index);
        Planete.construct = [{
            type: "atack",
            player: playerId
          },
          {
            type: "explo",
            player: playerId
          },
          {
            type: "commerce",
            player: playerId
          },
          {
            type: "megapole",
            player: null
          }
        ];
        Planete.hidden[playerId] = 9;
      }

      Planetes.push(Planete);
    }

    let allCoord = Planetes.map(planete => {
      // console.log(allCoord)

      return {
        index: planete.index,
        position: planete.position
      };
    });
    // console.log(allCoord);

    Planetes.forEach(planetA => {
      let ResultDistance = allCoord
        .map(planetB => {
          const dist = parseFloat(
            Tools.CalculDistance(planetA.position, planetB.position)
          );
          return {
            index: planetB.index,
            dist: dist
          };
        })

        .sort((a, b) => {
          return a.dist - b.dist;
        });

      let newConnect = [];

      let nearConnect = ResultDistance.map(planete =>
        planete.dist !== 0 && planete.dist < 300 ? planete.index : false
      ).filter(x => x);

      let farConnect = ResultDistance.map(planete =>
          planete.dist !== 0 &&
          planete.dist >= 700 &&
          nearConnect.indexOf(planete.index) < 0 ?
          planete.index :
          false
        )
        .filter(x => x)
        .slice(0, 1);
      let farFarConnect = ResultDistance.map(planete =>
          planete.dist !== 0 &&
          planete.dist >= 1500 &&
          farConnect.indexOf(planete.index) < 0 &&
          nearConnect.indexOf(planete.index) < 0 ?
          planete.index :
          false
        )
        .filter(x => x)
        .slice(0, 1);
      Planetes[planetA.index].connect = [
        ...nearConnect,
        ...farConnect,
        ...farFarConnect
      ];
      // console.log(Planetes[planetA.index].connect)
    });

    // console.log(Planetes.length);
    // Planetes = NewGame(Planetes, size);
    const Game = {
      galaxy: Planetes,
      id: Tools.makeID(12),
      name: data.name,
      whoCreate: Creator,
      date: {
        create: Date.now(),
        update: 0,
        end: 0,
        start: 0
      },
      moyen: {
        fer: moyenIron,
        elec: moyenElec,
        money: moyenMoney
      },
      originPlanets: originPlanets,
      playerIn: [Creator]
    };
    // Tools.SaveGame(Game);
    return Game;
  },
  nameGenerator: count => {
    let vowels = {
        "1": [
          "b",
          "c",
          "d",
          "f",
          "g",
          "h",
          "i",
          "j",
          "k",
          "l",
          "m",
          "n",
          "p",
          "q",
          "r",
          "s",
          "t",
          "v",
          "w",
          "x",
          "y",
          "z"
        ],
        "2": ["a", "e", "o", "u"],
        "3": [
          "br",
          "cr",
          "dr",
          "fr",
          "gr",
          "pr",
          "str",
          "tr",
          "bl",
          "cl",
          "fl",
          "gl",
          "pl",
          "sl",
          "sc",
          "sk",
          "sm",
          "sn",
          "sp",
          "st",
          "sw",
          "ch",
          "sh",
          "th",
          "wh"
        ],
        "4": [
          "ae",
          "ai",
          "ao",
          "au",
          "a",
          "ay",
          "ea",
          "ei",
          "eo",
          "eu",
          "e",
          "ey",
          "ua",
          "ue",
          "ui",
          "uo",
          "u",
          "uy",
          "ia",
          "ie",
          "iu",
          "io",
          "iy",
          "oa",
          "oe",
          "ou",
          "oi",
          "o",
          "oy"
        ],
        "5": [
          "turn",
          "ter",
          "nus",
          "rus",
          "tania",
          "hiri",
          "hines",
          "gawa",
          "nides",
          "carro",
          "rilia",
          "stea",
          "lia",
          "lea",
          "ria",
          "nov",
          "phus",
          "mia",
          "nerth",
          "wei",
          "ruta",
          "tov",
          "zuno",
          "vis",
          "lara",
          "nia",
          "liv",
          "tera",
          "gantu",
          "yama",
          "tune",
          "ter",
          "nus",
          "cury",
          "bos",
          "pra",
          "thea",
          "nope",
          "tis",
          "clite"
        ],
        "6": [
          "una",
          "ion",
          "iea",
          "iri",
          "illes",
          "ides",
          "agua",
          "olla",
          "inda",
          "eshan",
          "oria",
          "ilia",
          "erth",
          "arth",
          "orth",
          "oth",
          "illon",
          "ichi",
          "ov",
          "arvis",
          "ara",
          "ars",
          "yke",
          "yria",
          "onoe",
          "ippe",
          "osie",
          "one",
          "ore",
          "ade",
          "adus",
          "urn",
          "ypso",
          "ora",
          "iuq",
          "orix",
          "apus",
          "ion",
          "eon",
          "eron",
          "ao",
          "omia"
        ]
      },
      mtx = [
        [1, 1, 2, 2, 5, 5],
        [2, 2, 3, 3, 6, 6],
        [3, 3, 4, 4, 5, 5],
        [4, 4, 3, 3, 6, 6],
        [3, 3, 4, 4, 2, 2, 5, 5],
        [2, 2, 1, 1, 3, 3, 6, 6],
        [3, 3, 4, 4, 2, 2, 5, 5],
        [4, 4, 3, 3, 1, 1, 6, 6],
        [3, 3, 4, 4, 1, 1, 4, 4, 5, 5],
        [4, 4, 1, 1, 4, 4, 3, 3, 6, 6]
      ],
      fn = function (i) {
        return Math.floor(Math.random() * vowels[i].length);
      },
      //   ret = [],
      name,
      comp,
      i,
      il,
      c = 0;

    for (; c < count; c++) {
      name = "";
      comp = mtx[c % mtx.length];
      for (i = 0, il = comp.length / 2; i < il; i++) {
        name += vowels[comp[i * 2]][fn(comp[i * 2 + 1])];
      }
      //   ret.push(name);
    }

    return name;
  },
  CalculDistance: (planetA, planetB) => {
    let calX = Math.pow(planetB.x - planetA.x, 2);
    let calY = Math.pow(planetB.y - planetA.y, 2);
    let calZ = Math.pow(planetB.z - planetA.z, 2);
    let distance = Math.sqrt(calX + calY + calZ);
    return Math.floor(distance);
  },
  makeID: stringLength => {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < stringLength; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }
};

// function monkeyCount(n) {
//   return Array.from({length:n}, (_,i)=>i+1)
// }

module.exports = Tools;