import { MeshReflectorMaterial } from '@react-three/drei'
import { useFrame, useLoader } from '@react-three/fiber'
import React, { useEffect } from 'react'
import { LinearEncoding, RepeatWrapping, TextureLoader } from 'three'

export const Ground = () => {

    const [roughness,normal] = useLoader(TextureLoader,[
        process.env.PUBLIC_URL + "textures/terrain-roughness.jpg",
        process.env.PUBLIC_URL + "textures/terrain-normal.jpg",
    ])

    useEffect(() => {
        [normal,roughness].forEach((t) => {
            t.wrapS = RepeatWrapping
            t.wrapT = RepeatWrapping
            t.repeat.set(5,5)
        })
        normal.encoding = LinearEncoding

    },[normal,roughness])

    return (
        <mesh rotation={[-Math.PI * 0.5,0,0]} position={[1,0,0]} castShadow receiveShadow>
            <planeGeometry args={[70,70]}/>
            <MeshReflectorMaterial
                envMapIntensity={0}
                normalMap={normal}
                normalScale={[0.15,0.15]}
                roughnessMap={roughness}
                dithering={true}
                color={[0.015,0.015,0.015]}
                roughness={0.7}
                blur={[1000,400]}
                mixBlur={30}
                mixStrength={80}
                mixContrast={1}
                resolution={1024}
                mirror={0}
                depthScale={0.01}
                minDepthThreshold={0.9}
                maxDepthThreshold={1}
                depthToBlurRatioBias={0.25}
                debug={0}
                reflectorOffset={0.2}
            />
        </mesh>
    )
}
