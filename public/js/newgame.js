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

  const divOverlay = document.querySelector("#overlay");
  const divListPlanetes = document.querySelector("#listPlanetes");
  const buttonToogleLine = document.querySelector("#buttonToogleLine");

  function init(game, userID = 0) {
    Game = game;
    Galaxy = game.galaxy;
    userID = userID;
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
        scene.add(line)
    });
    showLine = !showLine
  }

  function DrawListPlanete(userID) {
    divListPlanetes.innerHTML = "";
    let ShowPlanetes = [];

    Galaxy.forEach(planete => {
      if (planete.hidden[userID] > 0) {
        console.log(planete, planete.connect);
        ShowPlanetes.push(planete.index);
        planete.connect.forEach(idPlanetConnect => {
          ShowPlanetes.push(idPlanetConnect);
        });
      }
    });

    ShowPlanetes.reduce((x, y) => (x.includes(y) ? x : [...x, y]), []).forEach(
      (idPlanet, key) => {
        const planete = Galaxy[idPlanet];

        let divPlanete = document.createElement("div");
        divPlanete.innerHTML = `${key} - ${planete.name}`;
        if (planete.hidden[userID] > 0) {
          divPlanete.className = "valid";
        }
        divPlanete.addEventListener("click", () => {
          ZoomCam(planete.position);
          DrawInfoPlanete(planete);
        });
        divListPlanetes.appendChild(divPlanete);

        // divListPlanetes.innerHTML += `<div class="${className}">${planete.name} ${
        //   planete.hidden[userID]
        // }</div>`;
        // ZoomCam(position)
      }
    );
  }

  function DrawInfoPlanete(planete) {
    divOverlay.innerHTML = `
    <div>Name : ${planete.name}</div>
    <div>Index : ${planete.index}</div>
    <div>X : ${Math.floor(planete.position.x)}</div>
    <div>Y : ${Math.floor(planete.position.y)}</div>
    <div>Z : ${Math.floor(planete.position.z)}</div>

    `;
    planete.construct.forEach(bat => {
      divOverlay.innerHTML += `<div>${bat.type} : ${bat.player}</div>`;
    });
    planete.connect.forEach(idConnect => {
      console.log(Galaxy[idConnect]);
      CalculDistance(planete.position, Galaxy[idConnect].position);
      divOverlay.innerHTML += `<div>${
        Galaxy[idConnect].name
      } : ${CalculDistance(
        planete.position,
        Galaxy[idConnect].position
      )}</div>`;
    });
    divOverlay.innerHTML += `<div>Iron : ${planete.value.fer}</div>`;
    divOverlay.innerHTML += `<div>Elec : ${planete.value.elec}</div>`;
    divOverlay.innerHTML += `<div>Money : ${planete.value.money}</div>`;
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
    controls.minDistance = 60;
    controls.maxDistance = (Galaxy.length / 20) * 500 * 2;

    loader = new THREE.TextureLoader();

    var light = new THREE.PointLight(0xff0000, 1, 100);
    light.position.set(50, 50, 50);
    scene.add(light);

    // console.log(Galaxy[Game.originPlanets[userID]], Galaxy);


    loader.load(`img/textures/espace.jpg`, function(
      texture
    ) {
      var geometry = new THREE.SphereGeometry(((Galaxy.length / 20) * 500 * 2)+1000, 30, 30);
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        wireframe: false,
        side: THREE.DoubleSide,
      });
      var sphere = new THREE.Mesh(geometry, material);
      sphere.position.x = 0;
      sphere.position.y = 0;
      sphere.position.z = 0;
      scene.add(sphere);
    });



    DrawPlanet(Galaxy[Game.originPlanets[userID]], true, userID);

    window.addEventListener(
      "resize",
      function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      },
      false
    );

    // render the scene
    onRenderFcts.push(function() {
      renderer.render(scene, camera);
    });

    // run the rendering loop
    var lastTimeMsec = null;
    requestAnimationFrame(function animate(nowMsec) {
      objects.forEach(sphere => {
        rotateSphere(sphere, sphere.data.size / 50000);
      });

      objectsClouds.forEach(sphere => {
        rotateSphere(sphere, getRandomInt(0, 2) / 500, getRandomInt(0, 2));
      });

      // keep looping
      requestAnimationFrame(animate);
      // measure time
      lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
      var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
      lastTimeMsec = nowMsec;
      // call each update function
      onRenderFcts.forEach(function(onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000);
      });
    });
    document.addEventListener("mousedown", event => {
      // console.log(test)
      var rect = renderer.domElement.getBoundingClientRect();
      mouse.x =
        ((event.clientX - rect.left) / (rect.width - rect.left)) * 2 - 1;
      mouse.y =
        -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      intersects = raycaster.intersectObjects(objects);
      if (intersects.length > 0) {
        const indexPlanet = intersects[0].object.data.index;

        // console.log();
        // console.log(Galaxy[indexPlanet].connect);
        DrawInfoPlanete(Galaxy[indexPlanet]);

        if (
          controls.center.x !== intersects[0].object.position.x ||
          controls.center.y !== intersects[0].object.position.y ||
          controls.center.z !== intersects[0].object.position.z
        ) {
          ZoomCam(intersects[0].object.position);

          // setTimeout(() => {
          //   controls.maxDistance = 3000;
          // }, 500);
        } else {
          if (Galaxy[indexPlanet].hidden[userID] === 0) {
            scene.remove(intersects[0].object);
            DrawPlanet(Galaxy[indexPlanet], true, userID);
            Galaxy[indexPlanet].hidden[userID] = 9;
            DrawListPlanete(userID);
          }
        }

        // controls.maxDistance = 1000;

        controls.update();
      }
    });


    
  }

  function DrawConnect(data, userID) {
    // console.log("DrawConnect", data.connect);
    data.connect.map(idPlanet => {
      let randomConnect = Galaxy[idPlanet];
      var material = new THREE.LineBasicMaterial({ color: 0xffffff, visible: showLine });
      var connectLine = new THREE.Geometry();
      console.log(idPlanet, randomConnect.hidden[userID]);
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
  function DrawPlanet(data, fog = false, userID) {
    console.log("DRAWPLANET", data.index);
    if (fog === true) {
      loader.load(`img/textures/planets/${data.texture}.jpg`, function(
        texture
      ) {
        var geometry = new THREE.SphereGeometry(data.size, 30, 30);
        var material = new THREE.MeshBasicMaterial({
          map: texture,
          wireframe: false,
          side: THREE.DoubleSide,
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
      console.log("FOG");

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
  function ZoomCam(position) {
    controls.maxDistance -= 20;
    const Interval = setInterval(() => {
      // console.log(controls.maxDistance)
      if (controls.maxDistance >= 60) {
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
    // console.log(planetA, planetB);
    let calX = Math.pow(planetB.x - planetA.x, 2);
    let calY = Math.pow(planetB.y - planetA.y, 2);
    let calZ = Math.pow(planetB.z - planetA.z, 2);
    let distance = Math.sqrt(calX + calY + calZ);
    console.log(distance);
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
      // console.log(event.ctrlKey)
      if (event.ctrlKey) {
        divOverlay.innerHTML = "Clique sur un planete";
        ResetCam();
      }
    },
    false
  );

  exports.init = init;
  exports.ResetCam = ResetCam;
  exports.ZoomCam = ZoomCam;
  // exports.Polygon = Polygon;
});

function rotateSphere(object, speed, delta = 2) {
  // object.rotation.x -= speed * x;
  object.rotation.y -= speed * delta;
  // object.rotation.z -= speed * z;
}

// function getRandomArbitrary(min, max) {
//   return Math.random() * (max - min) + min;
// }

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// function generateCoord(sizeGame = 2) {
//   let random = getRandomInt(500, sizeGame * 500);
//   // console.log("RANDOM", ((Math.random() * 10) / 5))
//   let theta = getRandomInt(2, 4) * Math.PI * getRandomArbitrary(1, 3);
//   let phi = Math.acos(1 - getRandomArbitrary(0, 2));
//   let x = Math.sin(phi) * Math.cos(theta) * random;
//   let y = Math.sin(phi) * Math.sin(theta) * random;
//   let z = Math.cos(phi) * random;

//   return {
//     x: x,
//     y: y,
//     z: z
//   };
// }

// var rgbToHex = function(rgb) {
//   var hex = Number(rgb).toString(16);
//   if (hex.length < 2) {
//     hex = "0" + hex;
//   }
//   return hex;
// };

// // getRandomInt(0, Planetes.length - 1);
// // console.log(Planetes[getRandomInt(0, Planetes.length - 1)]);
// //   return Planetes;
// // }

// function random_rgba() {
//   const red = getRandomInt(1, 255);
//   const green = getRandomInt(1, 255);
//   const blue = getRandomInt(1, 255);

//   const rgb = "rgb(" + red + "," + green + "," + blue + ")";

//   return {
//     red: red,
//     green: green,
//     blue: blue,
//     rgb: rgb
//   };
// }

// const Game = CreateGame();
// const Galaxy = Game.galaxy;

// // console.log("nb Planets", Galaxy.length);

// let renderer, scene, camera, controls, raycaster, mouse;
// const objects = [];
// const objectsClouds = [];
// const onRenderFcts = [];

// DrawGame(Galaxy);

// function DrawGame(Galaxy) {
//   renderer = new THREE.WebGLRenderer({
//     antialias: true,
//     alpha: true
//   });
//   raycaster = new THREE.Raycaster();
//   mouse = new THREE.Vector2();
//   camera = new THREE.PerspectiveCamera(
//     1000,
//     window.innerWidth / window.innerHeight,
//     0.01,
//     10000
//   );
//   scene = new THREE.Scene();

//   renderer.setSize(window.innerWidth, window.innerHeight);
//   document.body.appendChild(renderer.domElement);
//   camera.position.z = 2;

//   controls = new THREE.OrbitControls(camera);
//   controls.minDistance = 60;

//   var loader = new THREE.TextureLoader();

//   Galaxy.forEach((data, key) => {
//     const randTexture = Math.floor(Math.random() * 14);

//     console.log(data.hidden);
//     if (data.hidden >= 1) {
//       loader.load(`img/textures/planets/${data.texture}.jpg`, function(
//         texture
//       ) {
//         var geometry = new THREE.SphereGeometry(data.size, 30, 30);
//         var material = new THREE.MeshBasicMaterial({
//           map: texture,
//           wireframe: false
//         });
//         var sphere = new THREE.Mesh(geometry, material);
//         sphere.position.x = data.position.x;
//         sphere.position.y = data.position.y;
//         sphere.position.z = data.position.z;
//         sphere.cursor = "pointer";
//         sphere.data = data;
//         scene.add(sphere);
//         objects.push(sphere);
//       });

//       loader.load(
//         `img/textures/clouds/${getRandomInt(0, 3)}.png`,
//         function(texture) {
//           var geometry = new THREE.SphereGeometry(
//             data.size + getRandomInt(50, 100) / 100,
//             30,
//             30
//           );
//           var material = new THREE.MeshBasicMaterial({
//             map: texture,
//             color: data.color,
//             transparent: true,
//             opacity: 0.9,
//             wireframe: false
//           });
//           var sphere = new THREE.Mesh(geometry, material);
//           sphere.position.x = data.position.x;
//           sphere.position.y = data.position.y;
//           sphere.position.z = data.position.z;
//           sphere.cursor = "pointer";
//           sphere.data = data;
//           scene.add(sphere);
//           objectsClouds.push(sphere);
//         }
//       );

//       data.connect.forEach(idPlanet => {
//         let randomConnect = Galaxy[idPlanet];
//         if (randomConnect.hidden >= 0) {
//           var material = new THREE.LineBasicMaterial({ color: 0xffffff });
//           var connectLine = new THREE.Geometry();
//           connectLine.vertices.push(
//             new THREE.Vector3(
//               randomConnect.position.x,
//               randomConnect.position.y,
//               randomConnect.position.z
//             )
//           );
//           connectLine.vertices.push(
//             new THREE.Vector3(
//               data.position.x,
//               data.position.y,
//               data.position.z
//             )
//           );
//           var line = new THREE.Line(connectLine, material);
//           scene.add(line);
//         }
//       });
//     }
//   });
// }

// window.addEventListener(
//   "resize",
//   function() {
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//   },
//   false
// );

// function onDocumentMouseDown(event) {
//   var rect = renderer.domElement.getBoundingClientRect();
//   mouse.x =
//     ((event.clientX - rect.left) / (rect.width - rect.left)) * 2 - 1;
//   mouse.y =
//     -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);

//   intersects = raycaster.intersectObjects(objects);
//   if (intersects.length > 0) {
//     console.log(intersects[0].object.data);

//     if (
//       controls.center.x !== intersects[0].object.position.x ||
//       controls.center.y !== intersects[0].object.position.y ||
//       controls.center.z !== intersects[0].object.position.z
//     ) {
//       camera.position.set(0, 0, 0);
//       controls.maxDistance = 60;
//       setTimeout(() => {
//         controls.maxDistance = 3000;
//       }, 500);
//     }
//     controls.center.set(
//       intersects[0].object.position.x,
//       intersects[0].object.position.y,
//       intersects[0].object.position.z
//     );

//     // controls.maxDistance = 1000;

//     controls.update();
//   }
// }

// // render the scene
// onRenderFcts.push(function() {
//   renderer.render(scene, camera);
// });

// // run the rendering loop
// var lastTimeMsec = null;
// requestAnimationFrame(function animate(nowMsec) {
//   objects.forEach(sphere => {
//     rotateSphere(sphere, sphere.data.size / 100000);
//   });

//   objectsClouds.forEach(sphere => {
//     rotateSphere(sphere, getRandomInt(0, 2) / 500, getRandomInt(0, 2));
//   });

//   // keep looping
//   requestAnimationFrame(animate);
//   // measure time
//   lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
//   var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
//   lastTimeMsec = nowMsec;
//   // call each update function
//   onRenderFcts.forEach(function(onRenderFct) {
//     onRenderFct(deltaMsec / 1000, nowMsec / 1000);
//   });
// });
// document.addEventListener("mousedown", onDocumentMouseDown, false);

// function ResetCam() {
//   controls.center.set(0, 0, 0);
//   controls.minDistance = 60;
//   controls.maxDistance = Infinity;
//   controls.update();
// }
