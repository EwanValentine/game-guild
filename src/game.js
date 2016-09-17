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

      // Enable physics engine
      scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.CannonJSPlugin());

      // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
      const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 100, 100), scene);
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.attachControl(canvas, true);

      // create a basic light, aiming 0,1,0 - meaning, to the sky
      const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);

      // Grass material
      const materialPlane = new BABYLON.StandardMaterial("texturePlane", scene);
      materialPlane.diffuseTexture = new BABYLON.Texture("./src/textures/grass.jpg", scene);
      materialPlane.diffuseTexture.uScale = 5.0; //Repeat 5 times on the Vertical Axes
      materialPlane.diffuseTexture.vScale = 5.0; //Repeat 5 times on the Horizontal Axes
      materialPlane.backFaceCulling = false; //Always show the front and the back of an element

      // create a built-in "ground" shape; its constructor takes the same 5 params as the sphere's one
      const plane = BABYLON.Mesh.CreateGround('ground1', 500, 500, 2, scene);
      plane.material = materialPlane;
      plane.type = "ground";

      groundImpostor = new BABYLON.PhysicsImpostor(plane, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0, move: false }, scene);
      plane.physicsImpostor = groundImpostor;

      for (let i = 1; i < scene.meshes.length; i++) {
        if (scene.meshes[i].checkCollisions && scene.meshes[i].isVisible === false) {
          scene.meshes[i].setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 1, 
                                          friction: 0.5, restitution: 0.1 });
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
      state.selected.unshift(unit);
      unit.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
    }
  }

  // Create unit
  const createUnit = (scene, name) => {
    
    const box = BABYLON.Mesh.CreateBox(name, 2, scene);
    const boxMat = new BABYLON.StandardMaterial(`ground-${name}`, scene);
    boxMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    box.material = boxMat;
    box.type = "unit";
    box.checkCollisions = true;
    box.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 1 });

    box.position.y = 1;
  }

  createUnit(scene, "test");
  createUnit(scene, "test2");

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

  console.log(scene.meshes);

  // run the render loop
  engine.runRenderLoop(() => scene.render());

  // the canvas/window resize event handler
  window.addEventListener('resize', () => engine.resize());

  const addUnitButton = document.getElementById('build-unit');
  addUnitButton.addEventListener('click', e => {
    console.log(e);
    createUnit(scene, "testing123");
  });
});
