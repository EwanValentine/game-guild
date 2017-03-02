/**
 * Some game
 *
 * This is some generic RTS game at the moment.
 *
 * @author    Ewan Valentine <ewan.valentine89@gmail.com>
 * @copyright Ewan Valentine 2016
 */

// Select canvas
const canvas = document.getElementById('renderCanvas');

// Game engine instance
const engine = new BABYLON.Engine(canvas, true);

// When click event is raised
let clientX = 0
let clientY = 0

const meshesColliderList = [],
  buildings = [],
  oreMines = [],
  userOre = 0,
  standardOreValue = 100,
  rareOreValue = 500

let buildTime = 0;

// State
const state = {
	selected: [],
  selectedBuilding: null,
  targetPoint: BABYLON.Vector3.Zero(),
  toBeMoved: [],
}

// Total power ouput - minus total power consumption
const power = (buildings.length > 0) 
	? (buildings.filter(building => building.type === "power")
             .map(plant => plant.power)
             .reduce((prev, plant) => prev + plant))
  - (buildings.filter(building => building.type !== "power")
      .map(building => building.powerConsumption)
      .reduce((prev, building) => prev + building)) : 0

// Buildings

// Barracks
const barracks = {
  size: 3,
}

// Power Plant
const powerPlant = {
  size: 5,
  power: 10,
}

// Large Power Plant
const largePowerPlant = {
  size: 10,
  power: 40,
}

// warFactory
const warFactory = {
	size: 16,
	powerConsumption: 10,
}

// radar
const radar = {
	size: 4,
	powerConsumption: 50,
}

// constructionYard
const constructionYard = {
	size: 10,
	powerConsumption: 0,
}

// Ore Refinery
const refinery = {
  size: 12, 
  powerConsumption: 10,
}

// Units
const lightTank = {
  cost: 40,
	size: 4,
	attack: 50,
	shield: 20,
}

const heavyTank = {
  cost: 80,
  size: 8,
  attack: 80,
  shield: 60,
}

const jeep = {
  cost: 20,
	size: 2,
	attack: 10,
	shield: 2,
}

const oreTruck = {
  cost: 100,
  size: 4,
  attack: 0,
  shield: 50,
}

const grenadier = {
	cost: 10,
  size: 1,
	attack: 3,
	shield: 0.2,
}

const infantry = {
  cost: 2,
	size: 1,
	attack: 0.5,
	shield: 0.1,
}

const generateBoxMaterial = scene => {
  const boxMat = new BABYLON.StandardMaterial("groundMat", scene);
  boxMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
  return boxMat   
}

/**
 * createUnit
 *
 * @param {String}   name
 * @param {Object}   type
 * @param {Scene}    scene
 * @param {Material} material
 */
const createUnit = (name, type, scene, boxMat) => { 

  const box = BABYLON.Mesh.CreateBox(name, type.size, scene)
  box.material = boxMat
  box.type = "unit"
  box.position.x = getRandomInt(1, 100)
  box.position.z = getRandomInt(1, 100)

  // Place the unit inside the building
  // box.position.x = state.selectedBuilding.position.x; // + getRandomInt(8, 20);
  // box.position.z = state.selectedBuilding.position.z; // + getRandomInt(8, 20);
  // box.position.y = type.size / 2;

  // Create position just outside the building
  const moveToPos = new BABYLON.Vector3(
    box.position.x + getRandomInt(8, 20),
    box.position.y,
    box.position.z + getRandomInt(8, 20)
  );

  box.toPos = moveToPos;

  // state.toBeMoved.unshift(box);

  box.selected = false;
  box.checkCollisions = true;
}

const generateBuildingMaterial = scene => {

  // Concrete texture
  const buildingMaterial = new BABYLON.StandardMaterial("textureBuilding", scene);
  buildingMaterial.diffuseTexture = new BABYLON.Texture("./src/textures/concrete.jpg", scene);
  buildingMaterial.diffuseTexture.uScale = 1;
  buildingMaterial.diffuseTexture.vScale = 1;
  buildingMaterial.backFaceCulling = false;
  return buildingMaterial
}

/**
 * buildBuilding
 *
 * @param {String} name
 * @param {Object} type
 * @param {Vector} position
 */
const buildBuilding = (name, schema, position, type, scene) => {

  const buildingMaterial = generateBuildingMaterial(scene)
  const building = BABYLON.Mesh.CreateBox(name, schema.size, scene)

  building.position.y = schema.size / 2
  building.position.z = position.z
  building.position.x = position.x

  building.type = "building"
  building.buildingType = type
  building.checkCollisions = true
  building.selected = false
  building.material = buildingMaterial
  building.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 0, move: false })
}

