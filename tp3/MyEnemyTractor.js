import * as THREE from 'three';

class MyEnemyTractor {
    constructor(app,tractor){
        this.app = app;
        this.object = tractor;
        this.mixer = new THREE.AnimationMixer(tractor);

        this.clock = new THREE.Clock();
        this.clock.start();

        this.initRoute();
    }

    initRoute(){
        this.routePoints = this.object.data.representations[0].controlpoints.map(point => new THREE.Vector3(point.xx,point.yy,point.zz));
        this.routePoints.push(this.routePoints[0]);

        this.routeQuaternions = this.object.data.representations[0].controlpoints.map(point => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(point.rotation)));
        this.routeQuaternions.push(this.routeQuaternions[0]);

        // Position and rotation keyframe tracks
        const positionKF = new THREE.VectorKeyframeTrack(
            '.position',
            [...Array(this.routePoints.length).keys()],
            [].concat(...this.routePoints.map(point => [...point.toArray()])),
            THREE.InterpolateSmooth
        );

        const quaternionKF = new THREE.QuaternionKeyframeTrack(
            '.quaternion',
            [...Array(this.routeQuaternions.length).keys()],
            [].concat(...this.routeQuaternions.map(point => [...point.toArray()])),
        );

        // Animation clip
        const clip = new THREE.AnimationClip('Action', -1, [positionKF, quaternionKF]);

        // Animation action
        this.action = this.mixer.clipAction(clip);
        this.action.timeScale = 0.3;
        this.action.play();
    }

    update(){
        this.mixer.update(this.clock.getDelta());
    }
}

export { MyEnemyTractor };