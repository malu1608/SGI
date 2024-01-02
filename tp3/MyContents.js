import * as THREE from 'three';
import { MyAxis } from './MyAxis.js';
import { MyFileReader } from './parser/MyFileReader.js';
import { MyNurbsBuilder } from './MyNurbsBuilder.js';
import { PolygonBuilder } from './PolygonBuilder.js';
import { MyTrackBuilder } from './MyTrackBuilder.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MyTractor } from './MyTractor.js';
import { MyEnemyTractor } from './MyEnemyTractor.js';
import { MyGame} from './MyGame.js';

const States = {
    CHOOSING_PLAYER_TRACTOR: 0,
    CHOOSING_AUTONOMOUS_TRACTOR: 1,
    STARTING_PLAY: 2,
    MAIN_MENU : 3,
    INSTRUCTIONS : 4,
    GAME_OVER : 5,
    START_GAME : 6,
    RESUME_GAME : 7,
    CHOOSING_OBSTACLES : 8,
    PLACING_OBSTACLES : 9,
    PAUSE : 10,
    PLAY : 11
}

/**
 *  This class contains the contents of out application
 */
class MyContents  {

    /**
       constructs the object
       @param {MyApp} app The application object
    */ 
    constructor(app) {
        this.current_state = States.MAIN_MENU
        this.axis = null
        this.app = app
        
        this.data = null
        this.materials = new Map();
        this.object = null;
        this.lights = {};
        this.videos = [];
        this.picked_obj = [];

        // Tractors
        this.selectedTractors = [];
        this.trackPositions = [
            new THREE.Vector3(5,0,80),
            new THREE.Vector3(-10,0,85)
        ];
        this.choosingPlayerTractor = true;

        // Obstacles
        this.obstacleTrackPositions = [
            new THREE.Vector3(-60,1,100),
            new THREE.Vector3(-125,1,50),
            new THREE.Vector3(70,1,-90),
            new THREE.Vector3(100,1,-30)
        ];
        this.clickedObstacle = null;
       
        this.raycaster = new THREE.Raycaster()
        this.raycaster.near = 0.1
        this.raycaster.far = 1000
        this.pointer = new THREE.Vector2()
        this.intersectedObj = null
        this.pickingColor = "0x00ff00"  
        this.availableLayers = ['none']
        this.selectedLayer = this.availableLayers[0] 
        this.current_state = States.MAIN_MENU
        this.notPickableObjIds = []
        this.text_obj = new THREE.Object3D();
        this.app.scene.add(this.text_obj);
        
        // Sprite sheet
        this.spriteSheetTexture = null;
        this.tilesPerRow = 16; // For a 16x16 grid

        // Menu
        this.menuItems = {};
        this.menu = null; 
        this.menuEventListenerAdded = false; 
        this.currentHighlighted = null;
        this.initPointerEvents();

        // Game
        this.keys = {W: false, S: false, A: false, D: false, Space: false};
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        this.app.game = new MyGame(this.app);
    }

    onKeyDown(event) {
        if(this.current_state === States.PLAY){
            switch (event.code) {
                case 'KeyW':
                    this.keys.W = true;
                    break;
                case 'KeyS':
                    this.keys.S = true;
                    break;
                case 'KeyA':
                    this.keys.A = true;
                    break;
                case 'KeyD':
                    this.keys.D = true;
                    break;
                case 'Space':
                    this.keys.Space = true;
                    break;
                default:
                    break;
            }
        }  
        if(this.current_state === States.PAUSE){
            switch (event.code) {
                case 'Space':
                    this.current_state = States.PLAY;
                    this.app.game.resume();
                    this.app.pauseDiv.innerHTML = "";
                    break;
                default:
                    break;
            }
        }
    }

    onKeyUp(event) {
        if(this.current_state === States.PLAY){
            switch (event.code) {
                case 'KeyW':
                    this.keys.W = false;
                    break;
                case 'KeyS':
                    this.keys.S = false;
                    break;
                case 'KeyA':
                    this.keys.A = false;
                    break;
                case 'KeyD':
                    this.keys.D = false;
                    break;
                default:
                    break;
            }
        }
    }

    initPointerEvents(){
        document.addEventListener(
            "pointermove",
            this.onPointerMove.bind(this)
        );
        document.addEventListener("pointerdown", this.onPointerClick.bind(this));
        this.menuEventListenerAdded = true;
    }

    setMenu() {
        if (this.menu){
            return;
        }

        // Create a plane for the menu
        const menuGeometry = new THREE.PlaneGeometry(10, 10);
        const menuMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const menu = new THREE.Mesh(menuGeometry, menuMaterial);
        menu.position.set(0, 0, 0);
        
        // Create 3D text for menu items and add to the scene
        this.menuItems.play = {
            object: this.createTextFromSpriteSheet('Start', new THREE.Vector3(0, 1, 0)), 
            action : ()=>{this.current_state = States.START_GAME}
        };

        this.menu = menu;
        this.toggleMenuVisibility(true);
        this.app.scene.add(menu);
    }

    toggleMenuVisibility(visible) {
        if (this.menu) {
            // Toggle the menu visibility
            this.menu.visible = visible;

            // Toggle the visibility of each menu item
            Object.values(this.menuItems).forEach(item => {
                item.object.forEach(obj => obj.visible = visible)
            });
        }
    }

