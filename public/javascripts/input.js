// Key event handling

$('html').mousedown(function(event) {
	if (!player.controls.enabled || showInventory)
		return;
    switch (event.which) {
        case 1:
            player.punch();
            break;
        case 2:
            
            break;
        case 3:
            player.place = true;
            player.key.rightClick = Date.now();
            break;
        default:
            //alert('You have a strange Mouse!');
    }
})
$('html').mouseup(function(event) {
    switch (event.which) {
        case 1:
            player.click = false;
            player.key.leftClick = false;
            break;
        case 2:

            break;
        case 3:
            player.place = false;
            player.key.rightClick = false;
            break;
        default:
            //alert('You have a strange Mouse!');
    }
})

$(window).keydown(function(event) {
	if (!player.controls.enabled)
		return;
	if(event.keyCode == 18) { 
		event.preventDefault(); 
	}
	if (event.altKey && event.keyCode == 68) {
		event.preventDefault();
	}
	if (event.altKey && event.keyCode == 32) {
		event.preventDefault();
	}
});

$("body").mousemove(function (e) {
	mouseX = e.offsetX;
	mouseY = e.offsetY;
})

let mouseLeft, mouseRight = false;
$("body").mousedown(function (e) {
	if (!showInventory)
		return;
	switch (event.which) {
        case 1:
		    selectInventory("left");
		    mouseLeft = true;
            break;
        case 2:
            
            break;
        case 3:
            selectInventory("right");
            mouseRight = true;
            break;
        default:
            //alert('You have a strange Mouse!');
    }
}).mouseup(function (e) {
	if (!showInventory)
		return;
	switch (event.which) {
        case 1:
        	mouseLeft = false
            break;
        case 2:
            
            break;
        case 3:
            mouseRight = false;
            break;
        default:
            //alert('You have a strange Mouse!');
    }
})

$("body").dblclick(function () {
	selectInventory("double")
})

document.addEventListener('contextmenu', event => event.preventDefault());

var map = {};
onkeydown = onkeyup = function(e){
    e = e || event; 
    map[e.keyCode] = e.type == 'keydown';
}

var onKeyDown = function ( event ) {
	if (player.controls.enabled && event.keyCode == 13 && showChatFlag) {
		showChatFlag = false;
    	showChatBar = !showChatBar;
    	if (showChatBar) {
    		//$("#chat-input").show()
    		$("#chat-input").focus();
    		$("#chat-input").css({"background-color": "rgba(0, 0, 0, 0.3)"});
    		showChat = true;
    	} else {
    		//$("#chat-input").hide();
    		$("#chat-input").blur();
    		$("#chat-input").css({"background-color": "rgba(0, 0, 0, 0)"});
    		hideChatTimer(5000);
    	}

    	if (!showChatBar && $("#chat-input").val()) {
    		socket.emit("message", $("#chat-input").val());
    		$("#chat-input").val("")
    	}
	}

	if (!player.controls.enabled || showChatBar)
		return;

	if (keymap[event.keyCode] && keymap[event.keyCode][2]) {
		switch ( keymap[event.keyCode][0] ) {
			case "Attack":
			player.punch();
			break;
			case "Place Block":
			player.place = true;
			player.key.rightClick = Date.now();
			break;
			case "Move Forward":
			player.key.forward = 1;
			break;
			case "Move Left":
			player.key.left = 1; 
			break;
			case "Move Backward":
			player.key.backward = -1;
			break;
			case "Move Right":
			player.key.right = -1;
			break;
			case "Jump":
			player.key.up = -1;
			break;
			case "Sprint":
			player.key.sprint = true;
			break;
			case "Sneak":
			player.key.sneak = true;
			player.key.down = 1;
			break;
			case "Fly":
			break;
			case "Clip":
			break;
			case "Drop Item":
			player.dropItem();
			break;
			case "Respawn":
			break;
			case "Zoom":
			camera.zoom = zoomLevel;
			camera.enableZoom = true;
			break;
			case "Player Tab":
			showPlayerTab = true;
			break;
			case "Slot 1":
			player.currentSlot = 0;
			break;
			case "Slot 2":
			player.currentSlot = 1;
			break;
			case "Slot 3":
			player.currentSlot = 2;
			break;
			case "Slot 4":
			player.currentSlot = 3;
			break;
			case "Slot 5":
			player.currentSlot = 4;
			break;
			case "Slot 6":
			player.currentSlot = 5;
			break;
			case "Slot 7":
			player.currentSlot = 6;
			break;
			case "Slot 8":
			player.currentSlot = 7;
			break;
			case "Slot 9":
			player.currentSlot = 8;
			break;
		}
	}
};

var onKeyUp = function ( event ) {
	let {blockSize} = world;

	if (event.keyCode == 13)
		showChatFlag = true;

	if (!player.controls.enabled || showChatBar)
		return;

	if (keymap[event.keyCode] && keymap[event.keyCode][2]) {
		switch ( keymap[event.keyCode][0] ) {
			case "Attack":
			break;
			case "Place Block":
			player.place = false;
			player.key.rightClick = false;
			break;
			case "Move Forward":
			player.key.forward = 0;
			break;
			case "Move Left":
			player.key.left = 0;
			break;
			case "Move Backward":
			player.key.backward = 0;
			break;
			case "Move Right":
			player.key.right = 0;
			break;
			case "Jump":
			player.key.up = 0;
			break;
			case "Sprint":
			player.key.sprint = false;
			break;
			case "Sneak":
			player.key.sneak = false;
			player.key.down = 0;
			break;
			case "Fly":
			player.fly = !player.fly;
			break;
			case "Clip":
			if (player.controls.enabled)
				player.clip = !player.clip;
			break;
			case "Drop Item":
			player.allowDrop = true;
			break;
			case "Respawn":
			player.respawn(world.blockSize);
			socket.emit('respawn');
			break;
			case "Zoom":
			zoomLevel = 3;
			camera.enableZoom = false;
			camera.zoom = 1;
			break;
			case "Player Tab":
			showPlayerTab = false;
			break;
		}
	}
};

document.addEventListener( 'keydown', onKeyDown, false );
document.addEventListener( 'keyup', onKeyUp, false );


// Scrolling
var lastScrollTop = 0, delta = 5;
let zoomLevel = 3
$(document).bind('mousewheel', function(e) {
	if (!player.controls.enabled)
		return;

	if (camera.enableZoom) {
		if(e.originalEvent.wheelDelta / 120 > 0) {
			zoomLevel = clamp(zoomLevel+0.2, -10, 10);
	    } else {
	        zoomLevel = clamp(zoomLevel-0.2, -10, 10);
	    }
	    camera.zoom = zoomLevel;
	} else {
		if(e.originalEvent.wheelDelta / 120 > 0) {
	        player.currentSlot -= 1;
	        if (player.currentSlot < 0)
	        	player.currentSlot = 8;
	    } else {
	        player.currentSlot += 1;
	        if (player.currentSlot > 8)
	        	player.currentSlot = 0;
	    }
	} 
});

// Blur & Focus

$(window).blur(function () {
	inScreen = false;
})

$(window).focus(function () {
	inScreen = true;
})