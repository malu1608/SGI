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
        const tractorPosition = this.playerTractor.position + 1;
        const finishingLinePosition = new THREE.Vector3(-10, 0.2, 80);

        if (tractorPosition.z > finishingLinePosition.z) {
            this.lapCount++;
            console.log(this.lapCount);

            this.app.lapCountDiv.innerHTML = "Laps: " + this.lapCount;

            finishingLinePosition.z += 23.5;  
        }
    }
}

export { MyGame };
