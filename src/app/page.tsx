'use client'

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Object3D, Vector3 } from "three";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from '@/components/Button'

function SatelliteModel() {
  const ROTATION_SPEED = 0.5;
  const SWAY_AMPLITUDE = 0.15;
  const modelRef = useRef<Object3D>(null);
  const timeElapsed = useRef(0);

  useFrame((state, delta) => {
    if (modelRef.current) {
      timeElapsed.current += delta;
      modelRef.current.rotation.set(
        Math.cos(timeElapsed.current * ROTATION_SPEED) * SWAY_AMPLITUDE,
        timeElapsed.current * ROTATION_SPEED * 0.3,
        Math.sin(timeElapsed.current * ROTATION_SPEED) * SWAY_AMPLITUDE
      );
    }
  });

  const { scene } = useGLTF('/models/ISS_stationary.glb');
  return <primitive ref={modelRef} object={scene} scale={[0.6, 0.6, 0.6]} />;
}

export default function Home() {
  const router = useRouter();
  const handleClick = () => {
    router.push('/tracker');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6 sm:p-12 font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col items-center gap-6 mb-12">
        <h1 className="text-5xl sm:text-6xl md:text-7xl tracking-tight">
          <span className="font-light">Orbit</span><span className="font-bold">Trace</span>
        </h1>
        <p className="text-xl sm:text-2xl font-light text-gray-300">
          International Space Station Tracker
        </p>
      </header>

      <main className="max-w-5xl mx-auto">
        <div className="relative h-[300px] sm:h-[400px] mb-12">
          <Canvas camera={{ position: new Vector3(0, 70, 70), fov: 70 }}>
            <directionalLight position={[30, 40, 50]} intensity={1.2} />
            <ambientLight intensity={0.4} />
            <SatelliteModel />
          </Canvas>
          {/* <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" /> */}
        </div>

        <section className="text-center space-y-6">
          <p className="text-xl text-gray-300 mx-auto">
            A 3D representation of the ISS orbit.
          </p>
          <p className="text-sm sm:text-base text-gray-200 max-w-2xl mx-auto font-light">
            For this project, I used Next.js and Three.js (React Three Fiber). The development blog can be
            found on my website: <Link className="text-blue-500 font-light underline" href='https://slabby.dev/'>slabby.dev</Link>
          </p>
        </section>

        <section className="mt-12 flex justify-center">
          <Button onClick={handleClick}>
            View the Tracker
          </Button>
        </section>

      </main>

      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>
          Walker McGilvary - 2025
        </p>
      </footer>
    </div>
  );
}