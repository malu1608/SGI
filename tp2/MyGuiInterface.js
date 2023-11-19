import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { MyApp } from './MyApp.js';
import { MyContents } from './MyContents.js';

/**
    This class customizes the gui interface for the app
*/
class MyGuiInterface  {

    /**
     * 
     * @param {MyApp} app The application object 
     */
    constructor(app) {
        this.app = app
        this.datgui =  new GUI();
        this.contents = null
    }

    /**
     * Set the contents object
     * @param {MyContents} contents the contents objects 
     */
    setContents(contents) {
        this.contents = contents
    }

    /**
     * Initialize the gui interface
     */
    init() {
        const cameraFolder = this.datgui.addFolder('Camera')
        cameraFolder.add(this.app, 'targetName', ['Video Texture', 'LOD', 'MipMap', 'Bump Texture'] ).name("Target").onChange( (target) => { this.app.controls.target.set(this.app.targets[target].x, this.app.targets[target].y, this.app.targets[target].z);  this.app.controls.update();} );
    }
}

export { MyGuiInterface };