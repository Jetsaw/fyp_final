export type RiggedEbeeState =
  | "READY"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "NEEDS_REVIEW";

export const JOINT_CONTROLS = [
  "root",
  "spine",
  "chest",
  "neck",
  "head",
  "facePlate",
  "antenna",
  "shoulderL",
  "elbowL",
  "wristL",
  "fingersL",
  "shoulderR",
  "elbowR",
  "wristR",
  "fingersR",
  "hipL",
  "kneeL",
  "ankleL",
  "toesL",
  "hipR",
  "kneeR",
  "ankleR",
  "toesR",
  "wingL",
  "wingR",
  "tail",
] as const;

export type JointKey = (typeof JOINT_CONTROLS)[number];
export type JointTarget = [number, number, number];
export type RigPose = Partial<Record<JointKey, JointTarget>>;
export type RigNodePose = Record<string, JointTarget>;
export type ManualPose = RigPose;

export type MotionInputs = {
  t: number;
  pointerX: number;
  pointerY: number;
  state: RiggedEbeeState;
  transition?: number;
  intent?: MotionIntent;
  databaseWeight?: number;
};

export type MotionIntent = {
  facing: number;
  energy: number;
  gesture: number;
  attention: number;
  step: number;
};

export type MotionClip = {
  name: string;
  duration: number;
  state: RiggedEbeeState;
  basePose: RigPose;
  energy: number;
  wingRate: number;
  talkRate: number;
};

export type LocalPhaseKey = "spine" | "head" | "arms" | "legs" | "wings" | "tail";
export type LocalPhase = {
  phase: number;
  amplitude: number;
  frequency: number;
};
export type LocalPhaseChannels = Record<LocalPhaseKey, LocalPhase>;
export type MotionFeature = {
  state: RiggedEbeeState;
  normalizedTime: number;
  facing: number;
  energy: number;
  gesture: number;
  attention: number;
  step: number;
  phases: Record<LocalPhaseKey, { sin: number; cos: number; amplitude: number }>;
  trajectory: TrajectorySample[];
};
export type TrajectorySample = {
  time: number;
  position: [number, number];
  direction: [number, number];
};
export type MotionFrame = {
  id: string;
  clip: string;
  time: number;
  state: RiggedEbeeState;
  feature: MotionFeature;
  pose: RigPose;
  nodePose?: RigNodePose;
};
export type MotionDatabasePayload = {
  schema: string;
  source?: string;
  sourceSchema?: string;
  promotedBy?: string;
  installedBy?: string;
  runtimeMotionDatabase?: boolean;
  nodePose?: {
    source?: string;
    nodePathCount?: number;
  };
  frameCounts?: Partial<Record<RiggedEbeeState, number>>;
  frames: MotionFrame[];
};
export type MotionMatchCandidate = {
  frame: MotionFrame;
  score: number;
  weight: number;
};
export type MotionMatchResult = {
  feature: MotionFeature;
  candidates: MotionMatchCandidate[];
  pose: RigPose;
  nodePose: RigNodePose;
};
export type MotionSample = {
  pose: RigPose;
  nodePose: RigNodePose;
};

