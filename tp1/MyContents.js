import * as THREE from 'three';
import { MyAxis } from './MyAxis.js';

/**
 *  This class contains the contents of out application
 */
class MyContents  {

    /**
       constructs the object
       @param {MyApp} app The application object
    */ 
    constructor(app) {
        this.app = app
        this.axis = null

        // box related attributes
        this.boxMesh = null
        this.boxMeshSize = 1.0
        this.boxEnabled = true
        this.lastBoxEnabled = null
        this.boxDisplacement = new THREE.Vector3(0,2,0)

        // plane related attributes
        this.diffusePlaneColor = "#00ffff"
        this.specularPlaneColor = "#777777"
        this.planeShininess = 30
        this.planeMaterial = new THREE.MeshPhongMaterial({ color: this.diffusePlaneColor, 
            specular: this.diffusePlaneColor, emissive: "#000000", shininess: this.planeShininess })
    }

    /**
     * builds the box mesh with material assigned
     */
    buildBox() {    
        let boxMaterial = new THREE.MeshPhongMaterial({ color: "#ffff77", 
        specular: "#000000", emissive: "#000000", shininess: 90 })

        // Create a Cube Mesh with basic material
        let box = new THREE.BoxGeometry(  this.boxMeshSize,  this.boxMeshSize,  this.boxMeshSize );
        this.boxMesh = new THREE.Mesh( box, boxMaterial );
        this.boxMesh.rotation.x = -Math.PI / 2;
        this.boxMesh.position.y = this.boxDisplacement.y;
    }

    /**
     * initializes the contents
     */
    init() {
       
        // create once 
        if (this.axis === null) {
            // create and attach the axis to the scene
            this.axis = new MyAxis(this)
            this.app.scene.add(this.axis)
        }

        // add a point light on top of the model
        const pointLight = new THREE.PointLight( 0xffffff, 500, 0 );
        pointLight.position.set( 0, 20, 0 );
        this.app.scene.add( pointLight );

        // add a point light helper for the previous point light
        const sphereSize = 0.5;
        const pointLightHelper = new THREE.PointLightHelper( pointLight, sphereSize );
        this.app.scene.add( pointLightHelper );

        // add an ambient light
        const ambientLight = new THREE.AmbientLight( 0x555555 );
        this.app.scene.add( ambientLight );

        this.buildBox()
        
        // Create a Plane Mesh with basic material
        
        const planeWidth = 13.4; 
        const planeHeight = 13.4; 
        const planeColor = 0x8B5A2B; // Cor chão
    
        let plane = new THREE.PlaneGeometry(planeWidth, planeHeight);
        this.planeMaterial = new THREE.MeshBasicMaterial({ color: planeColor });
        this.planeMesh = new THREE.Mesh(plane, this.planeMaterial);
        this.planeMesh.rotation.x = -Math.PI / 2;
        this.planeMesh.position.y = -0; 
        this.app.scene.add(this.planeMesh);
        
        // Paredes
        this.createWalls();

        // Mesa
        const table = this.createTable();
        this.createLegs(table);
        const plate =  this.createPlate(table);
        const cake = this.createCake(plate); 
        const candle = this.createCandle(cake);
        this.createFlame(candle);
        this.createSmallPlate(table);

        // Cadeira
        const chair = this.createChair();
        this.app.scene.add(chair);
    }

