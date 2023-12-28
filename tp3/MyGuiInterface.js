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

        
        
        // interface with cameras
        const cameraFolder = this.datgui.addFolder('Cameras')
        const cameras = this.contents.app.cameras
        //console.log("aqi",cameras)
        cameraFolder.add(this.app, 'activeCameraName', Object.values(cameras).map(camera => camera.name)).name("active camera");

        cameras.forEach((camera, index) => {
            this.app.cameras[camera.name] = camera
            cameraFolder.open();
        });
        
        // interface with videos
        const videos = this.contents.videos;
        const videosFolder = this.datgui.addFolder('Videos');
        videosFolder.close();
        videos.forEach((video, index) => {
            const videoFolder = videosFolder.addFolder(`video  ${index}`);
            videoFolder.add(video, 'play').name('Play');
            videoFolder.add(video, 'pause').name('Pause');
            videoFolder.add(video, 'playbackRate', 0, 2).name('Speed');
            videoFolder.close(); 
        });

        // picking interface
        const data_pic_color = {
            'picking color': this.contents.pickingColor
        };

        const pickFolder = this.datgui.addFolder('Picking');
        pickFolder.addColor(data_pic_color, 'picking color').onChange((value) => { this.contents.updatePickingColor(value) });
        pickFolder.add(this.contents.raycaster, 'near', 0, 5)
        pickFolder.add(this.contents.raycaster, 'far', 5, 80)
        pickFolder.add(this.contents, 'selectedLayer', ['none']).name("selected layer").onChange((value) => { this.contents.selectedLayers = value; this.contents.updateSelectedLayer() });
        pickFolder.open()


    }
}

export { MyGuiInterface };