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

  // Check collision
  box.checkCollisions = true;

  // move the sphere upward 1/2 of its height
  box.position.y = 0.5;
  box.position.x = 0;

  box.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor);
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
