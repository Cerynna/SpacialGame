      function rotateSphere(object, speed, delta = 2) {
        // object.rotation.x -= speed * x;
        object.rotation.y -= speed * delta;
        // object.rotation.z -= speed * z;
      }

      function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
      }

      function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      function generateCoord(sizeGame = 2) {
        let random = getRandomInt(500, sizeGame * 500);
        // console.log("RANDOM", ((Math.random() * 10) / 5))
        let theta = getRandomInt(2, 4) * Math.PI * getRandomArbitrary(1, 3);
        let phi = Math.acos(1 - getRandomArbitrary(0, 2));
        let x = Math.sin(phi) * Math.cos(theta) * random;
        let y = Math.sin(phi) * Math.sin(theta) * random;
        let z = Math.cos(phi) * random;

        return {
          x: x,
          y: y,
          z: z
        };
      }

      var rgbToHex = function(rgb) {
        var hex = Number(rgb).toString(16);
        if (hex.length < 2) {
          hex = "0" + hex;
        }
        return hex;
      };

      function CreateGame(sizeGame = 2) {
        let Planetes = [];

        const originPlanets = [];

        let nbPlanetes = sizeGame * 20;
        let moyenIron = 0;
        let moyenElec = 0;
        let moyenMoney = 0;

        for (let index = 0; index < sizeGame; index++) {
          let indexPlanet = getRandomInt(0, nbPlanetes);

          if (originPlanets.indexOf(indexPlanet) > 0) {
            indexPlanet = getRandomInt(0, nbPlanetes - 1);
          }
          originPlanets.push(indexPlanet);
        }

        for (let index = 0; index < nbPlanetes; index++) {
          const randomValue = random_rgba();

          // console.log('ORIGIN',originPlanets, originPlanets.indexOf(index));
          let construct = [
            {
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

          console.log("construct", construct);
          const sizePlanet = Math.floor((Math.random() + 1) * 10) * 1.8;

          const position = generateCoord(sizeGame);
          // console.log(Math.floor(position.x + position.y + position.z));
          const Planete = {
            name: Math.floor(position.x + position.y + position.z),
            size: sizePlanet,
            position: position,
            color: randomValue.rgb,
            construct: construct,
            texture: getRandomInt(0, 29),
            hidden: 0,
            connect: [
              getRandomInt(0, nbPlanetes - 1),
              getRandomInt(0, nbPlanetes - 1)
            ],
            value: {
              fer: Math.floor((randomValue.red * sizePlanet) / 8),
              elec: Math.floor((randomValue.blue * sizePlanet) / 8),
              money: Math.floor((randomValue.green * sizePlanet) / 20)
            }
          };
          moyenIron += Math.floor((randomValue.red * sizePlanet) / 8);
          moyenElec += Math.floor((randomValue.blue * sizePlanet) / 8);
          moyenMoney += Math.floor((randomValue.green * sizePlanet) / 20);

          if (originPlanets.indexOf(index) >= 0) {
            console.log("ORIGIN", originPlanets, originPlanets.indexOf(index));
            Planete.construct = [
              {
                type: "atack",
                player: originPlanets.indexOf(index)
              },
              {
                type: "explo",
                player: originPlanets.indexOf(index)
              },
              {
                type: "commerce",
                player: originPlanets.indexOf(index)
              },
              {
                type: "megapole",
                player: null
              }
            ];
            Planete.hidden = 1;
          }

          Planetes.push(Planete);
        }

        // console.log(Planetes.length);
        // Planetes = NewGame(Planetes, size);
        return { galaxy: Planetes };
      }

      // function NewGame(Planetes, size) {
      //   const originPlanets = [];

      //   for (let index = 0; index < size; index++) {
      //     let indexPlanet = getRandomInt(0, Planetes.length - 1);

      //     if (originPlanets.indexOf(indexPlanet) > 0) {
      //       indexPlanet = getRandomInt(0, Planetes.length - 1);
      //     }
      //     originPlanets.push(indexPlanet);
      //   }
      //   console.log(Planetes[originPlanets[0]]);

      //   originPlanets.forEach(key => {
      //     Planetes[key].hidden = 1;
      //   });

      // getRandomInt(0, Planetes.length - 1);
      // console.log(Planetes[getRandomInt(0, Planetes.length - 1)]);
      //   return Planetes;
      // }

      function random_rgba() {
        const red = getRandomInt(1, 255);
        const green = getRandomInt(1, 255);
        const blue = getRandomInt(1, 255);

        const rgb = "rgb(" + red + "," + green + "," + blue + ")";

        return {
          red: red,
          green: green,
          blue: blue,
          rgb: rgb
        };
      }

      const Game = CreateGame();
      const Galaxy = Game.galaxy;

      // console.log("nb Planets", Galaxy.length);

      let renderer, scene, camera, controls, raycaster, mouse;
      const objects = [];
      const objectsClouds = [];
      const onRenderFcts = [];

      DrawGame(Galaxy);








      function DrawGame(Galaxy) {
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

        var loader = new THREE.TextureLoader();

        Galaxy.forEach((data, key) => {
          const randTexture = Math.floor(Math.random() * 14);

          console.log(data.hidden);
          if (data.hidden >= 0) {
            loader.load(`img/textures/planets/${data.texture}.jpg`, function(
              texture
            ) {
              var geometry = new THREE.SphereGeometry(data.size, 30, 30);
              var material = new THREE.MeshBasicMaterial({
                map: texture,
                wireframe: false
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

            loader.load(
              `img/textures/clouds/${getRandomInt(0, 3)}.png`,
              function(texture) {
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
              }
            );

            data.connect.forEach(idPlanet => {
              let randomConnect = Galaxy[idPlanet];
              if (randomConnect.hidden >= 0) {
                var material = new THREE.LineBasicMaterial({ color: 0xffffff });
                var connectLine = new THREE.Geometry();
                connectLine.vertices.push(
                  new THREE.Vector3(
                    randomConnect.position.x,
                    randomConnect.position.y,
                    randomConnect.position.z
                  )
                );
                connectLine.vertices.push(
                  new THREE.Vector3(
                    data.position.x,
                    data.position.y,
                    data.position.z
                  )
                );
                var line = new THREE.Line(connectLine, material);
                scene.add(line);
              }
            });
          }
        });
      }

      window.addEventListener(
        "resize",
        function() {
          renderer.setSize(window.innerWidth, window.innerHeight);
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
        },
        false
      );

      function onDocumentMouseDown(event) {
        var rect = renderer.domElement.getBoundingClientRect();
        mouse.x =
          ((event.clientX - rect.left) / (rect.width - rect.left)) * 2 - 1;
        mouse.y =
          -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        intersects = raycaster.intersectObjects(objects);
        if (intersects.length > 0) {
          console.log(intersects[0].object.data);

          if (
            controls.center.x !== intersects[0].object.position.x ||
            controls.center.y !== intersects[0].object.position.y ||
            controls.center.z !== intersects[0].object.position.z
          ) {
            camera.position.set(0, 0, 0);
            controls.maxDistance = 60;
            setTimeout(() => {
              controls.maxDistance = 3000;
            }, 500);
          }
          controls.center.set(
            intersects[0].object.position.x,
            intersects[0].object.position.y,
            intersects[0].object.position.z
          );

          // controls.maxDistance = 1000;

          controls.update();
        }
      }

      // render the scene
      onRenderFcts.push(function() {
        renderer.render(scene, camera);
      });

      // run the rendering loop
      var lastTimeMsec = null;
      requestAnimationFrame(function animate(nowMsec) {
        objects.forEach(sphere => {
          rotateSphere(sphere, sphere.data.size / 100000);
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

      function ResetCam() {
        controls.center.set(0, 0, 0);
        controls.minDistance = 60;
        controls.maxDistance = Infinity;
        controls.update();
      }

      // document.addEventListener("mousemove", onDocumentMouseDown, false);
      document.addEventListener("mousedown", onDocumentMouseDown, false);