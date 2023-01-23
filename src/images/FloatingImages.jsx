import { Cloud, Html, Image, OrbitControls, PerspectiveCamera, PointerLockControls, Sky, Stars, Text, useCursor, useProgress } from '@react-three/drei'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import React, { Suspense } from 'react'
import { useEffect } from 'react'
import { useRef } from 'react'
import { Ground } from './Ground'
import * as THREE from 'three'
import { useState } from 'react'
import { forwardRef } from 'react'
import gsap from 'gsap'
import { Mesh, TextureLoader } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EffectComposer, DepthOfField, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { useMemo } from 'react'
import { fragmentShader, vertextShader } from './shader'

const GOLDENRATIO = 1.61803398875

function mathRandom(params = 50) {
    const numValue = - Math.random() * params + Math.random() * params;
    return numValue
}

function height(min, max) {
    return min + Math.random() * (max - min);
  }

function Sparks({
    position,
    cPos,
    rotation,
    bools
}) {
    const lineRef = useRef()
    const clockRef = useRef(new THREE.Clock())
    const [texture] = useLoader(TextureLoader,[`./textures/termal.jpg`])

    useEffect(() => {
        if (bools) {
            gsap.to(lineRef.current.position, {x:cPos,duration:5,repeat:-1, yoyo:true, delay:mathRandom(10)});
        }
        else {
            gsap.to(lineRef.current.position, {z:cPos,duration:5,repeat:-1, yoyo:true, delay:mathRandom(10)});
        }

    },[])
    
    useFrame(() => {
        lineRef.current.material.uniforms.uTime.value = clockRef.current.getElapsedTime()
    })

    const uniforms = useMemo(() => ({
        uTime: {
            value: 0.0
        },
        uTexture: { value:texture }
    }))
    
    return (
        <>
            <mesh
                position={position}
                rotation={rotation}
                ref={lineRef}
                receiveShadow={true}
                castShadow={true}
            >
                <planeGeometry args={[5,1/10,20,20]} />
                <shaderMaterial 
                    vertexShader={vertextShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </>
    )
}

function Frame(
    { 
        title,
        url, 
        c = new THREE.Color(), 
        position,
        position2,
        rotate,
        links,
        object

    }) {
    const [hovered, hover] = useState(false)
    const [rnd] = useState(() => Math.random())
    const image = useRef()
    const frame = useRef()
    const name = title
    // const objectRef = useRef(null)

    // useEffect(() => {
    //     object.current.push(objectRef.current)
    // },[])

    const clicked = (links) => {
        window.location.href = links
    }

    useCursor(hovered)
    useFrame((state) => {

        image.current.scale.x = THREE.MathUtils.lerp(image.current.scale.x, 0.85 * (hovered ? 0.85 : 1), 0.1)
        image.current.scale.y = THREE.MathUtils.lerp(image.current.scale.y, 0.9 * (hovered ? 0.905 : 1), 0.1)
        frame.current.material.color.lerp(c.set(hovered ? 0xfadc16 : 'white'), 0.1)

    })
    return (
        <>
            <group position={position} rotation={[0,rotate,0]}>
                <mesh
                    castShadow
                    receiveShadow
                    name={name}
                    onPointerOver={(e) => (e.stopPropagation(), hover(true))}
                    onPointerOut={() => hover(false)}
                    onClick={() => clicked(links)}
                    scale={[3, 4, 0.1]}
                    position={[0, GOLDENRATIO / 2, 0]}>
                    <boxGeometry />
                    <meshStandardMaterial color="#151515" metalness={0.5} roughness={0.5} envMapIntensity={2} />
                    <mesh ref={frame} raycast={() => null} scale={[0.9, 0.93, 0.9]} position={[0, 0, 0.2]}>
                        <boxGeometry />
                        <meshBasicMaterial toneMapped={false} fog={false} />
                    </mesh>
                    <Image raycast={() => null} ref={image} position={[0, 0, 0.7]} url={url} />
                </mesh>
                <Text maxWidth={1} color={0xffffff} anchorX="left" anchorY="top" position={[1.7, GOLDENRATIO, 0]} fontSize={0.125}>
                    {name.split('-').join(' ')}
                </Text>
            </group>
        </>
    )
}

function Sphere({ geometry, x, y, z, s }) {
    return (
        <>
            <mesh 
                position={[x, y + 27, z]} scale={[4, 4, 4]} geometry={geometry}>
                <meshStandardMaterial color={0xfff700}
                roughness={0.1} 
                metalness={0.5}
                emissive={0x000000}
                emissiveIntensity={2}
                toneMapped={false}
                />
            </mesh>
            <mesh
                rotation={[-Math.PI*0.5,0,0]} 
                castShadow 
                receiveShadow
                position={[x,y + 7,z]}
                >
                <boxGeometry args={[1.5,1.5,25]}>
                </boxGeometry>
                <meshStandardMaterial
                    color={0x333333}
                    toneMapped={true}
                />
            </mesh>
        </>
    )
}

function RandomSpheres() {

    const [geometry] = useState(() => new THREE.OctahedronGeometry(1, 0))
    const data = useMemo(() => {
        return [
            [28,28],
            [-28,28],
            [-28,-28],
            [28,-28],
            [0,-28],
            [0,28],
        ].map((el,i) => ({
            x:el[0], 
            z:el[1],
            y: 5.5,
            s: 5 + Math.random() * (10 - 5), 
        }))
    }, [])
    
    return data.map((props, i) => <Sphere key={i} {...props} geometry={geometry} />)
}

function Blooms({ children }) {

    const { gl, camera, size } = useThree()
    const [scene, setScene] = useState()
    const composer = useRef()

    useEffect(() => {
         scene &&
         composer.current.setSize(size.width, size.height)
    },[size])
    useFrame(() => 
        scene &&
        composer.current.render()
    , 1)

    return (
        <>
            <scene ref={setScene}>{children}</scene>
            <EffectComposer
                ref={composer}
                args={[gl]}
            >
                <Bloom kernelSize={3} luminanceThreshold={0} luminanceSmoothing={0.4} intensity={0.6} />
            </EffectComposer>
        </>
    )
}

function Main({ children }) {
  const scene = useRef()
  const { gl, camera } = useThree()
  useFrame(() => {
    gl.autoClear = false
    gl.clearDepth()
    gl.render(scene.current, camera)
  }, 2)
  return <scene ref={scene}>{children}</scene>
}


const Scene = forwardRef((props,ref) => {

    const gltf = useLoader(
        GLTFLoader,
        process.env.PUBLIC_URL + "gundam/scene.gltf"
    )
 
    let createCarPos = false

    let raycaster = useRef(new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 3 ))

    let moveForward = useRef(false);
    let moveBackward = useRef(false);
    let moveLeft = useRef(false);
    let moveRight = useRef(false);
    let canJump = useRef(false);

    let prevTime = performance.now();
    let velocity = useRef(new THREE.Vector3());
    let direction = useRef(new THREE.Vector3());

    const {refBlock,refInstruct,persRef} = ref
    const cameraRef = useRef()

    const titles = [
        `Planetary Version 2`,
        `3D Building City Blocks`,
        `Honeycomebear`,
        `Quintuplets`,
        `Overlays`,
        `Hololive Design`,
        `Asian Website`,
        `Wedding Design`,
        `Electro Portfolio`,
        `Philippine 3D CSS`,
        `Aesthetic Shaders`,
        `Photography`,
        `Portfolio Version 1 Neon Effect`,
        `Messenger`,
        `Overlay 2`,
        `Yor Forger`,
        `Spy X Family`,
        `Pinterest`,
        `3D Drinks`,
        `Indian Casino`,
        `Planetary Version 1`,
        `Anime Designs`,
        `Mountain Hiking`,
        `Mapping 3D Video`,
        `Alarm Clock`,
        `3D Show Car`,
        `Gundam Portfolio`,
        `3D Show Car Version 2`
    ]

    const links = [
        `https://planetary2-jullemyth122.vercel.app/`,
        `https://blocks3d-jullemyth122.vercel.app`,
        `https://honeycomebear-3d-jullemyth122.vercel.app/`,
        `https://quintuplets-jullemyth122.vercel.app/`,
        `https://over-laying-jullemyth122.vercel.app/`,
        `https://hololivedesigns-jullemyth122.vercel.app/`,
        `https://asian-layout-jullemyth122.vercel.app`,
        `https://wedding-design-ghyijuial-jullemyth122.vercel.app/`,
        `https://profile-sigma-taupe.vercel.app`,
        `https://philippinewebsite.vercel.app/`,
        `https://aestheticdesign-jullemyth122.vercel.app/`,
        `https://photography-jullemyth122.vercel.app/`,
        `https://portfolio-jullemyth122.vercel.app/`,
        ``,
        `https://over-laying-jullemyth122.vercel.app/`,
        `https://yor.vercel.app`,
        `https://spyxfamily-jullemyth122.vercel.app/`,
        `https://pinterest-clone-fullstack-jullemyth122.vercel.app`,
        `https://brand-design-jullemyth122.vercel.app`,
        `https://casino-alpha.vercel.app/`,
        `https://planetary-jullemyth122.vercel.app/`,
        `https://animedesigns-jullemyth122.vercel.app/`,
        `https://mountain-jullemyth122.vercel.app/`,
        `https://video3dplayer.vercel.app`,
        `https://alarm-clock-iota.vercel.app/`,
        `https://three-fiber-samples.vercel.app/`,
        `https://portfolio-6-version-gundam-jullemyth122.vercel.app/`,
        `https://car-show-lilac.vercel.app/`
    ]


    const imageMap = (num) => `./img/p${num}.png`

    const frontMap = Array.from({length:28}).map((el,i) => imageMap(i+1))

    const listPositions = Array.from({length:10}).map((el,i) => ({x:-23.5 + i * 5,z:-25,rotY:0,x2:-23.5 + i * 5, z2:-23}))
    const listPosition_ = Array.from({length:10}).map((el,i) => (listPositions.push({x:27,z:-23.5 + i * 5 + 0.5 , x2:25 ,z2:-23.5 + i * 5 + 0.5, rotY: -Math.PI/2})))
    const listPosition__ = Array.from({length:8}).map((el,i) => (listPositions.push({x:23.5 - i * 5 - 2,z:25 , x2:23.5 - i * 5 - 2, z2:22, rotY: -Math.PI})))

    const objects = useRef([]);

    const {
        camera, gl:{domElement},
        
    } = useThree()

    useEffect(() => {
        camera.position.set(0,5,0)      
        persRef.current.addEventListener( 'unlock', function () {
            refBlock.current.style.display = 'block';
            refInstruct.current.style.display = '';
        })
    },[])

    
    let pos = [
        { x: -35, y: 10, z: 35 },
        { x: 35, y: 10, z: 35 },
        { x: -35, y: 10, z: -35 },
        { x: 35, y: 10, z: -35 }
    ].map(pos => [
        pos.x,
        pos.y,
        pos.z
    ]);

    const [positions, setPositions] = useState(pos);

    // let angle = 0;

    // useFrame((state,delta) => {
    //     // console.log(delta)
    //     delta += 0.01
    //     // angle += 0.01; // increase the angle by a small amount each frame
    //     setPositions(positions.map(pos => {
    //         return [
    //             pos.x + Math.sin(delta + pos.x),
    //             pos.y + Math.cos(delta + pos.y),
    //             pos.z + Math.sin(delta + pos.z),
    //         ]
    //     }))
    // });

    useEffect(() => {
        
        gltf.scene.scale.set(1.5,1.5,1.5)
        gltf.scene.rotation.set(0,Math.PI/2,0)

        gltf.scene.position.set(-25,0,0);

        gltf.scene.traverse((object) => {
            if(object instanceof Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        })

    },[gltf])

    const onKeyDown = function ( event ) {
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward.current = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft.current = true;
                break;
                
            case 'ArrowDown':
            case 'KeyS':
                moveBackward.current = true;
                break;

            case 'ArrowRight':
                case 'KeyD':
                moveRight.current = true;
                break;
                
            case 'Space':
                if ( canJump.current === true ) {
                    velocity.current.y += 100;
                }
                canJump.current = false;
                break;
            }
            
        };

        const onKeyUp = function ( event ) {
            
            switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward.current = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft.current = false;
                break;
                
                case 'ArrowDown':
                    case 'KeyS':
                        moveBackward.current = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight.current = false;
                break;
                
            }

    };

    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );

    useFrame(() => {
        const time = performance.now()
        
        if (persRef.current.isLocked == true) {

            raycaster.current.ray.origin.copy( persRef.current.getObject().position );
            raycaster.current.ray.origin.y -= 3;

            const intersections = raycaster.current.intersectObjects( objects.current, false );


            const onObject = intersections.length > 0;

            
            const delta = ( time - prevTime ) / 1000;
            
            velocity.current.x -= velocity.current.x * 15.0 * delta;
            velocity.current.z -= velocity.current.z * 15.0 * delta;
            
            velocity.current.y -= 9.8 * 40.0 * delta;
            
            direction.current.z = Number( moveForward.current ) - Number( moveBackward.current );
            direction.current.x = Number( moveRight.current ) - Number( moveLeft.current );
            direction.current.normalize(); // this ensures consistent movements in all directions
    
            
            if ( moveForward.current || moveBackward.current ) velocity.current.z -= direction.current.z * 400.0 * delta;
            if ( moveLeft.current || moveRight.current ) velocity.current.x -= direction.current.x * 400.0 * delta;
            
            if ( onObject === true ) {

                const pos = intersections[0].object.position
                const scales = intersections[0].object.scale
                
                velocity.current.y = Math.max( 0, velocity.current.y );
                
                canJump.current = true;
            }

            persRef.current.moveRight(- velocity.current.x * delta)
            persRef.current.moveForward(- velocity.current.z * delta)

            persRef.current.getObject().position.y += ( velocity.current.y * delta ); // new behavior

            if (persRef.current.getObject().position.x > 28 || 
                persRef.current.getObject().position.x < -28) {
                let r
                if (persRef.current.getObject().position.x > 28)
                    r = 28
                else
                    r = -28
                persRef.current.getObject().position.x = r
            }
            if (persRef.current.getObject().position.z < -26 ||
                persRef.current.getObject().position.z > 26) {
                let r
                if (persRef.current.getObject().position.z > 26)
                    r = 26
                else
                    r = -26
                persRef.current.getObject().position.z = r
            }

            if ( persRef.current.getObject().position.y < 3 ) {

                velocity.current.y = 0;
                persRef.current.getObject().position.y = 3;

                canJump.current = true;

            }
        }

        prevTime = time;

    })

    return(
        <>

            <PointerLockControls ref={persRef} args={[camera,document.querySelector('#three-canvas-container')]}/>
            <Main>
                <color attach="background" args={[0,0,0]}></color>
                <pointLight />
                {Array.from({length:28}).map((el,i) => {
                    return (
                        <Frame
                            key={i}
                            position={[
                                listPositions[i].x,
                                1.5,
                                listPositions[i].z
                            ]}
                            position2={[
                                listPositions[i].x2,
                                1.5,
                                listPositions[i].z2
                            ]}
                            rotate = {listPositions[i].rotY}
                            url = {frontMap[i]}
                            title = {titles[i]}
                            links={links[i]}
                            object={objects}
                        />
                    )
                })}

                {positions.map((elem,i) => {
                    return (
                        <spotLight
                            color={0xffffff}
                            intensity={1.5}
                            angle={0.6}
                            penumbra={0.5}
                            castShadow
                            position={elem}
                            shadow-bias={-0.0001}
                            key={i}
                        >
                        </spotLight>
                    )
                })}

                <primitive
                    object={gltf.scene}
                />
                <Ground/>
                <Sky
                    distance={450000} 
                    sunPosition={[10, 0, 20]} 
                    inclination={10} 
                    azimuth={0.25}
                    mieCoefficient={0.2}
                    rayleigh={1}
                    mieDirectionalG={1}
                    turbidity={1}    
                />
                <RandomSpheres />
                <Stars radius={150} depth={100} count={150} factor={4} saturation={1} fade speed={1} />

            </Main>
            <Blooms>
                <color attach="background" args={[0,0,0]}></color>
                <ambientLight/>
                <RandomSpheres />
            </Blooms>
        </>
    )
})

