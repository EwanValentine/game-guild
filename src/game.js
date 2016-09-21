const meshesColliderList = [];

const buildings = [];

// State
const state = {
	selected: [],
  targetPoint: BABYLON.Vector3.Zero(),
}

// Total power ouput
const power = (buildings.length > 0) 
	? buildings.filter(building => building.type === "power")
             .map(plant => plant.power)
             .reduce((prev, plant) => prev + plant) : 0;

// Buildings
const barracks = {
  size: BABYLON.Vector3(3, 3, 3),
}

// Power Plant
const powerPlant = {
  size: BABYLON.Vector3(5, 5, 5),
  power: 10,
}

// Large Power Plant
const largePowerPlant = {
  size: BABYLON.Vector3(10, 10, 10),
  power: 40,
}

window.addEventListener('DOMContentLoaded', () => {

  const canvas = document.getElementById('renderCanvas');

  const engine = new BABYLON.Engine(canvas, true);

  const createScene = () => {

      // This creates a basic Babylon Scene object (non-mesh)
      const scene = new BABYLON.Scene(engine);
      scene.enablePhysics();

      // This creates and positions a free camera (non-mesh)
      const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 120, 100), scene);

      // This targets the camera to scene origin
      camera.setTarget(BABYLON.Vector3.Zero());

      // This attaches the camera to the canvas
      camera.attachControl(canvas, true);

      // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
      const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

      // Default intensity is 1. Let's dim the light a small amount
      light.intensity = 0.7;

      // Sky
      const skybox = BABYLON.Mesh.CreateBox("skyBox", 500.0, scene);
      const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./src/textures/nebula", scene);
      skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
      skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.disableLighting = true;
      skybox.material = skyboxMaterial;

      const boxMat = new BABYLON.StandardMaterial("groundMat", scene);
      boxMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
      
      const getRandomInt = (min, max) => { 
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
      }

      // Grass material
      const materialPlane = new BABYLON.StandardMaterial("texturePlane", scene);
      materialPlane.diffuseTexture = new BABYLON.Texture("./src/textures/sand.jpg", scene);
      materialPlane.diffuseTexture.uScale = 5.0; //Repeat 5 times on the Vertical Axes
      materialPlane.diffuseTexture.vScale = 5.0; //Repeat 5 times on the Horizontal Axes
      materialPlane.backFaceCulling = false; //Always show the front and the back of an element

      // create a built-in "ground" shape; its constructor takes the same 5 params as the sphere's one
      const plane = BABYLON.Mesh.CreateGround("ground", 500, 500, 1000, scene);
      plane.type = "ground";
      plane.material = materialPlane;
      plane.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, mass: 0, friction: 1, restitution: 0.7, move: false });

      let targetPoint = state.targetPoint;

      const gridSize = 3;
      const marker = BABYLON.MeshBuilder.CreateSphere('marker', { size: gridSize, height: 1 }, scene);

			// Foreach mesh, add physics
      for (var i = 1; i < scene.meshes.length; i++) {
        if (scene.meshes[i].checkCollisions && scene.meshes[i].isVisible === false) {
          scene.meshes[i].setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 1, 
                                            friction: 1, restitution: 0.1 });
          meshesColliderList.push(scene.meshes[i]);
        }
      }
      
      /**
       * buildBuilding
       *
       * @param {String} name
			 * @param {Object} type
			 * @param {Vector} position
       */
      const buildBuilding = (name, type, position) => {

        const building = BABYLON.Mesh.CreateBox(name, position.y, scene);

        building.position.y = position.y / 2;
        building.position.z = position.z;
        building.position.x = position.x;

        building.type = "building";
        building.checkCollisions = true;
        building.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 0, move: false });
      }
      
      /**
       * selectUnit
       *
       * @param {Mesh} mesh
       */
      const selectUnit = mesh => { 
        if (mesh.type === "unit") {
          state.selected.unshift(mesh);
        }
      }
    
      // When click event is raised
      let clientX = 0;
      let clientY = 0;

      window.addEventListener("mousedown", function (e) {
        if (e.target.id === 'renderCanvas') {
          clientX = e.clientX;
          clientY = e.clientY;
        }
      });
      
      window.addEventListener("mouseup", function (e) {

        if (e.target.id == 'renderCanvas'
          && Math.abs(clientX - e.clientX) < 10
          && Math.abs(clientY - e.clientY) < 10) {
          
          // We try to pick an object
          const pickResult = scene.pick(scene.pointerX, scene.pointerY);

          if (pickResult.pickedPoint) {
            targetPoint = pickResult.pickedPoint;
            selectUnit(pickResult.pickedMesh);
          }	
        }
      });

      // Click handlers
      document.getElementById("buildPowerPlant").onclick = () => {
        console.log('Building power plant...');
        setTimeout(() => {
          buildBuilding("power-plant", powerStation, state.targetPoint);
        }, 8000 / power);
      }

      document.getElementById("buildLargePowerPlant").onclick = () => {
        console.log("Building large power plant...");
        setTimeout(() => {
          buildBuilding("large-power-plant", largePowerPlant, state.targetPoint);
        }, 12000 / power);
      }

      document.getElementById("buildBarracks").onclick = () => {
        console.log('Building barracks...');
        setTimeout(() => {
          buildBuilding("barracks", barracks, state.targetPoint); 
        }, 5000 / power);
      }
      
      scene.registerBeforeRender(() => {

        // If target point is set
        if (targetPoint) {

          // Foreach selected unit
          state.selected.map(box => {

            if (!facePoint(box, targetPoint)) {

              // Move unit to target point
              moveUnit(box, targetPoint);
            }
          });
        }
      });

      /**
       * createUnit
       *
       * @param {String}   name
       * @param {Scene}    scene
       * @param {Material} material
       */
      const createUnit = (name, scene, boxMat) => { 

        const box = BABYLON.Mesh.CreateBox(name, 2, scene);
        box.material = boxMat;
        box.type = "unit";	
        box.position.x = getRandomInt(1, 100);
        box.position.z = getRandomInt(1, 100);
        box.position.y = 1;
        box.checkCollisions = true;
      }
      
      createUnit("test", scene, boxMat);
      createUnit("test2", scene, boxMat);
    
      /**
       * facePoint
       *
       * @param {Mesh}
       * @param {Vector}
       *
       * @return {bool}
       */
      const facePoint = (rotatingObject, pointToRotateTo) => {
        
        // a directional vector from one object to the other one
        // Error here
        const direction = pointToRotateTo.subtract(rotatingObject.position);
        
        let v1 = new BABYLON.Vector3(0,0,1);
        let v2 = direction;
        
        // caluculate the angel for the new direction
        let angle = Math.acos(BABYLON.Vector3.Dot(v1, v2.normalize()));
        
        // decide it the angle has to be positive or negative
        if (direction.x < 0) angle = angle * -1;
        
        // calculate both angles in degrees
        const angleDegrees = Math.round(angle * 180/Math.PI);
        const playerRotationDegress = Math.round(rotatingObject.rotation.y * 180/Math.PI);
        
        // calculate the delta
        let deltaDegrees = playerRotationDegress - angleDegrees;
        
        // check what direction to turn to take the shotest turn
        if (deltaDegrees > 180) {
          deltaDegrees = deltaDegrees - 360;
        } else if(deltaDegrees < -180) {
          deltaDegrees = deltaDegrees + 360;
        }
        
        // rotate until the difference between the object angle and the target angle is no more than 3 degrees
        if (Math.abs(deltaDegrees) > 3) {

          const rotationSpeed = Math.round(Math.abs(deltaDegrees) / 8);
          
          if (deltaDegrees > 0) {

            rotatingObject.rotation.y -= rotationSpeed * Math.PI / 180;
            
            if (rotatingObject.rotation.y < -Math.PI) {
              rotatingObject.rotation.y = Math.PI;
            }
          }

          if (deltaDegrees < 0) {
            
            rotatingObject.rotation.y += rotationSpeed * Math.PI / 180;
            
            if (rotatingObject.rotation.y > Math.PI) {
              rotatingObject.rotation.y = -Math.PI;
            }
          }
          
          // return true since the rotation is in progress
          return true;
          
        } else {
        
          // return false since no rotation needed to be done
          return false;
        }
      }

      /**
       * moveUnit
       *
       * @param {Mesh}   objectToMove
       * @param {Vector} pointToMoveTo
       */
      const moveUnit = (objectToMove, pointToMoveTo) => {

        // Should be on the floor
        pointToMoveTo.y = 1;

        let moveVector = pointToMoveTo.subtract(objectToMove.position);
        
        marker.position.x = Math.round(pointToMoveTo.x / gridSize) * gridSize;
        marker.position.y = Math.round(pointToMoveTo.y / gridSize) * gridSize;
        marker.position.z = Math.round(pointToMoveTo.z / gridSize) * gridSize;

        if (moveVector.length() > 0.2) {

          moveVector = moveVector.normalize();
          moveVector = moveVector.scale(0.2);
          objectToMove.moveWithCollisions(moveVector);

        } else {
          targetPoint = null;
        } 
      }

      return scene;
  }
  
  const scene = createScene();

  // Start game
  engine.runRenderLoop(() => scene.render());

  // Resize automatically
  window.addEventListener('resize', () => engine.resize());
});
