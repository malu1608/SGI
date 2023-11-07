import * as THREE from 'three';
import { MyAxis } from './MyAxis.js';
import { MyFileReader } from './parser/MyFileReader.js';
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
        //this.materials['tableApp'] a key tableApp leva me diretamente ao material_obj
        this.reader = new MyFileReader(app, this, this.onSceneLoaded);
		this.reader.open("scenes/demo/demo.xml");		
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
        this.onAfterSceneLoadedAndBeforeRender(data);

        this.set_globals(data.options);
        this.set_fog(data.getFog());
        this.set_materials(data.materials);
        this.set_cameras(data.cameras,data.activeCameraId );
        this.object = this.set_nodes(data.rootId);
        this.app.scene.add(this.object);

    }

    set_fog(fog){
        if(fog != null){
            const color = fog.color;
            const near = fog.near;
            const far = fog.far;
            this.app.scene.fog = new THREE.Fog(new THREE.Color(color.r,color.b,color.c),near,far)
            console.log("a cor é "+ color.r + " " + color.g + " " + color.b)
            console.log("near: " + near )
            console.log("near: " + far)
        }
    }

    set_globals(options) {
        if (options.ambient != null) {
            const ambient = options.ambient;
            const ambientColor = new THREE.Color(ambient.r, ambient.g, ambient.b);
            this.app.scene.ambientLight = new THREE.AmbientLight(ambientColor);
            console.log("Ambient Light: " + ambient.r + " " + ambient.g + " " + ambient.b);
        }
      
        if (options.background != null) {
           const background = options.background;
           const backgroundColor = new THREE.Color(background.r,background.g,background.b)
           this.app.scene.background = new THREE.AmbientLight(backgroundColor);
           console.log("Background color : " + background.r + " " + background.g + " " + background.b);
        }
      }

    getTexture(texture, length_s, length_t){
        if(texture != null){
            const texture_obj = new THREE.TextureLoader().load(this.data.textures[texture].filepath);
            texture_obj.isVideo = this.data.textures[texture].isVideo;
            texture_obj.magFilter = THREE.LinearFilter;
            texture_obj.minFilter = THREE.LinearMipMapLinearFilter;
            texture_obj.anisotropy = this.data.textures[texture].anisotropy;
            texture_obj.mipmaps = true;
            texture_obj.wrapS = THREE.RepeatWrapping;
            texture_obj.wrapT = THREE.RepeatWrapping;
            texture_obj.repeat.set(length_s, length_t);
            return texture_obj;
        }
        return null;
    }

    set_materials(materials){
        for(let materials_idx in materials){
            const material = materials[materials_idx]
            const materialObj = new THREE.MeshPhongMaterial(
                {"color": new THREE.Color(material.color.r,material.color.g,material.color.b), 
                "specular": new THREE.Color(material.specular.r,material.specular.g,material.specular.b),  
                "shininess": material.shininess, 
                "emissive": new THREE.Color(material.emissive.r,material.emissive.g,material.emissive.b), 
                "side": (material.twosided) ? THREE.DoubleSide : THREE.FrontSide, 
                "wireframe": material.wireframe, 
                "bumpScale": material.bumpscale,
                "specularMap": new THREE.TextureLoader().load(material.specularref),
                "aoMap" : this.getTexture(material.textureref,material.texlength_s,material.texlength_t),    
                "bumpMap" : new THREE.TextureLoader().load(material.bumpref),
                "flatShading": (material.shading === 'flat'),

            })

            this.materials[materials_idx] = materialObj;
        }
        
    }

    set_cameras(cameras,id){
        this.app.cameras = [] // reset cameras

        //load das cameras todas
        for (let camera_idx in cameras) {
            console.log("camera ativa: " + camera_idx);
            const camera = cameras[camera_idx]
            const near = camera.near;
            const far = camera.far;
            let location = camera.location;
            let target = camera.target;
            const aspect = window.innerWidth / window.innerHeight;
            let camera_obj;
            if (camera.type === "perspective") {
                const angle = camera.angle;
                camera_obj = new THREE.PerspectiveCamera(angle,aspect,near,far);
                camera_obj.position.set(location[0],location[1],location[2]);
                //console.log("camera_obj: ", camera.location)
                camera_obj.lookAt(new THREE.Vector3(target[0],target[1],target[2]));
                //console.log("camera_obj: ", camera_obj.position['x']);
                this.app.cameras[camera_idx] = camera_obj;
                console.log("perspective values : " + angle + " " + aspect + " " + near + " " + far+ " "+ target + " " + location + " "+  camera_obj.position['x'] + " " + camera_obj.position['y'] + " " + camera_obj.position['z']);
            } else if (camera.type === "orthogonal") {
                const left = camera.left;
                const right = camera.right;
                const bottom = camera.bottom;
                const top = camera.top;
                camera_obj = new THREE.OrthographicCamera( left, right, top, bottom, near, far);
                camera_obj.position.set(location[0],location[1],location[2]);
                camera_obj.lookAt(new THREE.Vector3(target[0],target[1],target[2]));
                console.log("orthogonal values : " + left + " " + right + " " + top + " " + bottom + " " + near + " " + far);
                this.app.cameras[camera_idx] = camera_obj;
            }else{
                console.log("camera type not recognized");
            }

        }

        if(id != null){
            this.app.setActiveCamera(id); // set active camera
        }

    }

    set_nodes(rootId){
        //prox semana por o lod

        let node = this.data.nodes[rootId];
        let group = new THREE.Group();

        //aplicar transformações ao grupo
        for(let transformation in node.transformations){
            if(transformation.type === "T" ){

            }else if(transformation.type === "R"){

            }else if(transformation.type === "S"){

            }
            
        }

        //aplicar materiais ao grupo
        if(node.materialIds != [] && node.materialIds != null){
            for(let material in node.materialIds){
                group.material = this.materials[material];
            }
        }


        if(node.type === "node"){
            console.log("node: ", node);
            
        } 
        if(node.transformations != []){

        }
        if(node.materialIds != []){

        }
        for(let child in node.children){
            if(child.type === "node"){
                group.add(this.set_nodes(child.id));
            }
            else if(child.type === "primitive"){
                group.add( this.set_primitive(child));
            }
            else if(child.type === "spotlight"){
                //g add spotlight
            }
            else if(child.type === "directionallight"){

            }else if(child.type === "pointlight"){

            }
        }

        return group;

    }

    set_primitive(primitive){
        switch(primitive.subtype){
            case "rectangle":
                const rectangle = new THREE.Geometry();
                rectangle.vertices.push(
                    new THREE.Vector3( primitive.x1, primitive.y1, primitive.z1 ),
                    new THREE.Vector3( primitive.x2, primitive.y2, primitive.z2 ),
                    new THREE.Vector3( primitive.x3, primitive.y3, primitive.z3 ),
                    new THREE.Vector3( primitive.x4, primitive.y4, primitive.z4 ),
                );
                rectangle.faces.push( new THREE.Face3( 0, 1, 2 ) );
                rectangle.faces.push( new THREE.Face3( 0, 2, 3 ) );
                rectangle.computeFaceNormals();
                rectangle.computeVertexNormals();
                const rectangleMesh = new THREE.Mesh( rectangle, this.materials[primitive.materialId] );
                //this.app.scene.add( rectangleMesh );
                break;
            case "triangle":
                const triangle = new THREE.Geometry();
                triangle.vertices.push(
                    new THREE.Vector3( primitive.x1, primitive.y1, primitive.z1 ),
                    new THREE.Vector3( primitive.x2, primitive.y2, primitive.z2 ),
                    new THREE.Vector3( primitive.x3, primitive.y3, primitive.z3 ),
                );
                triangle.faces.push( new THREE.Face3( 0, 1, 2 ) );
                triangle.computeFaceNormals();
                triangle.computeVertexNormals();
                const triangleMesh = new THREE.Mesh( triangle, this.materials[primitive.materialId] );
                this.app.scene.add( triangleMesh );
                break;
            case "cylinder":
                const cylinder = new THREE.CylinderGeometry( primitive.base, primitive.top, primitive.height, primitive.slices, primitive.stacks );
                const cylinderMesh = new THREE.Mesh( cylinder, this.materials[primitive.materialId] );
                this.app.scene.add( cylinderMesh );
                break;
            case "sphere":
                const sphere = new THREE.SphereGeometry( primitive.radius, primitive.slices, primitive.stacks );
                const sphereMesh = new THREE.Mesh( sphere, this.materials[primitive.materialId] );
                this.app.scene.add( sphereMesh );
                break;
            default:
                break;

        }
    }

      
    output(obj, indent = 0) {
        console.log("" + new Array(indent * 4).join(' ') + " - " + obj.type + " " + (obj.id !== undefined ? "'" + obj.id + "'" : ""))
    }

    onAfterSceneLoadedAndBeforeRender(data) {
        this.data = data;
        // refer to descriptors in class MySceneData.js
        // to see the data structure for each item

        this.output(data.options)
        console.log("textures:")
        for (var key in data.textures) {
            let texture = data.textures[key]
            this.output(texture, 1)
        }

        console.log("materials:")
        for (var key in data.materials) {
            let material = data.materials[key]
            this.output(material, 1)
        }

        console.log("cameras:")
        for (var key in data.cameras) {
            let camera = data.cameras[key]
            this.output(camera, 1)
        }

        console.log("nodes:")
        for (var key in data.nodes) {
            console.log(data.getNode(key))
            
            let node = data.nodes[key]
            this.output(node, 1)
            if (node.loaded === false) {
                console.error("" + new Array(2 * 4).join(' ') + " not loaded. Possibly refered as a node child but not defined in scene.")
            }
            for (let i=0; i< node.children.length; i++) {
                let child = node.children[i]
                if (child.type === "primitive") {
                    console.log("" + new Array(2 * 4).join(' ') + " - " + child.type + " with "  + child.representations.length + " " + child.subtype + " representation(s)")
                    if (child.subtype === "nurbs") {
                        console.log("" + new Array(3 * 4).join(' ') + " - " + child.representations[0].controlpoints.length + " control points")
                    }
                }
                else
                if (child.type === "lodref") {
                    console.log("" + new Array(2 * 4).join(' ') + " - " + child.type + ", id "  + child.id)                    
                }
                else {
                    this.output(child, 2)
                }
            }
            
        }

        console.log("lods:")
        for (var key in data.lods) {
            let lod = data.lods[key]
            this.output(lod, 1)
            if (lod.loaded === false) {
                console.error("" + new Array(2 * 4).join(' ') + " not loaded. Possibly refered as a node child but not defined in scene.")
            }
            for (let i=0; i< lod.children.length; i++) {
                let child = lod.children[i]
                console.log("" + new Array(2 * 4).join(' ') + " - " + child.type + " "  + child.node.id + ", min distance: " + child.mindist)
            }
        }
    }

    update() {
        
    }
}

export { MyContents };