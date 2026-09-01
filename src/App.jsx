import { Canvas, useFrame, useLoader, extend, useThree } from '@react-three/fiber'
import { useGLTF, Clouds, Cloud, Clone, useProgress } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, HueSaturation, BrightnessContrast } from '@react-three/postprocessing'
import { Suspense, useMemo, useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { Water } from 'three-stdlib'

extend({ Water })

function Petals({ count = 150 }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        t: Math.random() * 100,
        speed: 0.01 + Math.random() / 100,
        x: -20 + Math.random() * 40,
        y: 2 + Math.random() * 15,
        z: -15 + Math.random() * 30,
        spin: Math.random() * 0.2
      })
    }
    return temp
  }, [count])

  useFrame((state, delta) => {
    particles.forEach((particle, i) => {
      particle.t += particle.speed
      particle.y -= delta * 1.5
      particle.x -= delta * 2.0
      
      if (particle.y < -0.5) {
        particle.y = 15 + Math.random() * 5
        particle.x = -20 + Math.random() * 40
      }
      if (particle.x < -20) {
        particle.x = 20
      }

      const flutterX = Math.sin(particle.t * 5) * 0.5
      const flutterZ = Math.cos(particle.t * 3) * 0.5

      dummy.position.set(particle.x + flutterX, particle.y, particle.z + flutterZ)
      dummy.rotation.set(particle.t * 2, particle.t * particle.spin * 10, particle.t * 3)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <boxGeometry args={[0.2, 0.1, 0.02]} />
      <meshBasicMaterial color="#ffcc00" side={THREE.DoubleSide} transparent opacity={0.9} />
    </instancedMesh>
  )
}

function WindStrings({ count = 30 }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const strings = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        x: -30 + Math.random() * 60,
        y: Math.random() * 15,
        z: -20 + Math.random() * 40,
        speed: 15 + Math.random() * 20, 
        scale: 0.5 + Math.random() * 1.5
      })
    }
    return temp
  }, [count])

  useFrame((state, delta) => {
    strings.forEach((str, i) => {
      str.x -= str.speed * delta 
      if (str.x < -30) {
        str.x = 30
        str.y = Math.random() * 15
        str.z = -20 + Math.random() * 40
      }
      dummy.position.set(str.x, str.y, str.z)
      dummy.scale.set(str.scale, 1, 1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]} rotation={[0, Math.PI / 2, 0]}>
      <boxGeometry args={[3, 0.015, 0.015]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
    </instancedMesh>
  )
}

function Lotuses({ count = 25 }) {
  const { scene } = useGLTF('./models/lotus.glb')
  
  const positions = useMemo(() => {
    return Array.from({ length: count }, () => {
      let x, z;
      do {
        x = -15 + Math.random() * 30;
        z = -15 + Math.random() * 30;
      } while (Math.sqrt(x*x + z*z) < 6);
      return [x, -0.4, z];
    })
  }, [count])
  
  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <Clone 
            object={scene} 
            scale={0.2 + Math.random() * 0.2} 
            rotation={[0, Math.random() * Math.PI * 2, 0]} 
          />
          <pointLight intensity={0.8} color="#88ccff" distance={3} position={[0, 0.5, 0]} />
        </group>
      ))}
    </group>
  )
}

