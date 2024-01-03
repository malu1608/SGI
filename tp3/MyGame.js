import * as THREE from 'three';

class MyGame {
    constructor(app) {
        this.app = app;
        this.playerTractor = null;
        this.enemyTractor = null;
        this.elapsedTime = 0;
        this.lapCount = 0;
        this.targetLaps = 3;
        this.winner = null;
        this.clock = new THREE.Clock();
        this.trackControlPoints = null;
        this.collidedWithPowerUp = false;
        this.lastTimeCollided = -5;
        this.obstacles = [];
        this.endgame = false;
    }

    initGame(){
        this.clock.start();
        const trackSpline = new THREE.CatmullRomCurve3(this.trackControlPoints,true);
        this.trackPoints = trackSpline.getPoints(200);
    }

    addObstacle(obstacle) {
        this.obstacles.push(obstacle);
    }

    update() {
        this.updateElapsedTime();
        this.updateTractors();
        this.updateVelocity(this.playerTractor.currentSpeed);
        this.updateLaps();
        this.checkOutOfTrack();
        this.checkPowerUpCollision();
        this.checkObstacleCollision();
        this.checkWinner();

    }

    updateElapsedTime(){
        this.elapsedTime = this.clock.getElapsedTime();
        this.app.timerDiv.innerHTML = "Time: " + this.elapsedTime.toFixed(2) + "s";
    }
    
    updateTractors(){
        this.playerTractor.update();
        this.enemyTractor.update();
    }

    updateVelocity(velocity) {
        // Conversion factor to convert from the original range [0, 1.5] to [0, 100]
        const conversionFactor = 100 / 1.5;
        const convertedVelocity = Math.round(velocity * conversionFactor);
    
        this.app.velocityDiv.innerHTML = "Velocity: " + convertedVelocity.toFixed(0) + " km/h";
    }    

    updateLaps() {
        this.lapCount = this.playerTractor.completedLaps;
        this.app.lapCountDiv.innerHTML = "Laps: " + this.lapCount + "/" + this.targetLaps;
    }

    checkOutOfTrack() {
        let tractorPosition = this.playerTractor.object.position
        let offset = new THREE.Vector3(0, -5.7, 0);
        let floorPosition = tractorPosition.clone().add(offset);
        const threshold = 13;

        for (let i = 0; i < this.trackPoints.length; i++) {
            const distance = floorPosition.distanceTo(this.trackPoints[i]);

            // If the tractor is close enough to the track, we consider it to be in the track
            if (distance < threshold) {
                this.playerTractor.tractorInTrack();
                return;
            }
        }

        this.playerTractor.tractorOutTrack();
    }
    
    checkPowerUpCollision() {

        // If the tractor collided with a power up less than 2 seconds ago, we ignore the collision
        if(this.lastTimeCollided + 2 > this.elapsedTime){
            return;
        }

        const tractorPosition = this.playerTractor.object.position;

        // Star Power up 1
        const powerUpPosition1 = new THREE.Vector3(-120, 7, -20);
        const distanceToPowerUp1 = tractorPosition.distanceTo(powerUpPosition1);

        // Star Power up 2
        const powerUpPosition2 = new THREE.Vector3(90, 7, 90);
        const distanceToPowerUp2 = tractorPosition.distanceTo(powerUpPosition2);

        // Box Power up 3
        const powerUpPosition3 = new THREE.Vector3(-70, 7, 100);
        const distanceToPowerUp3 = tractorPosition.distanceTo(powerUpPosition3);

        // Box Power up 4
        const powerUpPosition4 = new THREE.Vector3(50, 7, -90);
        const distanceToPowerUp4 = tractorPosition.distanceTo(powerUpPosition4);

        if (distanceToPowerUp1 < 5) {
            this.playerTractor.applyPowerUpEffect(1);
        } else if (distanceToPowerUp2 < 5) {
            this.playerTractor.applyPowerUpEffect(2);
        }
        else if (distanceToPowerUp3 < 5) {
            this.collidedWithPowerUp = true;
            this.lastTimeCollided = this.elapsedTime;
        } else if (distanceToPowerUp4 < 5) {
            this.collidedWithPowerUp = true;
            this.lastTimeCollided = this.elapsedTime;
        }
    }

    isCollidingWithPowerUp() {
        return this.collidedWithPowerUp;
    }

    checkObstacleCollision() {
        const tractorPosition = this.playerTractor.getPosition();
        
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstaclePosition = this.obstacles[i].position;
            const distanceToObstacle = tractorPosition.distanceTo(obstaclePosition);

            if (distanceToObstacle < 5) {
                this.playerTractor.applyObstacleEffect();
            }
        }
    }

    resetCollision() {
        this.collidedWithPowerUp = false;
    }

    checkWinner() {
        if (this.playerTractor.completedLaps > this.targetLaps) {
            this.winner = this.playerTractor;
            this.displayWinner();
            this.endGame();
        } else if (this.enemyTractor.completedLaps > this.targetLaps) {
            this.winner = this.enemyTractor;
            this.displayWinner();
            this.endGame();
        }
    }

    endGame() {
        this.pause();
        this.endgame = true;
    }

    displayRestart() {
        this.app.restartDiv.innerHTML = "Please press Space Bar to restart the game";
    }

    displayWinner() {
        this.app.winnerDiv.innerHTML = this.winner === this.playerTractor ? this.app.contents.player_name + " Wins!" : "Enemy Wins!";
    }

    pause() {
        this.clock.stop();
        this.enemyTractor.pause();
    }

    resume() {
        this.clock.start();
        this.clock.elapsedTime = this.elapsedTime;
        this.enemyTractor.resume();
    }

}

export { MyGame };