const LOCAL_PHASE_CONFIG: Record<RiggedEbeeState, Record<LocalPhaseKey, { offset: number; frequency: number; amplitude: number }>> = {
  READY: {
    spine: { offset: 0, frequency: 0.36, amplitude: 0.48 },
    head: { offset: 0.35, frequency: 0.28, amplitude: 0.32 },
    arms: { offset: 0.8, frequency: 0.34, amplitude: 0.24 },
    legs: { offset: 1.4, frequency: 0.22, amplitude: 0.16 },
    wings: { offset: 0.1, frequency: 0.92, amplitude: 0.42 },
    tail: { offset: 1.1, frequency: 0.3, amplitude: 0.22 },
  },
  LISTENING: {
    spine: { offset: 0.15, frequency: 0.52, amplitude: 0.55 },
    head: { offset: 0.5, frequency: 0.44, amplitude: 0.44 },
    arms: { offset: 1, frequency: 0.4, amplitude: 0.22 },
    legs: { offset: 1.5, frequency: 0.3, amplitude: 0.14 },
    wings: { offset: 0.25, frequency: 1.25, amplitude: 0.54 },
    tail: { offset: 1.3, frequency: 0.35, amplitude: 0.2 },
  },
  THINKING: {
    spine: { offset: 0.7, frequency: 0.28, amplitude: 0.34 },
    head: { offset: 1.8, frequency: 0.24, amplitude: 0.52 },
    arms: { offset: 1.3, frequency: 0.26, amplitude: 0.18 },
    legs: { offset: 2, frequency: 0.18, amplitude: 0.1 },
    wings: { offset: 0.9, frequency: 0.72, amplitude: 0.26 },
    tail: { offset: 1.5, frequency: 0.22, amplitude: 0.18 },
  },
  SPEAKING: {
    spine: { offset: 0.1, frequency: 0.68, amplitude: 0.68 },
    head: { offset: 0.6, frequency: 0.86, amplitude: 0.72 },
    arms: { offset: 1.4, frequency: 1.05, amplitude: 0.9 },
    legs: { offset: 2.1, frequency: 0.5, amplitude: 0.24 },
    wings: { offset: 0.2, frequency: 2.1, amplitude: 1 },
    tail: { offset: 1.1, frequency: 0.45, amplitude: 0.28 },
  },
  NEEDS_REVIEW: {
    spine: { offset: 0.3, frequency: 0.75, amplitude: 0.62 },
    head: { offset: 0.9, frequency: 0.8, amplitude: 0.66 },
    arms: { offset: 1.7, frequency: 0.58, amplitude: 0.38 },
    legs: { offset: 2.2, frequency: 0.26, amplitude: 0.12 },
    wings: { offset: 0.55, frequency: 1.12, amplitude: 0.72 },
    tail: { offset: 1.9, frequency: 0.5, amplitude: 0.3 },
  },
};

export const RIG_POSE_PRESETS: Record<string, RigPose> = {
  source: {},
  attentive: {
    chest: [-0.04, 0, 0],
    neck: [0.04, 0, 0],
    head: [-0.08, 0, 0],
    shoulderL: [-0.04, -0.02, -0.06],
    shoulderR: [-0.04, 0.02, 0.06],
  },
  explain: {
    chest: [-0.06, 0.02, 0.02],
    head: [-0.04, 0.08, 0.02],
    shoulderR: [-0.02, 0.02, 0.24],
    elbowR: [0.02, -0.01, 0.18],
    wristR: [0.08, -0.04, 0.12],
    fingersR: [0.2, 0, 0.04],
  },
  review: {
    chest: [0.08, 0, 0.04],
    head: [0.1, 0, -0.09],
    shoulderL: [-0.04, -0.04, -0.12],
    shoulderR: [-0.04, 0.04, 0.12],
    wingL: [0.04, -0.08, 0.12],
    wingR: [-0.04, 0.08, -0.12],
  },
};

export const MOTION_CLIPS: Record<RiggedEbeeState, MotionClip> = {
  READY: {
    name: "idle-breath",
    duration: 3.2,
    state: "READY",
    basePose: RIG_POSE_PRESETS.source,
    energy: 0.55,
    wingRate: 5.2,
    talkRate: 0,
  },
  LISTENING: {
    name: "attentive-listen",
    duration: 2.1,
    state: "LISTENING",
    basePose: RIG_POSE_PRESETS.attentive,
    energy: 0.72,
    wingRate: 9,
    talkRate: 0,
  },
  THINKING: {
    name: "reasoning-check",
    duration: 2.6,
    state: "THINKING",
    basePose: {
      ...RIG_POSE_PRESETS.attentive,
      head: [0.04, -0.04, 0.08],
      chest: [0.05, 0, 0.03],
    },
    energy: 0.48,
    wingRate: 4.8,
    talkRate: 0,
  },
  SPEAKING: {
    name: "explain-answer",
    duration: 1.35,
    state: "SPEAKING",
    basePose: RIG_POSE_PRESETS.explain,
    energy: 1,
    wingRate: 15,
    talkRate: 10.5,
  },
  NEEDS_REVIEW: {
    name: "review-alert",
    duration: 1.8,
    state: "NEEDS_REVIEW",
    basePose: RIG_POSE_PRESETS.review,
    energy: 0.82,
    wingRate: 7.2,
    talkRate: 0,
  },
};

