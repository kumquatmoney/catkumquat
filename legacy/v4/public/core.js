// Setup

var socket = io();

$(document).ready(function () {
	init();
	animate();
})

var scene, renderer, light, sky, stats;

var offscene;

var prevTime = performance.now();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000000000 );
var player;

function init() {
	console.log('Initalizing BlockCraft...')

	
	console.log('Socket ID:', socket.id)
	// Initialize pointer lock
	initPointerLock();

	// Setup scene

	offscene = new THREE.Scene();

	// Add the scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xffffff );

	// Add player controls

	player = new Player(camera, blocks);
	scene.add( player.controls.getObject() );

	// Add light

	light = new Light();

	// Skybox
    var skyGeometry = new THREE.CubeGeometry(1500, 1500, 1500);
    
    var skyMaterials = [
      // back side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-side.jpg'),
        side: THREE.DoubleSide
      }),
      // front side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-side.jpg'),
        side: THREE.DoubleSide
      }), 
      // Top side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-top.jpg'),
        side: THREE.DoubleSide
      }), 
      // Bottom side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-bottom.jpg'),
        side: THREE.DoubleSide
      }), 
      // right side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-side.jpg'),
        side: THREE.DoubleSide
      }), 
      // left side
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('textures/skybox-side.jpg'),
        side: THREE.DoubleSide
      }) 
    ];

    // Add sky & materials
    var skyMaterial = new THREE.MeshFaceMaterial(skyMaterials);
    sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    // Add the renderer

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	document.body.appendChild( renderer.domElement );
	stats = new Stats();
	document.body.appendChild( stats.dom );

	var maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

	window.addEventListener( 'resize', onWindowResize, false );
}

var mouse = new THREE.Vector2();
var previousBlock = {
	object: undefined
}

var players = {};

// Initialize server
let initialized = false;
socket.on('init', function (data) {
	// Check if already initialized
	if (initialized)
		location.reload(true);

	let serverPlayers = data.serverPlayers;
	let map = data.serverMap;
	let matrix = data.serverMatrix;

	// Receive current server players
	for (let id in serverPlayers) {
		if (id != socket.id) {
			players[id] = serverPlayers[id];
			if (players[id]) {
				addPlayer(players, id);
			}
		}
	}

	// Add chunks / terrain generation
	chunks.push(new Chunk());

	for (var i = 0; i < chunks.length; i++) {
		chunks[i].generate(map, matrix);
		chunks[i].update(true);
	}

	initialized = true;
})

// Add newcoming players
socket.on('addPlayer', function (data) {
	// Add to players
	if (data.id != socket.id) { // Check if not own player
		players[data.id] = data;

		addPlayer(players, data.id);
	}
})

socket.on('removePlayer', function (id) {
	console.log("Removed player", id)
	scene.remove(players[id].entity);
	delete players[id];
})

socket.on('update', function (data) {
	// Update player
	var serverPlayers = data.serverPlayers
	for (let id in players) {
		if (players[id].pos && players[id].rot) {
			// Set new player location
			players[id].pos.set({x: serverPlayers[id].pos.x, y: serverPlayers[id].pos.y, z: serverPlayers[id].pos.z});
			players[id].rot.set({x: serverPlayers[id].rot.x, y: serverPlayers[id].rot.y, z: serverPlayers[id].rot.z});
			players[id].dir.set({x: serverPlayers[id].dir.x, y: serverPlayers[id].dir.y, z: serverPlayers[id].dir.z});
			players[id].walking = serverPlayers[id].walking;
			players[id].punching = serverPlayers[id].punching;
		}
	}

	// Remove mined blocks
	var minedBlocks = data.mined;
	for (let pos of minedBlocks) {
		if (chunks[0].matrix[pos.x] && chunks[0].matrix[pos.x][pos.z] && chunks[0].matrix[pos.x][pos.z][pos.y]) {
			let block = chunks[0].matrix[pos.x][pos.z][pos.y];
			scene.remove(block);
			offscene.remove(block);
			chunks[0].matrix[pos.x][pos.z][pos.y] = "air";
		}	
	}

	// Add placed blocks
	var placedBlocks = data.placed;
	for (let pos of placedBlocks) {
		let block = new Block(stone, pos.x*blockSize, pos.y*blockSize, pos.z*blockSize);
		scene.add(block);
		blocks.push(block);
	}
})

