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
    }

    initGame(){
        this.clock.start();
    }

    update() {
        this.updateElapsedTime();
        this.updateTractors();
        this.updateVelocity(this.playerTractor.currentSpeed);
        this.updateLaps();
        this.checkPowerUpCollision();
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
        const finishingLinePosition = new THREE.Vector3(-10, 0, 80);
        const tractor = this.playerTractor;
        const tractorPosition = tractor.object.position;

        if(this.lapCount == 0){
            this.app.lapCountDiv.innerHTML = "Laps: " + this.lapCount + "/" + this.targetLaps;
        }
    
        if (tractorPosition.z > finishingLinePosition.z && !tractor.crossedFinishLine) {
            tractor.crossedFinishLine = true; // Set the flag to prevent multiple counts
            this.lapCount++;
    
            if (this.lapCount >= this.targetLaps) {
                this.winner = tractor;
            }
    
            this.app.lapCountDiv.innerHTML = "Laps: " + this.lapCount + "/" + this.targetLaps;

        } else if (tractorPosition.z < finishingLinePosition.z) {
            tractor.crossedFinishLine = false;
        }
    }

    checkPowerUpCollision() {
        const tractorPosition = this.playerTractor.object.position;

        // Star Power up 1
        const powerUpPosition1 = new THREE.Vector3(-120, 7, -20);
        const distanceToPowerUp1 = tractorPosition.distanceTo(powerUpPosition1);

        // Star Power up 2
        const powerUpPosition2 = new THREE.Vector3(90, 7, 90);
        const distanceToPowerUp2 = tractorPosition.distanceTo(powerUpPosition2);

        if (distanceToPowerUp1 < 5) {
            this.playerTractor.applyPowerUpEffect(1);
        } else if (distanceToPowerUp2 < 5) {
            this.playerTractor.applyPowerUpEffect(2);
        }
    }

}

export { MyGame };
