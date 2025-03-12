'use client'

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { useGLTF, Text } from "@react-three/drei";
import { TextureLoader, Vector3 } from "three";
import Button from '@/components/Button'


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
            // console.log(modelRef.current.position)

            // go to goal position
            modelRef.current.position.lerp(goalPosition.current, delta * .2);
            // console.log(delta)
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

function BillboardText({text, visibleRef, targetPositionRef, color = '#00ff00', size = 1}) {
    const textRef = useRef();

    useFrame((state, delta) => {
        const offsetVector = new Vector3(-1.6, .3, -.9);
        offsetVector.applyQuaternion(state.camera.quaternion); // make it relative to camera
        const goalPosition = targetPositionRef.current.clone().add(offsetVector.multiplyScalar(7));

        textRef.current.position.copy(textRef.current.position.lerp(goalPosition, delta * .2));
        textRef.current.lookAt(state.camera.position);

        textRef.current.visible = visibleRef.current;

        // console.log('updated text pos:', textRef.current.position);
    });

    return (
        <Text
            ref={textRef}
            // position={position}
            fontSize={size}
            color={color}
            outlineWidth={0.05}
            outlineColor='black'
        >
            {text}
        </Text>
    )
}

function PointCamera({target, camPosition}) {
    useFrame((state, delta) => {
        state.camera.position.lerp(camPosition.current, delta * .5);
        state.camera.lookAt(new Vector3(0, 0, 0));
        state.camera.up = new Vector3(0, 1, 0);
        state.camera.updateProjectionMatrix();
        // console.log('camera pos:', camPosition.current, state);
    })

    return null;
}

export default function Tracker() {
    // init iss position
    const issPosition = useRef(new Vector3(0, 70, 0));
    const camPosition = useRef(new Vector3(0, 200, 0));
    
    const telemetryVisible = useRef(true);

    const [billboardText, setBillboardText] = useState('N/A');
    const camView = useRef('follow');

    // path trace
    const [markers, setMarkers] = useState([]);


    // periodically fetch iss position from API
    useEffect(() => {
        const fetchISSposition = async () => {
            try {
                const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
                const data = await response.json();
                const { velocity: vel, altitude: alt, latitude: lat, longitude: lon } = data;

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
                // console.log('new cam pos:', newCamPos);
                issPosition.current.copy(newPos);


                if (camView.current == 'follow') {
                    camPosition.current = new Vector3(camX, camY, camZ);
                } else if (camView.current == 'fixed') {
                    camPosition.current = new Vector3(0, 0, 150);
                }

                setBillboardText(`Velocity: ${vel.toFixed(2)} kph\nLatitude: ${lat.toFixed(3)}\nLongitude: ${lon.toFixed(3)}\nAltitude: ${alt.toFixed(1)}`);

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

    const changeCamView = () => {
        if (camView.current == 'follow') {
            camView.current = 'fixed';
            camPosition.current = new Vector3(0, 0, 150);
        } else {
            camView.current = 'follow';
            camPosition.current.copy(issPosition.current);
        }
    }

    const toggleTelemetry = () => {
        telemetryVisible.current = !telemetryVisible.current;
    }



    // final render
    return (
        <div className="w-full h-[calc(100vh-4rem)]">
            <div className="fixed ml-3 mt-3 flex flex-col gap-2">
                <p className="text-4xl font-light text-center">OrbitTrace</p>
                <Button color="blue-800" onClick={changeCamView}>Change Camera View</Button>
                <Button color="indigo-600" onClick={toggleTelemetry}>Toggle Telemtry</Button>
            </div>
            <Canvas camera={{ position: new Vector3(0, 200, 0), fov: 50}}
                    style={{position: 'absolute', top: 0, left: 0, zIndex: -1}}>
                <ambientLight intensity={0.4} />
                <PointCamera target={issPosition} camPosition={camPosition} />
                <directionalLight
                    position={[0, 300, 0]}           // Position to mimic sunlight angle
                    intensity={2.5}                   // Brighter but not overpowering
                    color="#ffffff"                   // Pure white light (default)
                />
                <ISSModel goalPosition={issPosition} />
                <EarthModel />
                <BillboardText visibleRef={telemetryVisible} targetPositionRef={issPosition} text={billboardText} />


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