socket.on('refresh', function () {
	location.reload(true);
})


let playerDim = {
	torso: blockSize*0.5,
	torsoHeight: blockSize*0.75,
	armSize: blockSize*0.25,
	armHeight: blockSize*0.75,
	legSize: blockSize*0.25,
	legHeight: blockSize*0.75,
	headSize: blockSize*0.55,
	height: blockSize*1.8
}

function addPlayer(players, id) {
	let p = players[id];
	// Add head
	p.head = new THREE.Mesh(new THREE.BoxGeometry(playerDim.headSize, playerDim.headSize, playerDim.headSize), head.material);
	p.head.castShadow = true;
	p.head.receiveShadow = true;
	p.head.position.set(0, blockSize*0.2, 0);

	p.neck = new THREE.Object3D();
	p.neck.add(p.head);

	// Add body
	p.body = new THREE.Mesh(new THREE.BoxGeometry(playerDim.torso, playerDim.torsoHeight, playerDim.legSize), body.material);
	p.body.castShadow = true;
	p.body.receiveShadow = true;
	p.body.position.set(0, -blockSize*0.45, 0);

	// Add arms
	p.leftArm = new THREE.Mesh(new THREE.BoxGeometry(playerDim.armSize, playerDim.armHeight, playerDim.armSize), arm.material)
	p.leftArm.castShadow = true;
	p.leftArm.receiveShadow = true;
	p.leftArm.position.set(-playerDim.armSize*3/2, -blockSize*0.45, 0);

	p.rightArm = new THREE.Mesh(new THREE.BoxGeometry(playerDim.armSize, playerDim.armHeight, playerDim.armSize), arm.material)
	p.rightArm.castShadow = true;
	p.rightArm.receiveShadow = true;
	p.rightArm.position.set(0, -blockSize*0.3, 0);

	// Shoulder joints
	p.rightShoulder = new THREE.Object3D();
	p.rightShoulder.position.set(playerDim.armSize*3/2, -blockSize*0.15, 0);
	p.rightShoulder.add(p.rightArm);

	// Add legs
	p.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(playerDim.legSize, playerDim.legHeight, playerDim.legSize), leg.material)
	p.leftLeg.castShadow = true;
	p.leftLeg.receiveShadow = true;
	p.leftLeg.position.set(-playerDim.legSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

	p.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(playerDim.legSize, playerDim.legHeight, playerDim.legSize), leg.material)
	p.rightLeg.castShadow = true;
	p.rightLeg.receiveShadow = true;
	p.rightLeg.position.set(playerDim.armSize*1/2, -blockSize*0.45-blockSize*0.75, 0);

	// Entity (combine body and arm)
	p.entity = new THREE.Group();
	p.entity.add(p.body);
	p.entity.add(p.leftArm);

	p.entity.add(p.rightShoulder);
	p.entity.add(p.leftLeg);
	p.entity.add(p.rightLeg);

	p.entity.add(p.neck);

	// Set position of entity
	p.pos = Ola({x:0, y:0, z:0}, 50);
	p.rot = Ola({x:0, y:0, z:0}, 50);
	p.dir = Ola({x:0, y:0, z:0}, 50);

	scene.add(p.entity);
	//blocks.push(p.entity);

	p.punchingT = 0;

	console.log("Added player", id)
}

// Rotate object around a 3D point
function rotateAboutPoint(obj, point, axis, theta, pointIsWorld){
    pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;

    if(pointIsWorld){
        obj.parent.localToWorld(obj.position); // compensate for world coordinate
    }

    obj.position.sub(point); // remove the offset
    obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
    obj.position.add(point); // re-add the offset

    if(pointIsWorld){
        obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
    }

    obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}

// Rotate object around a 3D point
function rotateToPoint(obj, point, axis, theta, pointIsWorld){
    pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;

    if(pointIsWorld){
        obj.parent.localToWorld(obj.position); // compensate for world coordinate
    }

    obj.position.sub(point); // remove the offset
    obj.position.set(new THREE.Vector3(0, 0, 0));
    obj.position.add(point); // re-add the offset

    if(pointIsWorld){
        obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
    }

    obj.setRotationFromAxisAngle(axis, theta); // rotate the OBJECT
}

