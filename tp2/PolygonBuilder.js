import * as THREE from 'three';

/**
 * PolygonBuilder class creates a colored polygon mesh with specified radius, colors,
 * stacks, slices, and material.
 */
class PolygonBuilder {

    /**
     * Constructs a PolygonBuilder object.
     * @param {number} radius - The radius of the polygon.
     * @param {THREE.Color} color_c - The center color of the polygon.
     * @param {THREE.Color} color_p - The perimeter color of the polygon.
     * @param {number} stacks - The number of stacks in the polygon.
     * @param {number} slices - The number of slices in each stack of the polygon.
     * @param {THREE.Material} material - The material for the polygon (default is a basic wireframe material).
     */
    constructor(
        radius, 
        color_c,
        color_p,
        stacks = 32,
        slices = 32,
        material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    ) {
        this.radius = radius;
        this.color_c = new THREE.Color(color_c.r, color_c.g, color_c.b);
        this.color_p = new THREE.Color(color_p.r, color_p.g, color_p.b);
        this.stacks = stacks;
        this.slices = slices;
        this.material = material;
        this.mesh = new THREE.Group();
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;

        console.log("material: ", material);

        this.material.vertexColors = true;

        this.build();
    }

    /**
     * Calculates and returns a color based on the startColor, endColor, and percentage.
     * @param {THREE.Color} startColor - The starting color.
     * @param {THREE.Color} endColor - The ending color.
     * @param {number} percentage - The percentage between startColor and endColor.
     * @returns {number[]} - The RGB values of the calculated color.
     */
    getColor(startColor, endColor, percentage) {
        let color = [
            startColor.r + (endColor.r - startColor.r) * percentage,
            startColor.g + (endColor.g - startColor.g) * percentage,
            startColor.b + (endColor.b - startColor.b) * percentage
        ];

        return color;
    }

    /**
     * Builds the polygon by creating a BufferGeometry and adding vertices, normals, colors, indexes, and UVs.
    */
    build() {
        console.log("Building polygon...");
        let geometry = new THREE.BufferGeometry();
        let points = [0, 0, 0];
        let normals = [0, 0, 1];
        let colors = [this.color_c[0], this.color_c[1], this.color_c[2]];
        let indexes = [];
        let uvCenterU = 0.5;
        let uvCenterV = 0.5;
        let uvRadius = 0.5;
        const uvs = [uvCenterU, uvCenterV];

        let stackPercentage = 1 / this.stacks;
        const stackRadius = this.radius / this.stacks;
        console.log("stackRadius: ", stackRadius);
        let stackColor = this.getColor(this.color_c, this.color_p, stackPercentage);

        console.log("stackPercentage: ", stackPercentage);

        // Cycle for the 1st stack
        for (let currentSliceIndex = 0; currentSliceIndex < this.slices; currentSliceIndex++) {
            const angle = (currentSliceIndex / this.slices) * (2 * Math.PI);
            const x = stackRadius * Math.cos(angle);
            const y = stackRadius * Math.sin(angle);
            points.push(x, y, 0);
            normals.push(0, 0, 1);
            
            const currentSliceIdx = 1 + (currentSliceIndex % this.slices);
            const nextSliceIdx = 1 + ((currentSliceIndex + 1) % this.slices);
            indexes.push(0, currentSliceIdx, nextSliceIdx);
            colors.push(...stackColor);
            uvs.push(uvCenterU + uvRadius * stackPercentage * Math.cos(angle), 
                     uvCenterV + uvRadius * stackPercentage * Math.sin(angle));
        }

        // Cycle for other stacks
        for (let currentStackIndex = 1; currentStackIndex < this.stacks; currentStackIndex++) {
            let currentRadius = (currentStackIndex + 1) * stackRadius;
            stackPercentage = (1 + currentStackIndex) / this.stacks;
            console.log("currentRadius: ", currentRadius);
            stackColor = this.getColor(this.color_c, this.color_p, stackPercentage);

            for (let currentSliceIndex = 0; currentSliceIndex < this.slices; currentSliceIndex++) {
                const angle = (currentSliceIndex / this.slices) * (2 * Math.PI);
                const x = currentRadius * Math.cos(angle);
                const y = currentRadius * Math.sin(angle);

                points.push(x, y, 0);
                normals.push(0, 0, 1);
                colors.push(...stackColor);
                
                const currentSlicePreviousStackIdx = 1 + ((currentStackIndex - 1) * this.slices) + (currentSliceIndex % this.slices);
                const nextSlicePreviousStackIdx = 1 + ((currentStackIndex - 1) * this.slices) + ((currentSliceIndex + 1) % this.slices);

                const currentSliceIdx = 1 + (currentStackIndex * this.slices) + (currentSliceIndex % this.slices);
                const nextSliceIdx = 1 + (currentStackIndex * this.slices) + ((currentSliceIndex + 1) % this.slices);

                indexes.push(currentSliceIdx, nextSliceIdx, nextSlicePreviousStackIdx);
                indexes.push(currentSliceIdx, nextSlicePreviousStackIdx, currentSlicePreviousStackIdx);
                uvs.push(uvCenterU + uvRadius * stackPercentage * Math.cos(angle),
                         uvCenterU + uvRadius * stackPercentage * Math.sin(angle));
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indexes), 1));
        geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));

        this.mesh.add(new THREE.Mesh(geometry, this.material));
    }

}

export { PolygonBuilder };
