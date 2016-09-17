// Globals
const POINTER = "POINTER";
const SELECT_UNITS = "SELECT_UNITS";

const state = {
  selected: [],
  selectMode: POINTER,
  units: [],
  factories: [],
}

const speedCharacter = 8;
const gravity = 0.15;

window.addEventListener('DOMContentLoaded', () => {
  
  // get the canvas DOM element
  const canvas = document.getElementById('renderCanvas');

  // load the 3D engine
  const engine = new BABYLON.Engine(canvas, true);

  // createScene function that creates and return the scene
  const createScene = () => {

      const meshesColliderList = [];

      // create a basic BJS Scene object
      const scene = new BABYLON.Scene(engine);

      scene.collisionsEnabled = true;

      // Enable physics engine
      scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.OimoJSPlugin());

      // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
      const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 10, -10), scene);
      // camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.attachControl(canvas, false);
      // camera.applyGravity = true;
      camera.checkCollisions = true;    

      camera.onCollide = (mesh) => {
        if (mesh.type === "unit") {
          camera.position = new BABYLON.Vector3(0, -5, -20)
        }
      }

      // create a basic light, aiming 0,1,0 - meaning, to the sky
      const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);

      // Grass material
      const materialPlane = new BABYLON.StandardMaterial("texturePlane", scene);
      materialPlane.diffuseTexture = new BABYLON.Texture("./src/textures/grass.jpg", scene);
      materialPlane.diffuseTexture.uScale = 5.0; //Repeat 5 times on the Vertical Axes
      materialPlane.diffuseTexture.vScale = 5.0; //Repeat 5 times on the Horizontal Axes
      materialPlane.backFaceCulling = false; //Always show the front and the back of an element

      // create a built-in "ground" shape; its constructor takes the same 5 params as the sphere's one
      const plane = BABYLON.Mesh.CreateGround('ground1', 120, 120, 2, scene);
      plane.material = materialPlane;
      plane.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, move: false });
      plane.checkCollisions = true;

      plane.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, {mass:0, restitution:0.001});
    
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
      state.selected.unshift(unit);
    }
  }

  // Create unit
  const createUnit = (scene) => {
    const box = BABYLON.Mesh.CreateBox('tank', 0.5, scene);
    const boxMat = new BABYLON.StandardMaterial("ground", scene);
    boxMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    box.material = boxMat;
    box.type = "unit";
    box.ellipsoid = new BABYLON.Vector3(0.5, 1.0, 0.5);
    box.ellipsoidOffset = new BABYLON.Vector3(0, 1.0, 0);
    box.checkCollisions = true;
    
    box.position.y = 0.5;
    box.position.x = 0;

    box.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { 
      mass: 0, restitution: 0.5
    });
  }

  createUnit(scene);
  createUnit(scene);

  scene.onPointerDown = (evt, pickResult) => {

    const impact = pickResult.pickedMesh;
    const position = pickResult.pickedPoint;

    selectUnit(impact);

    if (pickResult.hit) {

      // For each selected unit
      state.selected.map(item => {

        // Animate to picked location
        BABYLON.Animation.CreateAndStartAnimation(
          "anim", 
          item, 
          "position",
          30, 
          30, 

          // Old position
          item.position, 
          
          // New position
          new BABYLON.Vector3(position.x, 1, position.z), 
          0
        );   
      });     
    }     
  }

  // run the render loop
  engine.runRenderLoop(() => scene.render());

  // the canvas/window resize event handler
  window.addEventListener('resize', () => engine.resize());
});
