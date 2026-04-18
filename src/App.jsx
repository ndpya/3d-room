import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js'

function App() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#FFFFFF');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      35,
      sizes.width / sizes.height,
      0.1,
      200
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    })
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
    outlinePass.edgeStrength = 2.0;
    outlinePass.edgeGlow = 0.0;
    outlinePass.edgeThickness = 1.0;
    outlinePass.pulsePeriod = 0;
    outlinePass.visibleEdgeColor.set(0xffffff);
    composer.addPass(outlinePass);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 5;
    controls.maxDistance = 45;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();
    controlsRef.current = controls;

    camera.position.set(-8.33422, -1.19208, 0.62114);
    controls.target.set(-0.17042, -2.64081, 0.66118);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let natMesh = null;
    let hoveredMesh = null;

    const handleResize = () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      composer.setSize(sizes.width, sizes.height);
    }
    window.addEventListener('resize', handleResize);

    const dracoLoader = new DRACOLoader();
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load('/3d-room/models/room_wip.glb', (gltf) => {
      gltf.scene.scale.set(1, 1, 1);
      gltf.scene.position.set(0, -3, 0);

      gltf.scene.traverse((child) => {
        if(child.isMesh){
          child.castShadow = true;
          child.receiveShadow = true;
          child.geometry.computeVertexNormals();

          if(child.material){
            child.material.envMapIntensity = 1;
            child.material.side = THREE.FrontSide;
          }
        }

        if(child.name === 'nat' || child.name.includes('nat')){
          natMesh = child;
          while(natMesh.parent &&
            (natMesh.parent.name === 'nat' || natMesh.parent.name.includes('nat'))){
              natMesh = natMesh.parent;
          }
          child.userData.clickable = true;
        }
      });
      scene.add(gltf.scene);
    });
    
    const onMouseClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
  
      const intersects = raycaster.intersectObject(scene, true);
  
      for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.userData.clickable) {
          window.location.href = '/3d-room/aboutme.html';
          break;
        }
      }
    };

    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(scene, true);

      let foundCharacter = false;
      
      for (let i = 0; i < intersects.length; i++) {
        let obj = intersects[i].object;
        while(obj){
          if(obj === natMesh){
            hoveredMesh = intersects[i].object;
            outlinePass.selectedObjects = [natMesh];
            foundCharacter = true;
            return;
          }
          obj = obj.parent;
        }
      }
      
      if(!foundCharacter){
        outlinePass.selectedObjects = [];
        hoveredMesh = null;
      }
    }

    window.addEventListener('click', onMouseClick); 
    window.addEventListener('mousemove', onMouseMove);

    // find camera and control coordinates
    /*
    window.addEventListener('keydown', (event) => {
      if(event.key == 'c'){
        console.log(`camera position: ${camera.position.x.toFixed(5)}, ${camera.position.y.toFixed(5)}, ${camera.position.z.toFixed(5)}`);
        console.log(`controls position: ${controls.target.x.toFixed(5)}, ${controls.target.y.toFixed(5)}, ${controls.target.z.toFixed(5)}`);
      }
    });
    */

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2);
    const light = new THREE.DirectionalLight(0xFFFFFF, 1);
    light.position.set(-5.758811528507977, 13.900633679846791, -13.500235755365786);
    light.castShadow = true;
    scene.add(ambientLight);
    scene.add(light);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      composer.render(scene, camera);
    }
    animate()

    return () => {
      window.removeEventListener('click', onMouseClick);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      composer.dispose();
    }
  }, [])

  return (
    <>
      <canvas id="experience-canvas" ref={canvasRef} style={{
        display: 'block',
        width: '100%',
        height: '100%'
      }} />    </>
  )
}

export default App;