    loadScene() {
        if (this.axis === null) {
            this.axis = new MyAxis(this);
            this.app.scene.add(this.axis);
        }

        // Load the scene from XML
        this.reader = new MyFileReader(this.app, this, this.onSceneLoaded);
        this.reader.open("scenes/farm/farm.xml");
    }
    
    /**
     * Called when the scene xml file load is complete
     * @param {MySceneData} data the entire scene data object
     */
    onSceneLoaded(data) {
        console.info("scene data loaded " + data + ". visit MySceneData javascript class to check contents for each data item.")
        
        this.set_globals(data.options);
        this.set_fog(data.getFog());
        
        if (data.nodes['scene'].materialIds.length === 0) {
            data.nodes['scene'].materialIds.push("default");
        }

        this.onAfterSceneLoadedAndBeforeRender(data);

    }

    onPointerMove(event) {
        event.preventDefault();
        
        // Calculate pointer position in normalized device coordinates
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Set the picking ray from the camera position and mouse coordinates
        this.raycaster.setFromCamera(this.pointer, this.app.getActiveCamera());

        let tractors = [];
        
        if ( this.current_state === 0 || this.current_state === 1 || this.current_state == 2){ 
            // Choose player tractor , start game or choose autonomous tractor
            
            for (let i = 1; i <= 5; i++) { // 5 tractors
                const tractorName = "tractor" + i;
                const tractor = this.app.scene.getObjectByName(tractorName);
                if (tractor) {
                        tractors.push(tractor);
                    }
                
                else {
                    console.warn(`Tractor named ${tractorName} not found.`);
                }
            }
            this.picked_obj = tractors;

            
        } else if(this.current_state === 8 || this.current_state === 9  || this.current_state === 11) {
            let obstacles = [];
            for (let i = 1; i <= 2; i++) { // 2 woods and 2 wheelbarrows
                const woodName = "wood" + i;
                const wheelBarrowName = "wheelbarrow" + i;
                const wood = this.app.scene.getObjectByName(woodName);
                const wheelBarrow = this.app.scene.getObjectByName(wheelBarrowName);
                if (wood.isGroup) {
                    obstacles.push(wood);
                } else {
                    console.warn(`Wood named ${woodName} not found.`);
                }

                if (wheelBarrow) {
                    if (wheelBarrow.isGroup ) {
                        obstacles.push(...wheelBarrow.children);
                    } else {
                        obstacles.push(wheelBarrow);
                    }
                    obstacles.push(wheelBarrow);
                } else {
                    console.warn(`WheelBarrow named ${wheelBarrowName} not found.`);
                }
            }
            if (this.current_state === 9){
                
                this.picked_obj = this.circles
            }
            else{
                this.picked_obj = obstacles; 
            }
        }

        // Compute intersections
        var intersects = this.raycaster.intersectObjects(this.picked_obj,true);
        this.pickingHelper(intersects);
    }

    onPointerClick(event) {
        event.preventDefault();

        // Calculate pointer position in normalized device coordinates
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Set the picking ray from the camera position and mouse coordinates
        this.raycaster.setFromCamera(this.pointer, this.app.getActiveCamera());

        if (this.current_state === 3) { // menu
            const menuItemsArray = Object.values(this.menuItems).map(item => item.object);
            var intersects2 = this.raycaster.intersectObjects(menuItemsArray.flat());

            // Check if any menu item was clicked
            if (intersects2.length > 0) {
                const intersected = intersects2[0].object;

                // Check which menu item was clicked and perform the action
                for (let key in this.menuItems) {
                    const item = this.menuItems[key];
                    if (item.object.includes(intersected)) {
                        item.action();
                        break;
                    }
                }
            }
        }
        
        // Player or autonomous tractor selection
        else if ( this.current_state === 0 || this.current_state === 1 ){ 
            intersects2 = this.raycaster.intersectObjects(this.picked_obj,true);

            if (intersects2.length > 0) {
                const clickedTractor = intersects2[0].object.parent.parent;

                if (clickedTractor.material && clickedTractor.currentHex) {
                    // Set the color back to its original value
                    clickedTractor.material.color.setHex(clickedTractor.currentHex);
                }
                
                // Add the clicked tractor to the selection array
                this.selectedTractors.push(clickedTractor);
        
                if (this.selectedTractors.length <= this.trackPositions.length) {
                    
                    this.moveTractorToTrack(clickedTractor);
                    this.choosingPlayerTractor = false;
                    
                    if(this.current_state === 0){
                        this.current_state = 1
                        this.text_obj.remove(...this.text_obj.children)
                        this.text_obj.add(...this.createTextFromSpriteSheet('Please choose the autonomous tractor:', new THREE.Vector3(-25, 15, 0)))
                        this.restoreColorOfFirstPickedObj()
                    }
                    else if (this.current_state === 1){
                        this.current_state = States.STARTING_PLAY;
                        this.app.game.initGame();
                    }
                }
            }
        } else if (this.current_state === 8 || this.current_state === 9) {
            
            intersects2 = this.raycaster.intersectObjects(this.picked_obj,true);

            if (intersects2.length > 0) {
                const clickedObstacle = intersects2[0].object.parent.parent;

                if(this.current_state === 8){
                    if (clickedObstacle.name.startsWith("wheelbarrow") || clickedObstacle.name.startsWith("wood")) {
                        this.circles = []
                        this.obstacleTrackPositions.forEach(position => {
                            const circle = this.setObstacleTrackPosition(position);
                            this.app.scene.add(circle);
                            this.circles.push(circle);
        
                        });
                        this.picked_obj = this.circles
                        this.current_state = 9
                        this.clickedObstacle = clickedObstacle
                    }
                    this.text_obj.remove(...this.text_obj.children)
                    this.text_obj.add(...this.createTextFromSpriteSheet('Please choose one circle to place the obstacle on the track:', new THREE.Vector3(-25, 15, 0)))
                } 

                else if(this.current_state === 9){
                    this.movingObstacle(this.clickedObstacle,intersects2[0].object.position);
                    this.current_state = States.RESUME_GAME;
                    this.app.scene.remove(...this.circles);
                }
            }
        }

        if (intersects2) {
            this.pickingHelper(intersects2);
        } 
    }