function Lanterns({ count = 15 }) {
  const lat1 = useGLTF('./models/latern1.glb')
  const lat2 = useGLTF('./models/latern2.glb')
  const lat3 = useGLTF('./models/latern3.glb')
  const models = [lat1.scene, lat2.scene, lat3.scene]
  
  const group = useRef()
  
  const lanterns = useMemo(() => {
    return Array.from({ length: count }, () => {
      let x, z;
      do {
        x = -12 + Math.random() * 24;
        z = -12 + Math.random() * 24;
      } while (Math.sqrt(x*x + z*z) < 4);
      return {
        modelIndex: Math.floor(Math.random() * 3),
        position: [x, 0.5 + Math.random() * 4, z],
        offset: Math.random() * 100,
        speed: 0.5 + Math.random() * 1.5,
        scale: 0.6 + Math.random() * 0.4
      }
    })
  }, [count])
  
  useFrame((state) => {
    if (group.current) {
      group.current.children.forEach((child, i) => {
        const lantern = lanterns[i]
        child.position.y = lantern.position[1] + Math.sin(state.clock.elapsedTime * lantern.speed + lantern.offset) * 0.4
      })
    }
  })

  return (
    <group ref={group}>
      {lanterns.map((l, i) => (
        <group key={i} position={l.position}>
          <Clone 
            object={models[l.modelIndex]} 
            scale={l.scale} 
            rotation={[0, Math.random() * Math.PI * 2, 0]} 
          />
          <pointLight intensity={0.5} color="#ffcc00" distance={3} />
        </group>
      ))}
    </group>
  )
}

function Ocean() {
  const ref = useRef()
  const gl = useThree((state) => state.gl)
  
  const waterNormals = useLoader(
    THREE.TextureLoader, 
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg'
  )
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping

  const geom = useMemo(() => new THREE.PlaneGeometry(2000, 2000), [])
  const config = useMemo(() => ({
    textureWidth: 1024,
    textureHeight: 1024,
    waterNormals,
    sunDirection: new THREE.Vector3(-15, 5, -2).normalize(), 
    sunColor: 0xffcc00, 
    waterColor: 0x000000, 
    distortionScale: 1.0,
    fog: true,
    format: gl.outputColorSpace || gl.outputEncoding,
  }), [waterNormals, gl])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.material.uniforms.time.value += delta * 0.1
    }
  })

  return <water ref={ref} args={[geom, config]} rotation-x={-Math.PI / 2} position={[0, -0.45, 0]} />
}

// Custom interactive group that handles horizontal dragging without triggering React state updates
function InteractiveGroup({ children }) {
  const group = useRef()
  const { gl } = useThree()
  
  useEffect(() => {
    let isDragging = false
    let previousX = 0
    
    const onPointerDown = (e) => {
      isDragging = true
      previousX = e.clientX
      gl.domElement.style.cursor = 'grabbing'
    }
    const onPointerUp = () => {
      isDragging = false
      gl.domElement.style.cursor = 'grab'
    }
    const onPointerMove = (e) => {
      if (isDragging && group.current) {
        const deltaX = e.clientX - previousX
        group.current.rotation.y += deltaX * 0.005 // Control drag speed here
        previousX = e.clientX
      }
    }
    
    gl.domElement.style.cursor = 'grab'
    gl.domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    
    return () => {
      gl.domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [gl])
  
  return <group ref={group}>{children}</group>
}

// Smoothly moves the camera based on mouse hover position for a parallax effect
function CameraRig() {
  useFrame((state) => {
    // Calculate a target position based on our base coordinate
    // state.mouse goes from -1 (bottom) to 1 (top)
    const targetX = 20 + state.mouse.x * 3;
    
    // Adjusted so that when mouse is at the very bottom (-1), Y is -0.2 (just barely above water at -0.45)
    // When mouse is at the top (1), Y is 1.8
    const targetY = 0.8 + state.mouse.y * 1.0;
    
    // Smoothly interpolate current camera position towards the target position
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    
    // Lock the camera focus higher up on the tree trunk so the camera physically "looks up"
    state.camera.lookAt(0, 3.0, 0);
  })
  return null
}

function Scene() {
  const { scene } = useGLTF('./models/yellow_tree.glb')
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])
  
  return (
    <>
      {/* We wrap the island, lotuses, and lanterns in the InteractiveGroup so they all rotate together */}
      <InteractiveGroup>
        <primitive object={scene} scale={10} />
        <Lotuses count={25} />
        <Lanterns count={15} />
      </InteractiveGroup>

      {/* The camera rig controls the parallax hover effect */}
      <CameraRig />
      
      <Clouds material={THREE.MeshLambertMaterial}>
        <Cloud seed={1} bounds={[30, 2, 10]} volume={20} color="#111111" position={[-15, 10, -15]} opacity={0.9} />
        <Cloud seed={2} bounds={[40, 4, 10]} volume={25} color="#050505" position={[10, 15, -25]} opacity={1.0} />
        <Cloud seed={3} bounds={[25, 4, 10]} volume={15} color="#222222" position={[5, 12, -20]} opacity={0.8} />
      </Clouds>

      <ambientLight intensity={0.5} color="#ffffff" />
      
      <directionalLight 
        position={[-15, 5, -2]} 
        intensity={1.5} 
        color="#ffffff" 
        castShadow 
        shadow-bias={-0.0001}
      />

      <pointLight position={[-2, 2, -2]} intensity={4.0} color="#ffcc00" distance={15} />
      <pointLight position={[2, 2, 2]} intensity={4.0} color="#ffaa00" distance={15} />
      <pointLight position={[0, 0, 0]} intensity={5.0} color="#ffdd44" distance={20} />

      {/* Petals and wind stay global so they don't rotate with the island */}
      <Petals count={200} />
      <WindStrings count={30} />

      <Ocean />

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom 
          luminanceThreshold={0.5} 
          mipmapBlur 
          intensity={1.0} 
        />
        <HueSaturation saturation={0.3} hue={0} />
        <BrightnessContrast brightness={0.05} contrast={0.2} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  )
}