    createWalls() {    
        const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xe2b5f5 }); // Cor das paredes 
    
        let wall1Geometry = new THREE.PlaneGeometry(13.4, 7);
        let wall1Mesh = new THREE.Mesh(wall1Geometry, wallMaterial);
        wall1Mesh.rotation.x = 0;
        wall1Mesh.position.set(0, 3.5, -6.7);
        this.app.scene.add(wall1Mesh);

        let wall2Geometry = new THREE.PlaneGeometry(13.4, 7);
        let wall2Mesh = new THREE.Mesh(wall2Geometry, wallMaterial);
        wall2Mesh.rotation.y = Math.PI / 2;
        wall2Mesh.position.set(-6.7, 3.5, 0);
        this.app.scene.add(wall2Mesh);

        let wall3Geometry = new THREE.PlaneGeometry(13.4, 7);
        let wall3Mesh = new THREE.Mesh(wall3Geometry, wallMaterial);
        wall3Mesh.rotation.y = -Math.PI / 2;
        wall3Mesh.position.set(6.7, 3.5, 0);
        this.app.scene.add(wall3Mesh);

        let wall4Geometry = new THREE.PlaneGeometry(13.4, 7);
        let wall4Mesh = new THREE.Mesh(wall4Geometry, wallMaterial);
        wall4Mesh.rotation.x = Math.PI;
        wall4Mesh.position.set(0, 3.5, 6.7);
        this.app.scene.add(wall4Mesh);

    }

    createTable() {
        const tableWidth = 4; 
        const tableLength = 8;
        const tableHeight = 0.2; 

        const tableGeometry = new THREE.BoxGeometry(tableWidth, tableHeight, tableLength);
        const tableMaterial = new THREE.MeshBasicMaterial({ color: 0x2E1D06 }); // Cor da mesa

        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.rotation.x = -Math.PI;
        table.position.set(0, 2, 0);
        this.app.scene.add(table);

        return table;
    }

    createLegs(table) {
        const legRadius = 0.1; 
        const legHeight = 2; 

        const legMaterial = new THREE.MeshBasicMaterial({ color: 0x2E1D06 }); // Cor das pernas

        const legPositions = [
            { x: -table.geometry.parameters.width / 2 + legRadius, y: legHeight / 2, z: -table.geometry.parameters.depth / 2 + legRadius }, // Canto esquerdo
            { x: table.geometry.parameters.width / 2 - legRadius, y: legHeight / 2, z: -table.geometry.parameters.depth / 2 + legRadius }, // Canto direito
            { x: -table.geometry.parameters.width / 2 + legRadius, y: legHeight / 2, z: table.geometry.parameters.depth / 2 - legRadius }, // Canto esquerdo
            { x: table.geometry.parameters.width / 2 - legRadius, y: legHeight / 2, z: table.geometry.parameters.depth / 2 - legRadius }, // Canto direito
        ];
    
        for (let i = 0; i < legPositions.length; i++) {
            const legPosition = legPositions[i];
            const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 32);
            const leg = new THREE.Mesh(legGeometry, legMaterial);
    
            leg.position.set(legPosition.x, legPosition.y, legPosition.z);
            table.add(leg);
        }
    }

    createPlate(table) {
        const plateRadius = 1.2; 
        const plateHeight = 0.08; 
        const plateMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Cor do prato
    
        const plateGeometry = new THREE.CylinderGeometry(plateRadius, plateRadius, plateHeight, 32);
        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    
        plate.position.set(0, -0.15, 0);
        table.add(plate); 

        return plate;
    }

    createSmallPlate(table) {
        const plateRadius = 0.6; 
        const plateHeight = 0.05; 
        const plateMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Cor do prato
    
        const plateGeometry = new THREE.CylinderGeometry(plateRadius, plateRadius, plateHeight, 32);
        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    
        plate.position.set(0, -0.15, -3.2);
        table.add(plate); 

        return plate;
    }

    createCake(plate) {
        const cakeRadius = 0.9; 
        const cakeHeight = 1; 
        const cakeMaterial = new THREE.MeshBasicMaterial({ color: 0xe7a8ba }); // Cor do bolo
    
        const cakeGeometry = new THREE.CylinderGeometry(cakeRadius, cakeRadius, cakeHeight, 32, 1, false, 0, Math.PI * 7/4);

        let side1 = new THREE.PlaneGeometry(cakeRadius, cakeHeight);
        let side2 = new THREE.PlaneGeometry(cakeRadius, cakeHeight);
        side1 = new THREE.Mesh(side1, cakeMaterial);
        side2 = new THREE.Mesh(side2, cakeMaterial);

        const cake = new THREE.Mesh(cakeGeometry, cakeMaterial);

        cake.position.set(0, side1.position.y - cakeHeight / 2, 0);

        side1.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 4);
        side1.position.set(side1.position.x - Math.cos(Math.PI / 4) * (cakeRadius / 2), side1.position.y - cakeHeight / 2, side1.position.z + Math.sin(Math.PI / 4) * (cakeRadius / 2));
        side2.rotateOnAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
        side2.position.set(side2.position.x, side2.position.y - cakeHeight / 2, side2.position.z + (cakeRadius / 2));

        plate.add(cake, side1, side2); 

        return cake;
    }


    createCandle(cake) {
        const candleRadius = 0.05; 
        const candleHeight = 0.5;
        const candleMaterial = new THREE.MeshBasicMaterial({ color: 0xf0e0a3 }); // Cor da vela
    
        const candleGeometry = new THREE.CylinderGeometry(candleRadius, candleRadius, candleHeight, 32);
        const candle = new THREE.Mesh(candleGeometry, candleMaterial);
     
        candle.position.set(0, -0.7, 0);
        cake.add(candle); 

        return candle;
    }

    createFlame(candle) {
        const flameRadius = 0.06; 
        const flameHeight = 0.1; 
        const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xff7f00 }); // Cor da chama
    
        const flameGeometry = new THREE.ConeGeometry(flameRadius, flameHeight, 32);
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        
        flame.rotation.x = -Math.PI;
        flame.position.set(0, -0.3, 0);
    
        candle.add(flame); 
    }

    createChair() {
        const chairWidth = 1.5; 
        const chairHeight = 3;
        const chairDepth = 1.8; 
        const chairLegsHeight = 0.8; 
        const chairMaterial = new THREE.MeshBasicMaterial({ color: 0x654321 }); // Cor da cadeira
        
        const seatGeometry = new THREE.BoxGeometry(chairWidth, 0.2, chairDepth);
        const seat = new THREE.Mesh(seatGeometry, chairMaterial);
        seat.position.set(-2.5, -0.3, 5);
        
        const backrestGeometry = new THREE.BoxGeometry(chairWidth, chairHeight - chairLegsHeight, 0.2);
        const backrest = new THREE.Mesh(backrestGeometry, chairMaterial);
        backrest.position.set(-2.5, 0.9, 5.8);

        // Agrupa todas as partes da cadeira
        const chairGroup = new THREE.Group();
        chairGroup.add(seat, backrest);

        chairGroup.position.set(2.5, chairHeight / 2, 0); 
        this.app.scene.add(chairGroup);
        this.createChairLegs(chairGroup);

        return chairGroup; 
    }

    createChairLegs(chair) {
        const legRadius = 0.1; 
        const legHeight = 1.2;
    
        const legMaterial = new THREE.MeshBasicMaterial({ color: 0x472c11 }); // Cor das pernas
    
        const legPositions = [
            { x: -3.1, y: -1, z: 4.2 }, // Canto esquerdo da frente
            { x: -1.9, y: -1, z: 4.2 }, // Canto direito da frente
            { x: -3.1, y: -1, z: 5.8 }, // Canto esquerdo de trás
            { x: -1.9, y: -1, z: 5.8 }, // Canto direito de trás
        ];
    
        for (let i = 0; i < legPositions.length; i++) {
            const legPosition = legPositions[i];
            const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 32);
            const leg = new THREE.Mesh(legGeometry, legMaterial);
    
            leg.position.set(legPosition.x, legPosition.y, legPosition.z);
            chair.add(leg);
        }
    }

    
    /**
     * updates the diffuse plane color and the material
     * @param {THREE.Color} value 
     */
    updateDiffusePlaneColor(value) {
        this.diffusePlaneColor = value
        this.planeMaterial.color.set(this.diffusePlaneColor)
    }
    /**
     * updates the specular plane color and the material
     * @param {THREE.Color} value 
     */
    updateSpecularPlaneColor(value) {
        this.specularPlaneColor = value
        this.planeMaterial.specular.set(this.specularPlaneColor)
    }
    /**
     * updates the plane shininess and the material
     * @param {number} value 
     */
    updatePlaneShininess(value) {
        this.planeShininess = value
        this.planeMaterial.shininess = this.planeShininess
    }
    
    /**
     * rebuilds the box mesh if required
     * this method is called from the gui interface
     */
    rebuildBox() {
        // remove boxMesh if exists
        if (this.boxMesh !== undefined && this.boxMesh !== null) {  
            this.app.scene.remove(this.boxMesh)
        }
        this.buildBox();
        this.lastBoxEnabled = null
    }
    
    /**
     * updates the box mesh if required
     * this method is called from the render method of the app
     * updates are trigered by boxEnabled property changes
     */
    updateBoxIfRequired() {
        if (this.boxEnabled !== this.lastBoxEnabled) {
            this.lastBoxEnabled = this.boxEnabled
            if (this.boxEnabled) {
                this.app.scene.add(this.boxMesh)
            }
            else {
                this.app.scene.remove(this.boxMesh)
            }
        }
    }

    /**
     * updates the contents
     * this method is called from the render method of the app
     * 
     */
    update() {
        // check if box mesh needs to be updated
        this.updateBoxIfRequired()

        // sets the box mesh position based on the displacement vector
        this.boxMesh.position.x = this.boxDisplacement.x
        this.boxMesh.position.y = this.boxDisplacement.y
        this.boxMesh.position.z = this.boxDisplacement.z
        
    }

}

export { MyContents };