function animate() {
	requestAnimationFrame( animate );

	// Get the frame's delta
	var time = performance.now();
	var delta = ( time - prevTime );
	delta /= 1000;

	// Player update
	player.select(true);
	player.mine();
	player.placeBlock();
	player.checkCollision(delta);
	player.update(delta);

	// Update server players

	for (let id in players) {
		if (players[id].entity) {
			players[id].entity.position.set(players[id].pos.x, players[id].pos.y, players[id].pos.z);
			players[id].entity.rotation.set(players[id].rot.x, players[id].rot.y, players[id].rot.z);
			players[id].neck.rotation.x = players[id].dir.y;

			// Walking animation
			if (players[id].walking) {
				if (players[id].leftArm.rotation.x < -Math.PI/3) {
					players[id].extendBody = false;
				} else if (players[id].leftArm.rotation.x > Math.PI/3) {
					players[id].extendBody = true;
				}
				
				if (players[id].extendBody) {
					rotateAboutPoint(players[id].rightArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), 0.1)
					rotateAboutPoint(players[id].leftArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), -0.1)

					rotateAboutPoint(players[id].rightLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), -0.1)
					rotateAboutPoint(players[id].leftLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), 0.1)
				} else {
					rotateAboutPoint(players[id].rightArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), -0.1)
					rotateAboutPoint(players[id].leftArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), 0.1)

					rotateAboutPoint(players[id].rightLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), 0.1)
					rotateAboutPoint(players[id].leftLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), -0.1)
				}
			} else {
				rotateAboutPoint(players[id].rightArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), Math.abs(players[id].rightArm.rotation.x)*Math.sign(-players[id].rightArm.rotation.x))
				rotateAboutPoint(players[id].leftArm, new THREE.Vector3(0, -blockSize*0.15, 0), new THREE.Vector3(1, 0, 0), Math.abs(players[id].leftArm.rotation.x)*Math.sign(-players[id].leftArm.rotation.x))

				rotateAboutPoint(players[id].rightLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), Math.abs(players[id].rightLeg.rotation.x)*Math.sign(-players[id].rightLeg.rotation.x))
				rotateAboutPoint(players[id].leftLeg, new THREE.Vector3(0, -blockSize*0.75, 0), new THREE.Vector3(1, 0, 0), Math.abs(players[id].leftLeg.rotation.x)*Math.sign(-players[id].leftLeg.rotation.x))
			}

			// Punching animation
			if (players[id].punching) {
				players[id].punchingT += 0.4;

				if (players[id].punchingT > 2*Math.PI)
					players[id].punchingT = 0
			} else {
				if (players[id].punchingT < 2*Math.PI) {
					players[id].punchingT += 0.4;
				} else {
					players[id].punchingT = 2*Math.PI;
				}
			}
				
			players[id].rightShoulder.rotation.x = (-Math.cos(players[id].punchingT)+1)/2;
			players[id].rightShoulder.rotation.z = Math.sin(players[id].punchingT)/2;
		}
	}

	// Emit events to server

	socket.emit('packet', {
		pos: player.position,
		rot: player.controls.getObject().rotation.toVector3(), // Rotation of body
		dir: camera.getWorldDirection(), // Rotation of head
		walking: (new Vector(player.velocity.x, player.velocity.z)).getMag() > 2,
		punching: player.punching
	});

	// Scene update

	light.update();
	sky.position.set(player.position.x, player.position.y, player.position.z);
	stats.update();

	// Update chunk if necessary
	var playerPos = player.position.clone().divideScalar(blockSize*blockSize)
	for (var i = 0; i < chunks.length; i++) {
		chunks[i].update(false, player);
	}

	prevTime = time;

	renderer.render( scene, camera );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	var crosshairSize = 50

	var width = $("html").innerWidth()
	$("#crosshair").css("left", width/2 - crosshairSize/2)
	var height = $("html").innerHeight()
	$("#crosshair").css("top", height/2 - crosshairSize/2)

}