export const STATE_INTENTS: Record<RiggedEbeeState, MotionIntent> = {
  READY: {
    facing: 0,
    energy: 0.45,
    gesture: 0.32,
    attention: 0.45,
    step: 0.25,
  },
  LISTENING: {
    facing: 0,
    energy: 0.62,
    gesture: 0.28,
    attention: 1,
    step: 0.18,
  },
  THINKING: {
    facing: -0.08,
    energy: 0.38,
    gesture: 0.2,
    attention: 0.72,
    step: 0.12,
  },
  SPEAKING: {
    facing: 0.08,
    energy: 0.9,
    gesture: 1,
    attention: 0.82,
    step: 0.36,
  },
  NEEDS_REVIEW: {
    facing: 0,
    energy: 0.74,
    gesture: 0.45,
    attention: 0.95,
    step: 0.08,
  },
};

function wave(t: number, speed: number, amount: number, offset = 0) {
  return Math.sin(t * speed + offset) * amount;
}

function phaseWave(channel: LocalPhase, amount = 1) {
  return Math.sin(channel.phase) * channel.amplitude * amount;
}

export function sampleLocalPhaseChannels(t: number, state: RiggedEbeeState, intent: MotionIntent): LocalPhaseChannels {
  const config = LOCAL_PHASE_CONFIG[state];
  const energyScale = 0.58 + intent.energy * 0.82;
  const gestureScale = 0.45 + intent.gesture * 0.82;
  const stepScale = 0.45 + intent.step * 0.9;

  return {
    spine: {
      phase: t * config.spine.frequency * Math.PI * 2 + config.spine.offset,
      amplitude: config.spine.amplitude * energyScale,
      frequency: config.spine.frequency,
    },
    head: {
      phase: t * config.head.frequency * Math.PI * 2 + config.head.offset,
      amplitude: config.head.amplitude * (0.48 + intent.attention * 0.78),
      frequency: config.head.frequency,
    },
    arms: {
      phase: t * config.arms.frequency * Math.PI * 2 + config.arms.offset,
      amplitude: config.arms.amplitude * gestureScale,
      frequency: config.arms.frequency,
    },
    legs: {
      phase: t * config.legs.frequency * Math.PI * 2 + config.legs.offset,
      amplitude: config.legs.amplitude * stepScale,
      frequency: config.legs.frequency,
    },
    wings: {
      phase: t * config.wings.frequency * Math.PI * 2 + config.wings.offset,
      amplitude: config.wings.amplitude * energyScale,
      frequency: config.wings.frequency,
    },
    tail: {
      phase: t * config.tail.frequency * Math.PI * 2 + config.tail.offset,
      amplitude: config.tail.amplitude * energyScale,
      frequency: config.tail.frequency,
    },
  };
}