function CustomLoader() {
  const { progress } = useProgress()
  const [status, setStatus] = useState('loading') // loading, ready, fading, hidden

  useEffect(() => {
    if (progress === 100 && status === 'loading') {
      setStatus('ready')
    }
  }, [progress, status])

  const fireflies = useMemo(() => {
    return Array.from({ length: 40 }, () => ({
      left: Math.random() * 100 + 'vw',
      top: Math.random() * 100 + 'vh',
      animationDelay: Math.random() * 5 + 's',
      animationDuration: 3 + Math.random() * 4 + 's'
    }))
  }, [])

  if (status === 'hidden') return null;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  // Fallback to empty if progress is undefined
  const offset = circumference - ((progress || 0) / 100) * circumference;

  return (
    <div className={`loader-container ${status === 'fading' ? 'fog-fade' : ''}`}>
      {/* HTML Fireflies background */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {fireflies.map((ff, i) => (
          <div 
            key={i} 
            className="firefly" 
            style={{ 
              left: ff.left, 
              top: ff.top, 
              animationDelay: `${ff.animationDelay}, ${ff.animationDelay}`,
              animationDuration: `${ff.animationDuration}, ${ff.animationDuration}`
            }} 
          />
        ))}
      </div>

      <div 
        className="loader-center" 
        style={{ zIndex: 1 }}
        onClick={() => {
          if (status === 'ready') {
            setStatus('fading')
            // Match the 2.5s CSS animation length
            setTimeout(() => setStatus('hidden'), 2500)
          }
        }}
      >
        <svg className="progress-ring" width="150" height="150">
          <circle
            className="progress-ring__circle"
            r={radius}
            cx="75"
            cy="75"
            style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
          />
        </svg>
        <img 
          src="./goldenleaf.png" 
          alt="Golden Leaf" 
          className={`golden-leaf ${status === 'ready' || status === 'fading' ? 'glow' : ''}`}
        />
      </div>
      <div className={`click-text-wrapper ${status === 'ready' || status === 'fading' ? 'visible' : ''}`}>
        <div className="click-text">CLICK TO ENTER</div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      <Canvas 
        shadows 
        camera={{ position: [20, 0.5, 2.66], fov: 45 }}
      >
        <fog attach="fog" args={['#050505', 10, 50]} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <CustomLoader />
    </div>
  )
}
