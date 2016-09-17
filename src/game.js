window.addEventListener('DOMContentLoaded', () => {

  const state = {
    selected: [],
    units: [],
    factories: [],
  }
  
  // get the canvas DOM element
  const canvas = document.getElementById('renderCanvas');

  // load the 3D engine
  const engine = new BABYLON.Engine(canvas, true);

  // createScene function that creates and return the scene
  const createScene = () => {

      // create a basic BJS Scene object
      const scene = new BABYLON.Scene(engine);

      // Enable physics engine
      scene.enablePhysics(new BABYLON.Vector3(0,-10,0), new BABYLON.OimoJSPlugin());

      // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
      const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 10, -10), scene);

      // target the camera to scene origin
      camera.setTarget(BABYLON.Vector3.Zero());

      // attach the camera to the canvas
      camera.attachControl(canvas, false);

      // create a basic light, aiming 0,1,0 - meaning, to the sky
      const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);

      // create a built-in "sphere" shape; its constructor takes 5 params: name, width, depth, subdivisions, scene
      const box = BABYLON.Mesh.CreateBox('tank', 0.5, scene);
      const boxMat = new BABYLON.StandardMaterial("ground", scene);
      boxMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
      box.material = boxMat;
      box.type = "unit";

      // Check collision
      box.checkCollisions = true;

      // move the sphere upward 1/2 of its height
      box.position.y = 0.5;
      box.position.x = 0;

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

      // return the created scene
      return scene;
  }

  // call the createScene function
  const scene = createScene();

  const unit = (name) => scene.getMeshByName(name);

  const moveX = (unit, amount) => unit.position.x = amount;
  const moveY = (unit, amount) => unit.position.y = amount;
  const moveZ = (unit, amount) => unit.position.z = amount;

  const selectUnit = (unit) => {
    if (unit.type === "unit") {
      state.selected.unshift(unit);
    }
  }

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

