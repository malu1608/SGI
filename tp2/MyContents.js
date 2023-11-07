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
        this.set_cameras(data.cameras);

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

    set_cameras(cameras){
        
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
                this.app.cameras['Perspective Camera'] = camera_obj;
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
                this.app.cameras['Orthogonal Camera'] = camera_obj;
            }else{
                console.log("camera type not recognized");
            }

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