const initScene = () => {

  // This creates a basic Babylon Scene object (non-mesh)
  const scene = new BABYLON.Scene(engine)
  scene.enablePhysics()

  // This creates and positions a free camera (non-mesh)
  const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 120, 100), scene)

  // This targets the camera to scene origin
  camera.setTarget(BABYLON.Vector3.Zero())

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true)

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7

  // Sky
  const skybox = BABYLON.Mesh.CreateBox("skyBox", 500.0, scene)
  const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene)
  skyboxMaterial.backFaceCulling = false
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./src/textures/nebula", scene)
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0)
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0)
  skyboxMaterial.disableLighting = true
  skybox.material = skyboxMaterial

  return scene;
}

const generateSelectedMaterial = scene => {
  const selectedMaterial = new BABYLON.StandardMaterial("groundMat", scene)
  selectedMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.7, 0.4)
  return selectedMaterial
}

/**
 * getRandomInt
 *
 * @param {Integer} min
 * @param {Integer} max
 *
 * @return {Integer}
 */
const getRandomInt = (min, max) => { 
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * selectUnit
 *
 * @param {Mesh} mesh
 */
const selectUnit = (mesh, scene) => { 

  const boxMat           = generateBoxMaterial(scene)
  const buildingMaterial = generateBuildingMaterial(scene) 
  const selectedMaterial = generateSelectedMaterial(scene)
  
  // If mesh type is unit, and mesh is not already selected
  if (mesh.type === "unit" && mesh.selected === false) {
    mesh.selected = true;
    mesh.material = selectedMaterial;
    state.selected.unshift(mesh);
  } else if (mesh.type === "unit" && mesh.selected === true) {
    mesh.selected = false;
    mesh.material = boxMat;
    state.selected = state.selected.filter(unit => unit.id !== mesh.id);
  } else if (mesh.type === "building" && mesh.selected === false) {
    document.getElementById("selected-building").text = mesh.buildingType;
    
    // If a previous building is selected
    if (state.selectedBuilding) {
      state.selectedBuilding.selected = false;
      state.selectedBuilding.material = buildingMaterial
    }
    
    if (mesh.buildingType === "warFactory") {
      document.getElementsByClassName("unit-controls")[0]
              .style.display = 'block';
    }

    mesh.selected = true;
    mesh.material = selectedMaterial;
    state.selectedBuilding = mesh;
  } else if (mesh.type === "building" && mesh.selected === true) {

    document.getElementsByClassName("unit-controls")[0]
            .style.display = 'none';

    mesh.selected = false;
    mesh.material = buildingMaterial;
    state.selectedBuilding = false;
  }

  return false;
}

// On DOM load
window.addEventListener('DOMContentLoaded', () => {
  const createScene = () => {

	  const scene = initScene()

    registerHandlers(scene)

    // Grass material
    const materialPlane = new BABYLON.StandardMaterial("texturePlane", scene)
    materialPlane.diffuseTexture = new BABYLON.Texture("./src/textures/sand.jpg", scene)
    materialPlane.diffuseTexture.uScale = 5.0 //Repeat 5 times on the Vertical Axes
    materialPlane.diffuseTexture.vScale = 5.0 //Repeat 5 times on the Horizontal Axes
    materialPlane.backFaceCulling = false //Always show the front and the back of an element

    const oreMaterial = new BABYLON.StandardMaterial("orePlane", scene)
    oreMaterial.diffuseTexture = new BABYLON.Texture("./src/textures/ore.jpg", scene)
    oreMaterial.diffuseTexture.uScale = 1 //Repeat 5 times on the Vertical Axes
    oreMaterial.diffuseTexture.vScale = 1 //Repeat 5 times on the Horizontal Axes
    oreMaterial.backFaceCulling = false //Always show the front and the back of an element

    const generateOreField = () => {
      for (i = 0; i < 50; i++) {
        generateOre();
      }	
    }

    const generateOre = () => {
      const ore = BABYLON.Mesh.CreateBox("ore", 0.5, scene);

      ore.type = "ore";

      oreMines.push(ore);
      
      ore.position.y = 0;
      ore.position.z = getRandomInt(10, 30);
      ore.position.x = getRandomInt(10, 30);

      ore.material = oreMaterial;
      ore.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 0, move: false, height: 0.1 });
    }

    // generateOreField();

    // create a built-in "ground" shape; its constructor takes the same 5 params as the sphere's one
    const plane = BABYLON.Mesh.CreateGround("ground", 500, 500, 1000, scene)
    plane.type = "ground"
    plane.material = materialPlane
    plane.setPhysicsState({ 
      impostor: BABYLON.PhysicsEngine.BoxImpostor, 
      mass: 0, 
      friction: 1, 
      restitution: 0.7, 
      move: false,
    })

    const gridSize = 3
    const marker = BABYLON.MeshBuilder.CreateSphere('marker', { size: gridSize, height: 1 }, scene)

    // Foreach mesh, add physics
    scene.meshes.map(mesh => {
      if (mesh.checkCollisions && mesh.isVisible === false) {
        mesh.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 1, 
                                          friction: 1, restitution: 0.1 });
        meshesColliderList.push(mesh);
      }
    })

    // Before scene is rendered
    scene.registerBeforeRender(() => {

      // Other none selected units to be moved
      // What's the difference between this and the block below?
      /*
      if (state.toBeMoved.length > 0) {

        // For each unit
        state.toBeMoved.map(unit => {
          
          if (!facePoint(unit, unit.toPos)) {

            // Move unit to target point
            moveUnit(unit, unit.toPos)
          }
        })
      }
      */

      // If target point is set
      if (state.targetPoint) {

        // Foreach selected unit
        state.selected.map(box => {

          if (!facePoint(box, state.targetPoint)) {

            // Move unit to target point
            moveUnit(box, state.targetPoint)
          }
        })
      }
    })

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
      const direction = pointToRotateTo.subtract(rotatingObject.position)
      
      let v1 = new BABYLON.Vector3(0,0,1)
      let v2 = direction
      
      // caluculate the angel for the new direction
      let angle = Math.acos(BABYLON.Vector3.Dot(v1, v2.normalize()))

      // decide it the angle has to be positive or negative
      if (direction.x < 0) angle = angle * -1
      
      // calculate both angles in degrees
      const angleDegrees = Math.round(angle * 180/Math.PI)
      const playerRotationDegress = Math.round(rotatingObject.rotation.y * 180/Math.PI)
      
      // calculate the delta
      let deltaDegrees = playerRotationDegress - angleDegrees
      
      // check what direction to turn to take the shotest turn
      if (deltaDegrees > 180) {
        deltaDegrees = deltaDegrees - 360
      } else if(deltaDegrees < -180) {
        deltaDegrees = deltaDegrees + 360
      }
      
      // rotate until the difference between the object angle and the target angle is no more than 3 degrees
      if (Math.abs(deltaDegrees) > 3) {

        const rotationSpeed = Math.round(Math.abs(deltaDegrees) / 8)
        
        if (deltaDegrees > 0) {
          rotatingObject.rotation.y -= rotationSpeed * Math.PI / 180
          if (rotatingObject.rotation.y < -Math.PI) {
            rotatingObject.rotation.y = Math.PI
          }
        }

        if (deltaDegrees < 0) {
          rotatingObject.rotation.y += rotationSpeed * Math.PI / 180
          if (rotatingObject.rotation.y > Math.PI) {
            rotatingObject.rotation.y = -Math.PI
          }
        }
        
        // return true since the rotation is in progress
        return true
      }
      
      // return false since no rotation needed to be done
      return false
    }

      /**
       * moveUnit
       *
       * @param {Mesh}   objectToMove
       * @param {Vector} pointToMoveTo
       */
      const moveUnit = (objectToMove, pointToMoveTo) => {

        // Should be on the floor
        pointToMoveTo.y = 3

				// Create move vector
        let moveVector = pointToMoveTo.subtract(objectToMove.position)
        
				// Set marker point to picked position
        marker.position.x = Math.round(pointToMoveTo.x / gridSize) * gridSize
        marker.position.y = Math.round(pointToMoveTo.y / gridSize) * gridSize
        marker.position.z = Math.round(pointToMoveTo.z / gridSize) * gridSize

				// If distance is greater than 0.2
        if (moveVector.length() > 0.2) {
          moveVector = moveVector.normalize()
          moveVector = moveVector.scale(0.2)
          objectToMove.moveWithCollisions(moveVector)
        }       
			}

      return scene
  }
  
  const scene = createScene()

  // Start game
  engine.runRenderLoop(() => scene.render())

  // Resize automatically
  window.addEventListener('resize', () => engine.resize())
});
