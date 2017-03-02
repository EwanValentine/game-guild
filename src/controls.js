const registerHandlers = scene => {

  const boxMat = generateBoxMaterial(scene)

  // On mousedown
  window.addEventListener("mousedown", e => {
    if (e.target.id === 'renderCanvas') {
      clientX = e.clientX
      clientY = e.clientY
    }
  });

  // On mouseup
  window.addEventListener("mouseup", e => {
    if (e.target.id === 'renderCanvas'
      && Math.abs(clientX - e.clientX) < 10
      && Math.abs(clientY - e.clientY) < 10) {
        
      // We try to pick an object
      const pickResult = scene.pick(e.clientX, e.clientY)

      // If valid pickpoint
      if (pickResult.pickedPoint) {
        state.targetPoint = pickResult.pickedPoint
        selectUnit(pickResult.pickedMesh, scene)
      }	
    }
  })

  // Click handlers
  document.getElementById("buildPowerPlant").onclick = () => {
    console.log('Building power plant...');
    setTimeout(() => {
      buildTime = 12000 / power;
      buildBuilding("power-plant", powerPlant, state.targetPoint, "powerPlant", scene)
    }, buildTime);
  }

  // Build large power plant button
  document.getElementById("buildLargePowerPlant").onclick = () => {
    console.log("Building large power plant...");
    setTimeout(() => {
      buildTime = 12000 / power;
      buildBuilding("large-power-plant", largePowerPlant, state.targetPoint, "largePowerPlant", scene)
    }, buildTime);
  }

  // Build barracks 
  document.getElementById("buildBarracks").onclick = () => {
    console.log('Building barracks...');
    setTimeout(() => {
      buildTime = 5000 / power;
      buildBuilding("barracks", barracks, state.targetPoint, "barracks", scene)
    }, buildTime);
  }

  document.getElementById("buildHeavyTank").onclick = () => {
    
    if (!state.selectedBuilding || state.selectedBuilding.buildingType !== "warFactory") {
      alert("You have not selected a war factory!");
      return false;
    }
    
    setTimeout(() => {
      buildTime = 4000 / power
      createUnit("heavy-tank", heavyTank, scene, boxMat)
    }, buildTime);
  }

  document.getElementById("buildJeep").onclick = () => {

    if (!state.selectedBuilding || state.selectedBuilding.buildingType !== "warFactory") {
      alert("You have not selected a war factory!");
      return false;
    }

    setTimeout(() => {
      buildTime = 1000 / power
      createUnit("jeep", jeep, scene, boxMat)
    }, buildTime)
  }

  document.getElementById("buildHeavyTank").onclick = () => {
    if (!state.selectedBuilding || state.selectedBuilding.buildingType !== "warFactory") {
      alert("You have not selected a war factory!")
      return false
    }

    setTimeout(() => {
      buildTime = 2000 / power
      createUnit("large-tank", heavyTank, scene, boxMat)
    }, buildTime)
  }

  document.getElementById("buildWarFactory").onclick = () => {
    setTimeout(() => {
      buildTime = 8000 / power;
      buildBuilding("war-factory", warFactory, state.targetPoint, "warFactory", scene)
    }, buildTime);
  }

  document.getElementById("buildRadar").onclick = () => {
    setTimeout(() => {
      buildTime = 10000 / power;
      buildUnit("radar", radar, scene, boxMat, scene)
    }, buildTime);	
  }

  document.getElementById("buildRefinery").onclick = () => {
    setTimeout(() => {
      buildTime = 5000 / power;
      buildBuilding("refinery", refinery, state.targetPoint, "refinery");
      const startVector = new BABYLON.Vector3(state.targetPoint.x + 3, oreTruck.size / 2, state.targetPoint.z);
      createUnit("ore-truck", oreTruck, startVector);
    }, buildTime);
  }

  document.getElementById("ore").text = userOre;
}