    movingObstacle(obstacle,circle_position) {
        const previousPosition = obstacle.position.clone();

        let angle = Math.PI /2;
        let axis = new THREE.Vector3(0, 1, 0);

        // Rotate the tractor to starting track position
        obstacle.rotateOnAxis(axis, angle);

        // If the user chooses the position 0
        obstacle.position.set(this.obstacleTrackPositions[0].x, previousPosition.y,this.obstacleTrackPositions[0].z);
        obstacle.position.set(circle_position.x, previousPosition.y,circle_position.z);

        if (obstacle.material && obstacle.material.color && obstacle.originalColor) {
            obstacle.material.color.set(obstacle.originalColor);
        }
    }

    setObstacleTrackPosition(position){
        const circleRadius = 5;
        const circleSegments = 32;
        const circleGeometry = new THREE.CircleGeometry(circleRadius, circleSegments);
        const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);

        circle.rotation.x = -Math.PI / 2;
        circle.position.set(position.x, position.y, position.z);

        return circle;
    }

    moveTractorToTrack(tractor) {
        // Move the tractor to the given position
        const previousPosition = tractor.position.clone();

        let tractors = this.app.scene.getObjectByName("tractors");
        let toPosition = this.choosingPlayerTractor ? this.trackPositions[0] : this.trackPositions[1]; 
        
        if (this.choosingPlayerTractor) {
            tractors.remove(tractor);
            tractor.position.set(toPosition.x, previousPosition.y, toPosition.z);
            tractor.rotation.set(0,-Math.PI/2,0)
            this.app.scene.add(tractor);
            this.app.game.playerTractor = new MyTractor(tractor, this.app);
        }

        if (tractor.material && tractor.material.color && tractor.originalColor) {
            tractor.material.color.set(tractor.originalColor);
        }
        
        if(!this.choosingPlayerTractor){
            this.app.game.enemyTractor = new MyEnemyTractor(this.app,tractor);
        }
    }

    pickingHelper(intersects) {
        if (intersects.length > 0) {
            const obj = intersects[0].object
            if (this.notPickableObjIds.includes(obj.name)) {
                this.restoreColorOfFirstPickedObj()
            } 
            else {
                this.changeColorOfFirstPickedObj(obj)
            }
        } 
        else {
            this.restoreColorOfFirstPickedObj()
        }
    }

    // Method to change the color of the first picked object
    changeColorOfFirstPickedObj(obj) {
        if (this.lastPickedObj != obj) {
            if (this.lastPickedObj)
                this.lastPickedObj.material.color.setHex(this.lastPickedObj.currentHex);
            this.lastPickedObj = obj;
            this.lastPickedObj.currentHex = this.lastPickedObj.material.color.getHex();
            this.lastPickedObj.material.color.setHex(this.pickingColor);
        }
    }

    // Method to restore the color of the first picked object
    restoreColorOfFirstPickedObj() {
        if (this.lastPickedObj)
            this.lastPickedObj.material.color.setHex(this.lastPickedObj.currentHex);
        this.lastPickedObj = null;
    }

    // Method to update the selected layer
    updateSelectedLayer() {
        this.raycaster.layers.enableAll()
        if (this.selectedLayer !== 'none') {
            const selectedIndex = this.availableLayers[parseInt(this.selectedLayer)]
            this.raycaster.layers.set(selectedIndex)
        }
    }

    // Method to update the picking color
    updatePickingColor(value) {
        this.pickingColor = value.replace('#', '0x');
    }

    getUVForCharacter(character) {
        const asciiCode = character.charCodeAt(0);
        const tileUSize = 1 / this.tilesPerRow; // The size of one tile in U dimension
        const tileVSize = 1 / this.tilesPerRow; // The size of one tile in V dimension

        const uIndex = asciiCode % this.tilesPerRow;
        const vIndex = Math.floor(asciiCode / this.tilesPerRow);
        
        return {
            u: uIndex * tileUSize,
            v: 1 - (vIndex + 1) * tileVSize // Textures in WebGL are Y-inverted
        };
    }

    // Use this function to create a mesh for each character using the sprite sheet
    createTextFromSpriteSheet(text, position) {
        const characters = text.split('');
        const meshes = [];
        
        characters.forEach((char, index) => {

            const uv = this.getUVForCharacter(char);
            const characterTexture = new THREE.TextureLoader().load('fonts/spritesheet.png').clone();
            characterTexture.needsUpdate = true; 

            // Configure texture wrapping
            characterTexture.wrapS = THREE.ClampToEdgeWrapping;
            characterTexture.wrapT = THREE.ClampToEdgeWrapping;

            // Apply UV mapping to the cloned texture
            characterTexture.offset.x = uv.u;
            characterTexture.offset.y = uv.v;
            characterTexture.repeat.set(1 / this.tilesPerRow, 1 / this.tilesPerRow);

            // Create the material with the cloned texture
            const material = new THREE.MeshBasicMaterial({
                map: characterTexture,
                transparent: true
            });

            // Create a plane geometry for the character
            const geometry = new THREE.PlaneGeometry(1, 1); 
            const mesh = new THREE.Mesh(geometry, material);

            // Position the character mesh
            mesh.position.set(position.x + index, position.y, position.z);
            mesh.position.set(
                position.x + index, 
                position.y,
                position.z
            );

            this.app.scene.add(mesh);
            meshes.push(mesh);
        });

        return meshes;
    }

    // Method to create a spritesheet material for a button
    createButtonHighlightSprite(position) {
        const spriteMap = new THREE.TextureLoader().load('fonts/spritesheet.png');
        const spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap });
        const sprite = new THREE.Sprite(spriteMaterial);

        sprite.position.copy(position);
        this.app.scene.add(sprite);
        return sprite;
    }

    /**
     * Sets fog based on the provided fog data.
     * @param {Object} fog The fog data.
     */
    set_fog(fog) {
        if(fog != null){
            const color = fog.color;
            const near = fog.near;
            const far = fog.far;

            this.app.scene.fog = new THREE.Fog(new THREE.Color(color.r,color.g,color.b),near,far)
        }
    }

    /**
     * Sets global options like ambient light and background color.
     * @param {Object} options The options data.
     */
    set_globals(options) {
        // Set ambient light
        if (options.ambient != null) {
            const ambient = options.ambient;
            const ambientColor = new THREE.Color(ambient.r, ambient.g, ambient.b);
            const light = new THREE.AmbientLight(ambientColor);
            this.app.scene.add(light);
        }
        
        // Set background color
        if (options.background != null) {
           const background = options.background;
           const backgroundColor = new THREE.Color(background.r,background.g,background.b)
           this.app.scene.background = backgroundColor;
        }
      }

    /**
     * Gets a texture object based on the provided texture data.
     * @param {string} texture The texture ID.
     * @param {number} length_s Texture length in the S direction.
     * @param {number} length_t Texture length in the T direction.
     * @returns {THREE.Texture} The texture object.
    */
    getTexture(texture, length_s, length_t) {
        if(texture != null){
            const textureInfo = this.data.textures[texture];
            let map = null;

            if (textureInfo.isVideo) {
                // Create a video element
                let video = document.createElement('video');
                video.id = 'video';
                video.playsinline = true;
                video.setAttribute("webkit-playsinline", ""); // Webkit specific attribute
                video.muted = true;
                video.loop = true;
                video.autoplay = true;
                video.width = 640;
                video.height = 360;
                video.src = textureInfo.filepath;
                video.style.opacity = "0%"
                video.style.position = "absolute"
                video.style.top="0"

                document.body.appendChild(video); // add video to html

                const newTexture = new THREE.VideoTexture(video);
                this.videos.push(video);

                return newTexture;

            } else {
                map = new THREE.TextureLoader().load(textureInfo.filepath);
            }

            // Build mipmaps for the texture
            if(textureInfo.mipmaps){
                this.buildMipmap(textureInfo, map);
            }

            // Configure texture wrapping
            map.wrapS = map.wrapT = THREE.RepeatWrapping;
            map.repeat.set(length_s, length_t);
            
            return map;
        }
        return null;
    }

    /**
     * Loads a mipmap for a texture.
     * @param {THREE.Texture} texture - The target texture object.
     * @param {number} level - The mipmap level.
     * @param {string} mipmap - The file path or URL of the mipmap image.
    */
    loadMipmap(texture, level, mipmap) {
        
        new THREE.TextureLoader().load(
            mipmap,
            /**
             * Callback function when the mipmap is loaded.
             * @param {THREE.Texture} mipmapTex - The loaded texture.
            */
            function(mipmapTex) {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                context.scale(1, 1);

                const img = mipmapTex.image;
                canvas.width = img.width;
                canvas.height = img.height;

                context.drawImage(img, 0, 0);
                
                texture.mipmaps[level] = canvas;
            },
            undefined,
            /**
             * Error callback function.
             * @param {Error} error - The error that occurred during loading.
            */
            function(error) {
                console.error(error);
            }
        );
    }

    /**
     * Builds mipmaps for a texture based on the provided texture info.
     * @param {object} textureInfo - Information about the texture and mipmaps.
     * @param {THREE.Texture} texture - The target texture object.
    */
    buildMipmap(textureInfo, texture) {
        texture.generateMipmaps = false;

        if (textureInfo['mipmaps']) {
            let mipmaps = [
                textureInfo?.mipmap0, textureInfo?.mipmap1, textureInfo?.mipmap2, textureInfo?.mipmap3,
                textureInfo?.mipmap4, textureInfo?.mipmap5, textureInfo?.mipmap6, textureInfo?.mipmap7
            ];
            
            for (let level = 0; level < mipmaps.length; level++) {
                if (mipmaps[level]) { // Add mipmap
                    this.loadMipmap(texture, level, mipmaps[level]);
                }
            }
            texture.needsUpdate = true;
        }
    }  

    /**
     * Sets materials for the scene based on the provided material data.
     * @param {Array} materials - An array of material objects.
    */
    set_materials(materials){ 
        for(let materials_idx in materials){
            
            const material = materials[materials_idx];

            // Create a new MeshPhongMaterial using the provided material data
            const materialObj = new THREE.MeshPhongMaterial({
                "color": new THREE.Color(material.color.r,material.color.g,material.color.b), 
                "specular": material.specular,  
                "shininess": material.shininess, 
                "emissive": material.emissive, 
                "side": (material.twosided) ? THREE.DoubleSide : THREE.FrontSide, 
                "wireframe": material.wireframe,
                "bumpScale": material.bumpscale,
                "map": this.getTexture(material.textureref,material.texlength_s,material.texlength_t),
                "flatShading": (material.shading === 'flat'),
                "bumpMap": (material.bumpref) ? new THREE.TextureLoader().load(this.data.textures[material.bumpref].filepath) : null,
            })
            
            // Store the created material object in the application's materials array
            this.materials[materials_idx] = materialObj;
        }
        
    }

    /**
     * Sets up cameras for the scene based on the provided camera data.
     * @param {Array} cameras - An array of camera objects.
     * @param {number|null} id - The ID of the camera to set as active. If null, no active camera is set.
    */
    set_cameras(cameras,id) {
        this.app.cameras = [] // reset cameras

        // load all cameras 
        for (let camera_idx in cameras) {
            const camera = cameras[camera_idx]
            const near = camera.near;
            const far = camera.far;
            let location = camera.location;
            let target = camera.target;
            const aspect = window.innerWidth / window.innerHeight;
            let camera_obj;
            if (camera.type === "perspective") {
                const angle = camera.angle;

                // Create a new PerspectiveCamera
                camera_obj = new THREE.PerspectiveCamera(angle,aspect,near,far);
                camera_obj.name = camera.id;
                camera_obj.position.set(location[0],location[1],location[2]);
                camera_obj.lookAt(new THREE.Vector3(target[0],target[1],target[2]));
                this.app.cameras[camera_idx] = camera_obj;  
            } 
            else if (camera.type === "orthogonal") {
                const left = camera.left;
                const right = camera.right;
                const bottom = camera.bottom;
                const top = camera.top;

                // Create a new OrthographicCamera
                camera_obj = new THREE.OrthographicCamera( left, right, top, bottom, near, far);
                camera_obj.name = camera.id;
                camera_obj.position.set(location[0],location[1],location[2]);
                camera_obj.lookAt(new THREE.Vector3(target[0],target[1],target[2]));
                this.app.cameras[camera_idx] = camera_obj;
            }
        }

        // Set the active camera if an ID is provided
        if(id != null){
            this.app.setActiveCamera(id); 
        }

        this.app.updateCameras = true;

    }

    /**
     * Recursively sets up the scene nodes based on the provided node data.
     * @param {string} nodeRef - The reference ID of the node to set up.
     * @param {THREE.Group} [parent] - The parent group to which the new node will be added. If not provided, the node will be added to the root.
     * @returns {THREE.Group} The created THREE.Group representing the node and its children.
    */
    set_nodes(nodeRef, parent = undefined) {
    
        let node = this.data.nodes[nodeRef];
        let group = new THREE.Group();

        group.name = node.id;
        
        // apply group transformations
        let transformations = node['transformations'];
        this.set_transformations(group, transformations)


        // Set material IDs for the group
        if (node.materialIds.length != 0) {
            group.materialIds = node.materialIds;
        } else if (parent != undefined) {
            group.materialIds = parent.materialIds;
        } else {
            group.materialIds = [];
        }

        let parentCastShadow
        let parentReceiveShadow

        if (parent==undefined) {
            parentCastShadow = false;
            parentReceiveShadow = false;
        }
        else {
            parentCastShadow = parent.castShadow;
            parentReceiveShadow = parent.receiveShadow;
        }

        if (node.castShadows || parentCastShadow ) {
            group.castShadow = true
        }
        if (node.receiveShadows || parentReceiveShadow) {
            group.receiveShadow = true
        }
        
        // Process children of the node
        node.children.forEach(async child =>{
            if(child.type === "node"){
                // Recursively add child node to the group
                group.add(this.set_nodes(child.id, group));
            }
            else if (child.type === "primitive") {
                // Add primitive child to the group
                let material = this.materials[group.materialIds[0]];
                let newPrimitive = null;
                group.data = child;

                if (child.subtype === "model3d") {
                    // Use OBJLoader asynchronously
                    const objLoader = new OBJLoader();
                    const modelPath = child.representations[0].filepath;

                    // Load the material in jpg format, load the texture separately
                    const textureLoader = new THREE.TextureLoader();
                    const texturePath = child.representations[0].texture;
                    const texture = textureLoader.load(texturePath);
            
                    // Load the model
                    objLoader.load(modelPath, function (obj) {
                        obj.traverse(function (child) {
                            if (child instanceof THREE.Mesh) {
                                // Apply the texture to the material
                                const newMaterial = new THREE.MeshPhongMaterial({ map: texture });
                                child.material = newMaterial;
                                child.castShadow = group.castShadow;
                                child.receiveShadow = group.receiveShadow;
                            }
                        });
            
                        newPrimitive = obj;
            
                        // Add the loaded mesh to the group
                        if (newPrimitive) {
                            group.add(newPrimitive);
                        // Continue with the next steps or callback
                        } else {
                            console.warn("Primitive not created. Check if the subtype", child.subtype, "is supported by the application.");
                        }
                    });
                } else {
                    newPrimitive = this.set_primitive(child, material, group.castShadow, group.receiveShadow);
            
                    if (newPrimitive) {
                        group.add(newPrimitive);
                    } else {
                        console.warn("Primitive not created. Check if the subtype", child.subtype, "is supported by the application.");
                    }
                }
            }
            
            else if(child.type === 'lod') {
                // Add LOD (Level of Detail) child to the group
                let lod = new THREE.LOD();

                if (child.materialIds === undefined || child.materialIds.length === 0) {
                    child.materialIds = node.materialIds;
                }
                
                for(let i = 0; i < child.children.length; i++){
                    let grandChild = child.children[i];
                    if (grandChild.type === "lodnoderef") {
                        let grandChildMaterial = grandChild.materialIds;
                        let grandChildMesh = this.set_nodes(grandChild.node.id, grandChildMaterial);

                        lod.addLevel(grandChildMesh, grandChild.mindist);
                    }
                }

                group.add(lod);
            }

            else if(child.type === "spotlight"){
                // Add spotlight child to the group
                const { id, color, position, target, angle, enabled, intensity, distance, decay, penumbra, castshadow, shadowfar, shadowmapsize } = child;

                const spotlight = new THREE.SpotLight(
                    new THREE.Color(color.x, color.y, color.z),
                    intensity, distance, angle, penumbra, decay);

                spotlight.position.set(position[0], position[1], position[2]);
                spotlight.target.position.set(target[0], target[1], target[2]);
                spotlight.castShadow = castshadow;
                spotlight.shadow.mapSize.width = shadowmapsize;
                spotlight.shadow.mapSize.height = shadowmapsize;
                spotlight.shadow.camera.far = shadowfar;

                if (enabled) {
                    spotlight.visible = true;
                } else {
                    spotlight.visible = false;
                }
    
                this.lights[id] = spotlight;
                group.add(spotlight);
            }
            else if(child.type === "directionallight"){
                // Add directional light child to the group
                const { id, color, position, enabled, intensity, castshadow, shadowleft, shadowright, shadowbottom, shadowtop, shadowfar, shadowmapsize } = child;

                const directionallight = new THREE.DirectionalLight(
                    new THREE.Color(color.x, color.y, color.z),
                    intensity);
                directionallight.position.set(position[0], position[1], position[2]);
                    
                directionallight.castShadow = castshadow;
                directionallight.shadow.camera.left = shadowleft;
                directionallight.shadow.camera.right = shadowright;
                directionallight.shadow.camera.top = shadowtop;
                directionallight.shadow.camera.bottom = shadowbottom;
                directionallight.shadow.camera.far = shadowfar;
                directionallight.shadow.mapSize.width = shadowmapsize;
                directionallight.shadow.mapSize.height = shadowmapsize;

                if (enabled) {
                    directionallight.visible = true;
                } else {
                    directionallight.visible = false;
                }

                this.lights[id] = directionallight;
                group.add(directionallight);
            }
            else if(child.type === "pointlight"){
                // Add point light child to the group
                const { id, color, position, enabled, intensity, distance, decay, castshadow, shadowfar, shadowmapsize } = child;

                const pointlight = new THREE.PointLight(
                    new THREE.Color(color.x, color.y, color.z),
                    intensity, distance, decay);
                pointlight.position.set(position[0], position[1], position[2]);

                pointlight.castShadow = castshadow;
                pointlight.shadow.mapSize.width = shadowmapsize;
                pointlight.shadow.mapSize.height = shadowmapsize;
                pointlight.shadow.camera.far = shadowfar;

                if (enabled) {
                    pointlight.visible = true;
                } else {
                    pointlight.visible = false;
                }
                this.lights[id] = pointlight;
                group.add(pointlight);
            }
        });

        return group;

    }

    /**
     * Applies transformations to a Three.js group based on the provided transformation data.
     * @param {THREE.Group} group - The Three.js group to apply transformations to.
     * @param {Object} transformations - The transformation data, including translation, rotation, and scale information.
    */
    set_transformations(group, transformations) {

        // Apply transformations to the group
        for(const transformation in transformations){
            if(transformations[transformation].type === "T" ){
                const [x, y, z] = transformations[transformation].translate;
                group.translateX(x);
                group.translateY(y);
                group.translateZ(z);
            }
            else if(transformations[transformation].type === "R"){
                const [x, y, z] = transformations[transformation].rotation;
                group.rotateX(x);
                group.rotateY(y);
                group.rotateZ(z);
            }
            else if(transformations[transformation].type === "S"){
                const [x, y, z] = transformations[transformation].scale;
                group.scale.set(x, y, z);
            }
            
        }
    }

    /**
     * Creates a Three.js Mesh for a given primitive based on its subtype.
     * @param {Object} primitive - The primitive data, including subtype and representation details.
     * @param {THREE.Material} material - The Three.js material to apply to the created mesh.
     * @param {boolean} castShadow - Whether the mesh should cast shadows.
     * @param {boolean} receiveShadow - Whether the mesh should receive shadows.
     * @returns {THREE.Mesh|undefined} The created Three.js Mesh or undefined if the primitive type is not supported.
    */
    set_primitive(primitive, material,castShadow,receiveShadow){
        let geometry = null
        let texture = material.map;

        switch(primitive.subtype){

            case "rectangle":
                if (texture != null) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set((primitive.representations[0].xy2[0] - primitive.representations[0].xy1[0]) / material.map.repeat.x, (primitive.representations[0].xy2[1] - primitive.representations[0].xy1[1]) / material.map.repeat.y);
                    material.map = texture;
                }

                // Create a plane geometry for a rectangle primitive
                const { xy1, xy2, parts_x, parts_y } = primitive.representations[0];
                geometry = new THREE.PlaneGeometry(xy2[0] - xy1[0], xy2[1] - xy1[1], parts_x, parts_y);
                break;
            
            case "triangle":
                // Create a geometry for a triangle primitive
                const { xyz1, xyz2, xyz3 } = primitive.representations[0];
                geometry = new THREE.Geometry();
                geometry.vertices.push(new THREE.Vector3((xyz1[0], xyz1[1], xyz1[2])))
                geometry.vertices.push(new THREE.Vector3(xyz2[0], xyz2[1], xyz2[2]));
                geometry.vertices.push(new THREE.Vector3(xyz3[0], xyz3[1], xyz3[2]));
                geometry.faces.push(new THREE.Face3( 0, 1, 2 ) );
                geometry.computeFaceNormals();
                break;

            case "cylinder":
                // Create a sphere geometry for a cylinder primitive
                const { top, base, height, slices, stacks, capsclose, thetastart, thetalength, distance } = primitive.representations[0];
                geometry = new THREE.CylinderGeometry(top, base, height, slices, stacks, capsclose, thetastart, thetalength,distance);
                break;

            case "sphere":
                // Create a sphere geometry for a sphere primitive
                const {radius,s_slices,s_stacks,s_thetastart = 0.0,s_thetalength = 2 * Math.PI,phistart = 0.0,philength = 2 * Math.PI} = primitive.representations[0];
                geometry = new THREE.SphereGeometry(radius, s_slices, s_stacks, s_thetastart, s_thetalength, phistart, philength);
                break;

            case "box":
                // Create a box geometry for a box primitive
                let b_xyz1 = primitive.representations[0].xyz1;
                let b_xyz2 = primitive.representations[0].xyz2;
                const b_parts_x = primitive.representations[0].parts_x || 1;
                const b_parts_y = primitive.representations[0].parts_y || 1;
                const b_parts_z = primitive.representations[0].parts_z || 1;
                
                const b_height = Math.abs(b_xyz2[1]-b_xyz1[1])
                const b_width = Math.abs(b_xyz2[0]-b_xyz1[0])
                const b_depth = Math.abs(b_xyz2[2]-b_xyz1[2])
                geometry = new THREE.BoxGeometry(b_width, b_height, b_depth, b_parts_x, b_parts_y,b_parts_z);
                break;

            case "nurbs":
                // Create a nurbs geometry for a nurbs primitive
                let points = []
                let count_v = 0
                let count_u = 0
                let temp = []
                let representations = primitive.representations[0]
                for (const controlpoint of representations.controlpoints) {
                    temp.push(Object.values(controlpoint).slice(0, -1))
                    count_v++
                    if (count_v == representations.degree_v + 1) {
                        points.push(temp)
                        temp = []
                        count_v = 0
                        count_u++
                    }
                    if (count_u == representations.degree_u + 1) {
                        break;
                    }
                }

                const builder = new MyNurbsBuilder(this.app)
                geometry = builder.build(points, representations.degree_u, representations.degree_v, representations.parts_u, representations.parts_v)
                break;

            case "track":
                // Create a track geometry for a track primitive
                let trackRepresentations = primitive.representations[0];
                const trackBuilder = new MyTrackBuilder(trackRepresentations.controlpoints, trackRepresentations.segments);
                geometry = trackBuilder.build();
                let cp = trackRepresentations.controlpoints.map(cp => new THREE.Vector3(cp.xx, cp.yy, cp.zz));
                this.app.game.trackControlPoints = cp;
                break;

            case "polygon":
                // Create a polygon geometry for a polygon primitive
                geometry = new PolygonBuilder(primitive.representations[0].radius, primitive.representations[0].color_c, primitive.representations[0].color_p, primitive.representations[0].stacks, primitive.representations[0].slices, material);
                return geometry.mesh;

            default:
                break;
        
        }

        if (geometry) {
            let mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = castShadow;
            mesh.receiveShadow = receiveShadow;
            return mesh;
        }
        else {
            return undefined; // primitive not created
        }


    }
    
    /**
    * Builds skyboxes based on the provided data and adds them to the Three.js scene.
    */
    buildSkyboxs() {
        if (this.data.skyboxes) {
            // Iterate through each skybox defined in the data
            for (let skyboxID in this.data.skyboxes) {
                const skyboxInfo = this.data.skyboxes[skyboxID];

                // Create a box geometry for the skybox based on size
                const skyboxGeometry = new THREE.BoxGeometry(skyboxInfo['size'][0], skyboxInfo['size'][1], skyboxInfo['size'][2]);
                
                // Define textures for each face of the skybox
                let textures = [
                    this.data.textures[skyboxInfo['up']],
                    this.data.textures[skyboxInfo['down']],                    
                    this.data.textures[skyboxInfo['left']],                    
                    this.data.textures[skyboxInfo['right']],                    
                    this.data.textures[skyboxInfo['front']],                    
                    this.data.textures[skyboxInfo['back']],                
                ];
                
                let skyboxMaterials = [];

                // Iterate through each texture and create materials for the skybox
                for (let texIdx in textures) {
                    let texture = textures[texIdx];
                    let map;
                    if(texture){
                        
                        // Create a basic material for the skybox face using the texture
                        let material = new THREE.MeshBasicMaterial({ map: this.getTexture(texture.id), side: THREE.DoubleSide })

                        skyboxMaterials.push(material);
                    }
                }

                // Create a mesh for the skybox using the geometry and materials
                let mesh = new THREE.Mesh(skyboxGeometry, skyboxMaterials);

                // Configure texture wrapping for the mesh
                mesh.wrapS = mesh.wrapT = THREE.RepeatWrapping;

                // Set the position of the skybox based on the provided center
                mesh.position.set(skyboxInfo['center'][0], skyboxInfo['center'][1], skyboxInfo['center'][2]);

                this.app.scene.add(mesh);
            }
        }
    }

    output(obj, indent = 0) {
        console.log("" + new Array(indent * 4).join(' ') + " - " + obj.type + " " + (obj.id !== undefined ? "'" + obj.id + "'" : ""))
    }

    onAfterSceneLoadedAndBeforeRender(data) {
        // Called after the scene is loaded and before the first render
        this.data = data;

        this.buildSkyboxs();
        this.set_materials(data.materials);
        this.set_cameras(data.cameras,data.activeCameraId);

        this.object = this.set_nodes(data.rootId);
        this.app.scene.add(this.object);
        this.clock = new THREE.Clock();
    }

    handleKeys() {
        if (this.keys.W){
            this.app.game.playerTractor.accelerate();
        }
        if (this.keys.S){
            this.app.game.playerTractor.decelerate();
        }
        if (this.keys.A){
            this.app.game.playerTractor.turnLeft();
        }
        if (this.keys.D){
            this.app.game.playerTractor.turnRight();
        }
        if (this.keys.Space){
            this.keys.Space = false;
            this.current_state = 10;
            this.app.game.pause();
        }
    }

    updateCamera() {

        // Update the camera position and target
        let activeCamera = this.app.getActiveCamera();
        let tractorsPark = this.app.scene.getObjectByName('park');
        
        switch(this.current_state){
            case States.PLAY:
                let offset = new THREE.Vector3(0, 8, -20);
                let rotationMatrix = new THREE.Matrix4();
                rotationMatrix.makeRotationY(this.app.game.playerTractor.orientation);

                offset.applyMatrix4(rotationMatrix);

                let cameraPosition = this.app.game.playerTractor.object.position.clone().add(offset);
                activeCamera.position.copy(new THREE.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z)); 
                this.app.controls.target = this.app.game.playerTractor.object.position.clone();

                break;

            case States.CHOOSING_PLAYER_TRACTOR:
                activeCamera.position.copy(tractorsPark.position.clone().add(new THREE.Vector3(0, 30, -30)));
                this.app.controls.target = tractorsPark.position.clone();
                break;
            
            case States.CHOOSING_AUTONOMOUS_TRACTOR:
                activeCamera.position.copy(tractorsPark.position.clone().add(new THREE.Vector3(0, 30, -30)));
                this.app.controls.target = tractorsPark.position.clone();
                break;

            default:
                break;
        }
    }

    update() {
        const activeCamera = this.app.getActiveCamera();
        const cameraWorldPosition = new THREE.Vector3();
        const cameraWorldDirection = new THREE.Vector3();

        // Update the position of the HUD
        activeCamera.getWorldPosition(cameraWorldPosition);
        activeCamera.getWorldDirection(cameraWorldDirection);

        const hudPosition = cameraWorldPosition.clone().add(cameraWorldDirection.clone());
        
        this.text_obj.position.set(...hudPosition);
        this.text_obj.scale.set(0.05, 0.05, 0.05)
        this.text_obj.lookAt(cameraWorldPosition);
        
        // Update the state
        switch (this.current_state) {
            case States.MAIN_MENU:
                this.toggleMenuVisibility(true);
                this.setMenu();
                break;
            case States.STARTING_PLAY:
                this.current_state = States.PLAY;
                break;
            case States.PLAY:
                this.text_obj.remove(...this.text_obj.children)
                this.handleKeys();
                this.app.game.update();
                this.updateCamera();
                if (this.app.game.isCollidingWithObstacle()){
                    this.current_state = States.PAUSE;
                    this.text_obj.add(...this.createTextFromSpriteSheet('Please choose one obstacle:', new THREE.Vector3(-25, 15, 0)))
                }
                break;
            case States.PAUSE:
                this.app.pauseDiv.innerHTML = "PAUSE";
                this.current_state = States.CHOOSING_OBSTACLES
                break;
            case States.GAME_OVER:
    
                break;
            case States.INSTRUCTIONS:
                
                break;
            case States.CHOOSING_OBSTACLES:
            
                break;
            case States.PLACING_OBSTACLES:
                
                break;
            case States.RESUME_GAME: // Restart game
                this.text_obj.remove(...this.text_obj.children)
                this.current_state = States.PLAY;
                break;
            case States.CHOOSING_PLAYER_TRACTOR:
                
                this.updateCamera();
                
            
                break;
            case States.CHOOSING_AUTONOMOUS_TRACTOR:

            
                this.updateCamera();
                
                break;

            case States.START_GAME:
                this.toggleMenuVisibility(false);
                this.loadScene()
                this.current_state = States.CHOOSING_PLAYER_TRACTOR
                this.text_obj.add(...this.createTextFromSpriteSheet('Please choose the player tractor:', new THREE.Vector3(-25, 15, 0)))
                break;
            
            default:
                this.current_state = States.MAIN_MENU;
                break;
        }
    }

    updateState(newState) {
        this.current_state = newState;
    }
}

export { MyContents };