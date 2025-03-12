'use client'

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei";
import { TextureLoader, Vector3 } from "three";

function ISSModel({ goalPosition }) {
    const ROTATION_SPEED = .6;
    const ROTATION_INTENSITY = .2;
    const modelRef = useRef();
    const runTime = useRef(0);

    useFrame((state, delta) => {
        if (modelRef.current) {
            runTime.current += delta;

            modelRef.current.rotation.set(
                Math.sin(runTime.current * ROTATION_SPEED) * ROTATION_INTENSITY,
                0,
                Math.sin(runTime.current / 1.2 * ROTATION_SPEED) * ROTATION_INTENSITY
            );
            console.log(modelRef.current.position)

            // go to goal position
            modelRef.current.position.lerp(goalPosition.current, delta * .2);
            console.log(delta)
        } else {
            console.log("Waiting for model");
        }
        
    });

    const { scene } = useGLTF('/models/ISS_stationary.glb'); // load model
    return <primitive ref={modelRef} object={scene} scale={[0.1, 0.1, 0.1]} />;
}

function EarthModel() {
    const [texture, specularMap, normalMap] = useLoader(TextureLoader, [
        '/textures/earth.jpg', '/textures/earth_specular.jpg', '/textures/earth_normal.jpg'
    ]);

    specularMap.needsUpdate = true;

    return (
        <mesh>
            <sphereGeometry args={[50, 64, 64]} position={[0, 0, 0]} />
            <meshPhongMaterial map={texture} specularMap={specularMap} normalMap={normalMap} shininess={100} />
        </mesh>
    )
}

function PointCamera({target, camPosition}) {
    useFrame((state, delta) => {
        state.camera.position.lerp(camPosition.current, delta * .5);
        state.camera.lookAt(new Vector3(0, 0, 0));
        state.camera.up = new Vector3(0, 1, 0);
        state.camera.updateProjectionMatrix();
        console.log('camera pos:', camPosition.current, state);
    })

    return null;
}

export default function Tracker() {
    // init iss position
    const issPosition = useRef(new Vector3(0, 70, 0));
    const camPosition = useRef(new Vector3(0, 200, 0));

    // path trace
    const [markers, setMarkers] = useState([]);


    // periodically fetch iss position from API
    useEffect(() => {
        const fetchISSposition = async () => {
            try {
                const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
                const data = await response.json();
                const { latitude: lat, longitude: lon } = data;

                console.log('ISS position data:', data);

                // convert to spherical coordiantes
                const polarAngle = (Math.PI / 180) * (90 - lat)
                const azimuthAngle = (Math.PI / 180) * (0 - lon);
                const radius = 100;
                const cameraRadius = 120;

                const x = radius * Math.sin(polarAngle) * Math.cos(azimuthAngle);
                const camX = x / radius * cameraRadius;
                const y = radius * Math.cos(polarAngle);
                const camY = y / radius * cameraRadius;
                const z = radius * Math.sin(polarAngle) * Math.sin(azimuthAngle);
                const camZ = z / radius * cameraRadius;
                
                const newPos = new Vector3(x, y, z);
                const newCamPos = new Vector3(camX, camY, camZ);
                console.log('new cam pos:', newCamPos);
                issPosition.current.copy(newPos);
                camPosition.current.copy(newCamPos);

                // create new marker
                setMarkers(prevMarkers => [
                    ...prevMarkers,
                    {position: newPos.clone(), id: Date.now()}
                ]);
            } catch (error) {
                console.log("Error fetching ISS position:", error);
            }

        };

        fetchISSposition();
        const interval = setInterval(fetchISSposition, 20000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-[calc(100vh-4rem)]">
            <p className="text-6xl font-bold text-center fixed">OrbitTrace</p>
            <Canvas camera={{ position: new Vector3(0, 200, 0), fov: 50}}>
                <ambientLight intensity={0.1} />
                <PointCamera target={issPosition} camPosition={camPosition} />
                <directionalLight
                    position={[0, 300, 0]}           // Position to mimic sunlight angle
                    intensity={2.5}                   // Brighter but not overpowering
                    color="#ffffff"                   // Pure white light (default)
                />
                <ISSModel goalPosition={issPosition} />
                <EarthModel />


                {markers.map(marker => (
                    <mesh key={marker.id} position={marker.position}>
                        <sphereGeometry args={[.5, 32, 32]} />
                        <meshStandardMaterial color='red' transparent opacity={.3} />
                    </mesh>
                ))}
            </Canvas>
        </div>
        
    )
}