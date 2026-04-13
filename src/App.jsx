import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'


function App() {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const animationIdRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#FFFFFF')
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      35,
      sizes.width / sizes.height,
      0.1,
      200
    )
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 5
    controls.maxDistance = 45
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.update()
    controlsRef.current = controls

    camera.position.set(-8.10177, -0.54518,2.44466);
    controls.target.set(-0.11979, -2.68421, 1.78202);

    const handleResize = () => {
      sizes.width = window.innerWidth
      sizes.height = window.innerHeight

      camera.aspect = sizes.width / sizes.height
      camera.updateProjectionMatrix()

      renderer.setSize(sizes.width, sizes.height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
    window.addEventListener('resize', handleResize)

    const dracoLoader = new DRACOLoader()
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    loader.load('/models/room_wip.glb', (gltf) => {
      scene.add(gltf.scene)
      renderer.setClearColor(new THREE.Color(0x201910).convertSRGBToLinear())
      gltf.scene.scale.set(1, 1, 1)
      gltf.scene.position.set(0, -3, 0)
    })

    const ambientLight = new THREE.AmbientLight(0xFFE7BF, 2)
    scene.add(ambientLight)

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      renderer.dispose()
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

export default App
