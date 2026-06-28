import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import "./Avatar3D.css";

export type Avatar3DState =
  | "READY"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "NEEDS_REVIEW";

type Avatar3DProps = {
  state: Avatar3DState;
};

type JointTarget = [number, number, number];

const stateLabels: Record<Avatar3DState, string> = {
  READY: "Ready",
  LISTENING: "Listening",
  THINKING: "Checking",
  SPEAKING: "Speaking",
  NEEDS_REVIEW: "Review",
};

function dampJoint(
  joint: THREE.Group | null,
  target: JointTarget,
  delta: number,
  speed = 9,
) {
  if (!joint) return;
  joint.rotation.x = THREE.MathUtils.damp(joint.rotation.x, target[0], speed, delta);
  joint.rotation.y = THREE.MathUtils.damp(joint.rotation.y, target[1], speed, delta);
  joint.rotation.z = THREE.MathUtils.damp(joint.rotation.z, target[2], speed, delta);
}

function dampScale(
  joint: THREE.Group | null,
  target: JointTarget,
  delta: number,
  speed = 9,
) {
  if (!joint) return;
  joint.scale.x = THREE.MathUtils.damp(joint.scale.x, target[0], speed, delta);
  joint.scale.y = THREE.MathUtils.damp(joint.scale.y, target[1], speed, delta);
  joint.scale.z = THREE.MathUtils.damp(joint.scale.z, target[2], speed, delta);
}

function EbeeEye({ x }: { x: number }) {
  return (
    <group position={[x, 0.04, 0.49]}>
      <mesh scale={[0.15, 0.19, 0.035]}>
        <sphereGeometry args={[1, 32, 18]} />
        <meshStandardMaterial color="#f5f7fb" roughness={0.18} metalness={0.04} />
      </mesh>
      <mesh position={[0, -0.005, 0.035]} scale={[0.075, 0.095, 0.02]}>
        <sphereGeometry args={[1, 24, 14]} />
        <meshStandardMaterial color="#07120d" roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.005, 0.058]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.052, 0.007, 8, 26]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[0, -0.005, 0.062]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.025, 0.004, 8, 20]} />
        <meshStandardMaterial color="#86efac" emissive="#86efac" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function Boot() {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} scale={[0.14, 0.28, 0.13]}>
        <capsuleGeometry args={[1, 1.1, 8, 18]} />
        <meshStandardMaterial color="#0867c5" roughness={0.28} metalness={0.18} />
      </mesh>
      <mesh position={[0, -0.13, 0.11]} scale={[0.18, 0.08, 0.24]}>
        <sphereGeometry args={[1, 24, 14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.22} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.2, 0.03]} scale={[0.2, 0.035, 0.22]}>
        <sphereGeometry args={[1, 20, 10]} />
        <meshStandardMaterial color="#122033" roughness={0.42} />
      </mesh>
    </group>
  );
}

