var meshesColliderList = [];
var state = {
	selected: []
};

var createScene = function () {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
	  scene.enablePhysics();

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;
	
	var boxMat = new BABYLON.StandardMaterial("groundMat", scene);
    boxMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
	
	var getRandomInt = function (min, max) { 
		min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
	}
	
	var createUnit = function(name, scene, boxMat) { 
		var box = BABYLON.Mesh.CreateBox(name, 2, scene);
		box.material = boxMat;
		box.type = "unit";	
		box.position.x = getRandomInt(1, 100);
        box.position.z = getRandomInt(1, 100);
		box.position.y = 1;
		box.checkCollisions = true;
	}
	
	createUnit("test", scene, boxMat);
	createUnit("test2", scene, boxMat);
	
	var building = BABYLON.Mesh.CreateBox("mainBuilding", 6, scene);
    building.position.y = 3;
	building.position.z = 10;
	building.type = "building";
	building.checkCollisions = true;
	building.setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 0, move: false });

    // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
    var ground = BABYLON.Mesh.CreateGround("ground1", 150, 150, 2, scene);
	
	var targetPoint = null;
	var gridSize = 1;
	var marker = BABYLON.MeshBuilder.CreateBox('marker', { size: gridSize, height: 0.1 }, scene);

	for (var i = 1; i < scene.meshes.length; i++) {
        if (scene.meshes[i].checkCollisions && scene.meshes[i].isVisible === false) {
          scene.meshes[i].setPhysicsState(BABYLON.PhysicsEngine.BoxImpostor, { mass: 1, 
                                          friction: 1, restitution: 0.1 });
          meshesColliderList.push(scene.meshes[i]);
        }
    }
	
	var selectUnit = function (mesh) { 
		if (mesh.type === "unit") {
			state.selected.unshift(mesh);
		}
	}
	
	//When click event is raised
	var clientX = 0;
	var clientY = 0;
	window.addEventListener("mousedown", function (e) {
		
		if (e.target.id == 'renderCanvas') {
			clientX = e.clientX;
			clientY = e.clientY;
		}
	});
	
	window.addEventListener("mouseup", function (e) {

		if (e.target.id == 'renderCanvas'
			&& Math.abs(clientX - e.clientX) < 10
			&& Math.abs(clientY - e.clientY) < 10) {
			
			// We try to pick an object
			var pickResult = scene.pick(scene.pointerX, scene.pointerY);

			if (pickResult.pickedPoint) {
				targetPoint = pickResult.pickedPoint;
				selectUnit(pickResult.pickedMesh);
			}	
		}
	});
	
	scene.registerBeforeRender(function () {
		if (targetPoint) {
			state.selected.map(function (box) {
				if (!facePoint(box, targetPoint)) {
					moveUnit(box, targetPoint);
				}
			});
		}
	});
	
	function facePoint(rotatingObject, pointToRotateTo) {
		
		// a directional vector from one object to the other one
		// Error here
		var direction = pointToRotateTo.subtract(rotatingObject.position);
		
		var v1 = new BABYLON.Vector3(0,0,1);
		var v2 = direction;
		
		// caluculate the angel for the new direction
		var angle = Math.acos(BABYLON.Vector3.Dot(v1, v2.normalize()));
		
		// decide it the angle has to be positive or negative
		if (direction.x < 0) angle = angle * -1;
		
		// calculate both angles in degrees
		var angleDegrees = Math.round(angle * 180/Math.PI);
		var playerRotationDegress = Math.round(rotatingObject.rotation.y * 180/Math.PI);
		
		// calculate the delta
		var deltaDegrees = playerRotationDegress - angleDegrees;
		
		// check what direction to turn to take the shotest turn
		if(deltaDegrees > 180){
			deltaDegrees = deltaDegrees - 360;
		} else if(deltaDegrees < -180){
			deltaDegrees = deltaDegrees + 360;
		}
		
		// rotate until the difference between the object angle and the target angle is no more than 3 degrees
		if (Math.abs(deltaDegrees) > 3) {

			var rotationSpeed = Math.round(Math.abs(deltaDegrees) / 8);
			
			if (deltaDegrees > 0) {
				rotatingObject.rotation.y -= rotationSpeed * Math.PI / 180;
				if (rotatingObject.rotation.y < -Math.PI) {
					rotatingObject.rotation.y = Math.PI;
				}
			}
			if (deltaDegrees < 0) {
				rotatingObject.rotation.y += rotationSpeed * Math.PI / 180;
				if (rotatingObject.rotation.y > Math.PI) {
					rotatingObject.rotation.y = -Math.PI;
				}
			}
			
			// return true since the rotation is in progress
			return true;
			
		} else {
		
			// return false since no rotation needed to be done
			return false;
		
		}
	}

	var moveUnit = function(objectToMove, pointToMoveTo) {
		pointToMoveTo.y = 1;
		var moveVector = pointToMoveTo.subtract(objectToMove.position);
		console.log(marker, objectToMove.position);
		marker.position.x = Math.round(objectToMove.position.x/gridSize)*gridSize;
		marker.position.y = Math.round(objectToMove.position.y/gridSize)*gridSize;
		marker.position.z = Math.round(objectToMove.position.z/gridSize)*gridSize;

		if(moveVector.length() > 0.2) {
			moveVector = moveVector.normalize();
			moveVector = moveVector.scale(0.2);
			objectToMove.moveWithCollisions(moveVector);
		} else {
			targetPoint = null;
		}
		
	};

    return scene;
};
