// Globals
const POINTER = "POINTER";
const SELECT_UNITS = "SELECT_UNITS";

const state = {
  selected: [],
  selectMode: POINTER,
  units: [],
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

      for (let i = 1; i < scene.meshes.length; i++) {
        if (scene.meshes[i].checkCollisions && scene.meshes[i].isVisible === false) {
          scene.meshes[i].setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 1, 
                                          friction: 1, restitution: 0.1 });
          meshesColliderList.push(scene.meshes[i]);
        }
      }
      
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
    box.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 1, restitution: 0.1, friction: 1.5 });
    box.applyGravity = true; 
    box.ellipsoid = new BABYLON.Vector3(size, size, size);
    
    box.position.y = getRandomInt(1, 100);
    box.position.z = getRandomInt(1, 100);

    const col = new BABYLON.Vector3(box.position.x - 10, box.position.y - 10, box.position.z - 10);
    box.moveWithCollisions(col);
    
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
    box.applyGravity = true;
    box.ellipsoid = new BABYLON.Vector3(6, 6, 6);
    box.position.y = 3;
    // box.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 0, move: false, restitution: 0.1, friction: 1.5 });

    meshesColliderList.push(box);
  }

  let currentAnimation = null;

  scene.onPointerDown = (evt, pickResult) => {

    const unit = pickResult.pickedMesh;
    const position = pickResult.pickedPoint;

    selectUnit(unit);

    if (pickResult.hit) {

      const pickedPosition = position.clone();
      pickedPosition.y = 1;

      if (currentAnimation) {
        currentAnimation.stop();
      }

      // For each selected unit
      state.selected.map(item => {
        moveUnit(position, item);
      });     
    }     
  }

  // Animate unit easing
  const easing = new BABYLON.ExponentialEase();
	easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

  const moveUnit = (position, item) => {
    currentAnimation = BABYLON.Animation.CreateAndStartAnimation(
      "anim",
      item,
      "position",
      60, 
      120,
      item.position,
      position,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      easing
    )
  }

  // run the render loop
  engine.runRenderLoop(() => scene.render());

  // the canvas/window resize event handler
  window.addEventListener('resize', () => engine.resize());

  const addUnitButton = document.getElementById('build-unit');
  addUnitButton.addEventListener('click', e => {
    console.log(e);
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
