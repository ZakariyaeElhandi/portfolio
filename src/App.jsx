import { Canvas, useFrame, useLoader, extend, useThree } from '@react-three/fiber'
import { useGLTF, Clouds, Cloud, Clone, useProgress, PerformanceMonitor, BakeShadows, ScrollControls, Scroll, useScroll } from '@react-three/drei'
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

function Lotuses({ count = 8 }) {
  const { scene } = useGLTF('./models/lotus.glb', true)
  
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

function Lanterns({ count = 5 }) {
  const lat1 = useGLTF('./models/latern1.glb', true)
  const lat2 = useGLTF('./models/latern2.glb', true)
  const lat3 = useGLTF('./models/latern3.glb', true)
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

function InteractiveScrollIsland({ children }) {
  const group = useRef()
  const scroll = useScroll()
  const { gl } = useThree()
  
  // Drag state
  const rotationY = useRef(0)
  
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
      if (isDragging) {
        const deltaX = e.clientX - previousX
        rotationY.current += deltaX * 0.005
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

  useFrame(() => {
    if (!group.current) return
    const r = scroll.range(0, 0.15) 
    
    // Smoothly scale down and DROWN into the water (Y drops to -5)
    // The group starts at scale 1 (since internal elements have their own base scales) and shrinks to 0.5
    group.current.scale.setScalar(THREE.MathUtils.lerp(1, 0.5, r))
    group.current.position.y = THREE.MathUtils.lerp(0, -5, r)
    group.current.position.z = THREE.MathUtils.lerp(0, -5, r)
    group.current.rotation.x = THREE.MathUtils.lerp(0, 0.15, r)
    
    // Combine scroll rotation and interactive drag rotation
    const scrollRotY = THREE.MathUtils.lerp(0, Math.PI * 0.1, r)
    group.current.rotation.y = scrollRotY + rotationY.current
  })

  return <group ref={group}>{children}</group>
}

function FloatingDecorations() {
  const mask = useGLTF('./models/mask.glb', true)
  const lat1 = useGLTF('./models/latern1.glb', true)
  
  const group = useRef()
  useFrame((state) => {
    group.current.children.forEach((child, i) => {
      child.rotation.y += 0.005 * (i % 2 === 0 ? 1 : -1)
      child.position.y += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.005
    })
  })

  return (
    <Scroll>
      <group ref={group}>
        {/* Floating Mask for Skills (Page 3). Text is right, mask on left. */}
        <group position={[-12, -33, 8]}>
          <Clone object={mask.scene} scale={4} rotation={[0, 0.5, -0.1]} />
          <pointLight intensity={3} color="#ffcc00" distance={15} />
        </group>
        
        {/* Floating Lanterns for Projects (Page 4). Text is left, lanterns on right. */}
        <group position={[14, -50, 8]}>
          <Clone object={lat1.scene} scale={4} rotation={[0.2, -0.5, 0.1]} />
          <pointLight intensity={2} color="#ffcc00" distance={15} />
        </group>
      </group>
    </Scroll>
  )
}

function HTMLPortfolio() {
  return (
    <Scroll html style={{ width: '100vw', height: '600vh' }}>
      {/* Page 1: Empty to show the 3D Island */}
      <section className="scroll-section hero-section" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '5vh' }}>
        <div className="hero-content top-left">
          <h1 className="hero-name">ZAKARIYAE EL HANDI</h1>
          <p className="hero-subtitle">Software Engineering & Interactive 3D</p>
        </div>
        <div className="scroll-indicator" style={{ position: 'absolute', bottom: '5vh', left: '50%', transform: 'translateX(-50%)' }}>
          <span>SCROLL DOWN</span>
          <div className="mouse"><div className="wheel"></div></div>
        </div>
      </section>

      {/* Page 2: About Me */}
      <section className="scroll-section" style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="content-box left">
          <h2 className="section-title">ABOUT ME</h2>
          <p className="section-text">
            Full-stack-oriented engineering student combining software engineering, AI, data, enterprise systems, 3D modeling, game development, Unreal Engine, Unity, and multimedia.
          </p>
          <p className="section-text">
            Interested in building interactive, visually impressive and technically ambitious digital experiences.
          </p>
        </div>
      </section>

      {/* Page 3: Skills (Mask is floating here) */}
      <section className="scroll-section" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <div className="content-box right">
          <h2 className="section-title">TECHNICAL SKILLS</h2>
          <ul className="skills-list">
            <li><strong>Languages:</strong> JavaScript, TypeScript, Python, C#, C++, SQL, PHP</li>
            <li><strong>Frontend:</strong> React, Next.js, React Native, Three.js, Tailwind</li>
            <li><strong>Backend:</strong> Node.js, Express, NestJS, FastAPI, Django, PostgreSQL</li>
            <li><strong>AI / Data:</strong> Groq API, LLaMA, Whisper, Scikit-learn, Power BI</li>
          </ul>
        </div>
      </section>

      {/* Page 4: Projects (Lotus floating here) */}
      <section className="scroll-section" style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="content-box left">
          <h2 className="section-title">ENTERPRISE & AI</h2>
          <div className="project">
            <h3 className="project-title">Smart HR Ecosystem</h3>
            <p className="section-text">
              A full-stack ecosystem combining Odoo ERP backend, React Native mobile apps, and Next.js SaaS analytics, integrated with LLaMA and Groq AI for automated recruitment and business intelligence.
            </p>
          </div>
          <div className="project">
            <h3 className="project-title">Darija Tourist</h3>
            <p className="section-text">
              AI-powered mobile application helping tourists learn Moroccan Darija with voice interaction, Whisper Speech-to-Text, and custom Animated UI.
            </p>
          </div>
        </div>
      </section>

      {/* Page 5: 3D / Games (Lanterns floating here) */}
      <section className="scroll-section" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <div className="content-box right">
          <h2 className="section-title">3D & GAME DEV</h2>
          <div className="project">
            <h3 className="project-title">Echoes of the Labyrinth</h3>
            <p className="section-text">
              Third-person survival adventure game built in Unity and C#, featuring custom 3D environments modeled in Blender and Mixamo animations.
            </p>
          </div>
          <div className="project">
            <h3 className="project-title">Unreal Engine Samurai</h3>
            <p className="section-text">
              Action-combat prototype exploring Unreal Engine blueprints, animation systems, lighting, and game-ready 3D asset pipelines.
            </p>
          </div>
        </div>
      </section>

      {/* Page 6: Contact */}
      <section className="scroll-section" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="content-box center">
          <h2 className="section-title huge">LET'S CONNECT</h2>
          <a href="mailto:contact@example.com" className="contact-btn">REACH OUT</a>
        </div>
      </section>
    </Scroll>
  )
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

function Scene({ isMobile }) {
  const { scene } = useGLTF('./models/yellow_tree.glb', true)
  
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
      {/* We wrap the island, lotuses, and lanterns in the InteractiveScrollIsland so they sink into water and can be dragged */}
      <InteractiveScrollIsland>
        <primitive object={scene} scale={10} />
        <Lotuses count={25} />
        <Lanterns count={15} />
      </InteractiveScrollIsland>

      <FloatingDecorations />
      <HTMLPortfolio />

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

      <CameraRig />
      
      {!isMobile && (
        <EffectComposer disableNormalPass multisampling={4}>
          <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.0} />
          <HueSaturation saturation={0.3} hue={0} />
          <BrightnessContrast brightness={0.05} contrast={0.2} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      )}

      <Ocean />
    </>
  )
}

