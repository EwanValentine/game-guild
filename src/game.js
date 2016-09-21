// Globals
const POINTER = "POINTER";
const SELECT_UNITS = "SELECT_UNITS";

const state = {
  selected: [],
  selectMode: POINTER,
  factories: [],
  score: 0,
}

const speedCharacter = 8;
const gravity = 0.15;
let groundImpostor;
const meshesColliderList = [];

window.addEventListener('DOMContentLoaded', () => {
  
  // get the canvas DOM element
  const canvas = document.getElementById('renderCanvas');

  // load the 3D engine
  const engine = new BABYLON.Engine(canvas, true);

  // createScene function that creates and return the scene
  const createScene = () => {

      // create a basic BJS Scene object
      const scene = new BABYLON.Scene(engine);

      scene.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.2);

      // Enable physics engine
      scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.CannonJSPlugin());
      scene.collisionsEnabled = true;

      // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
      const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 100, 100), scene);
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.attachControl(canvas, true);

      // create a basic light, aiming 0,1,0 - meaning, to the sky
      const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);

      // Grass material
      const materialPlane = new BABYLON.StandardMaterial("texturePlane", scene);
      materialPlane.diffuseTexture = new BABYLON.Texture("./src/textures/sand.jpg", scene);
      materialPlane.diffuseTexture.uScale = 5.0; //Repeat 5 times on the Vertical Axes
      materialPlane.diffuseTexture.vScale = 5.0; //Repeat 5 times on the Horizontal Axes
      materialPlane.backFaceCulling = false; //Always show the front and the back of an element

      // Skybox
      const skybox = BABYLON.Mesh.CreateBox("skyBox", 500.0, scene);
      const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./src/textures/nebula", scene);
      skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
      skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.disableLighting = true;
      skybox.material = skyboxMaterial;

      // create a built-in "ground" shape; its constructor takes the same 5 params as the sphere's one
      const plane = BABYLON.Mesh.CreateGround("ground", 500, 500, 1000, scene);
      plane.type = "ground";
      plane.material = materialPlane;
      plane.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, mass: 0, friction: 1, restitution: 0.7, move: false });

      let targetPoint = null;
      const gridSize = 1;
      const marker = BABYLON.MeshBuilder.CreateBox("marker", { size: gridSize, height: 0.1 }, scene);

      for (var i = 1; i < scene.meshes.length; i++) {
          if (scene.meshes[i].checkCollisions && scene.meshes[i].isVisible === false) {
            scene.meshes[i].setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 1, 
                                            friction: 1, restitution: 0.1 });
            meshesColliderList.push(scene.meshes[i]);
          }
      }

      let clientX = 0;
      let clientY = 0;

      window.addEventListener("mousedown", e => {
        
        if (e.target.id == 'renderCanvas') {
          clientX = e.clientX;
          clientY = e.clientY;
        }
      });

      window.addEventListener("mouseup", e => {

        if (e.target.id == 'renderCanvas'
          && Math.abs(clientX - e.clientX) < 10
          && Math.abs(clientY - e.clientY) < 10) {
          
          // We try to pick an object
          const pickResult = scene.pick(scene.pointerX, scene.pointerY);

          if (pickResult.pickedPoint) {

            targetPoint = pickResult.pickedPoint;

            if (pickResult.hit) {

              const unit = pickResult.pickedMesh;

              selectUnit(unit);

              console.log(state.selected);
            }
          }
        } 
      });

      scene.registerBeforeRender(() => {

        if (targetPoint) {
          
          // Foreach selected unit
          state.selected.map(unit => {

            // If
            if (!facePoint(unit, targetPoint)) {

              // Move unit
              moveUnit(unit, targetPoint);
            }
          });
        }
      });

      const facePoint = (rotatingObject, pointToRotateTo) => {
      
        // a directional vector from one object to the other one
        const direction = pointToRotateTo.subtract(rotatingObject.position);
        
        const v1 = new BABYLON.Vector3(0,0,1);
        const v2 = direction;
        
        // caluculate the angel for the new direction
        let angle = Math.acos(BABYLON.Vector3.Dot(v1, v2.normalize()));
        
        //console.log(angle);
        
        // decide it the angle has to be positive or negative
        if (direction.x < 0) angle = angle * -1;
        
        // calculate both angles in degrees
        let angleDegrees = Math.round(angle * 180/Math.PI);
        let playerRotationDegress = Math.round(rotatingObject.rotation.y * 180/Math.PI);
        
        // calculate the delta
        let deltaDegrees = playerRotationDegress - angleDegrees;
        
        // check what direction to turn to take the shotest turn
        if (deltaDegrees > 180) {
          deltaDegrees = deltaDegrees - 360;
        } else if(deltaDegrees < -180){
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

      const moveUnit = (objectToMove, pointToMoveTo) => {

        pointToMoveTo.y = 1;

        let moveVector = pointToMoveTo.subtract(objectToMove.position);

        marker.position.x = Math.round(objectToMove.position.x/gridSize)*gridSize;
        marker.position.y = Math.round(objectToMove.position.y/gridSize)*gridSize;
        marker.position.z = Math.round(objectToMove.position.z/gridSize)*gridSize;

        if (moveVector.length() > 0.2) {
          moveVector = moveVector.normalize();
          moveVector = moveVector.scale(0.2);
          objectToMove.moveWithCollisions(moveVector);
        } else {
          targetPoint = null;
        }
      };
        
      // return the created scene
      return scene;
  }

  // call the createScene function
  const scene = createScene();

  // Get unit
  const unit = (name) => scene.getMeshByName(name);

  // Select a unit
  const selectUnit = (unit) => {
    if (unit.type === "unit") {
      if (state.score > state.selected.length * 2) {
        state.selected.unshift(unit);
        unit.material.diffuseColor = new BABYLON.Color4(0, 0, 0.9, 0.1);
      }
    }
  }

  const increaseScore = (amount) => {
    state.score = state.score + amount;
    document.getElementById('score').textContent = state.score;
  }

  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // Create unit
  const createUnit = (scene, name, size = 2, y = 1) => {

    const box = BABYLON.Mesh.CreateBox(name, size, scene);
    const boxMat = new BABYLON.StandardMaterial(`ground-${name}`, scene);
    boxMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    box.material = boxMat;
    box.type = "unit";
    box.checkCollisions = true;
    box.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 1, 
                                          friction: 1, restitution: 0.1 });
    
    box.position.y = getRandomInt(1, 100);
    box.position.z = getRandomInt(1, 100);

    const col = new BABYLON.Vector3(box.position.x - 10, box.position.y - 10, box.position.z - 10);
    meshesColliderList.push(box);
  }

  // Start
  for (let i = 1; i < 100; i++) {
    createUnit(scene, "start");
  }

  const buildBuilding = (scene, name) => {

    const box = BABYLON.Mesh.CreateBox(name, 6, scene);
    const boxMat = new BABYLON.StandardMaterial(`ground-${name}`, scene);

    boxMat.diffuseColor = new BABYLON.Color3(1, 0.1, 0.1); 
    box.material = boxMat;
    box.type = "building";
    box.checkCollisions = true;
    box.position.y = 3;
    box.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 0, move: false });

    meshesColliderList.push(box);
  }

  let currentAnimation = null;

  // On pointer down
  /**
  scene.onPointerDown = (evt, pickResult) => {

    console.log('test 2')

    const unit = pickResult.pickedMesh;
    const position = pickResult.pickedPoint;

    if (pickResult.hit) {
      selectUnit(unit);
    }     
  }
  */

  // Animate unit easing
  const easing = new BABYLON.ExponentialEase();
	easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

  // run the render loop
  engine.runRenderLoop(() => scene.render());

  // the canvas/window resize event handler
  window.addEventListener('resize', () => engine.resize());

  const addUnitButton = document.getElementById('build-unit');

  addUnitButton.addEventListener('click', e => {
    setTimeout(() => createUnit(scene, "testing123"), 1000);
  });

  const addBuildingButton = document.getElementById('build-building');
  addBuildingButton.addEventListener('click', e => {
    setTimeout(() => {
      buildBuilding(scene, "building123");
      increaseScore(20);
    }, 1000);
  });
});
