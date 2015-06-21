var Player = function(startX, startY) {
    this.x = startX,
    this.y = startY,
    this.id = null;
    this.velocityX = 0;
    this.velocityY = 0;
    /*
    var getX = function() {
        return x;
    };

    var getY = function() {
        return y;
    };

    var setX = function(newX) {
        x = newX;
    };

    var setY = function(newY) {
        y = newY;
    };

    return {
        getX: getX,
        getY: getY,
        setX: setX,
        setY: setY,
        id: id
    }*/
};

exports.Player = Player;