import * as THREE from 'three';

class MyTrackBuilder {
    constructor(controlPoints, numSegments) {
        // Convert the control points to Vector3
        this.controlPoints = controlPoints.map(point => new THREE.Vector3(point.xx, point.yy, point.zz));
        this.numSegments = numSegments;
        this.path = this.createPath();
    }

    createPath() {
        return new THREE.CatmullRomCurve3(this.controlPoints, true); // true => closed curve
    }

    build() {
        const tubeGeometry = new THREE.TubeGeometry(
        this.path,
        this.numSegments,
        12, // Width of the tube
        20, // Radius segments
        false // Closed tube (true) or not (false)
        );

        tubeGeometry.scale(1, 0.05, 1); // Scale down the tube

        return tubeGeometry;
    }
}
export { MyTrackBuilder };