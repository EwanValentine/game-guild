/**
 * moveUnit
 *
 * @param {Mesh}   objectToMove
 * @param {Vector} pointToMoveTo
 */
const moveUnit = (objectToMove, pointToMoveTo) => {

  // Should be on the floor
  pointToMoveTo.y = 3

  if (!pointToMoveTo) return

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

  // Destination reached
  if (moveVector.length() < 0.199999) {

    console.log('Destination reached')

    // Set target to null
    objectToMove.targetPoint = null
  }
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

  return false
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

  const box = types[name].clone(name)

  box.isVisible = true
  box.material = boxMat
  box.type = "unit"

  // Create position just outside the building
  const moveToPos = new BABYLON.Vector3(
    box.position.x + getRandomInt(8, 20),
    box.position.y,
    box.position.z + getRandomInt(8, 20)
  );

  box.toPos = moveToPos;
  box.targetPoint = moveToPos
  box.selected = false
  box.checkCollisions = true

  units.push(box)

  state.toBeMoved.push(box)
}
