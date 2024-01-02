import * as THREE from 'three';

class MyTractor {
    constructor(tractor, app) {
        this.object = tractor;
        this.app = app;
        this.completedLaps = 0;
        this.currentSpeed = 0;
        this.turningSpeed = 0.05;
        this.accelerationRate = 0.02;
        this.maxSpeed = 1.5;
        this.orientation = tractor.rotation.y;
        this.lappedRecently = false;
        this.inTrack = true;

        // Get the wheels
        this.leftBackWheel = tractor.getObjectByName("group2 polySurface27");
        this.rightBackWheel = tractor.getObjectByName("group2 polySurface28");
        this.rightFrontWheel = tractor.getObjectByName("group2 polySurface29");
        this.leftFrontWheel = tractor.getObjectByName("group2 polySurface30");

        // Set the steering variables
        this.steering = 0;
        this.maxSteering = 0.10;
        this.steeringSpeed = 0.03;

        // Power up variables
        this.powerUpActive = false;
        this.powerUpCallback = null;
        this.resetPowerUpEffect = this.resetPowerUpEffect.bind(this);


    }

    accelerate() {
        this.currentSpeed += this.accelerationRate;
        this.currentSpeed = Math.min(this.currentSpeed, this.maxSpeed);
        this.currentSpeed = Math.max(this.currentSpeed, -this.maxSpeed);
    }

    decelerate() {
        this.currentSpeed -= this.accelerationRate;
        this.currentSpeed = Math.min(this.currentSpeed, this.maxSpeed);
        this.currentSpeed = Math.max(this.currentSpeed, -this.maxSpeed);
    }

    turnRight() {
        if (this.currentSpeed !== 0) {
            this.orientation -= this.turningSpeed;
        }
        this.steering = Math.max(this.steering - this.steeringSpeed, -this.maxSteering);
    }

    turnLeft() {
        if (this.currentSpeed !== 0) {
            this.orientation += this.turningSpeed;
        }
        this.steering = Math.min(this.steering + this.steeringSpeed, this.maxSteering);
    }

    update() {
        this.updateSpeed();
        this.updateSteering();
        this.updatePosition();
        this.updateWheelsRotation();
        this.updateLaps();
    }

    getPosition() {
        const offset = new THREE.Vector3(-10, -5.7, 2);
        return this.object.position.clone().add(offset);
    }

    updateLaps() {
        const finishingLinePosition = new THREE.Vector3(-10, 0, 80);
        const pos = this.getPosition();
        const distanceToFinish = pos.distanceTo(finishingLinePosition);

        if (distanceToFinish < 10 && !this.lappedRecently) {
            this.completedLaps++;
            this.lappedRecently = true;
        } else if (distanceToFinish > 10) {
            this.lappedRecently = false;
        }
    }

    updateSpeed() {
        this.currentSpeed -= Math.sign(this.currentSpeed) * 0.005;

        if (Math.abs(this.currentSpeed) < 0.001) {
            this.currentSpeed = 0;
        }
    }

    updateSteering() {
        this.steering -= Math.sign(this.steering) * 0.005;

        if (Math.abs(this.steering) < 0.004) {
            this.steering = 0;
        }
    }

    updatePosition() {
        this.object.position.x += this.currentSpeed * Math.sin(this.orientation);
        this.object.position.z += this.currentSpeed * Math.cos(this.orientation);
    }

    updateWheelsRotation() {
        this.rightFrontWheel.rotation.y = this.steering;
        this.leftFrontWheel.rotation.y = this.steering;
        this.rightBackWheel.rotation.y = this.steering * 0.5;
        this.leftBackWheel.rotation.y = this.steering * 0.5;
        this.object.rotation.y = this.orientation;
    }

    tractorOutTrack() {
        if(!this.inTrack) return;

        this.inTrack = false;
        this.maxSpeed = this.maxSpeed / 2;
    }

    tractorInTrack() {
        if(this.inTrack) return;

        this.inTrack = true;
        this.maxSpeed = this.maxSpeed * 2;
    }

    applyPowerUpEffect() {
        if (!this.powerUpActive) {
            this.maxSpeed = 3.0;
            this.currentSpeed = Math.min(this.currentSpeed + this.accelerationRate, this.maxSpeed);
            this.powerUpActive = true;
    
            const duration = 4; 
            let remainingTime = duration;
    
            this.powerUpTimeout = setInterval(() => {
                remainingTime -= 0.1; 
                remainingTime = Math.max(0, remainingTime); // Ensure it doesn't go below zero
                this.updatePowerUpDuration(remainingTime);
    
                if (remainingTime <= 0) {
                    this.resetPowerUpEffect();
                }
            }, 50); 
        }
    }
    
    resetPowerUpEffect() {
        this.maxSpeed = 1.5;
        this.inTrack = true;
        this.powerUpActive = false;

        clearTimeout(this.powerUpTimeout);
    }

    updatePowerUpDuration(remainingTime) {
        this.app.durationDiv.innerHTML = "The power up will end in " + remainingTime.toFixed(0) + "s";

        if (remainingTime <= 0) {
            this.app.durationDiv.innerHTML = "";
        }
    }
}

export { MyTractor };