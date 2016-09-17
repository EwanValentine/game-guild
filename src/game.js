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

      // Enable physics engine
      scene.enablePhysics();

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

    const distanceJoint = new BABYLON.DistanceJoint({ maxDistance: 4 });

    const boxImpostor = new BABYLON.PhysicsImpostor(box, BABYLON.PhysicsImpostor.BoxImpostor, {
      mass: 1, restitution: 0, friction: 0.9, move: true,
    }, scene);

    box.physicsImpostor = boxImpostor;

    // Detect collision
    boxImpostor.registerOnPhysicsCollide(boxImpostor, (main, collided) => {
      console.log('SHIT');
      main.object.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
    });

    box.physicsImpostor.addJoint(box.physicsImpostor, distanceJoint);
    
    box.physicsImpostor.applyImpulse(new BABYLON.Vector3(1, 0, 0), box.getAbsolutePosition());

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

  // run the render loop
  engine.runRenderLoop(() => scene.render());

  // the canvas/window resize event handler
  window.addEventListener('resize', () => engine.resize());
});
