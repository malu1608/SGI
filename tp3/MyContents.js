import * as THREE from 'three';
import { MyAxis } from './MyAxis.js';
import { MyFileReader } from './parser/MyFileReader.js';
import { MyNurbsBuilder } from './MyNurbsBuilder.js';
import { PolygonBuilder } from './PolygonBuilder.js';
import { MyTrackBuilder } from './MyTrackBuilder.js';
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
        this.data = null
        this.materials = new Map();
        this.object = null;
        this.lights = {};
        this.videos = [];
        this.reader = new MyFileReader(app, this, this.onSceneLoaded);
		this.reader.open("scenes/farm/farm.xml");		
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
            // console.log("a cor é "+ color.r + " " + color.g + " " + color.b)
            // console.log("near: " + near )
            // console.log("near: " + far)
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
            console.log("Ambient Light: " + ambient.r + " " + ambient.g + " " + ambient.b);
        }
        
        // Set background color
        if (options.background != null) {
           const background = options.background;
           const backgroundColor = new THREE.Color(background.r,background.g,background.b)
           this.app.scene.background = backgroundColor;
           console.log("Background color : " + background.r + " " + background.g + " " + background.b);
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
                // console.log("doc body: ", document.body);

                const newTexture = new THREE.VideoTexture(video);
                // console.log("newTexture: ", newTexture);

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
                // console.log("IMG: ", img.width, mipmap);
                canvas.width = img.width;
                canvas.height = img.height;

                context.drawImage(img, 0, 0);
                
                // console.log("mipmap: ", texture.mipmaps);
                texture.mipmaps[level] = canvas;
                //texture.needsUpdate = true;
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
            // console.log("mipmaps: ", mipmaps);
        }
    }  

    /**
     * Sets materials for the scene based on the provided material data.
     * @param {Array} materials - An array of material objects.
    */
    set_materials(materials){ 
        for(let materials_idx in materials){
            
            const material = materials[materials_idx]
            
            // console.log("material: ", material);

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
            
            // console.log("materialObj: ", materialObj);
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
            // console.log("camera ativa: " + camera_idx);
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
                //console.log("perspective values : " + angle + " " + aspect + " " + near + " " + far+ " "+ target + " " + location + " "+  camera_obj.position['x'] + " " + camera_obj.position['y'] + " " + camera_obj.position['z']);
            } else if (camera.type === "orthogonal") {
                const left = camera.left;
                const right = camera.right;
                const bottom = camera.bottom;
                const top = camera.top;

                // Create a new OrthographicCamera
                camera_obj = new THREE.OrthographicCamera( left, right, top, bottom, near, far);
                camera_obj.name = camera.id;
                camera_obj.position.set(location[0],location[1],location[2]);
                camera_obj.lookAt(new THREE.Vector3(target[0],target[1],target[2]));
                //console.log("orthogonal values : " + left + " " + right + " " + top + " " + bottom + " " + near + " " + far);
                this.app.cameras[camera_idx] = camera_obj;
            }else{
                console.log("camera type not recognized");
            }

        }

        // Set the active camera if an ID is provided
        if(id != null){
            this.app.setActiveCamera(id); 
        }

    }

    /**
     * Recursively sets up the scene nodes based on the provided node data.
     * @param {string} nodeRef - The reference ID of the node to set up.
     * @param {THREE.Group} [parent] - The parent group to which the new node will be added. If not provided, the node will be added to the root.
     * @returns {THREE.Group} The created THREE.Group representing the node and its children.
    */
    set_nodes(nodeRef, parent = undefined) {
    
        let node = this.data.nodes[nodeRef];
        if(node.id === "pigs"){
            console.log("node: ")    
            console.log(node);
        }
        
        let group = new THREE.Group();
        
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
        // console.log("parent:")
        // console.log(parent)

        

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

        if(node.id === "pigs"){
            console.log("group: ")    
            console.log(group);
        }
        
        // Process children of the node
        node.children.forEach(child =>{
            //console.log("childAAA: ", child);

            if(child.type === "node"){
                // Recursively add child node to the group
                group.add(this.set_nodes(child.id, group));
            }
            else if(child.type === "primitive"){
                // Add primitive child to the group
                let material = this.materials[group.materialIds[0]];
                const newPrimitive = this.set_primitive(child, material,group.castShadow,group.receiveShadow);
                if (newPrimitive)
                    group.add(newPrimitive)
                else
                    console.warn("primitive not created. Check if the subtype", child.subtype, "is supported by the application.")
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
                        // console.log("grandChild.node: ", grandChild.node);
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
                //console.log("spotlight: ", spotlight);
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

            }else if(child.type === "pointlight"){
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
            // console.log("transformation: ", transformations[transformation]);
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
        // console.log("primitive: ", primitive);

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
                // console.log("cylinder rep: ", primitive.representations[0]);
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
                console.log("trackRepresentations: ", trackRepresentations)
                const trackBuilder = new MyTrackBuilder(trackRepresentations.controlpoints, trackRepresentations.segments);
                geometry = trackBuilder.build();
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
                //console.log("skyboxInfo: ", skyboxInfo);
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
        // called after the scene is loaded and before the first render
        this.data = data;

        this.buildSkyboxs();

        this.set_materials(data.materials);
        this.set_cameras(data.cameras,data.activeCameraId);

        this.object = this.set_nodes(data.rootId);
        this.app.scene.add(this.object);
    }

    update() {
        
    }
}

export { MyContents };