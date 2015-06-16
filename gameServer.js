var util = require("util"),
	Player = require("./player").Player,
	players;

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

function init() {
	players = [];

	//app.get('/', function(req, res){
	//  res.sendfile('index.html');
	//});
	app.use(express.static('public'));
	
	io.on("connection", onSocketConnection);

	http.listen(3000, function (){
		console.log('Game initialized');
	});	
};
init();

function onSocketConnection(client) {
    util.log("New player has connected: "+client.id);
    client.on("disconnect", onClientDisconnect);
    client.on("new player", onNewPlayer);
    client.on("move player", onMovePlayer);
};

function onClientDisconnect() {
    util.log("Player has disconnected: "+this.id);
	var removePlayer = playerById(this.id);

	if (!removePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	players.splice(players.indexOf(removePlayer), 1);
	this.broadcast.emit("remove player", {id: this.id});	
};

function onNewPlayer(data) {
	var newPlayer = new Player(data.x, data.y);
	newPlayer.id = this.id;
	this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});
	
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
	};
	
	players.push(newPlayer);
};

function onMovePlayer(data) {
	var movePlayer = playerById(this.id);

	if (!movePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	movePlayer.setX(data.x);
	movePlayer.setY(data.y);

	this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()});
};

function playerById(id) {
    var i;
    for (i = 0; i < players.length; i++) {
        if (players[i].id == id)
            return players[i];
    };

    return false;
};
