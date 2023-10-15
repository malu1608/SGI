import * as THREE from 'three';
import { MyAxis } from './MyAxis.js';
import { MyNurbsBuilder } from './MyNurbsBuilder.js';
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

        // Box related attributes
        this.boxMesh = null
        this.boxMeshSize = 1.0
        this.boxEnabled = true
        this.lastBoxEnabled = null
        this.boxDisplacement = new THREE.Vector3(0,2,0)

        // Plane related attributes
        this.diffusePlaneColor = "#00ffff"
        this.specularPlaneColor = "#777777"
        this.planeShininess = 30
        this.planeMaterial = new THREE.MeshPhongMaterial({ color: this.diffusePlaneColor, 
            specular: this.diffusePlaneColor, emissive: "#000000", shininess: this.planeShininess })

        // Textures
        this.tableTexture = new THREE.TextureLoader().load('textures/table.jpg');
        this.wallTexture = new THREE.TextureLoader().load('textures/wall.jpg');
        this.floorTexture = new THREE.TextureLoader().load('textures/floor.jpg');
        this.chairTexture = new THREE.TextureLoader().load('textures/chair.jpg');
        this.doorTexture = new THREE.TextureLoader().load('textures/door.jpg');
        this.dishTexture = new THREE.TextureLoader().load('textures/dish.jpg');
        this.flameTexture = new THREE.TextureLoader().load('textures/flame.jpg');
        this.carpetTexture = new THREE.TextureLoader().load('textures/carpet.jpg');
        this.booksTexture = new THREE.TextureLoader().load('textures/books.jpg');
        this.friends1Texture = new THREE.TextureLoader().load('textures/amigas1.jpg');
        this.friends2Texture = new THREE.TextureLoader().load('textures/amigas2.jpg');
        this.windowTexture = new THREE.TextureLoader().load('textures/window.jpg');
        this.whitewoodTexture = new THREE.TextureLoader().load('textures/whitewood.jpg');
        this.borderTexture = new THREE.TextureLoader().load('textures/border.jpg');

        // Newspaper
        this.builder = new MyNurbsBuilder(this.app);
        const newspaperTexture = new THREE.TextureLoader().load('textures/jornal.jpg');
        newspaperTexture.wrapS = newspaperTexture.wrapT = THREE.RepeatWrapping;
        newspaperTexture.anisotropy = 16;
        newspaperTexture.colorSpace = THREE.SRGBColorSpace;
        this.newspaperMaterial = new THREE.MeshLambertMaterial( { map: newspaperTexture, side: THREE.DoubleSide,
            transparent: true, opacity: 0.90 } );
        this.meshes = [];
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
       
        // Create once 
        if (this.axis === null) {
            // create and attach the axis to the scene
            this.axis = new MyAxis(this)
            this.app.scene.add(this.axis)
        }

        // Add a point light on top of the model   
        const pointLight = new THREE.PointLight( 0xffffff, 100, 17 );
        pointLight.position.set(0, 10, 0);
        this.app.scene.add(pointLight);

        // Add a point light helper for the previous point light
        const sphereSize = 0.5;
        const pointLightHelper = new THREE.PointLightHelper( pointLight, sphereSize );
        this.app.scene.add(pointLightHelper);
        const f_color = 0xffffff;
        const spotLight = new THREE.SpotLight(f_color, 2, 10,Math.PI/12,0,0);
        spotLight.position.set(0,10,0);
        spotLight.penumbra = 0.7;

        this.app.scene.add(spotLight);
        spotLight.target.position.set(0,0.5,0);
        this.app.scene.add(spotLight.target);

        // Add an ambient light
        const ambientLight = new THREE.AmbientLight( 0x555555 );
        this.app.scene.add(ambientLight);

        this.buildBox()
        
        // Create a Plane Mesh with basic material
        const planeWidth = 25; 
        const planeHeight = 25; 
    
        let plane = new THREE.PlaneGeometry(planeWidth, planeHeight);
        this.planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, map: this.floorTexture });
        this.planeMesh = new THREE.Mesh(plane, this.planeMaterial);
        this.planeMesh.rotation.x = -Math.PI / 2;
        this.planeMesh.position.y = -0; 
        this.app.scene.add(this.planeMesh);
        
        // Walls
        this.createWalls();
        this.createDoor();
        this.createBookshelf();
        this.createWindow();
        this.createFrames();
        this.createCarocha();

        // Table
        const table = this.createTable();
        this.createLegs(table);
        const plate =  this.createPlate(table);
        const cake = this.createCake(plate); 
        const candle = this.createCandle(cake);
        this.createFlame(candle);
        this.createSmallPlate(table);
        this.createSpiral();
        this.createNewspaper();

        // Floor
        this.createCarpet();

        // Chair
        const chair = this.createChair();
        this.app.scene.add(chair);
    }


    createWalls() {    
        const diffuseColor = 0xefd6da;
        const wallMaterial = new THREE.MeshPhongMaterial({ color: diffuseColor, map: this.wallTexture });
        const wallGeometry = new THREE.PlaneGeometry(25, 7);

        const wall1Mesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wall1Mesh.rotation.x = 0;
        wall1Mesh.position.set(0, 3.5, -12.5);
        this.app.scene.add(wall1Mesh);

        const wall2Mesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wall2Mesh.rotation.y = Math.PI / 2;
        wall2Mesh.position.set(-12.5, 3.5, 0);
        this.app.scene.add(wall2Mesh);

        const wall3Mesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wall3Mesh.rotation.y = -Math.PI / 2;
        wall3Mesh.position.set(12.5, 3.5, 0);
        this.app.scene.add(wall3Mesh);

        const wall4Mesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wall4Mesh.rotation.x = Math.PI;
        wall4Mesh.position.set(0, 3.5, 12.5);
        this.app.scene.add(wall4Mesh);

    }

    createBookshelf() {
        const shelfWidth = 3.0;
        const shelfHeight = 0.15;
        const shelfThickness = 0.6;
    
        const shelfGeometry = new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfThickness);
        const shelfMaterial = new THREE.MeshPhongMaterial({color: 0xbb9469, map: this.tableTexture });
    
        const shelfMesh = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelfMesh.position.set(8.5, 4.0, 12.2);
        this.app.scene.add(shelfMesh);

        const rectangleWidth = 1.5;
        const rectangleHeight = 1.0;
        const rectangleDepth = 0.4;
        
        const rectangleGeometry = new THREE.BoxGeometry(rectangleWidth, rectangleHeight, rectangleDepth);
        const rectangleMaterial = new THREE.MeshPhongMaterial({ color: 0xf0e0a3, map: this.booksTexture });
        
        const rectangleMesh = new THREE.Mesh(rectangleGeometry, rectangleMaterial);
        rectangleMesh.position.set(-0.5, 0.5, 0);
        shelfMesh.add(rectangleMesh);
    
        return shelfMesh;
    }
    
    createDoor() {
        const doorWidth = 2.7;
        const doorHeight = 5.7;
        const doorThickness = 0.15;
    
        const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness);
        const doorMaterial = new THREE.MeshPhongMaterial({color: 0xbb9469, map: this.doorTexture });
    
        const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
        doorMesh.position.set(-8.5, doorHeight / 2, 12.5);
        this.app.scene.add(doorMesh);
    
        return doorMesh;
    }

    createCarpet() {
        const carpetWidth = 8;
        const carpetLength = 14.5;
        const carpetThickness = 0.02;
    
        const carpetGeometry = new THREE.BoxGeometry(carpetWidth, carpetThickness, carpetLength);
        const carpetMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, map: this.carpetTexture });
    
        const carpetMesh = new THREE.Mesh(carpetGeometry, carpetMaterial);
        carpetMesh.position.set(0, carpetThickness / 2, 0); 
        this.app.scene.add(carpetMesh);
    
        return carpetMesh;
    }

    createTable() {
        const tableWidth = 4; 
        const tableLength = 8;
        const tableHeight = 0.2; 

        const tableGeometry = new THREE.BoxGeometry(tableWidth, tableHeight, tableLength);
        const tableMaterial = new THREE.MeshPhongMaterial({color: 0xbb9469, map: this.tableTexture });

        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.rotation.x = -Math.PI;
        table.position.set(0, 2, 0);
        this.app.scene.add(table);

        return table;
    }

    createLegs(table) {
        const legRadius = 0.1; 
        const legHeight = 2; 

        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513, specular: 0xffffff, shininess: 500 });
        const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 32);

        const legPositions = [
            { x: -table.geometry.parameters.width / 2 + legRadius, y: legHeight / 2, z: -table.geometry.parameters.depth / 2 + legRadius }, // Canto esquerdo
            { x: table.geometry.parameters.width / 2 - legRadius, y: legHeight / 2, z: -table.geometry.parameters.depth / 2 + legRadius }, // Canto direito
            { x: -table.geometry.parameters.width / 2 + legRadius, y: legHeight / 2, z: table.geometry.parameters.depth / 2 - legRadius }, // Canto esquerdo
            { x: table.geometry.parameters.width / 2 - legRadius, y: legHeight / 2, z: table.geometry.parameters.depth / 2 - legRadius }, // Canto direito
        ];
    
        for (let i = 0; i < legPositions.length; i++) {
            const legPosition = legPositions[i];
            const leg = new THREE.Mesh(legGeometry, legMaterial);
    
            leg.position.set(legPosition.x, legPosition.y, legPosition.z);
            table.add(leg);
        }
    }

    createPlate(table) {
        const plateRadius = 1.2; 
        const plateHeight = 0.08; 

        const plateMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, map: this.dishTexture });
        const plateGeometry = new THREE.CylinderGeometry(plateRadius, plateRadius, plateHeight, 32);

        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
        plate.position.set(0, -0.15, 0);
        table.add(plate); 

        return plate;
    }

    createSmallPlate(table) {
        const plateRadius = 0.6; 
        const plateHeight = 0.05; 

        const plateMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, map: this.dishTexture });
        const plateGeometry = new THREE.CylinderGeometry(plateRadius, plateRadius, plateHeight, 32);
        
        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
        plate.position.set(0, -0.15, -3.2);
        table.add(plate); 

        return plate;
    }

    createCake(plate) {
        const cakeRadius = 0.9; 
        const cakeHeight = 1; 

        const cakeMaterial = new THREE.MeshPhongMaterial({ color: 0xe7a8ba, specular: 0xe7a8ba, shininess: 100}); // Cor do bolo
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

        const flameMaterial = new THREE.MeshPhongMaterial({color: 0xff7f00, map: this.flameTexture });
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

        const chairMaterial = new THREE.MeshPhongMaterial({ color: 0xefd6da, map: this.chairTexture });
        
        const seatGeometry = new THREE.BoxGeometry(chairWidth, 0.2, chairDepth);
        const seat = new THREE.Mesh(seatGeometry, chairMaterial);
        seat.position.set(-2.5, -0.3, 5);
        
        const backrestGeometry = new THREE.BoxGeometry(chairWidth, chairHeight - chairLegsHeight, 0.2);
        const backrest = new THREE.Mesh(backrestGeometry, chairMaterial);
        backrest.position.set(-2.5, 0.9, 5.8);

        // Agrupa todas as partes da cadeira
        const chairGroup = new THREE.Group();
        chairGroup.add(seat, backrest);

        chairGroup.position.set(2.5, 1.6, 0); 
        this.app.scene.add(chairGroup);
        this.createChairLegs(chairGroup);

        return chairGroup; 
    }

    createChairLegs(chair) {
        const legRadius = 0.1; 
        const legHeight = 1.2;
    
        const legMaterial = new THREE.MeshBasicMaterial({ color: 0x363636 }); // Cor das pernas
    
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

    createFrames() {
        const frameWidth = 2;
        const frameHeight = 1.5;
        const borderWidth = 2.3;
        const borderHeight = 1.8;

        const frameGeometry = new THREE.PlaneGeometry(frameWidth, frameHeight);
        const borderGeometry = new THREE.PlaneGeometry(borderWidth, borderHeight);

        const frame1Material = new THREE.MeshPhongMaterial({ map:this.friends1Texture }); 
        const frame2Material = new THREE.MeshPhongMaterial({ map:this.friends2Texture }); 
        const borderMaterial = new THREE.MeshBasicMaterial({ color: 0xbb9469, map:this.borderTexture }); 
        
        const frame1 = new THREE.Mesh(frameGeometry, frame1Material);
        frame1.position.set(-3, 4, -12.48); 
    
        const border1 = new THREE.Mesh(borderGeometry, borderMaterial);
        border1.position.set(-3, 4, -12.49); 
        
        const frame2 = new THREE.Mesh(frameGeometry, frame2Material);
        frame2.position.set(3, 4, -12.48); 
    
        const border2 = new THREE.Mesh(borderGeometry, borderMaterial);
        border2.position.set(3, 4, -12.49); 
        
        this.app.scene.add(frame1);
        this.app.scene.add(border1);
        this.app.scene.add(frame2);
        this.app.scene.add(border2);
    }

    createWindow() {
        const windowWidth = 6;
        const windowHeight = 2.5;
        const borderWidth = 6.3;
        const borderHeight = 2.8;

        const windowGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight);
        const borderGeometry = new THREE.PlaneGeometry(borderWidth, borderHeight);

        const windowMaterial = new THREE.MeshPhongMaterial({ map:this.windowTexture }); 
        const borderMaterial = new THREE.MeshPhongMaterial({ map:this.whitewoodTexture }); 
        
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.rotation.y = Math.PI / 2;
        window.position.set(-12.48, 4, 0);
    
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.rotation.y = Math.PI / 2;
        border.position.set(-12.49, 4, 0);
        
        this.app.scene.add(window);
        this.app.scene.add(border);
    }

    createSpiral() {
        const numLoops = 5;         
        const numSegmentsPerLoop = 20; 
        const radius = 0.3;            
        const pitch = 0.2;           

        const spiralPoints = [];

        for (let i = 0; i < numLoops * numSegmentsPerLoop; i++) {
            const t = i / numSegmentsPerLoop;
            const x = radius * Math.cos(t * 2 * Math.PI);
            const y = radius * Math.sin(t * 2 * Math.PI);
            const z = t * pitch;
            spiralPoints.push(new THREE.Vector3(x, y, z));
        }

        const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints);
        const spiralMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

        const spiral = new THREE.Line(spiralGeometry, spiralMaterial);
        spiral.position.set(-0.8, 3, -3); 
        spiral.rotation.x = Math.PI / 2;
        this.app.scene.add(spiral);

      }

      createCarocha() {
        this.mesh = new THREE.Group();
        const scale = 0.5;

        const startPoint = new THREE.Vector3(-4.0, 1.5, 24.8);
        const controlPoint = new THREE.Vector3(-4.0, 3.5, 24.8); 
        const controlPoint_2 = new THREE.Vector3(-1.0, 3.5, 24.8); 
        const endPoint = new THREE.Vector3(-1.0, 1.5, 24.8);

        const curve = new THREE.CubicBezierCurve3(startPoint, controlPoint, controlPoint_2, endPoint);
        const curveGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)); 
        const curveMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        this.curveObject = new THREE.Line(curveGeometry, curveMaterial);

        const startPoint2 = new THREE.Vector3(-4.0, 1.5, 24.8);
        const controlPoint2 = new THREE.Vector3(-4.0, 4.0, 24.8); 
        const controlPoint2_1 = new THREE.Vector3(-2.5, 5.5, 24.8); 
        const endPoint2 = new THREE.Vector3(0, 5.5, 24.8);

        const curve2 = new THREE.CubicBezierCurve3(startPoint2, controlPoint2, controlPoint2_1, endPoint2);
        const curveGeometry2 = new THREE.BufferGeometry().setFromPoints(curve2.getPoints(50)); 
        const curveMaterial2 = new THREE.LineBasicMaterial({ color: 0x000000 });
        this.curveObject2 = new THREE.Line(curveGeometry2, curveMaterial2);

        const startPoint3 = new THREE.Vector3(0, 5.5, 24.8);
        const controlPoint3_1 = new THREE.Vector3(1.0, 5.5, 24.8); 
        const controlPoint3_2 = new THREE.Vector3(2.0, 4.5, 24.8); 
        const endPoint3 = new THREE.Vector3(2.0, 3.5, 24.8);

        const curve3 = new THREE.CubicBezierCurve3(startPoint3, controlPoint3_1, controlPoint3_2, endPoint3);
        const curveGeometry3 = new THREE.BufferGeometry().setFromPoints(curve3.getPoints(50)); 
        const curveMaterial3 = new THREE.LineBasicMaterial({ color: 0x000000 });
        this.curveObject3 = new THREE.Line(curveGeometry3, curveMaterial3);

        const startPoint4 = new THREE.Vector3(2.0, 3.5, 24.8);
        const controlPoint4_1 = new THREE.Vector3(3.0, 3.5, 24.8); 
        const controlPoint4_2 = new THREE.Vector3(4.0, 2.5, 24.8); 
        const endPoint4 = new THREE.Vector3(4.0, 1.5, 24.8);

        const curve4 = new THREE.CubicBezierCurve3(startPoint4, controlPoint4_1, controlPoint4_2, endPoint4);
        const curveGeometry4 = new THREE.BufferGeometry().setFromPoints(curve4.getPoints(50)); 
        const curveMaterial4 = new THREE.LineBasicMaterial({ color: 0x000000 });
        this.curveObject4 = new THREE.Line(curveGeometry4, curveMaterial4);

        const startPoint5 = new THREE.Vector3(1.0, 1.5, 24.8);
        const controlPoint5_1 = new THREE.Vector3(1.0, 3.5, 24.8); 
        const controlPoint5_2 = new THREE.Vector3(4.0, 3.5, 24.8);
        const endPoint5 = new THREE.Vector3(4.0, 1.5, 24.8);

        const curve5 = new THREE.CubicBezierCurve3(startPoint5, controlPoint5_1, controlPoint5_2, endPoint5);
        const curveGeometry5 = new THREE.BufferGeometry().setFromPoints(curve5.getPoints(50)); 
        const curveMaterial5 = new THREE.LineBasicMaterial({ color: 0x000000 });
        this.curveObject5 = new THREE.Line(curveGeometry5, curveMaterial5);

        this.mesh.add(this.curveObject);
        this.mesh.add(this.curveObject2);
        this.mesh.add(this.curveObject3);
        this.mesh.add(this.curveObject4);
        this.mesh.add(this.curveObject5);

        this.mesh.scale.set(scale, scale, scale);

        // Frame
        const frameGeometry = new THREE.BoxGeometry(8.5, 0.1, 5);
        const frameMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
      
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.rotation.x = Math.PI / 2;
        frame.position.set(0, 4.0, 24.9);
    
        this.mesh.add(frame);
        this.app.scene.add(this.mesh);
      }

      createNewspaper() {
        const newspaperSamplesU = 18;
        const newspaperSamplesV = 18;
        const newspaperOrderU = 2;
        const newspaperOrderV = 1;

        let newspaperMesh;
        let controlPoints;
        let surfaceData;

        controlPoints = [
            // U = 0
                [ // V = 0..1
                    [ -0.75, -1.0, 0.0, 1.0 ],
                    [ -0.75, 1.0, 0.0, 1.0 ]
                ],

            // U = 1
                [ // V = 0..1
                    [ 0.0, -1.0, 1.0, 1.0 ],
                    [ 0.0, 1.0, 1.0, 1.0 ]
                ],

            // U = 2
                [ // V = 0..1
                    [ 0.75, -1.0, 0.0, 1.0 ],
                    [ 0.75, 1.0, 0.0, 1.0 ]
                ]
            ];
       
        surfaceData = this.builder.build(controlPoints, newspaperOrderU, newspaperOrderV, newspaperSamplesU,
            newspaperSamplesV, this.newspaperMaterial);

        newspaperMesh = new THREE.Mesh(surfaceData, this.newspaperMaterial);
        newspaperMesh.rotation.x = Math.PI/2;
        newspaperMesh.rotation.y = 0;
        newspaperMesh.rotation.z = Math.PI;
        newspaperMesh.position.set(1, 2.6, -2.8);
        
        this.app.scene.add(newspaperMesh);
        this.meshes.push(newspaperMesh);
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