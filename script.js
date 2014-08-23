(function () {
    var FpsShow = function () {
        this.lastLoop = 0;
        this.thisLoop = 0;
        this.fps = 0;
    };

    FpsShow.prototype.render = function () {
        this.thisLoop = (new Date()).getTime();
        this.fps = 1000 / (this.thisLoop - this.lastLoop);
        this.lastLoop = this.thisLoop;
        document.getElementById('fps').innerHTML = "FPS: " + Math.round(this.fps);
    };

    var Canvas = function () {
        this.canvas = document.getElementById('myCanvas');
        this.context = this.canvas.getContext('2d');
    };

    Canvas.prototype.clean = function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    var Keyboard = function () {
        this.keyMap = { 37: false, 38: false, 39: false, 40: false, 32: false, 17: false, 13: false };
        this.keyMapMemLR = { 37: false, 39: false };
    };

    Keyboard.prototype.kDown = function (e) {
        this.keyMap[e.keyCode] = true;
        this.saveToMem(); // to decide which direction to fire    
    };

    Keyboard.prototype.kUp = function (e) {
        this.keyMap[e.keyCode] = false;
        this.saveToMem(); // to decide which direction to fire
    };

    Keyboard.prototype.saveToMem = function () { // save history of lefr / right key 
        if (this.keyMap[37] == true) {
            this.keyMapMemLR[37] = true;
            this.keyMapMemLR[39] = false;
        }
        if (this.keyMap[39] == true) {
            this.keyMapMemLR[37] = false;
            this.keyMapMemLR[39] = true;
        }
    };

    var Animal = function (canvas, weapons, barrier) {
        this.canvas = canvas.canvas;
        this.context = canvas.context;
        this.width = 20;
        this.height = 20;
        this.x = 10; // start position x
        this.y = this.canvas.height - this.height; // start position y
        this.fpsTiming = (new Date()).getTime();
        this.speed = 100; // speed (px / s)
        this.jumpSpeed = 500;
        this.weapons = weapons;
        this.barrier = barrier;
        this.jumping = false; // false - not in jump | true - in jump
        this.jumpInic = false;
        this.jumpStartTime = 0; // jump timing - for gravity to calculate actual speed of the jump
        this.falling = false;
        this.fallStartTime = 0;
        this.fallInic = false;
        this.life = 1;
    };

    Animal.prototype.calculateSpeed = function () { // left / right moving (px / s | respecting fps )
        var time = 0, pixels = 0;

        time = (new Date()).getTime() - this.fpsTiming; // timing begin
        pixels = Math.round(this.speed * time / 1000);
        if (pixels > 5) pixels = 5;
        return pixels;
    };

    Animal.prototype.jump = function () {
        var pixels = 0, spd = 0, time = 0;

        if (this.jumping == false && this.jumpInic == false) { // no jumping / no jump initialization
            return;
        }

        if (this.jumpInic == true && this.jumping == false) { // no jumping / jump inic
            this.jumping = true;
            this.jumpStartTime = (new Date()).getTime();
        }

        if (this.jumping == true) { // calculate jump speed
            spd = this.jumpSpeed - (((new Date()).getTime() - this.jumpStartTime) * 1.81); // (jumpspeed) - ((now) - (jump start)) * gravity acceleration

            time = (new Date()).getTime() - this.fpsTiming;
            pixels = Math.round(spd * time / 1000);  
            if (pixels >  10) pixels =  10; // max speed of jump up (px / s)
            if (pixels < -10) pixels = -10; // max speed of jump down (px / s)
            if (!this.barrier.collision(this.x, this.y - pixels, this.width, this.height)) {
                this.y -= pixels;
            } else {
                this.jumping = false;
                this.y -= this.barrier.newPxMove(this.x, this.y, this.width, this.height, pixels, 'down');
            }
        }
        this.jumpInic = false;
    };

    Animal.prototype.fall = function () {
        
        if (this.jumping == true) {
            return;
        }

        if (this.falling == false && this.fallInic == false) { // test ground
            var test = this.barrier.collision(this.x, this.y + 1, this.width, this.height);
            if (!test) {
                this.fallInic = true;
            }
        }
        
        if (this.falling == false && this.fallInic == true) {
            this.falling = true;
            this.fallStartTime = (new Date()).getTime();
        }

        if (this.falling == true) {
            spd = 0 - (((new Date()).getTime() - this.fallStartTime) * 1.81);

            time = (new Date()).getTime() - this.fpsTiming;
            pixels = Math.round(spd * time / 1000);  
            if (pixels < -10) pixels = -10; // max speed of falling (px / s)
            if (!this.barrier.collision(this.x, this.y - pixels, this.width, this.height)) {
                this.y -= pixels;
            } else {
                this.falling = false;
                this.y -= this.barrier.newPxMove(this.x, this.y, this.width, this.height, pixels, 'down');
            }
            this.fallInic = false;
        }
    };

    Animal.prototype.render = function (keyMap, keyMapMemLR) {
        var left = keyMap[37];
        var up = keyMap[38] || keyMap[32];
        var right = keyMap[39];
        var down = keyMap[40];

        var pixels = this.calculateSpeed(); // move left right

        if (left) {
            if (!this.barrier.collision(this.x - pixels, this.y, this.width, this.height)) {
                this.x -= pixels;
            } else {
                this.x -= this.barrier.newPxMove(this.x, this.y, this.width, this.height, pixels, 'left');
            }
        }
        if (right) {
            if (!this.barrier.collision(this.x + pixels, this.y, this.width, this.height)) {
                this.x += pixels;
            } else {
                this.x += this.barrier.newPxMove(this.x, this.y, this.width, this.height, pixels, 'right');
            }
        }
        if (up) {
            this.jumpInic = true;
        }
            
        this.jump();
        this.fall();

        if (keyMap[17] == true) { // create new weapon
            this.weapons.create(this.x, this.y, this.width, this.height, keyMapMemLR);
        }

        // begin collision with robot
        if (this.barrier.collisionRobot(this.x, this.y, this.width, this.height)) {
            this.life -= 1;
        }
        // end collision with robot

        this.context.beginPath();
        this.context.rect(this.x, this.y, this.width, this.height);
        this.context.fillStyle = 'yellow';
        this.context.fill();
        this.context.lineWidth = 2;
        this.context.strokeStyle = 'black';
        this.context.stroke();

        this.fpsTiming = (new Date()).getTime();
    };

    var Barrier = function (canvas) {
        this.boxes = new Array();
        this.robots = new Array();
        this.canvas = canvas.canvas;
        this.context = canvas.context;
    };

    Barrier.prototype.addBox = function (obj) {
        this.boxes[this.boxes.length] = obj;
    };

    Barrier.prototype.addRobot = function (obj) {
        this.robots[this.robots.length] = obj;
    };

    Barrier.prototype.removeRobot = function (index) {
        this.robots.splice(index, 1);
    }

    Barrier.prototype.collision = function (a_x, a_y, a_w, a_h) {
        var ret = false;

        if (a_x < 0 || a_y < 0 || a_x > this.canvas.width  - a_w || a_y > this.canvas.height - a_h) 
            ret = true;            

        this.boxes.forEach( function (e) {
            if (a_x < e.x + e.width && a_x + a_w > e.x && a_y < e.y + e.height && a_y + a_h > e.y) {
                ret = true;
            }
        });

        return ret;
    };

    Barrier.prototype.collisionRobot = function (x, y, width, height) {
        var ret = false;
        this.robots.forEach( function (e) {
            if (x < e.x + e.width && x + width > e.x && y < e.y + e.height && y + height > e.y) {
                e.life -= 1;
                if (e.life <= 0) // kill robot
                    e.deleteMe = true;
                ret = true;
            }
        });

        return ret;
    };

    Barrier.prototype.newPxMove = function (a_x, a_y, a_w, a_h, pixels, direction) {
        var newPx = 0;

        if (direction == 'down') {
            newPx = 0 - (this.canvas.height - a_y - a_h); // canvas bottom barrier
            a_yt = a_y - pixels;
            this.boxes.forEach( function (e) {
                if (a_x < e.x + e.width && a_x + a_w > e.x && a_yt < e.y + e.height && a_yt + a_h > e.y) {
                    newPx = 0 - (e.y - a_y - a_h);
                }
            });
        }

        if (direction == 'right') {
            newPx = this.canvas.width - a_x - a_w; // canvas right barrier
            a_xt = a_x + pixels;
            this.boxes.forEach( function (e) {
                if (a_xt < e.x + e.width && a_xt + a_w > e.x && a_y < e.y + e.height && a_y + a_h > e.y) {
                    newPx = e.x - a_x - a_w;
                }
            });
        }

        if (direction == 'left') {
            newPx = 0; // canvas left barrier
            a_xt = a_x - pixels;
            this.boxes.forEach( function (e) {
                if (a_xt < e.x + e.width && a_xt + a_w > e.x && a_y < e.y + e.height && a_y + a_h > e.y) {
                    newPx = a_x - e.x - e.width;
                }
            });
        }

        return newPx;
    };

    var Weapon = function (canvas, x, y, right_left, barrier) {
        this.canvas = canvas.canvas;
        this.context = canvas.context;
        this.fpsTiming = (new Date()).getTime();
        this.speed = 400; // px / s
        this.x = x;
        this.y = y;
        this.width = 2;
        this.height = 2;
        this.deleteMe = false;
        this.fire_right_left = right_left; 
        this.barrier = barrier;
    };

    Weapon.prototype.render = function () {
        if (this.fire_right_left == 1)
            this.fireLeft();
        else
            this.fireRight();

        this.context.beginPath();
        this.context.moveTo(this.x, this.y);
        this.context.lineTo(this.x + this.width, this.y);
        this.context.lineWidth = this.height;
        this.context.strokeStyle = '#ff0000';
        this.context.stroke();

        this.fpsTiming = (new Date()).getTime();
    };

    Weapon.prototype.fireLeft = function () {
        var pixels = this.calculateSpeed();
        this.x -= pixels;
        if (this.barrier.collision(this.x, this.y, this.width, this.height) || 
            this.barrier.collisionRobot(this.x, this.y, this.width, this.height)) {
            this.deleteMe = true;
        }
    };

    Weapon.prototype.fireRight = function () {
        var pixels = this.calculateSpeed();
        this.x += pixels;
        if (this.barrier.collision(this.x, this.y, this.width, this.height) ||
            this.barrier.collisionRobot(this.x, this.y, this.width, this.height)) {
            this.deleteMe = true;
        }
    }

    Weapon.prototype.calculateSpeed = function () {
        var time = 0, pixels = 0;
        time = (new Date()).getTime() - this.fpsTiming;
        pixels = Math.round(this.speed * time / 1000);
        return pixels;
    };

    var ManageWeapons = function (canvas, barrier) {
        this.canvas = canvas;
        this.weapons = new Array();
        this.barrier = barrier;
    };

    ManageWeapons.prototype.create = function (x, y, width, height, keyMapMemLR) {
        var w_x, w_y, right_left;
        if (keyMapMemLR[37] == true) { // fire to left
            w_x = x - 2;
            w_y = y + (height / 2) - 1; // -1 px (height of the fire)
            right_left = 1;
        } else { // fire to right
            w_x = x + width;
            w_y = y + (height / 2) - 1; // -1 px (height of the fire)
            right_left = 2;
        }

        var w = new Weapon(this.canvas, w_x, w_y, right_left, this.barrier);
        this.weapons[this.weapons.length] = w;
    };

    ManageWeapons.prototype.render = function () {
        this.weapons.forEach( function (e, index) {
            if (e.deleteMe == true) {
                this.weapons.splice(index, 1);
            } else {
                e.render();
            }
        }, this);
    };

    var Box = function (canvas, width, height, x, y) {
        this.canvas = canvas.canvas;
        this.context = canvas.context;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    };

    Box.prototype.render = function () {
        this.context.beginPath();
        this.context.rect(this.x, this.y, this.width, this.height);
        this.context.fillStyle = '#004400';
        this.context.fill();
    };

    var ManageBoxes = function (canvas, barrier) {
        this.canvas = canvas;
        this.barrier = barrier;
        this.boxes = new Array();
    };

    ManageBoxes.prototype.create = function (width, height, x, y) {
        var box = new Box(this.canvas, width, height, x, y);
        this.barrier.addBox(box);
        this.boxes[this.boxes.length] = box;
    };

    ManageBoxes.prototype.render = function () {
        this.boxes.forEach( function (e) {
            e.render();
        });
    };

    var Robot = function (canvas, barrier, x) {
        this.width = 20;
        this.height = 20;
        this.canvas = canvas.canvas;
        this.context = canvas.context;
        this.fpsTiming = (new Date()).getTime();
        this.speed = 50; // speed (px / s)
        this.x = x; // start position x
        this.y = 0; // this.canvas.height - this.height; // start position y
        this.barrier = barrier;
        this.falling = false;
        this.fallStartTime = 0;
        this.fallInic = true;
        this.direction = true; // true - left | false - right
        this.life = 30;
        this.maxLife = this.life;
        this.deleteMe = false; // if robot has no life delet him | the value changes method Barrier.prototype.collisionRobot
    };

    Robot.prototype.calculateSpeed = function () { // left / right moving (px / s | respecting fps )
        var time = 0, pixels = 0;

        time = (new Date()).getTime() - this.fpsTiming; // timing begin
        pixels = Math.round(this.speed * time / 1000);
        if (pixels > 5) pixels = 5;
        return pixels;
    };

    Robot.prototype.fall = function () {
        if (this.falling == false && this.fallInic == false) { // test ground
            var test = this.barrier.collision(this.x, this.y + 1, this.width, this.height);
            if (!test) {
                this.fallInic = true;
            }
        }
        
        if (this.falling == false && this.fallInic == true) {
            this.falling = true;
            this.fallStartTime = (new Date()).getTime();
        }

        if (this.falling == true) {
            spd = 0 - (((new Date()).getTime() - this.fallStartTime) * 1.81);

            time = (new Date()).getTime() - this.fpsTiming;
            pixels = Math.round(spd * time / 1000);  
            if (pixels < -10) pixels = -10; // max speed of falling (px / s)
            if (!this.barrier.collision(this.x, this.y - pixels, this.width, this.height)) {
                this.y -= pixels;
            } else {
                this.falling = false;
                this.y -= this.barrier.newPxMove(this.x, this.y, this.width, this.height, pixels, 'down');
            }
            this.fallInic = false;
        }
    };

    Robot.prototype.render = function () {
        var pixels = this.calculateSpeed(); // move left right

        if (this.direction) {
            if (!this.barrier.collision(this.x - pixels, this.y, this.width, this.height)) {
                this.x -= pixels;
            } else {
                this.x -= this.barrier.newPxMove(this.x, this.y, this.width, this.height, pixels, 'left');
                this.direction = false;
            }
        }
        else {
            if (!this.barrier.collision(this.x + pixels, this.y, this.width, this.height)) {
                this.x += pixels;
            } else {
                this.x += this.barrier.newPxMove(this.x, this.y, this.width, this.height, pixels, 'right');
                this.direction = true;
            }
        }

        this.fall();

        this.context.beginPath();
        this.context.rect(this.x, this.y, this.width, this.height);
        this.context.fillStyle = 'orange';
        this.context.fill();
        this.context.lineWidth = 2;
        this.context.strokeStyle = 'red';
        this.context.stroke();
        this.fpsTiming = (new Date()).getTime();
        this.context.beginPath();
        this.context.rect(this.x, this.y, this.width, this.height * (1 - this.life / this.maxLife));
        this.context.fillStyle = 'red';
        this.context.fill();

    };

    var ManageRobots = function (canvas, barrier) {
        this.canvas = canvas;
        this.robots = new Array();
        this.barrier = barrier;
    };

    ManageRobots.prototype.create = function (x) {
        var robot = new Robot(this.canvas, this.barrier, x);
        this.barrier.addRobot(robot);
        this.robots[this.robots.length] = robot;
    };

    ManageRobots.prototype.render = function () {
        this.robots.forEach( function (e, index) {
            if (e.deleteMe == true) {
                this.barrier.removeRobot(index, 1);
                this.robots.splice(index, 1);
            } else {
                e.render();
            }
        }, this);
    };

    var Game = function () {
        this.canvas = new Canvas();
        this.fpsShow = new FpsShow();
        this.keyboard = new Keyboard();
        
        document.addEventListener("keydown", (function (_this) { return function (e) { _this.keyboard.kDown(e); }; })(this));
        document.addEventListener("keyup",   (function (_this) { return function (e) { _this.keyboard.kUp(e);   }; })(this));

        this.msgPrint = false;
        this.gameInic = true;
        this.inGame = false;
        this.gameOver = false;
        this.winGame = false;
    };

    Game.prototype.create = function () {
        this.barrier = new Barrier(this.canvas);
        this.weapons = new ManageWeapons(this.canvas, this.barrier);
        this.animal = new Animal(this.canvas, this.weapons, this.barrier);
        this.robots = new ManageRobots(this.canvas, this.barrier);
        this.boxes = new ManageBoxes(this.canvas, this.barrier);

        this.boxes.create(200, 15, 140, 385);
        this.boxes.create(200, 100, 550, 300);
        this.boxes.create(100, 50, 780, 350);
        this.boxes.create(50, 50, 470, 350);
        this.boxes.create(10, 15, 570, 285);
        this.boxes.create(10, 15, 730, 285);
        this.boxes.create(10, 70, 760, 330);
        this.boxes.create(10, 70, 890, 330);

        this.robots.create(920);
        this.robots.create(750);
        this.robots.create(550);
        this.robots.create(350);
    };

    Game.prototype.printGameOver = function () {
        this.canvas.context.font = '40pt Calibri';
        this.canvas.context.textAlign = 'center';
        this.canvas.context.fillStyle = 'red';
        this.canvas.context.fillText('Game Over!', this.canvas.canvas.width / 2, this.canvas.canvas.height / 2);

        this.canvas.context.font = '20pt Calibri';
        this.canvas.context.textAlign = 'center';
        this.canvas.context.fillStyle = 'blue';
        this.canvas.context.fillText('Press Enter to start again.', this.canvas.canvas.width / 2, this.canvas.canvas.height / 2 + 40);
    };

    Game.prototype.printWinGame = function () {
        this.canvas.context.font = '40pt Calibri';
        this.canvas.context.textAlign = 'center';
        this.canvas.context.fillStyle = 'red';
        this.canvas.context.fillText('You Won the game!', this.canvas.canvas.width / 2, this.canvas.canvas.height / 2);

        this.canvas.context.font = '20pt Calibri';
        this.canvas.context.textAlign = 'center';
        this.canvas.context.fillStyle = 'blue';
        this.canvas.context.fillText('Press Enter to start again.', this.canvas.canvas.width / 2, this.canvas.canvas.height / 2 + 40);
    }

    Game.prototype.manage = function () {
        this.fpsShow.render();

        if (this.gameInic == true && this.inGame == false) { // start new game on gameInic
            this.create();
            this.gameInic = false;
            this.inGame = true;
        }

        if (this.gameOver == true && this.msgPrint == true) { // start new game after game over
            if (this.keyboard.keyMap[13] == true) {
                this.gameOver = false;
                this.msgPrint = false;
                this.gameInic = true;
            }
        }

        if (this.winGame == true) {
            if (this.keyboard.keyMap[13] == true) {
                this.winGame = false;
                this.gameInic = true;
                this.inGame = false;
            }
        }

        if (this.inGame == true) {

            if (this.animal.life <= 0) {
                this.inGame = false;
                this.gameOver = true;
            }

            if (this.robots.robots.length == 0) {
                this.winGame = true;
            }

            this.canvas.clean();
            this.weapons.render();
            this.animal.render(this.keyboard.keyMap, this.keyboard.keyMapMemLR);
            this.robots.render();
            this.boxes.render();
        }

        if (this.gameOver == true && this.msgPrint == false) {
            this.msgPrint = true;
            this.printGameOver();
        }

        if (this.winGame == true) {
            this.printWinGame();
        }
    };


    /***** BEGIN INITIALIZATION ********/

    game = new Game();

    setInterval( function () {
        game.manage();   
    }, 1000 / 60);

})();
