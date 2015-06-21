module.exports = gameServer;

function gameServer(){
	
	var util = require("util"),
		Player = require("./player").Player,
		players;
	
	var express = require('express');
	var app = express();
	var http = require('http').Server(app);
	var io = require('socket.io')(http);
	
	return {
		startServer : startServer
	};
	//this.startServer = startServer;
	
	function startServer() {
		players = [];
	
		//app.get('/', function(req, res){
		//  res.sendfile('index.html');
		//});
		app.use(express.static('./src/gameClient'));
		
		io.on("connection", onSocketConnection);
	
		http.listen(3000, function (){
			console.log('Game initialized');
		});	
	};
	
	function onSocketConnection(client) {
	    util.log("New player has connected: "+client.id);
		
	    client.on("disconnect", onClientDisconnect);
	    client.on("newPlayer", onNewPlayer);
	    client.on("movePlayer", onMovePlayer);
	};
	
	function onClientDisconnect() {
	    util.log("Player has disconnected: "+this.id);
		var removePlayer = playerById(this.id);
	
		if (!removePlayer) {
			util.log("Player not found: "+this.id);
			return;
		};
	
		players.splice(players.indexOf(removePlayer), 1);
		this.broadcast.emit("removePlayer", {id: this.id});	
	};
	
	function onNewPlayer(data) {
		var newPlayer = new Player(data.x, data.y);
		newPlayer.id = this.id;
		this.broadcast.emit("newPlayer", newPlayer);
		
		var i, existingPlayer;
		for (i = 0; i < players.length; i++) {
			existingPlayer = players[i];
			this.emit("newPlayer", existingPlayer);
		};
		
		players.push(newPlayer);
	};
	
	function onMovePlayer(data) {
		var movePlayer = playerById(this.id);  // todo - maybe this can be removed.
	
		if (!movePlayer) {
			util.log("Player not found: "+this.id);
			return;
		};
	
		movePlayer.x = data.x;
		movePlayer.y = data.y;
		movePlayer.velocity = data.velocity;
		
		this.broadcast.emit("movePlayer", movePlayer);
	};
	
	function playerById(id) {
	    var i;
	    for (i = 0; i < players.length; i++) {
	        if (players[i].id == id)
	            return players[i];
	    };
	
	    return false;
	};
};