
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MyContents } from './MyContents.js';
import { MyGuiInterface } from './MyGuiInterface.js';
import Stats from 'three/addons/libs/stats.module.js'

/**
 * This class contains the application object
 */
class MyApp  {
    /**
     * the constructor
     */
    constructor() {
        this.scene = null
        this.stats = null

        // camera related attributes
        this.activeCamera = null
        this.activeCameraName = null
        this.lastCameraName = null
        this.cameras = []
        this.frustumSize = 20

        // other attributes
        this.renderer = null
        this.controls = null
        this.gui = null
        this.axis = null
        this.contents == null
    }
    /**
     * initializes the application
     */
    init() {
                
        // Create an empty scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x101010 );

        this.stats = new Stats()
        this.stats.showPanel(1) // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom)

        this.initCameras();
        this.setActiveCamera('Perspective1')

        // Create a renderer with Antialiasing
        this.renderer = new THREE.WebGLRenderer({antialias:true});
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setClearColor("#000000");

        // Configure renderer size
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        // Append Renderer to DOM
        document.getElementById("canvas").appendChild( this.renderer.domElement );

        // manage window resizes
        window.addEventListener('resize', this.onResize.bind(this), false );

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
        this.scene.add(chair);
    }

    createWalls() {    
        const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xe2b5f5 }); // Cor das paredes 
    
        let wall1Geometry = new THREE.PlaneGeometry(13.4, 7);
        let wall1Mesh = new THREE.Mesh(wall1Geometry, wallMaterial);
        wall1Mesh.rotation.x = 0;
        wall1Mesh.position.set(0, 3.5, -6.7);
        this.scene.add(wall1Mesh);

        let wall2Geometry = new THREE.PlaneGeometry(13.4, 7);
        let wall2Mesh = new THREE.Mesh(wall2Geometry, wallMaterial);
        wall2Mesh.rotation.y = Math.PI / 2;
        wall2Mesh.position.set(-6.7, 3.5, 0);
        this.scene.add(wall2Mesh);

        let wall3Geometry = new THREE.PlaneGeometry(13.4, 7);
        let wall3Mesh = new THREE.Mesh(wall3Geometry, wallMaterial);
        wall3Mesh.rotation.y = -Math.PI / 2;
        wall3Mesh.position.set(6.7, 3.5, 0);
        this.scene.add(wall3Mesh);

        let wall4Geometry = new THREE.PlaneGeometry(13.4, 7);
        let wall4Mesh = new THREE.Mesh(wall4Geometry, wallMaterial);
        wall4Mesh.rotation.x = Math.PI;
        wall4Mesh.position.set(0, 3.5, 6.7);
        this.scene.add(wall4Mesh);

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
        this.scene.add(table);

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
        this.scene.add(chairGroup);
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
     * initializes all the cameras
     */
    initCameras() {
        const aspect = window.innerWidth / window.innerHeight;

        // Create a basic perspective camera
        const perspective1 = new THREE.PerspectiveCamera( 75, aspect, 0.1, 1000 )
        perspective1.position.set(10,10,3)
        this.cameras['Perspective1'] = perspective1

        const perspective2 = new THREE.PerspectiveCamera( 75, aspect, 0.1, 1000 )
        perspective2.position.set(5,5,-3)
        this.cameras['Perspective2'] = perspective2

        // defines the frustum size for the orthographic cameras
        const left = -this.frustumSize / 2 * aspect
        const right = this.frustumSize /2 * aspect 
        const top = this.frustumSize / 2 
        const bottom = -this.frustumSize / 2
        const near = -this.frustumSize /2
        const far =  this.frustumSize

        // create a left view orthographic camera
        const orthoLeft = new THREE.OrthographicCamera( left, right, top, bottom, near, far);
        orthoLeft.up = new THREE.Vector3(0,1,0);
        orthoLeft.position.set(-this.frustumSize /4,0,0) 
        orthoLeft.lookAt( new THREE.Vector3(0,0,0) );
        this.cameras['Left'] = orthoLeft

        // create a top view orthographic camera
        const orthoTop = new THREE.OrthographicCamera( left, right, top, bottom, near, far);
        orthoTop.up = new THREE.Vector3(0,0,1);
        orthoTop.position.set(0, this.frustumSize /4, 0) 
        orthoTop.lookAt( new THREE.Vector3(0,0,0) );
        this.cameras['Top'] = orthoTop

        // create a front view orthographic camera
        const orthoFront = new THREE.OrthographicCamera( left, right, top, bottom, near, far);
        orthoFront.up = new THREE.Vector3(0,1,0);
        orthoFront.position.set(0,0, this.frustumSize /4) 
        orthoFront.lookAt( new THREE.Vector3(0,0,0) );
        this.cameras['Front'] = orthoFront

        // create a right view orthographic camera
        const orthoRight = new THREE.OrthographicCamera( left, right, top, bottom, near, far);
        orthoRight.up = new THREE.Vector3(0,1,0);
        orthoRight.position.set(this.frustumSize /4,0,0) 
        orthoRight.lookAt( new THREE.Vector3(0,0,0) );
        this.cameras['Right'] = orthoRight

        // create a back view orthographic camera
        const orthoBack = new THREE.OrthographicCamera( left, right, top, bottom, near, far);
        orthoBack.up = new THREE.Vector3(0,1,0);
        orthoBack.position.set(0,0, -this.frustumSize /4) 
        orthoBack.lookAt( new THREE.Vector3(0,0,0) );
        this.cameras['Back'] = orthoBack
    }

    /**
     * sets the active camera by name
     * @param {String} cameraName 
     */
    setActiveCamera(cameraName) {   
        this.activeCameraName = cameraName
        this.activeCamera = this.cameras[this.activeCameraName]
    }

    /**
     * updates the active camera if required
     * this function is called in the render loop
     * when the active camera name changes
     * it updates the active camera and the controls
     */
    updateCameraIfRequired() {

        // camera changed?
        if (this.lastCameraName !== this.activeCameraName) {
            this.lastCameraName = this.activeCameraName;
            this.activeCamera = this.cameras[this.activeCameraName]
            document.getElementById("camera").innerHTML = this.activeCameraName
           
            // call on resize to update the camera aspect ratio
            // among other things
            this.onResize()

            // are the controls yet?
            if (this.controls === null) {
                // Orbit controls allow the camera to orbit around a target.
                this.controls = new OrbitControls( this.activeCamera, this.renderer.domElement );
                this.controls.enableZoom = true;
                this.controls.update();
            }
            else {
                this.controls.object = this.activeCamera
            }
        }
    }

    /**
     * the window resize handler
     */
    onResize() {
        if (this.activeCamera !== undefined && this.activeCamera !== null) {
            this.activeCamera.aspect = window.innerWidth / window.innerHeight;
            this.activeCamera.updateProjectionMatrix();
            this.renderer.setSize( window.innerWidth, window.innerHeight );
        }
    }
    /**
     * 
     * @param {MyContents} contents the contents object 
     */
    setContents(contents) {
        this.contents = contents;
    }

    /**
     * @param {MyGuiInterface} contents the gui interface object
     */
    setGui(gui) {   
        this.gui = gui
    }

    /**
    * the main render function. Called in a requestAnimationFrame loop
    */
    render () {
        this.stats.begin()
        this.updateCameraIfRequired()

        // update the animation if contents were provided
        if (this.activeCamera !== undefined && this.activeCamera !== null) {
            this.contents.update()
        }

        // required if controls.enableDamping or controls.autoRotate are set to true
        this.controls.update();

        // render the scene
        this.renderer.render(this.scene, this.activeCamera);

        // subsequent async calls to the render loop
        requestAnimationFrame( this.render.bind(this) );

        this.lastCameraName = this.activeCameraName
        this.stats.end()
    }
}


export { MyApp };