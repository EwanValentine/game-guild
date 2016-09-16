window.addEventListener('DOMContentLoaded', () => {

  const state = {
    selected: null,
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
      const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5,-10), scene);

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
      box.position.y = 1;
      box.position.x = 0;

      // Grass material
      const materialPlane = new BABYLON.StandardMaterial("texturePlane", scene);
      materialPlane.diffuseTexture = new BABYLON.Texture("./src/textures/grass.jpg", scene);
      materialPlane.diffuseTexture.uScale = 5.0;//Repeat 5 times on the Vertical Axes
      materialPlane.diffuseTexture.vScale = 5.0;//Repeat 5 times on the Horizontal Axes
      materialPlane.backFaceCulling = false;//Always show the front and the back of an element

      // create a built-in "ground" shape; its constructor takes the same 5 params as the sphere's one
      const plane = BABYLON.Mesh.CreatePlane('ground1', 120, scene);
      plane.position.y = 0;
      plane.rotation.x = Math.PI / 2;
      plane.material = materialPlane;

      plane.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, move:false});

      // return the created scene
      return scene;
  }

  // call the createScene function
  const scene = createScene();

  // Click event listener
  window.addEventListener("click", e => {
    const result = scene.pick(e.clientX, e.clientY)

    console.log(result)

    if (result.pickedMesh.type === "unit") {
      
      // Set this unit to selected
      selectUnit(result.pickedMesh);
    }

    moveTo(state.selected, scene.pointerX, scene.pointerY)
  });

  // run the render loop
  engine.runRenderLoop(() => scene.render());

  // the canvas/window resize event handler
  window.addEventListener('resize', () => engine.resize());

  const unit = (name) => scene.getMeshByName(name);

  const moveTo = (unit, x, y) => {
    unit.position.x = x;
    unit.position.y = y;
  }

  const moveX = (unit, amount) => unit.position.x = amount;
  const moveY = (unit, amount) => unit.position.y = amount;
  const moveZ = (unit, amount) => unit.position.z = amount;

  const selectUnit = (unit) => {
    state.selected = unit;
  };

  const createTank = () => {
    const tank = BABYLON.Mesh.CreateBox('tank', 1.0, scene);
    state.units.push(tank);
  };

  selectUnit(unit('tank'));

  console.log(state);
});