function addTarget(a: JointTarget = [0, 0, 0], b: JointTarget = [0, 0, 0]): JointTarget {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scaleTarget(target: JointTarget, amount: number): JointTarget {
  return [target[0] * amount, target[1] * amount, target[2] * amount];
}

function blendTarget(a: JointTarget = [0, 0, 0], b: JointTarget = [0, 0, 0], amount: number): JointTarget {
  return [
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ];
}

export function blendIntent(a: MotionIntent, b: MotionIntent, amount: number): MotionIntent {
  return {
    facing: a.facing + (b.facing - a.facing) * amount,
    energy: a.energy + (b.energy - a.energy) * amount,
    gesture: a.gesture + (b.gesture - a.gesture) * amount,
    attention: a.attention + (b.attention - a.attention) * amount,
    step: a.step + (b.step - a.step) * amount,
  };
}

export function combinePoses(...poses: RigPose[]): RigPose {
  const next: RigPose = {};

  for (const pose of poses) {
    for (const key of JOINT_CONTROLS) {
      const target = pose[key];
      if (!target) continue;
      next[key] = addTarget(next[key], target);
    }
  }

  return next;
}

export function blendPoses(a: RigPose, b: RigPose, amount: number): RigPose {
  const next: RigPose = {};

  for (const key of JOINT_CONTROLS) {
    const av = a[key];
    const bv = b[key];
    if (!av && !bv) continue;
    next[key] = blendTarget(av, bv, amount);
  }

  return next;
}

export function blendWeightedPoses(candidates: { pose: RigPose; weight: number }[]): RigPose {
  const next: RigPose = {};
  const totalWeight = candidates.reduce((sum, candidate) => sum + Math.max(0, candidate.weight), 0);
  if (totalWeight <= 0) return next;

  for (const key of JOINT_CONTROLS) {
    let x = 0;
    let y = 0;
    let z = 0;
    let hasJoint = false;

    for (const candidate of candidates) {
      const target = candidate.pose[key];
      const weight = Math.max(0, candidate.weight) / totalWeight;
      if (!target || weight <= 0) continue;
      hasJoint = true;
      x += target[0] * weight;
      y += target[1] * weight;
      z += target[2] * weight;
    }

    if (hasJoint) next[key] = [x, y, z];
  }

  return next;
}

export function blendWeightedNodePoses(candidates: { nodePose?: RigNodePose; weight: number }[]): RigNodePose {
  const next: RigNodePose = {};
  const totalWeight = candidates.reduce((sum, candidate) => sum + Math.max(0, candidate.weight), 0);
  if (totalWeight <= 0) return next;

  const nodeIds = new Set(candidates.flatMap((candidate) => Object.keys(candidate.nodePose ?? {})));
  for (const nodeId of nodeIds) {
    let x = 0;
    let y = 0;
    let z = 0;
    let hasNode = false;

    for (const candidate of candidates) {
      const target = candidate.nodePose?.[nodeId];
      const weight = Math.max(0, candidate.weight) / totalWeight;
      if (!target || weight <= 0) continue;
      hasNode = true;
      x += target[0] * weight;
      y += target[1] * weight;
      z += target[2] * weight;
    }

    if (hasNode) next[nodeId] = [x, y, z];
  }

  return next;
}

export function getStatePreset(state: RiggedEbeeState): RigPose {
  return MOTION_CLIPS[state].basePose;
}

export function buildTrajectoryPose(intent: MotionIntent, pointerX: number, pointerY: number): RigPose {
  const facing = intent.facing + pointerX * 0.08;
  const attentionLean = -0.1 * intent.attention;

  return {
    spine: [attentionLean * 0.25, facing * 0.28, 0],
    chest: [attentionLean * 0.45, facing * 0.42, 0],
    neck: [-attentionLean * 0.4 - pointerY * 0.025, facing * 0.55, 0],
    head: [attentionLean - pointerY * 0.05, facing * 0.75, 0],
  };
}

export function buildTrajectorySamples(inputs: MotionInputs): TrajectorySample[] {
  const intent = inputs.intent ?? STATE_INTENTS[inputs.state];
  const facing = intent.facing + inputs.pointerX * 0.08;
  const speed = (0.16 + intent.step * 0.34 + intent.energy * 0.08) * (inputs.state === "SPEAKING" ? 0.75 : 1);
  const strafe = inputs.pointerY * 0.08 + intent.gesture * 0.025;

  return [-0.25, 0, 0.35, 0.7, 1.05].map((timeOffset) => {
    const future = Math.max(0, timeOffset);
    const sway = Math.sin((inputs.t + timeOffset) * 1.7) * 0.025 * intent.energy;
    const x = facing * (0.18 + future * 0.32) + strafe * future + sway;
    const z = speed * future;
    const directionAngle = facing * 0.55 + sway * 0.8;

    return {
      time: Number(timeOffset.toFixed(3)),
      position: [Number(x.toFixed(4)), Number(z.toFixed(4))],
      direction: [Number(Math.sin(directionAngle).toFixed(4)), Number(Math.cos(directionAngle).toFixed(4))],
    };
  });
}

export function buildProceduralPose({ t, pointerX, pointerY, state, transition = 1, intent = STATE_INTENTS[state] }: MotionInputs): RigPose {
  const isListening = state === "LISTENING";
  const isSpeaking = state === "SPEAKING";
  const isReview = state === "NEEDS_REVIEW";
  const clip = MOTION_CLIPS[state];
  const phases = sampleLocalPhaseChannels(t, state, intent);
  const clipTime = (t % clip.duration) / clip.duration;
  const clipPhase = clipTime * Math.PI * 2;
  const energy = clip.energy * intent.energy;
  const gesture = intent.gesture;
  const breath = phaseWave(phases.spine, energy);
  const step = 0;
  const armSwing = phaseWave(phases.arms, gesture);
  const headMotion = phaseWave(phases.head);
  const wing = phaseWave(phases.wings, energy);
  const talk = isSpeaking ? wave(t, clip.talkRate, transition * gesture) : 0;
  const shake = isReview ? wave(t, 16, transition) : 0;
  const lean = isListening ? -0.13 : state === "THINKING" ? 0.08 : 0;
  const anticipation = Math.sin(clipPhase) * 0.018 * transition;

  return {
    spine: [lean * 0.4 + anticipation, pointerX * 0.025, breath * 0.015],
    chest: [lean * 0.6 + anticipation, pointerX * 0.045, breath * 0.018 + shake * 0.035],
    neck: [-lean * 0.4 - pointerY * 0.035, pointerX * 0.06, -breath * 0.02],
    head: [
      lean - pointerY * 0.06 + (isSpeaking ? talk * 0.07 : wave(t, 1.25, 0.025)),
      pointerX * 0.12 + headMotion * 0.08 + shake * 0.08,
      (state === "THINKING" ? 0.09 : 0) + headMotion * 0.035 + shake * 0.04,
    ],
    facePlate: [isSpeaking ? talk * 0.035 : 0, pointerX * 0.015, 0],
    antenna: [0, pointerX * 0.03, wave(t, 3.4, 0.08) + shake * 0.08],
    shoulderL: [-0.04 + lean * 0.15 + step * 0.02, -0.02, -0.06 + armSwing * 0.08 + breath * 0.025 * gesture],
    elbowL: [step * 0.035, 0.01, -0.08 + armSwing * 0.09 + breath * 0.035],
    wristL: [step * 0.06, 0.035, armSwing * 0.12 + breath * 0.08],
    shoulderR: [
      -0.04 + lean * 0.15 + (isSpeaking ? armSwing * 0.12 : -step * 0.02),
      0.02,
      isSpeaking ? 0.24 * gesture + armSwing * 0.18 : 0.06 - breath * 0.025,
    ],
    elbowR: [
      isSpeaking ? armSwing * 0.16 : -step * 0.035,
      -0.01,
      isSpeaking ? 0.18 * gesture + armSwing * 0.16 : 0.08 - breath * 0.035,
    ],
    wristR: [talk * 0.12, -0.035, isSpeaking ? talk * 0.18 : -breath * 0.08],
    fingersL: [0.08 + breath * 0.035, 0, -0.04],
    fingersR: [0.12 + (isSpeaking ? Math.abs(talk) * 0.16 : breath * 0.035), 0, 0.04 * gesture],
    wingL: [wing * 0.11, -0.12 + wing * 0.14, 0.18 + wing * 0.22],
    wingR: [-wing * 0.11, 0.12 - wing * 0.14, -0.18 - wing * 0.22],
    tail: [0, phaseWave(phases.tail, 0.08), -phaseWave(phases.tail, 0.11)],
  };
}

function buildDirectMotionPose(inputs: MotionInputs): RigPose {
  const intent = inputs.intent ?? STATE_INTENTS[inputs.state];
  const trajectoryPose = buildTrajectoryPose(intent, inputs.pointerX, inputs.pointerY);
  const statePose = Object.fromEntries(
    Object.entries(getStatePreset(inputs.state)).map(([key, target]) => [
      key,
      scaleTarget(target, intent.gesture),
    ]),
  ) as RigPose;

  return combinePoses(trajectoryPose, statePose, buildProceduralPose({ ...inputs, intent }));
}

function buildMotionFeature(inputs: MotionInputs): MotionFeature {
  const intent = inputs.intent ?? STATE_INTENTS[inputs.state];
  const clip = MOTION_CLIPS[inputs.state];
  const phases = sampleLocalPhaseChannels(inputs.t, inputs.state, intent);

  return {
    state: inputs.state,
    normalizedTime: (inputs.t % clip.duration) / clip.duration,
    facing: intent.facing + inputs.pointerX * 0.08,
    energy: intent.energy,
    gesture: intent.gesture,
    attention: intent.attention,
    step: intent.step,
    phases: Object.fromEntries(
      Object.entries(phases).map(([key, phase]) => [
        key,
        {
          sin: Math.sin(phase.phase),
          cos: Math.cos(phase.phase),
          amplitude: phase.amplitude,
        },
      ]),
    ) as MotionFeature["phases"],
    trajectory: buildTrajectorySamples(inputs),
  };
}

function phaseDistance(a: MotionFeature, b: MotionFeature) {
  return (Object.keys(a.phases) as LocalPhaseKey[]).reduce((sum, key) => {
    const av = a.phases[key];
    const bv = b.phases[key];
    return (
      sum +
      Math.abs(av.sin - bv.sin) * 0.22 +
      Math.abs(av.cos - bv.cos) * 0.14 +
      Math.abs(av.amplitude - bv.amplitude) * 0.32
    );
  }, 0);
}

function trajectoryDistance(a: MotionFeature, b: MotionFeature) {
  const sampleCount = Math.min(a.trajectory?.length ?? 0, b.trajectory?.length ?? 0);
  if (sampleCount === 0) return 0;

  let sum = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const av = a.trajectory[index];
    const bv = b.trajectory[index];
    sum +=
      Math.abs(av.time - bv.time) * 0.08 +
      Math.abs(av.position[0] - bv.position[0]) * 1.4 +
      Math.abs(av.position[1] - bv.position[1]) * 1.1 +
      Math.abs(av.direction[0] - bv.direction[0]) * 0.55 +
      Math.abs(av.direction[1] - bv.direction[1]) * 0.35;
  }

  return sum / sampleCount;
}

