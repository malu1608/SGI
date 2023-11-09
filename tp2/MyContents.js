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
        this.lights = {}
        //this.materials['tableApp'] a key tableApp leva me diretamente ao material_obj
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
        this.onAfterSceneLoadedAndBeforeRender(data);

        this.set_globals(data.options);
        this.set_fog(data.getFog());
        this.set_materials(data.materials);
        this.set_cameras(data.cameras,data.activeCameraId);
        this.object = this.set_nodes(data.rootId);
        this.app.scene.add(this.object);

    }

    set_fog(fog){
        if(fog != null){
            const color = fog.color;
            const near = fog.near;
            const far = fog.far;

            this.app.scene.fog = new THREE.Fog(new THREE.Color(color.r,color.g,color.b),near,far)
            console.log("a cor é "+ color.r + " " + color.g + " " + color.b)
            console.log("near: " + near )
            console.log("near: " + far)
        }
    }

    set_globals(options) {
        if (options.ambient != null) {
            const ambient = options.ambient;
            const ambientColor = new THREE.Color(ambient.r, ambient.g, ambient.b);
            const light = new THREE.AmbientLight(ambientColor);
            this.app.scene.add(light);
            console.log("Ambient Light: " + ambient.r + " " + ambient.g + " " + ambient.b);
        }
      
        if (options.background != null) {
           const background = options.background;
           const backgroundColor = new THREE.Color(background.r,background.g,background.b)
           this.app.scene.background = backgroundColor;
           console.log("Background color : " + background.r + " " + background.g + " " + background.b);
        }
      }

    getTexture(texture, length_s, length_t){
        if(texture != null){
            console.log("texture: ", texture);
            const texture_obj = new THREE.TextureLoader().load(this.data.textures[texture].filepath);
            texture_obj.isVideo = this.data.textures[texture].isVideo;
            texture_obj.magFilter = THREE.LinearFilter;
            texture_obj.minFilter = THREE.LinearMipMapLinearFilter;
            texture_obj.anisotropy = this.data.textures[texture].anisotropy;
            texture_obj.mipmaps = true;
            texture_obj.wrapS = THREE.ClampToEdgeWrapping;
            texture_obj.wrapT = THREE.ClampToEdgeWrapping;
            texture_obj.repeat.set(length_s, length_t); // TODO: check if this is correct
            return texture_obj;
        }
        return null;
    }

    set_materials(materials){
        for(let materials_idx in materials){
            
            const material = materials[materials_idx]
            console.log("material: ", material);
            const materialObj = new THREE.MeshPhongMaterial(
                
                {
                "color": new THREE.Color(material.color.r,material.color.g,material.color.b), 
                "specular": material.specular,  
                "shininess": material.shininess, 
                "emissive": material.emissive, 
                "side": (material.twosided) ? THREE.DoubleSide : THREE.FrontSide, 
                "wireframe": material.wireframe,
                "bumpScale": material.bumpscale,
                "map": this.getTexture(material.textureref,material.texlength_s,material.texlength_t),
                "flatShading": (material.shading === 'flat'),

            })
            
            console.log("materialObj: ", materialObj);
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
                //console.log("perspective values : " + angle + " " + aspect + " " + near + " " + far+ " "+ target + " " + location + " "+  camera_obj.position['x'] + " " + camera_obj.position['y'] + " " + camera_obj.position['z']);
            } else if (camera.type === "orthogonal") {
                const left = camera.left;
                const right = camera.right;
                const bottom = camera.bottom;
                const top = camera.top;
                camera_obj = new THREE.OrthographicCamera( left, right, top, bottom, near, far);
                camera_obj.position.set(location[0],location[1],location[2]);
                camera_obj.lookAt(new THREE.Vector3(target[0],target[1],target[2]));
                //console.log("orthogonal values : " + left + " " + right + " " + top + " " + bottom + " " + near + " " + far);
                this.app.cameras[camera_idx] = camera_obj;
            }else{
                console.log("camera type not recognized");
            }

        }

        if(id != null){
            this.app.setActiveCamera(id); // set active camera
        }

    }

    set_nodes(nodeRef, parent = undefined){
        //prox semana por o lod

        let node = this.data.nodes[nodeRef];
        //console.log("node: ", this.data.getNode(nodeRef));
        console.log("node: ", nodeRef)    
        let group = new THREE.Group();
        //console.log("transformation: ", node.transformations);
        //aplicar transformações ao grupo
        let transformations = node['transformations'];

        this.set_transformations(group, transformations)

        if (node.materialIds.length != 0) {
            group.materialIds = node.materialIds;
        } else if (parent != undefined) {
            group.materialIds = parent.materialIds;
        } else {
            group.materialIds = [];
        }

        node.children.forEach(child =>{
            //console.log("child: ", child);

            if(child.type === "node"){
                group.add(this.set_nodes(child.id, group));
            }
            else if(child.type === "primitive"){
                const newPrimitive = this.set_primitive(child, this.materials[group.materialIds[0]]);
                if (newPrimitive)
                    group.add(newPrimitive)
                else
                    console.warn("primitive not created. Check if the subtype", child.subtype, "is supported by the application.")
            }
            else if(child.type === "spotlight"){
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

    set_transformations(group, transformations){
        for(const transformation in transformations){
            console.log("transformation: ", transformations[transformation]);
            if(transformations[transformation].type === "T" ){
                const [x, y, z] = transformations[transformation].translate;
                group.translateX(x);
                group.translateY(y);
                group.translateZ(z);
            }else if(transformations[transformation].type === "R"){
                const [x, y, z] = transformations[transformation].rotation;
                group.rotateX(x * Math.PI / 180);
                group.rotateY(y * Math.PI / 180);
                group.rotateZ(z * Math.PI / 180);
            }else if(transformations[transformation].type === "S"){
                const [x, y, z] = transformations[transformation].scale;
                //group.scale.set(x, y, z);
                group.scale.x *= x
                group.scale.y *= y
                group.scale.z *= z
            }
            
        }
    }

    set_primitive(primitive, material){
        console.log("primitive: ", primitive);

        let geometry = null

        switch(primitive.subtype){
            case "rectangle":
                const { xy1, xy2, parts_x, parts_y } = primitive.representations[0];
                geometry = new THREE.PlaneGeometry(xy2[0] - xy1[0], xy2[1] - xy1[1], parts_x, parts_y);

                geometry.translate(
                    (xy2[0] + xy1[0]) / 2, (xy2[1] + xy1[1]) / 2, 0
                )
                break
            case "triangle":
                const { xyz1, xyz2, xyz3 } = primitive.representations[0];
                geometry = new THREE.Geometry();
                geometry.vertices.push(new THREE.Vector3((xyz1[0], xyz1[1], xyz1[2])))
                geometry.vertices.push(new THREE.Vector3(xyz2[0], xyz2[1], xyz2[2]));
                geometry.vertices.push(new THREE.Vector3(xyz3[0], xyz3[1], xyz3[2]));
                geometry.faces.push(new THREE.Face3( 0, 1, 2 ) );
                geometry.computeFaceNormals();
                //triangle.computeVertexNormals(); prreciso?
                break
            case "cylinder":
                const { base, top, height, slices, stacks, capsclose, thetastart, thetalength, distance } = primitive.representations[0];
                geometry = new THREE.CylinderGeometry(top, base, height, slices, stacks, capsclose, thetastart, thetalength,distance);
                break
            case "sphere":
                const {radius,s_slices,s_stacks,s_thetastart = 0.0,s_thetalength = 2 * Math.PI,phistart = 0.0,philength = 2 * Math.PI} = primitive.representations[0];
                geometry = new THREE.SphereGeometry(radius, s_slices, s_stacks, s_thetastart, s_thetalength, phistart, philength);
                break
            case "box":
                let b_xyz1 = primitive.representations[0].xyz1;
                let b_xyz2 = primitive.representations[0].xyz2;
                const b_parts_x = primitive.representations[0].parts_x || 1;
                const b_parts_y = primitive.representations[0].parts_y || 1;
                const b_parts_z = primitive.representations[0].parts_z || 1;
                // { b_xyz1, b_xyz2, b_parts_x , b_parts_y ,b_parts_z} = primitive.representations[0];
                const b_height = Math.abs(b_xyz2[1]-b_xyz1[1])
                const b_width = Math.abs(b_xyz2[0]-b_xyz1[0])
                const b_depth = Math.abs(b_xyz2[2]-b_xyz1[2])
                geometry = new THREE.BoxGeometry(b_width, b_height, b_depth, b_parts_x, b_parts_y,b_parts_z);
                break
            case "nurbs":
                const { controlpoints, degree1, degree2, knots1, knots2, partsU, partsV } = primitive.representations[0];
                //geometry = new THREE.NURBSSurfaceGeometry(degree1, degree2, knots1, knots2, controlpoints, partsU, partsV);
                break
            default:
                break;
        }

        if (geometry)
            return new THREE.Mesh(geometry, material);
        else
            return undefined // TODO: do not add undefined mesh to parent

    }

      
    output(obj, indent = 0) {
        console.log("" + new Array(indent * 4).join(' ') + " - " + obj.type + " " + (obj.id !== undefined ? "'" + obj.id + "'" : ""))
    }

    onAfterSceneLoadedAndBeforeRender(data) {
        this.data = data;
        // refer to descriptors in class MySceneData.js
        // to see the data structure for each item

        /*
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
        }*/
    }

    update() {
        
    }
}

export { MyContents };