function CustomLoader() {
  const { active, progress, total } = useProgress()
  const [status, setStatus] = useState('loading') // loading, ready, fading, hidden
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    if (progress > displayProgress) {
      setDisplayProgress(progress)
    }
  }, [progress, displayProgress])

  useEffect(() => {
    // Only transition to ready if we have actually registered items to load (total > 0),
    // they are completely finished (progress === 100), and the loading manager is no longer active.
    // This prevents the "CLICK TO ENTER" text from appearing prematurely on the very first frame.
    if (!active && progress === 100 && total > 0 && status === 'loading') {
      setStatus('ready')
    }
  }, [active, progress, total, status])

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
  const offset = circumference - ((displayProgress || 0) / 100) * circumference;

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [dpr, setDpr] = useState(1.5)
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      <Canvas 
        shadows={!isMobile} 
        dpr={isMobile ? [1, 1] : [1, dpr]}
        camera={{ position: [20, 0.5, 2.66], fov: 45 }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)}>
          <color attach="background" args={['#050505']} />
          <fog attach="fog" args={['#050505', 10, 50]} />
          <Suspense fallback={null}>
            <ScrollControls pages={6} damping={0.25}>
              <Scene isMobile={isMobile} />
            </ScrollControls>
            {!isMobile && <BakeShadows />}
          </Suspense>
        </PerformanceMonitor>
      </Canvas>
      <CustomLoader />
    </div>
  )
}