function featureDistance(a: MotionFeature, b: MotionFeature) {
  const wrappedTime = Math.min(
    Math.abs(a.normalizedTime - b.normalizedTime),
    1 - Math.abs(a.normalizedTime - b.normalizedTime),
  );

  return (
    (a.state === b.state ? 0 : 12) +
    wrappedTime * 0.9 +
    Math.abs(a.facing - b.facing) * 1.2 +
    Math.abs(a.energy - b.energy) * 0.75 +
    Math.abs(a.gesture - b.gesture) * 0.8 +
    Math.abs(a.attention - b.attention) * 0.65 +
    Math.abs(a.step - b.step) * 0.7 +
    phaseDistance(a, b) +
    trajectoryDistance(a, b)
  );
}

function buildMotionDatabase(): MotionFrame[] {
  return Object.values(MOTION_CLIPS).flatMap((clip) => {
    const intent = STATE_INTENTS[clip.state];
    return Array.from({ length: 18 }, (_, index) => {
      const time = (clip.duration * index) / 18;
      const inputs: MotionInputs = {
        t: time,
        pointerX: Math.sin(index * 0.7) * 0.22,
        pointerY: Math.cos(index * 0.5) * 0.16,
        state: clip.state,
        transition: 1,
        intent,
      };

      return {
        id: `${clip.state}-${index.toString().padStart(2, "0")}`,
        clip: clip.name,
        time,
        state: clip.state,
        feature: buildMotionFeature(inputs),
        pose: buildDirectMotionPose(inputs),
      };
    });
  });
}

