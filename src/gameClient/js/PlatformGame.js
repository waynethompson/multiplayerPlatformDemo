var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
}

var player;
var platforms;
var cursors;

var stars;
var score = 0;
var scoreText;

var aliens;
var socket;

function create() {

    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  A simple background for our game
    game.add.sprite(0, 0, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = game.add.group();

    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;

    // Here we create the ground.
    var ground = platforms.create(0, game.world.height - 64, 'ground');

    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    ground.scale.setTo(2, 2);

    //  This stops it from falling away when you jump on it
    ground.body.immovable = true;

    //  Now let's create two ledges
    var ledge = platforms.create(400, 400, 'ground');
    ledge.body.immovable = true;

    ledge = platforms.create(-150, 250, 'ground');
    ledge.body.immovable = true;

    // The player and its settings
    aliens = game.add.group();
    aliens.enableBody = true;
    player = createPlayer(Math.random() * 800, game.world.height - 150);

    //  Finally some stars to collect
    stars = game.add.group();

    //  We will enable physics for any star that is created in this group
    stars.enableBody = true;

    //  Here we'll create 12 of them evenly spaced apart
    for (var i = 0; i < 12; i++)
    {
        //  Create a star inside of the 'stars' group
        var star = stars.create(i * 70, 0, 'star');

        //  Let gravity do its thing
        star.body.gravity.y = 300;

        //  This just gives each star a slightly random bounce value
        star.body.bounce.y = 0.7 + Math.random() * 0.2;
    }

    //  The score
    scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();
 
    socket = io();
    setEventHandlers();
}

function update() {
    
    //  Collide the player and the stars with the platforms
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(stars, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    game.physics.arcade.overlap(player, stars, collectStar, null, this);

    //  Reset the players velocity (movement)
    player.hasMoved = false;
    player.body.velocity.x = 0;

    if (cursors.left.isDown) {
        //  Move to the left
        player.body.velocity.x = -150;

        player.animations.play('left');
    }
    else if (cursors.right.isDown) {
        //  Move to the right
        player.body.velocity.x = 150;

        player.animations.play('right');
    }
    else {
        //  Stand still
        player.animations.stop();

        player.frame = 4;
    }
    
    //  Allow the player to jump if they are touching the ground.
    if (cursors.up.isDown && player.body.touching.down) {
        player.body.velocity.y = -350;
    }
    
    if(player.body.velocity.x != 0 || player.body.velocity.y != 0){
        socket.emit("movePlayer", { x: player.x, y: player.y, velocity: player.body.velocity });
    }    
}

function collectStar(player, star) {    
    // Removes the star from the screen
    star.kill();

    //  Add and update the score
    score += 10;
    scoreText.text = 'Score: ' + score;
}



function setEventHandlers() {
	socket.on("connect", onSocketConnected);
	socket.on("disconnect", onSocketDisconnect);
	socket.on("newPlayer", onNewPlayer);
	socket.on("movePlayer", onMovePlayer);
	socket.on("removePlayer", onRemovePlayer);
};

function onSocketConnected() {
    console.log("Connected to socket server");
	socket.emit("newPlayer", {x: player.x, y: player.y});
};

function onSocketDisconnect() {
    console.log("Disconnected from socket server");
};

function onNewPlayer(data) {
    console.log("New player connected: "+data.id);
	
	var newPlayer = createPlayer(data.x, data.y);
	newPlayer.id = data.id;
};

function onMovePlayer(data) {
	var movePlayer = playerById(data.id);

	if (!movePlayer) {
		console.log("Player not found: "+data.id);
		return;
	};
     
	movePlayer.x = data.x;
	movePlayer.y = data.y;  
	movePlayer.body.velocity.x = data.velocity.x;
	movePlayer.body.velocity.y = data.velocity.y;
    
    if (movePlayer.body.velocity.x < 0) {
        movePlayer.animations.play('left');
    }
    else if (movePlayer.body.velocity.x > 0) {
        movePlayer.animations.play('right');
    }
    else {
        movePlayer.animations.stop();
        movePlayer.frame = 4;
    }
};

function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);
    
	if (!removePlayer) {
		console.log("Player not found: "+data.id);
		return;
	};
    removePlayer.kill();
	//aliens.splice(aliens.indexOf(removePlayer), 1);
};


// helper functions
function createPlayer(startX, startY) {
    var newPlayer = aliens.create(startX, startY, 'dude');
    newPlayer.id = -1;
    //  We need to enable physics on the player
    game.physics.arcade.enable(newPlayer);

    //  Player physics properties. Give the little guy a slight bounce.
    newPlayer.body.bounce.y = 0.2;
    newPlayer.body.gravity.y = 300;
    newPlayer.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    newPlayer.animations.add('left', [0, 1, 2, 3], 10, true);
    newPlayer.animations.add('right', [5, 6, 7, 8], 10, true);
 
    return newPlayer;
};

function playerById(id) {
    for (var i = 0; i < aliens.children.length; i++) {
        if (aliens.children[i].id == id)
            return aliens.children[i];
    };

    return false;
};