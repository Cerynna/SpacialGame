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
    Galaxy,
    Lines = [],
    userID,
    objects = [],
    showLine = true,
    objectsClouds = [],
    onRenderFcts = [];

  // const divOverlay = document.querySelector("#overlay");
  const divOverlay = document.querySelector("#newOverlay");
  const divListPlanetes = document.querySelector("#listPlanetes");
  const buttonToogleLine = document.querySelector("#buttonToogleLine");
  const hoverInfo = document.querySelector("#hoverInfo");

  function init(game, idUser = 0) {
    Game = game;
    Galaxy = game.galaxy;
    userID = idUser;
    DrawGame(Galaxy, userID);
    DrawListPlanete(userID);
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

  function DrawListPlanete(userID) {
    divListPlanetes.innerHTML = "";

    let ShowPlanetes = [];

    Galaxy.forEach(planete => {
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
    divTotalPlanetes.innerHTML = `${ExplorPlanetes.length}/${Galaxy.length}`;
    divListPlanetes.appendChild(divTotalPlanetes);
    ExplorPlanetes.forEach((idPlanet, key) => {
      const planete = Galaxy[idPlanet];

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

    const divCurrentPlanet = divOverlay.children.currentPlanet
    console.log(divCurrentPlanet.children.planetCoord)
    divCurrentPlanet.children.planetName.innerHTML = planete.name;
    divCurrentPlanet.children.planetRes.querySelector('.iron .value').innerHTML = planete.value.fer;
    divCurrentPlanet.children.planetRes.querySelector('.elec .value').innerHTML = planete.value.elec;
    divCurrentPlanet.children.planetRes.querySelector('.money .value').innerHTML = planete.value.money;

    divCurrentPlanet.children.planetCoord.querySelector('.x').innerHTML = Math.floor(planete.position.x);
    divCurrentPlanet.children.planetCoord.querySelector('.y').innerHTML = Math.floor(planete.position.y);
    divCurrentPlanet.children.planetCoord.querySelector('.z').innerHTML = Math.floor(planete.position.z);

    // divOverlay.innerHTML = `
    // <div>Name : ${planete.name}</div>
    // <div>Index : ${planete.index}</div>
    // <div>X : ${Math.floor(planete.position.x)}</div>
    // <div>Y : ${Math.floor(planete.position.y)}</div>
    // <div>Z : ${Math.floor(planete.position.z)}</div>

    // `;
    // planete.construct.forEach(bat => {
    //   divOverlay.innerHTML += `<div>${bat.type} : ${bat.player}</div>`;
    // });
    // planete.connect.forEach(idConnect => {
    //   CalculDistance(planete.position, Galaxy[idConnect].position);
    //   divOverlay.innerHTML += `<div>${
    //     Galaxy[idConnect].name
    //   } : ${CalculDistance(
    //     planete.position,
    //     Galaxy[idConnect].position
    //   )}</div>`;
    // });
    // divOverlay.innerHTML += `<div>Iron : ${planete.value.fer}</div>`;
    // divOverlay.innerHTML += `<div>Elec : ${planete.value.elec}</div>`;
    // divOverlay.innerHTML += `<div>Money : ${planete.value.money}</div>`;
  }

  function DrawGame(Galaxy, userID) {
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
    controls.maxDistance = (Galaxy.length / 20) * 500 * 2;

    loader = new THREE.TextureLoader();

    loader.load(`img/textures/espace.jpg`, function(texture) {
      var geometry = new THREE.SphereGeometry(
        (Galaxy.length / 20) * 500 * 2 + 1000,
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

    DrawPlanet(Galaxy[Game.originPlanets[userID]], true, userID);
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
          hoverInfo.style.display = "none";
          const indexPlanet = intersects[0].object.data.index;
          DrawInfoPlanete(Galaxy[indexPlanet]);
          if (
            controls.center.x !== intersects[0].object.position.x ||
            controls.center.y !== intersects[0].object.position.y ||
            controls.center.z !== intersects[0].object.position.z
          ) {
            ZoomCam(Galaxy[indexPlanet]);
          } else {
            if (Galaxy[indexPlanet].hidden[userID] === 0) {
              scene.remove(intersects[0].object);
              DrawPlanet(Galaxy[indexPlanet], true, userID);
              Galaxy[indexPlanet].hidden[userID] = 9;
              DrawListPlanete(userID);
            }
          }
          controls.update();
        }
      },
      false
    );

    renderer.domElement.addEventListener(
      "mousemove",
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

            let divCenter = document.createElement("div");

            divCenter.classList.add("hoverInfo");
            divCenter.style.width = "30px";
            divCenter.style.height = "30px";
            divCenter.style.background =
              '#fff center/100%  url("/img/center.png") no-repeat';
            divCenter.style.top = "-30px";
            divCenter.style.borderRadius = "15px";

            divCenter.addEventListener("click", () => {
              ZoomCam(planete);
            });

            hoverInfo.appendChild(divCenter);
            let divName = document.createElement("div");
            divName.innerHTML = `${planete.name}`;
            divName.style.textTransform = "capitalize";
            divName.classList.add("hoverInfo");

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
            }
          }
        } else {
          if (event.path[0].className !== "hoverInfo") {
            hoverInfo.style.display = "none";
          }
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
      let randomConnect = Galaxy[idPlanet];
      var material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        visible: showLine
      });
      var connectLine = new THREE.Geometry();
      if (randomConnect.hidden[userID] == 0) {
        DrawPlanet(randomConnect, false, userID);
      }

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
      Lines.push(line);
      scene.add(line);
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
  }

  function DrawPlanet(data, fog = false, userID) {
    CleanScene(data.position);

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
        if (bat.type !== "megapole" && bat.player !== null) {
          console.log(Game.playerIn[bat.player].color)  
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
    DrawInfoPlanete(planete)
   let position = planete.position
    controls.maxDistance -= 20;
    const Interval = setInterval(() => {
      if (controls.maxDistance >= 80) {
        controls.maxDistance -= 20;
        controls.update();
      } else {
        clearInterval(Interval);
        controls.maxDistance = (Galaxy.length / 20) * 500 * 2;
      }
    }, 10);
    controls.center.set(position.x, position.y, position.z);
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
    controls.maxDistance = (Galaxy.length / 20) * 500 * 2;
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

  exports.init = init;
  exports.ResetCam = ResetCam;
  exports.ZoomCam = ZoomCam;
});

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