export const MOTION_DATABASE = buildMotionDatabase();

export function normalizeMotionDatabase(payload: MotionDatabasePayload): MotionFrame[] {
  if (payload.schema !== "hive-ebee-motion-database/v1") return MOTION_DATABASE;
  if (!Array.isArray(payload.frames) || payload.frames.length === 0) return MOTION_DATABASE;

  const validFrames = payload.frames.filter((frame) => {
    if (!frame || !MOTION_CLIPS[frame.state]) return false;
    if (!frame.feature || frame.feature.state !== frame.state) return false;
    if (!frame.pose || typeof frame.pose !== "object") return false;
    return true;
  });

  return validFrames.length > 0 ? validFrames : MOTION_DATABASE;
}

export function queryMotionDatabase(inputs: MotionInputs, database: MotionFrame[] = MOTION_DATABASE): MotionFrame {
  const feature = buildMotionFeature(inputs);
  let bestFrame = database[0] ?? MOTION_DATABASE[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const frame of database.length > 0 ? database : MOTION_DATABASE) {
    const score = featureDistance(feature, frame.feature);
    if (score < bestScore) {
      bestScore = score;
      bestFrame = frame;
    }
  }

  return bestFrame;
}

export function queryMotionDatabaseBlend(
  inputs: MotionInputs,
  database: MotionFrame[] = MOTION_DATABASE,
  candidateCount = 4,
): MotionMatchResult {
  const feature = buildMotionFeature(inputs);
  const frames = database.length > 0 ? database : MOTION_DATABASE;
  const candidates = frames
    .map((frame) => ({
      frame,
      score: featureDistance(feature, frame.feature),
      weight: 0,
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, Math.max(1, candidateCount));
  const bestScore = candidates[0]?.score ?? 0;
  const weightedCandidates = candidates.map((candidate) => ({
    ...candidate,
    weight: 1 / (1 + Math.max(0, candidate.score - bestScore)),
  }));

  return {
    feature,
    candidates: weightedCandidates,
    pose: blendWeightedPoses(weightedCandidates.map((candidate) => ({ pose: candidate.frame.pose, weight: candidate.weight }))),
    nodePose: blendWeightedNodePoses(
      weightedCandidates.map((candidate) => ({ nodePose: candidate.frame.nodePose, weight: candidate.weight })),
    ),
  };
}

export function sampleMotionFrame(inputs: MotionInputs, database: MotionFrame[] = MOTION_DATABASE): MotionSample {
  const directPose = buildDirectMotionPose(inputs);
  const match = queryMotionDatabaseBlend(inputs, database);
  const matchedFrame = match.candidates[0]?.frame ?? MOTION_DATABASE[0];
  const defaultWeight = inputs.state === matchedFrame.state ? 0.28 : 0.12;
  const matchWeight = Math.max(0, Math.min(1, inputs.databaseWeight ?? defaultWeight));

  return {
    pose: blendPoses(directPose, match.pose, matchWeight),
    nodePose: Object.fromEntries(
      Object.entries(match.nodePose).map(([nodeId, target]) => [nodeId, scaleTarget(target, matchWeight)]),
    ),
  };
}

export function sampleMotionClip(inputs: MotionInputs, database: MotionFrame[] = MOTION_DATABASE): RigPose {
  return sampleMotionFrame(inputs, database).pose;
}
