// Globals
const POINTER = "POINTER";
const SELECT_UNITS = "SELECT_UNITS";

const state = {
  selected: [],
  selectMode: SELECT_UNITS,
  units: [],
  factories: [],
}

window.addEventListener('DOMContentLoaded', () => {
  
  // get the canvas DOM element
  const canvas = document.getElementById('renderCanvas');

  // load the 3D engine
  const engine = new BABYLON.Engine(canvas, true);

  // createScene function that creates and return the scene
  const createScene = () => {

      const speedCharacter = 8;
      const gravity = 0.15;
      const meshesColliderList = [];

      // create a basic BJS Scene object
      const scene = new BABYLON.Scene(engine);

      scene.collisionsEnabled = true;

      // Enable physics engine
      scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.OimoJSPlugin());

      for (var i = 1; i < scene.meshes.length; i++) {
        if (scene.meshes[i].checkCollisions && scene.meshes[i].isVisible === false) {
          scene.meshes[i].setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 0, 
                                          friction: 0.5, restitution: 0.7 });
          meshesColliderList.push(scene.meshes[i]);
        }
      }

      // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
      const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 10, -10), scene);

      // target the camera to scene origin
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.attachControl(canvas, false);
      camera.applyGravity = true;
      camera.checkCollisions = true;

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

      // return the created scene
      return scene;
  }

  // call the createScene function
  const scene = createScene();

  // run the render loop
  engine.runRenderLoop(() => scene.render());

  // the canvas/window resize event handler
  window.addEventListener('resize', () => engine.resize());
});

