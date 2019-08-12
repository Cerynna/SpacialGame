(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory(exports)
    : typeof define === "function" && define.amd
    ? define(["exports"], factory)
    : ((global = global || self), factory((global.GAME = {})));
})(this, function(exports) {
  "use strict";

  let renderer,
    scene,
    camera,
    controls,
    raycaster,
    intersects,
    mouse,
    loader,
    Game,
    Lines = [],
    userID,
    objects = [],
    showLine = true,
    gameSpeed = 10,
    currentPlanete = null,
    objectsClouds = [],
    onRenderFcts = [];

  // const divOverlay = document.querySelector("#overlay");
  const divOverlay = document.querySelector("#newOverlay");
  const divListPlanetes = document.querySelector("#listPlanetes");
  const buttonToogleLine = document.querySelector("#buttonToogleLine");
  const hoverInfo = document.querySelector("#hoverInfo");
  const divPlanetConstructs = document.querySelector("#planetConstructs");

  function init(game, idUser = 0) {
    Game = game;
    userID = idUser;

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    camera = new THREE.PerspectiveCamera(
      1000,
      window.innerWidth / window.innerHeight,
      0.01,
      10000
    );
    scene = new THREE.Scene();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    camera.position.z = 2;

    controls = new THREE.OrbitControls(camera);
    controls.minDistance = 0;
    controls.maxDistance = (Game.galaxy.length / 20) * 500 * 2;

    loader = new THREE.TextureLoader();

    DrawGame(Game, userID);
    DrawListPlanete(userID);
    ZoomCam(Game.galaxy[Game.originPlanets[userID]]);
  }
  buttonToogleLine.addEventListener("click", () => {
    ToogleLine();
  });

  function ToogleLine() {
    Lines.forEach(line => {
      scene.remove(line);
      line.visible = !showLine;
      scene.add(line);
    });
    showLine = !showLine;
  }

  function DrawPlanetConstruct(planete) {
    currentPlanete = planete;
    divPlanetConstructs.innerHTML = "";
    console.log(planete.construct[1].player);
    if (planete.hidden[userID] > 0) {
      console.log(planete);

      const buttonExplo = document.createElement("div");
      buttonExplo.classList.add("bat", "elec");
      // buttonExplo.classList.add('elec')
      // buttonExplo.innerHTML = "EXPLO";
      if (Game.galaxy[planete.index].construct[1].player !== null) {
        // buttonExplo.style.border = "2px solid " + Game.playerIn[Game.galaxy[planete.index].construct[1].player].color;
        buttonExplo.style.backgroundColor =
          Game.playerIn[Game.galaxy[planete.index].construct[1].player].color;
      } else {
        buttonExplo.addEventListener("click", () => {
          Game.galaxy[planete.index].construct[1].player = userID;

          DrawPlanet(Game.galaxy[planete.index], true, userID);
          DrawPlanetConstruct(Game.galaxy[planete.index]);
        });
      }

      divPlanetConstructs.appendChild(buttonExplo);

      const divListProbe = document.createElement("ul");
      divListProbe.id = "planetProbes";

      if (Game.galaxy[planete.index].construct[1].player == userID) {
        planete.connect.forEach(connectPlanetID => {
          let distance = CalculDistance(
            planete.position,
            Game.galaxy[connectPlanetID].position
          );
          const buttonProbe = document.createElement("li");

          // buttonProbe.innerHTML =
          //   Game.galaxy[connectPlanetID].name +
          //   " - " +
          //   distance;
          const divNamePlanete = document.createElement("div");
          divNamePlanete.classList.add("namePlanete");
          divNamePlanete.innerHTML = Game.galaxy[connectPlanetID].name;

          const divScreenPlanete = document.createElement("div");

          divScreenPlanete.classList.add("screenPlanete");

          if (Game.galaxy[connectPlanetID].hidden[userID] > 0) {
            divScreenPlanete.style.background = `center url("/img/textures/planets/${
              Game.galaxy[connectPlanetID].texture
            }.jpg") no-repeat`;
            divScreenPlanete.addEventListener("click", () => {
              // Game.galaxy[connectPlanetID].hidden[userID] = 9;
              // DrawPlanet(Game.galaxy[connectPlanetID], true, userID);
              ZoomCam(Game.galaxy[connectPlanetID]);
            });
          } else {
            divScreenPlanete.style.background = `linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.9)),  center url("/img/textures/planets/${
              Game.galaxy[connectPlanetID].texture
            }.jpg")  no-repeat`;

            console.log();
            // "</div>";
            divScreenPlanete.addEventListener("click", () => {
              //
              divScreenPlanete.innerHTML =
                // '<div id="countdown">' +
                "<svg>" + '<circle r="17" cx="20" cy="20">' + "</svg>";
              divScreenPlanete.querySelector(
                "circle"
              ).style.animation = `countdown ${distance *
                gameSpeed}ms linear forwards`;

              setTimeout(() => {
                Game.galaxy[connectPlanetID].hidden[userID] = 9;
                DrawPlanet(Game.galaxy[connectPlanetID], true, userID);

                if (
                  currentPlanete !== null &&
                  currentPlanete.index === planete.index
                ) {

                  divScreenPlanete.style.animation = 'glow 1s ease-in-out infinite alternate';

                  divScreenPlanete.style.background = `center url("/img/textures/planets/${
                    Game.galaxy[connectPlanetID].texture
                  }.jpg") no-repeat`;
                  divScreenPlanete.addEventListener("click", () => {
                    // Game.galaxy[connectPlanetID].hidden[userID] = 9;
                    // DrawPlanet(Game.galaxy[connectPlanetID], true, userID);
                    ZoomCam(Game.galaxy[connectPlanetID]);
                  });
                }
                Notification(Game.galaxy[connectPlanetID], 'newExplo')
                //
              }, distance * gameSpeed);
            });
          }

          // divScreenPlanete.addEventListener("click", () => {
          //   Game.galaxy[connectPlanetID].hidden[userID] = 9;
          //   DrawPlanet(Game.galaxy[connectPlanetID], true, userID);
          // });

          buttonProbe.appendChild(divScreenPlanete);
          buttonProbe.appendChild(divNamePlanete);
          divListProbe.appendChild(buttonProbe);
          DrawListPlanete(userID);
        });
      }
      divPlanetConstructs.appendChild(divListProbe);

      const buttonAttack = document.createElement("div");
      buttonAttack.classList.add("bat", "attack");
      // buttonAttack.innerHTML = "Attack";
      if (Game.galaxy[planete.index].construct[0].player !== null) {
        // buttonExplo.style.border = "2px solid " + Game.playerIn[Game.galaxy[planete.index].construct[1].player].color;
        buttonAttack.style.backgroundColor =
          Game.playerIn[Game.galaxy[planete.index].construct[0].player].color;
      } else {
        buttonAttack.addEventListener("click", () => {
          Game.galaxy[planete.index].construct[0].player = userID;

          DrawPlanet(Game.galaxy[planete.index], true, userID);
          DrawPlanetConstruct(Game.galaxy[planete.index]);
        });
      }
      divPlanetConstructs.appendChild(buttonAttack);

      const buttonMoney = document.createElement("div");
      buttonMoney.classList.add("bat", "money");
      // buttonMoney.innerHTML = "Money";
      if (Game.galaxy[planete.index].construct[2].player !== null) {
        // buttonExplo.style.border = "2px solid " + Game.playerIn[Game.galaxy[planete.index].construct[1].player].color;
        buttonMoney.style.backgroundColor =
          Game.playerIn[Game.galaxy[planete.index].construct[2].player].color;
      } else {
        buttonMoney.addEventListener("click", () => {
          Game.galaxy[planete.index].construct[2].player = userID;

          DrawPlanet(Game.galaxy[planete.index], true, userID);
          DrawPlanetConstruct(Game.galaxy[planete.index]);
        });
      }
      divPlanetConstructs.appendChild(buttonMoney);
    }
  }

  function DrawListPlanete(userID) {
    divListPlanetes.innerHTML = "";

    let ShowPlanetes = [];

    Game.galaxy.forEach(planete => {
      if (planete.hidden[userID] > 0) {
        ShowPlanetes.push(planete.index);
        planete.connect.forEach(idPlanetConnect => {
          ShowPlanetes.push(idPlanetConnect);
        });
      }
    });
    const ExplorPlanetes = ShowPlanetes.reduce(
      (x, y) => (x.includes(y) ? x : [...x, y]),
      []
    );

    const divTotalPlanetes = document.createElement("div");
    divTotalPlanetes.innerHTML = `${ExplorPlanetes.length}/${
      Game.galaxy.length
    }`;
    divListPlanetes.appendChild(divTotalPlanetes);
    ExplorPlanetes.forEach((idPlanet, key) => {
      const planete = Game.galaxy[idPlanet];

      let divPlanete = document.createElement("div");
      divPlanete.innerHTML = `${planete.name}`;
      if (planete.hidden[userID] > 0) {
        divPlanete.className = "valid";
      }
      divPlanete.addEventListener("click", () => {
        ZoomCam(planete);
        DrawInfoPlanete(planete);
      });
      divListPlanetes.appendChild(divPlanete);
    });
  }

  function DrawInfoPlanete(planete) {
    const divCurrentPlanet = divOverlay.children.currentPlanet;
    console.log(planete.hidden[userID]);
    divCurrentPlanet.children.planetName.innerHTML = planete.name;
    divCurrentPlanet.children.planetRes.querySelector(
      ".iron .value"
    ).innerHTML = planete.hidden[userID] > 0 ? planete.value.fer : "???";
    divCurrentPlanet.children.planetRes.querySelector(
      ".elec .value"
    ).innerHTML = planete.hidden[userID] > 0 ? planete.value.elec : "???";
    divCurrentPlanet.children.planetRes.querySelector(
      ".money .value"
    ).innerHTML = planete.hidden[userID] > 0 ? planete.value.money : "???";

    divCurrentPlanet.children.planetCoord.querySelector(".x").innerHTML =
      planete.hidden[userID] > 0 ? Math.floor(planete.position.x) : "???";
    divCurrentPlanet.children.planetCoord.querySelector(".y").innerHTML =
      planete.hidden[userID] > 0 ? Math.floor(planete.position.y) : "???";
    divCurrentPlanet.children.planetCoord.querySelector(".z").innerHTML =
      planete.hidden[userID] > 0 ? Math.floor(planete.position.z) : "???";
  }

  function DrawGame(Game, userID) {
    loader.load(`img/textures/espace.jpg`, function(texture) {
      var geometry = new THREE.SphereGeometry(
        (Game.galaxy.length / 20) * 500 * 2 + 1000,
        30,
        30
      );
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        wireframe: false,
        side: THREE.DoubleSide
      });
      var sphere = new THREE.Mesh(geometry, material);
      sphere.position.x = 0;
      sphere.position.y = 0;
      sphere.position.z = 0;
      scene.add(sphere);
    });

    Game.galaxy.forEach(planete => {
      if (planete.hidden[userID] > 0) {
        DrawPlanet(planete, true, userID);
        DrawConnect(planete, userID);
      }
    });
    renderer.domElement.addEventListener(
      "mousedown",
      event => {
        var rect = renderer.domElement.getBoundingClientRect();
        mouse.x =
          ((event.clientX - rect.left) / (rect.width - rect.left)) * 2 - 1;
        mouse.y =
          -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        intersects = raycaster.intersectObjects(objects);
        if (intersects.length > 0) {
          if (
            controls.center.x !== intersects[0].object.position.x ||
            controls.center.y !== intersects[0].object.position.y ||
            controls.center.z !== intersects[0].object.position.z
          ) {
            let planete = intersects[0].object.data;

            hoverInfo.style.display = "block";
            hoverInfo.style.top = event.pageY + "px";
            hoverInfo.style.left = event.pageX + "px";
            hoverInfo.innerHTML = "";

            let divZoomIn = document.createElement("div");

            // divZoomIn.classList.add("hoverInfo");
            divZoomIn.style.width = "30px";
            divZoomIn.style.height = "30px";
            divZoomIn.style.background =
              '#fff center/100%  url("/img/center.png") no-repeat';
            divZoomIn.style.top = "-30px";
            divZoomIn.style.borderRadius = "15px";

            divZoomIn.addEventListener("click", () => {
              ZoomCam(planete);
            });

            hoverInfo.appendChild(divZoomIn);
            let divName = document.createElement("div");
            divName.innerHTML = `${planete.name}`;
            divName.style.textTransform = "capitalize";
            // divName.classList.add("hoverInfo");

            hoverInfo.appendChild(divName);

            if (planete.hidden[userID] > 0) {
              let divResIron = document.createElement("div");
              divResIron.innerHTML = `${planete.value.fer}`;
              divResIron.style.background =
                '#000 bottom right  url("/img/iron.png") no-repeat';
              divResIron.style.backgroundSize = "15px";
              divResIron.style.width = "50px";
              divResIron.style.height = "30px";
              divResIron.style.color = "#FFF";
              divResIron.style.margin = "5px";
              divResIron.style.borderRadius = "5px";

              divResIron.classList.add("hoverInfo");
              hoverInfo.appendChild(divResIron);

              let divResElec = document.createElement("div");
              divResElec.innerHTML = `${planete.value.elec}`;
              divResElec.style.background =
                '#000 bottom right  url("/img/elec.png") no-repeat';
              divResElec.style.backgroundSize = "15px";
              divResElec.style.width = "50px";
              divResElec.style.height = "30px";
              divResElec.style.color = "#FFF";
              divResElec.style.margin = "5px";
              divResElec.style.borderRadius = "5px";
              divResElec.classList.add("hoverInfo");
              hoverInfo.appendChild(divResElec);

              let divResMoney = document.createElement("div");
              divResMoney.innerHTML = `${planete.value.money}`;
              divResMoney.style.background =
                '#000 bottom right  url("/img/money.png") no-repeat';
              divResMoney.style.backgroundSize = "15px";
              divResMoney.style.width = "50px";
              divResMoney.style.height = "30px";
              divResMoney.style.color = "#FFF";
              divResMoney.style.margin = "5px";
              divResMoney.style.borderRadius = "5px";
              divResMoney.classList.add("hoverInfo");
              hoverInfo.appendChild(divResMoney);
            } else {
            }
          }
        } else {
          // if (event.path[0].className !== "hoverInfo") {
          //   hoverInfo.style.display = "none";
          // }
        }
      },
      false
    );
    hoverInfo.addEventListener(
      "mouseover",
      () => {
        hoverInfo.style.display = "block";
      },
      false
    );
    hoverInfo.addEventListener(
      "mouseout",
      () => {
        hoverInfo.style.display = "none";
      },
      false
    );
    window.addEventListener(
      "resize",
      function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      },
      false
    );

    onRenderFcts.push(function() {
      renderer.render(scene, camera);
    });

    var lastTimeMsec = null;
    requestAnimationFrame(function animate(nowMsec) {
      objects.forEach(sphere => {
        rotateSphere(sphere, sphere.data.size / 50000);
      });

      objectsClouds.forEach(sphere => {
        rotateSphere(sphere, getRandomInt(0, 2) / 500, getRandomInt(0, 2));
      });

      requestAnimationFrame(animate);
      lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
      var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
      lastTimeMsec = nowMsec;
      onRenderFcts.forEach(function(onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000);
      });
    });
  }

  function DrawConnect(data, userID) {
    data.connect.map(idPlanet => {
      let randomConnect = Game.galaxy[idPlanet];
      var material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        visible: showLine
      });
      var connectLine = new THREE.Geometry();

      if (randomConnect.hidden[userID] == 0) {
        DrawPlanet(randomConnect, false, userID);
      }
      Lines.forEach(line => {
        if (line.data) {
          // console.log(line.data);
        }
      });
      if (data.construct[1].player == userID) {
        connectLine.vertices.push(
          new THREE.Vector3(
            randomConnect.position.x,
            randomConnect.position.y,
            randomConnect.position.z
          )
        );
        connectLine.vertices.push(
          new THREE.Vector3(data.position.x, data.position.y, data.position.z)
        );
        var line = new THREE.Line(connectLine, material);

        line.data = {
          planeteA: {
            x: data.position.x,
            y: data.position.y,
            z: data.position.z
          },
          planeteB: {
            x: data.position.x,
            y: data.position.y,
            z: data.position.z
          }
        };

        Lines.push(line);
        scene.add(line);
      }
    });
  }

  function CleanScene(planetPosition) {
    objects.forEach(sphere => {
      if (
        planetPosition.x === sphere.position.x ||
        planetPosition.y === sphere.position.y ||
        planetPosition.z === sphere.position.z
      ) {
        console.log(sphere.position);
        scene.remove(sphere);
      }
    });
    objectsClouds.forEach(sphere => {
      if (
        planetPosition.x === sphere.position.x ||
        planetPosition.y === sphere.position.y ||
        planetPosition.z === sphere.position.z
      ) {
        console.log(sphere.position);
        scene.remove(sphere);
      }
    });
  }

  function DrawPlanet(data, fog = false, userID) {
    CleanScene(data.position);
    console.log("DrawPlanet", data);

    if (fog === true) {
      DrawConstructs(data);

      loader.load(`img/textures/planets/${data.texture}.jpg`, function(
        texture
      ) {
        var geometry = new THREE.SphereGeometry(data.size, 30, 30);
        var material = new THREE.MeshBasicMaterial({
          map: texture,
          wireframe: false,
          side: THREE.DoubleSide
        });
        var sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = data.position.x;
        sphere.position.y = data.position.y;
        sphere.position.z = data.position.z;
        sphere.cursor = "pointer";
        sphere.data = data;
        scene.add(sphere);
        objects.push(sphere);
      });

      loader.load(`img/textures/clouds/${getRandomInt(0, 3)}.png`, function(
        texture
      ) {
        var geometry = new THREE.SphereGeometry(
          data.size + getRandomInt(50, 100) / 100,
          30,
          30
        );
        var material = new THREE.MeshBasicMaterial({
          map: texture,
          color: data.color,
          transparent: true,
          opacity: 0.9,
          wireframe: false
        });
        var sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = data.position.x;
        sphere.position.y = data.position.y;
        sphere.position.z = data.position.z;
        sphere.cursor = "pointer";
        sphere.data = data;
        scene.add(sphere);
        objectsClouds.push(sphere);
      });
      DrawConnect(data, userID);
    } else {
      loader.load(`img/textures/planets/${data.texture}.jpg`, function(
        texture
      ) {
        var geometry = new THREE.SphereGeometry(data.size, 10, 10);
        var material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.5,
          wireframe: true
        });
        var sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = data.position.x;
        sphere.position.y = data.position.y;
        sphere.position.z = data.position.z;
        sphere.cursor = "pointer";
        sphere.data = data;
        scene.add(sphere);
        objects.push(sphere);
      });
    }
  }

  function DrawConstructs(data) {
    if (data.construct)
      data.construct.forEach((bat, key) => {
        if (bat.type !== "megapole" && bat.player !== null && Game.playerIn) {
          console.log(
            "DrawConstructs",
            Game.playerIn,
            Game.playerIn[bat.player]
          );

          const sprite = (Math.PI * 2) / 3;
          const phiStart = sprite * key;
          const phiLength = sprite;
          var geometry = new THREE.SphereGeometry(
            data.size + 2,
            30,
            30,
            phiStart,
            phiLength
          );
          var material = new THREE.MeshBasicMaterial({
            color: Game.playerIn[bat.player].color,
            wireframe: false,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
          });
          var sphere = new THREE.Mesh(geometry, material);
          sphere.position.x = data.position.x;
          sphere.position.y = data.position.y;
          sphere.position.z = data.position.z;
          sphere.data = data;
          scene.add(sphere);
          objects.push(sphere);
        }
      });
  }

  function ZoomCam(planete) {
    DrawInfoPlanete(planete);
    DrawPlanetConstruct(planete);
    let position = planete.position;
    controls.maxDistance -= 20;
    const Interval = setInterval(() => {
      if (controls.maxDistance >= 80) {
        controls.maxDistance -= 20;
        controls.update();
      } else {
        clearInterval(Interval);
        controls.maxDistance = (Game.galaxy.length / 20) * 500 * 2;
      }
    }, 5);
    // controls.maxDistance  = 60;
    controls.center.set(position.x, position.y, position.z);
  }

  function Notification(planete, type) {


    const popupNotif = document.createElement("div");
    popupNotif.classList.add('popupNotif');

    const divIcon = document.createElement("div");
    divIcon.classList.add('icon');

    const divMessage = document.createElement("div");
    divMessage.classList.add('message');

    const divNotification = document.querySelector("#Notification");

switch (type) {
  case "newExplo":
    console.log(planete);
    divIcon.style.background = `center url("img/textures/planets/${planete.texture}.jpg") no-repeat`;
    divMessage.innerHTML = planete.name + " découverte"
    divIcon.addEventListener('click', ()=>{
      ZoomCam(planete)
    })
    break;

  default:
    break;
}
popupNotif.appendChild(divIcon);
popupNotif.appendChild(divMessage);
divNotification.appendChild(popupNotif);
    // divMessage.innerHTML = message;
    divNotification.scrollTo(0,divNotification.scrollHeight);
    popupNotif.style.animation = "popupON 1s linear forwards";


  }

  function CalculDistance(planetA, planetB) {
    let calX = Math.pow(planetB.x - planetA.x, 2);
    let calY = Math.pow(planetB.y - planetA.y, 2);
    let calZ = Math.pow(planetB.z - planetA.z, 2);
    let distance = Math.sqrt(calX + calY + calZ);
    return Math.floor(distance);
  }

  function ResetCam() {
    controls.center.set(0, 0, 0);
    controls.minDistance = 60;
    controls.maxDistance = (Game.galaxy.length / 20) * 500 * 2;
    controls.update();
  }

  document.addEventListener(
    "dblclick",
    event => {
      if (event.ctrlKey) {
        // divOverlay.innerHTML = "Clique sur un planete";
        ResetCam();
      }
    },
    false
  );

  function rotateSphere(object, speed, delta = 2) {
    // object.rotation.x -= speed * x;
    object.rotation.y -= speed * delta;
    // object.rotation.z -= speed * z;
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getCurrent() {
    return Game;
  }

  exports.init = init;
  exports.ResetCam = ResetCam;
  exports.ZoomCam = ZoomCam;
  exports.Game = Game;
  exports.getCurrent = getCurrent;
});