const FloatingImages = () => {
    
    const { progress} = useProgress()

    const refBlock = useRef(null)
    const refInstruct = useRef(null)
    const persRef = useRef(null)

    const handleClick = () => {
        persRef.current.lock()
        persRef.current.addEventListener("lock", () => {
            refInstruct.current.style.display = 'none';
            refBlock.current.style.display = 'none';
        })
    }

    return (
        <div className='box'>
            <div id="blocker" ref={refBlock} onClick={e => handleClick()}
                style={ progress == 100 ? {display:"block"} : {display:"none"}}
            >
                <div id="instructions" ref={refInstruct}>
                    <p style={{fontSize:"36px"}}>
                        Click to Roam Around
                    </p>
                    <p>
                        Move: WASD<br/>
                        Jump: SPACE<br/>
                        Look: MOUSE
                    </p>
                </div>
            </div>
            <div className="text-loading"
                style={ progress == 100 ? {display:"none"} : {display:"flex"}}
            >
                {progress} % loading
            </div>
            <Canvas linear shadows gl={{ antialias:true }} id='three-canvas-container'>
                <Suspense fallback={null}>
                    <Scene ref={{refBlock,refInstruct,persRef}}></Scene>
                </Suspense>
            </Canvas>
            <div className="dot"/>
        </div>
    )
}

export default FloatingImages