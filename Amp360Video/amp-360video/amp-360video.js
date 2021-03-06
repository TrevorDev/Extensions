/*
 * BabylonJS 360/VR
 */
(function(vjs) {
    var extend = function(obj /*, arg1, arg2, ... */) {
        var arg, i, k;
        for (i = 1; i < arguments.length; i++) {
            arg = arguments[i];
            for (k in arg) {
                if (arg.hasOwnProperty(k)) {
                    obj[k] = arg[k];
                }
            }
        }
        return obj;
    },
    defaults = {
        enableVR: true,
        fov: 1.18,
        defaultCameraOrientationX: 0,
        defaultCameraOrientationY: -Math.PI / 2
    },
    plugin = function(pluginOptions) {
        var player = this;
        var settings = extend({}, defaults, pluginOptions || {});
        var videoEl = this.el().getElementsByTagName('video')[0];
        var toggleWebVR = null;

        var addBeforeFullScreen = function(controlBar, element, name) {
            if (controlBar.fullscreenToggle) {
                var fst = controlBar.fullscreenToggle.el();
                if (fst) {
                    fst.parentElement.insertBefore(element, fst);
                }
            }
        };

        var addToggle = function(controlBar, text, css, callback) {
            var Button = vjs.getComponent('Button');
            var button = vjs.extend(Button, {
                constructor: function() {
                    Button.apply(this, arguments);
                },
                textContent: text,
                handleClick: function() {
                    callback();
                },
                buildCSSClass: function() {
                    return css + " " + Button.prototype.buildCSSClass.call(this);
                }
            });
            var childName = text + 'Toggle';
            vjs.registerComponent(childName, button);
            controlBar[childName] = player.getChild('controlBar').addChild(childName, {});
            
            player.ready(function() {
                addBeforeFullScreen(controlBar, controlBar[childName].el(), childName);
            });
        };

        var initScene = function() {
            // Creates the canvas
            var renderedCanvas = document.createElement("canvas");
            renderedCanvas.className = "vjs-tech";
            videoEl.parentElement.insertBefore(renderedCanvas, videoEl);
            videoEl.style.display = "none";

            // Creates the default babylonjs scene
            var engine = new BABYLON.Engine(renderedCanvas);
            var scene = new BABYLON.Scene(engine);

            // Helps reducing the needed number of draw calls.
            scene.renderTargetsEnabled = false;
            scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
            scene.onPointerObservable.add(function() {
                player.userActive(true);
            });

            // No need of clear or depth buffer as it is a 360 video only
            scene.autoClear = false;
            scene.autoClearDepthAndStencil = false;
            engine.setDepthBuffer(false);
            
            // Creates the 360 video.
            var dome = new BABYLON.VideoDome("testdome", videoEl, { autoPlay: false, size: 2000 }, scene);
            dome.rotation.x = -settings.defaultCameraOrientationX;
            dome.rotation.y = -settings.defaultCameraOrientationY;

            // Create the custom vr helper if requested.
            var vrHelper = scene.createDefaultVRExperience({
                useCustomVRButton: true,
                controllerMeshes: false
            });

            // Adapt the camera to the requested settings.
            scene.activeCamera.fov = settings.fov;

            // VR Switch function.
            toggleWebVR = function() {
                if (!vrHelper.isInVRMode) {
                    vrHelper.enterVR();
                    setTimeout(() => { engine.resize(); }, 100);
                } else {
                    vrHelper.exitVR();
                    setTimeout(() => { engine.resize(); }, 100);
                }
            }

            // And finally starts the render loop
            engine.runRenderLoop(function() {
                scene.render();
            });
        };

        if (settings.enableVR) {
            addToggle(player.controlBar, "WebVr", "vjs-webvr-control", function() {
                if (toggleWebVR) {
                    toggleWebVR();
                }
            });
        }

        this.ready(function() {
            initScene();
        });
    };

    // register the plugin with video.js
    vjs.plugin('threeSixty', plugin);
}(window.amp));