function EbeePuppet({ state }: Avatar3DProps) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const neckRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Group>(null);
  const rightHandRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const leftThighRef = useRef<THREE.Group>(null);
  const rightThighRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);
  const leftFootRef = useRef<THREE.Group>(null);
  const rightFootRef = useRef<THREE.Group>(null);
  const antennaStemRef = useRef<THREE.Group>(null);
  const antennaTipRef = useRef<THREE.Group>(null);

  useFrame((renderState, delta) => {
    const t = renderState.clock.getElapsedTime();
    const pointerX = THREE.MathUtils.clamp(renderState.pointer.x, -0.8, 0.8);
    const pointerY = THREE.MathUtils.clamp(renderState.pointer.y, -0.8, 0.8);
    const isListening = state === "LISTENING";
    const isThinking = state === "THINKING";
    const isSpeaking = state === "SPEAKING";
    const isError = state === "NEEDS_REVIEW";
    const breath = Math.sin(t * 2.1);
    const sway = Math.sin(t * 1.15);
    const step = Math.sin(t * (isSpeaking ? 4.2 : 2.2));
    const wingBeat = Math.sin(t * (isSpeaking ? 16 : isListening ? 10 : 5.4));
    const talk = isSpeaking ? Math.sin(t * 10.5) : 0;
    const reviewShake = isError ? Math.sin(t * 16) : 0;
    const listenLean = isListening ? -0.16 : 0;
    const thinkLean = isThinking ? 0.13 : 0;

    if (rootRef.current) {
      rootRef.current.position.y = THREE.MathUtils.damp(
        rootRef.current.position.y,
        -0.08 + breath * 0.018 + (isSpeaking ? Math.abs(talk) * 0.026 : 0),
        8,
        delta,
      );
      dampJoint(
        rootRef.current,
        [
          0,
          pointerX * 0.07 + sway * 0.07 + reviewShake * 0.045,
          (isThinking ? 0.05 : 0) + Math.sin(t * 0.85) * 0.018,
        ],
        delta,
        7,
      );
    }

    if (bodyRef.current) {
      bodyRef.current.scale.y = THREE.MathUtils.damp(
        bodyRef.current.scale.y,
        1 + breath * 0.012 + (isSpeaking ? Math.abs(talk) * 0.018 : 0),
        9,
        delta,
      );
    }

    dampJoint(bodyRef.current, [listenLean, pointerX * 0.035, sway * 0.025 + reviewShake * 0.04], delta, 8);
    dampJoint(neckRef.current, [-listenLean * 0.45, pointerX * 0.1, -sway * 0.035], delta, 10);
    dampJoint(
      headRef.current,
      [
        listenLean - pointerY * 0.08 + (isSpeaking ? talk * 0.085 : Math.sin(t * 1.35) * 0.035),
        pointerX * 0.18 + Math.sin(t * 1.05) * (isError ? 0.18 : 0.09) - (isThinking ? 0.12 : 0),
        thinkLean + Math.sin(t * 1.65) * 0.032 + reviewShake * 0.045,
      ],
      delta,
      10,
    );
    dampJoint(eyesRef.current, [-pointerY * 0.05, pointerX * 0.12, 0], delta, 12);
    dampScale(mouthRef.current, [1, isSpeaking ? 1 + Math.abs(talk) * 0.8 : 0.28, 1], delta, 16);

    dampJoint(
      leftArmRef.current,
      [
        -0.08 + listenLean * 0.55 + step * 0.04,
        isListening ? -0.18 : 0.08,
        0.9 + breath * 0.07 + (isThinking ? 0.12 : 0),
      ],
      delta,
      9,
    );
    dampJoint(
      leftForearmRef.current,
      [
        step * 0.08,
        isThinking ? -0.18 : 0,
        -0.45 + breath * 0.12 + (isListening ? -0.22 : 0),
      ],
      delta,
      10,
    );
    dampJoint(leftHandRef.current, [step * 0.2, 0.08 + sway * 0.06, -0.1 + breath * 0.28], delta, 12);

    dampJoint(
      rightArmRef.current,
      [
        (isSpeaking ? Math.sin(t * 6.2) * 0.16 : -0.05) + listenLean * 0.45,
        isListening ? 0.18 : -0.08,
        isSpeaking ? -1.42 + Math.sin(t * 6.2) * 0.32 : -0.9 - breath * 0.08,
      ],
      delta,
      9,
    );
    dampJoint(
      rightForearmRef.current,
      [
        isSpeaking ? Math.sin(t * 6.7) * 0.36 : -step * 0.08,
        isThinking ? 0.16 : 0,
        isSpeaking ? -0.72 + Math.sin(t * 7.8) * 0.42 : 0.43 - breath * 0.12,
      ],
      delta,
      10,
    );
    dampJoint(rightHandRef.current, [talk * 0.3, -0.08 - sway * 0.06, isSpeaking ? talk * 0.58 : breath * 0.24], delta, 12);

    dampJoint(leftWingRef.current, [wingBeat * 0.06, -0.36 + wingBeat * 0.2, 0.3 + wingBeat * 0.36], delta, 14);
    dampJoint(rightWingRef.current, [-wingBeat * 0.06, 0.36 - wingBeat * 0.2, -0.3 - wingBeat * 0.36], delta, 14);

    dampJoint(leftThighRef.current, [0.02 + step * 0.06, 0.05, -0.03 + sway * 0.02], delta, 8);
    dampJoint(rightThighRef.current, [0.02 - step * 0.06, -0.05, 0.03 + sway * 0.02], delta, 8);
    dampJoint(leftShinRef.current, [-0.08 - Math.max(step, 0) * 0.1, 0, 0.02], delta, 9);
    dampJoint(rightShinRef.current, [-0.08 + Math.min(step, 0) * 0.1, 0, -0.02], delta, 9);
    dampJoint(leftFootRef.current, [0.08 - step * 0.05, 0.05, -0.04 + breath * 0.03], delta, 10);
    dampJoint(rightFootRef.current, [0.08 + step * 0.05, -0.05, 0.04 - breath * 0.03], delta, 10);

    dampJoint(antennaStemRef.current, [pointerY * 0.04, pointerX * 0.08, Math.sin(t * 2.8) * 0.08 + reviewShake * 0.08], delta, 11);
    dampJoint(antennaTipRef.current, [0, 0, -Math.sin(t * 4.1) * 0.16 + reviewShake * 0.14], delta, 14);
  });

  return (
    <group ref={rootRef} position={[0, -0.08, 0]} scale={0.82}>
      <group ref={bodyRef}>
        <mesh position={[0, -0.12, 0]} scale={[0.43, 0.62, 0.3]}>
          <sphereGeometry args={[1, 48, 28]} />
          <meshStandardMaterial color="#0867c5" roughness={0.24} metalness={0.22} />
        </mesh>
        <mesh position={[0, -0.1, 0.3]} scale={[0.28, 0.44, 0.045]}>
          <sphereGeometry args={[1, 32, 18]} />
          <meshStandardMaterial color="#080d13" roughness={0.34} />
        </mesh>
        <mesh position={[0, 0.36, 0.03]} scale={[0.34, 0.1, 0.23]}>
          <sphereGeometry args={[1, 28, 12]} />
          <meshStandardMaterial color="#dbeafe" roughness={0.22} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.48, 0.05]} rotation={[0, 0, Math.PI / 2]} scale={[0.75, 1, 1]}>
          <torusGeometry args={[0.22, 0.028, 10, 44]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.2} metalness={0.18} />
        </mesh>
      </group>

      <group ref={neckRef} position={[0, 0.48, 0.02]}>
        <mesh position={[0, 0.13, 0]} scale={[0.14, 0.16, 0.13]}>
          <capsuleGeometry args={[1, 0.7, 8, 18]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.23} metalness={0.1} />
        </mesh>
        <group ref={headRef} position={[0, 0.34, 0]}>
          <mesh scale={[0.48, 0.42, 0.42]}>
            <sphereGeometry args={[1, 48, 30]} />
            <meshStandardMaterial color="#d7e3f3" roughness={0.2} metalness={0.08} />
          </mesh>
          <mesh position={[0, 0.21, -0.02]} scale={[0.52, 0.22, 0.41]}>
            <sphereGeometry args={[1, 36, 16]} />
            <meshStandardMaterial color="#d91524" roughness={0.22} metalness={0.16} />
          </mesh>
          <mesh position={[0, 0.42, 0.01]} scale={[0.13, 0.055, 0.11]}>
            <sphereGeometry args={[1, 18, 10]} />
            <meshStandardMaterial color="#0867c5" roughness={0.2} metalness={0.2} />
          </mesh>
          <mesh position={[-0.47, -0.02, 0.02]} scale={[0.07, 0.21, 0.14]}>
            <sphereGeometry args={[1, 20, 14]} />
            <meshStandardMaterial color="#074bd1" roughness={0.24} metalness={0.2} />
          </mesh>
          <mesh position={[0.47, -0.02, 0.02]} scale={[0.07, 0.21, 0.14]}>
            <sphereGeometry args={[1, 20, 14]} />
            <meshStandardMaterial color="#074bd1" roughness={0.24} metalness={0.2} />
          </mesh>
          <mesh position={[0, -0.16, 0.43]} scale={[0.42, 0.2, 0.055]}>
            <sphereGeometry args={[1, 32, 16]} />
            <meshStandardMaterial color="#edf4ff" roughness={0.18} metalness={0.04} />
          </mesh>
          <group ref={mouthRef} position={[0, -0.18, 0.49]} scale={[1, 0.28, 1]}>
            <mesh scale={[0.17, 0.032, 0.018]}>
              <sphereGeometry args={[1, 18, 10]} />
              <meshStandardMaterial color="#07120d" roughness={0.22} />
            </mesh>
          </group>
          <group ref={eyesRef}>
            <EbeeEye x={-0.17} />
            <EbeeEye x={0.17} />
          </group>

          <group ref={antennaStemRef} position={[0, 0.46, 0.04]}>
            <mesh position={[0, 0.12, 0]} rotation={[0, 0, -0.16]}>
              <cylinderGeometry args={[0.014, 0.014, 0.27, 12]} />
              <meshStandardMaterial color="#e5e7eb" roughness={0.28} />
            </mesh>
            <group ref={antennaTipRef} position={[0.035, 0.26, 0]}>
              <mesh scale={[0.035, 0.035, 0.035]}>
                <sphereGeometry args={[1, 14, 10]} />
                <meshStandardMaterial color="#d91524" emissive="#d91524" emissiveIntensity={0.25} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      <group ref={leftWingRef} position={[-0.34, -0.02, -0.24]} rotation={[0, -0.34, 0.28]}>
        <mesh scale={[0.16, 0.58, 0.035]}>
          <sphereGeometry args={[1, 32, 18]} />
          <meshStandardMaterial color="#67e8f9" emissive="#0891b2" emissiveIntensity={0.3} opacity={0.58} transparent roughness={0.18} />
        </mesh>
      </group>
      <group ref={rightWingRef} position={[0.34, -0.02, -0.24]} rotation={[0, 0.34, -0.28]}>
        <mesh scale={[0.16, 0.58, 0.035]}>
          <sphereGeometry args={[1, 32, 18]} />
          <meshStandardMaterial color="#67e8f9" emissive="#0891b2" emissiveIntensity={0.3} opacity={0.58} transparent roughness={0.18} />
        </mesh>
      </group>

      <group ref={leftArmRef} position={[-0.38, 0.15, 0.1]} rotation={[0, 0, 0.9]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 0.4, 16]} />
          <meshStandardMaterial color="#0867c5" roughness={0.3} metalness={0.18} />
        </mesh>
        <group ref={leftForearmRef} position={[0, -0.4, 0]}>
          <mesh position={[0, -0.16, 0]}>
            <cylinderGeometry args={[0.04, 0.047, 0.32, 16]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.24} metalness={0.08} />
          </mesh>
          <group ref={leftHandRef} position={[0, -0.35, 0]}>
            <mesh scale={[0.105, 0.09, 0.085]}>
              <sphereGeometry args={[1, 20, 14]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.22} />
            </mesh>
          </group>
        </group>
      </group>

      <group ref={rightArmRef} position={[0.38, 0.15, 0.1]} rotation={[0, 0, -0.9]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 0.4, 16]} />
          <meshStandardMaterial color="#0867c5" roughness={0.3} metalness={0.18} />
        </mesh>
        <group ref={rightForearmRef} position={[0, -0.4, 0]}>
          <mesh position={[0, -0.16, 0]}>
            <cylinderGeometry args={[0.04, 0.047, 0.32, 16]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.24} metalness={0.08} />
          </mesh>
          <group ref={rightHandRef} position={[0, -0.35, 0]}>
            <mesh scale={[0.105, 0.09, 0.085]}>
              <sphereGeometry args={[1, 20, 14]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.22} />
            </mesh>
          </group>
        </group>
      </group>

      <group ref={leftThighRef} position={[-0.18, -0.64, 0.02]}>
        <mesh position={[0, -0.23, 0]}>
          <cylinderGeometry args={[0.064, 0.07, 0.46, 16]} />
          <meshStandardMaterial color="#edf4ff" roughness={0.24} metalness={0.06} />
        </mesh>
        <group ref={leftShinRef} position={[0, -0.46, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.056, 0.064, 0.44, 16]} />
            <meshStandardMaterial color="#dbeafe" roughness={0.24} metalness={0.06} />
          </mesh>
          <group ref={leftFootRef} position={[0, -0.48, 0.05]}>
            <Boot />
          </group>
        </group>
      </group>
      <group ref={rightThighRef} position={[0.18, -0.64, 0.02]}>
        <mesh position={[0, -0.23, 0]}>
          <cylinderGeometry args={[0.064, 0.07, 0.46, 16]} />
          <meshStandardMaterial color="#edf4ff" roughness={0.24} metalness={0.06} />
        </mesh>
        <group ref={rightShinRef} position={[0, -0.46, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.056, 0.064, 0.44, 16]} />
            <meshStandardMaterial color="#dbeafe" roughness={0.24} metalness={0.06} />
          </mesh>
          <group ref={rightFootRef} position={[0, -0.48, 0.05]}>
            <Boot />
          </group>
        </group>
      </group>

      {state === "SPEAKING" && (
        <Html position={[0, 0.58, 0.56]} center>
          <div className="avatar-3d-mouth-pulse">
            <span />
            <span />
            <span />
          </div>
        </Html>
      )}
    </group>
  );
}

export default function Avatar3D({ state }: Avatar3DProps) {
  return (
    <div className={`avatar-3d-shell avatar-3d-${state.toLowerCase()}`}>
      <div className="avatar-3d-orbit" />

      <Canvas
        camera={{ position: [0, 0.04, 5.35], fov: 36 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        dpr={[1, 1.5]}
        shadows={false}
      >
        <ambientLight intensity={2.8} />
        <directionalLight position={[3, 4, 5]} intensity={3.4} />
        <directionalLight position={[-3, 2, 2]} intensity={1.7} />
        <pointLight position={[0, 1.4, 3]} intensity={1.5} color="#67e8f9" />

        <EbeePuppet state={state} />
      </Canvas>

      <div className="avatar-3d-status-chip">
        <span className="avatar-3d-status-dot" />
        {stateLabels[state]}
      </div>
    </div>
  );
}
