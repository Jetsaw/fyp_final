import {
  JOINT_CONTROLS,
  MOTION_DATABASE,
  MOTION_CLIPS,
  RIG_POSE_PRESETS,
  STATE_INTENTS,
  queryMotionDatabase,
  queryMotionDatabaseBlend,
  sampleLocalPhaseChannels,
  sampleMotionClip,
} from "../src/components/ebeeRigController.ts";

const jointSet = new Set(JOINT_CONTROLS);

function assertPose(name, pose) {
  for (const [joint, target] of Object.entries(pose)) {
    if (!jointSet.has(joint)) {
      throw new Error(`${name} references unknown joint ${joint}`);
    }

    if (!Array.isArray(target) || target.length !== 3 || target.some((value) => !Number.isFinite(value))) {
      throw new Error(`${name}.${joint} must be a finite XYZ tuple`);
    }
  }
}

function poseMagnitude(pose) {
  return Object.values(pose).reduce(
    (sum, target) => sum + Math.hypot(target[0], target[1], target[2]),
    0,
  );
}

function poseDistance(a, b) {
  const joints = new Set([...Object.keys(a), ...Object.keys(b)]);
  let sum = 0;

  for (const joint of joints) {
    const av = a[joint] ?? [0, 0, 0];
    const bv = b[joint] ?? [0, 0, 0];
    sum += Math.hypot(av[0] - bv[0], av[1] - bv[1], av[2] - bv[2]);
  }

  return sum;
}

function assertMotionContinuity(state, intent) {
  const samples = Array.from({ length: 90 }, (_, index) =>
    sampleMotionClip({
      t: index / 30,
      pointerX: Math.sin(index / 12) * 0.35,
      pointerY: Math.cos(index / 16) * 0.25,
      state,
      transition: 1,
      intent,
    }),
  );

  let totalMotion = 0;
  let maxFrameDelta = 0;

  for (let i = 1; i < samples.length; i += 1) {
    const distance = poseDistance(samples[i - 1], samples[i]);
    totalMotion += distance;
    maxFrameDelta = Math.max(maxFrameDelta, distance);
  }

  if (totalMotion < 1.5) {
    throw new Error(`state ${state} is too static: total motion ${totalMotion.toFixed(3)}`);
  }

  if (maxFrameDelta > 1.3) {
    throw new Error(`state ${state} has a discontinuous frame jump: ${maxFrameDelta.toFixed(3)}`);
  }

  return {
    totalMotion: Number(totalMotion.toFixed(3)),
    maxFrameDelta: Number(maxFrameDelta.toFixed(3)),
    averageMagnitude: Number((samples.reduce((sum, pose) => sum + poseMagnitude(pose), 0) / samples.length).toFixed(3)),
  };
}

function assertIntentResponsiveness(state) {
  const calm = sampleMotionClip({
    t: 1.1,
    pointerX: 0,
    pointerY: 0,
    state,
    transition: 1,
    intent: {
      ...STATE_INTENTS[state],
      energy: 0.2,
      gesture: 0.15,
      attention: 0.2,
      step: 0.05,
    },
  });
  const expressive = sampleMotionClip({
    t: 1.1,
    pointerX: 0.45,
    pointerY: -0.25,
    state,
    transition: 1,
    intent: {
      ...STATE_INTENTS[state],
      facing: 0.55,
      energy: 1,
      gesture: 1,
      attention: 1,
      step: 0.7,
    },
  });
  const distance = poseDistance(calm, expressive);

  if (distance < 0.45) {
    throw new Error(`state ${state} does not respond strongly enough to intent controls: ${distance.toFixed(3)}`);
  }

  return Number(distance.toFixed(3));
}

function assertDatabaseInfluence(state, intent) {
  const direct = sampleMotionClip({
    t: 1.35,
    pointerX: 0.2,
    pointerY: -0.1,
    state,
    transition: 1,
    intent,
    databaseWeight: 0,
  });
  const matched = sampleMotionClip({
    t: 1.35,
    pointerX: 0.2,
    pointerY: -0.1,
    state,
    transition: 1,
    intent,
    databaseWeight: 1,
  });
  const distance = poseDistance(direct, matched);

  if (distance < 0.02) {
    throw new Error(`state ${state} is not influenced by database blend: ${distance.toFixed(3)}`);
  }

  return Number(distance.toFixed(3));
}

function assertDatabaseBlendQuery(state, intent) {
  const match = queryMotionDatabaseBlend({
    t: 1.35,
    pointerX: 0.2,
    pointerY: -0.1,
    state,
    transition: 1,
    intent,
  });

  if (match.feature.state !== state) {
    throw new Error(`blend query feature state mismatch for ${state}`);
  }

  if (!Array.isArray(match.candidates) || match.candidates.length < 3) {
    throw new Error(`blend query for ${state} needs multiple candidates`);
  }

  if (match.candidates[0].frame.state !== state) {
    throw new Error(`blend query for ${state} matched ${match.candidates[0].frame.state}`);
  }

  for (let i = 1; i < match.candidates.length; i += 1) {
    if (match.candidates[i].score < match.candidates[i - 1].score) {
      throw new Error(`blend query candidates for ${state} are not sorted by score`);
    }
  }

  if (match.candidates.some((candidate) => !Number.isFinite(candidate.weight) || candidate.weight <= 0)) {
    throw new Error(`blend query for ${state} has invalid candidate weights`);
  }

  assertPose(`blend-query:${state}`, match.pose);

  return {
    candidates: match.candidates.length,
    bestScore: Number(match.candidates[0].score.toFixed(3)),
    worstScore: Number(match.candidates.at(-1).score.toFixed(3)),
    totalWeight: Number(match.candidates.reduce((sum, candidate) => sum + candidate.weight, 0).toFixed(3)),
  };
}

function assertLocalPhases(state, intent) {
  const phases = sampleLocalPhaseChannels(1.25, state, intent);
  const required = ["spine", "head", "arms", "legs", "wings", "tail"];

  for (const key of required) {
    const channel = phases[key];
    if (!channel) {
      throw new Error(`state ${state} is missing local phase channel ${key}`);
    }

    for (const [field, value] of Object.entries(channel)) {
      if (!Number.isFinite(value)) {
        throw new Error(`state ${state} phase ${key}.${field} must be finite`);
      }
    }

    if (channel.frequency <= 0 || channel.amplitude <= 0) {
      throw new Error(`state ${state} phase ${key} must have positive frequency and amplitude`);
    }
  }

  return Object.fromEntries(
    required.map((key) => [
      key,
      {
        frequency: Number(phases[key].frequency.toFixed(3)),
        amplitude: Number(phases[key].amplitude.toFixed(3)),
      },
    ]),
  );
}

function assertTrajectoryFeature(state, intent) {
  const match = queryMotionDatabaseBlend({
    t: 1.35,
    pointerX: 0.2,
    pointerY: -0.1,
    state,
    transition: 1,
    intent,
  });
  const trajectory = match.feature.trajectory;

  if (!Array.isArray(trajectory) || trajectory.length < 5) {
    throw new Error(`state ${state} needs at least five trajectory feature samples`);
  }

  for (const [index, sample] of trajectory.entries()) {
    if (!Number.isFinite(sample.time)) {
      throw new Error(`state ${state} trajectory[${index}].time must be finite`);
    }

    for (const field of ["position", "direction"]) {
      const tuple = sample[field];
      if (!Array.isArray(tuple) || tuple.length !== 2 || tuple.some((value) => !Number.isFinite(value))) {
        throw new Error(`state ${state} trajectory[${index}].${field} must be a finite XZ tuple`);
      }
    }
  }

  return {
    samples: trajectory.length,
    finalPosition: trajectory.at(-1).position.map((value) => Number(value.toFixed(3))),
    finalDirection: trajectory.at(-1).direction.map((value) => Number(value.toFixed(3))),
  };
}

for (const [name, pose] of Object.entries(RIG_POSE_PRESETS)) {
  assertPose(`preset:${name}`, pose);
}

const motionMetrics = {};
const databaseCounts = Object.fromEntries(Object.keys(MOTION_CLIPS).map((state) => [state, 0]));

for (const frame of MOTION_DATABASE) {
  if (!databaseCounts[frame.state] && databaseCounts[frame.state] !== 0) {
    throw new Error(`motion database has unknown state ${frame.state}`);
  }

  databaseCounts[frame.state] += 1;
  assertPose(`database:${frame.id}`, frame.pose);

  if (!Number.isFinite(frame.time) || frame.time < 0) {
    throw new Error(`motion database frame ${frame.id} has invalid time`);
  }

  if (frame.feature.state !== frame.state) {
    throw new Error(`motion database frame ${frame.id} feature state mismatch`);
  }
}

for (const [state, count] of Object.entries(databaseCounts)) {
  if (count < 12) {
    throw new Error(`motion database needs broad coverage for ${state}, found ${count}`);
  }
}

for (const [state, clip] of Object.entries(MOTION_CLIPS)) {
  const intent = STATE_INTENTS[state];
  if (!intent) {
    throw new Error(`Missing intent for state ${state}`);
  }

  for (const [key, value] of Object.entries(intent)) {
    if (!Number.isFinite(value)) {
      throw new Error(`intent ${state}.${key} must be finite`);
    }
  }

  if (clip.state !== state) {
    throw new Error(`clip ${clip.name} state mismatch: ${clip.state} !== ${state}`);
  }

  if (!Number.isFinite(clip.duration) || clip.duration <= 0) {
    throw new Error(`clip ${clip.name} must have a positive duration`);
  }

  assertPose(`clip:${clip.name}`, clip.basePose);

  for (const t of [0, 0.25, 0.75, 1.5, 3]) {
    const matchedFrame = queryMotionDatabase({
      t,
      pointerX: 0.2,
      pointerY: -0.1,
      state: clip.state,
      transition: 1,
      intent,
    });

    if (matchedFrame.state !== clip.state) {
      throw new Error(`query for ${clip.state} matched ${matchedFrame.state}`);
    }

    const sample = sampleMotionClip({
      t,
      pointerX: 0.2,
      pointerY: -0.1,
      state: clip.state,
      transition: 1,
      intent,
    });
    assertPose(`sample:${clip.name}:${t}`, sample);
  }

  motionMetrics[state] = {
    ...assertMotionContinuity(state, intent),
    intentResponse: assertIntentResponsiveness(state),
    databaseInfluence: assertDatabaseInfluence(state, intent),
    databaseBlend: assertDatabaseBlendQuery(state, intent),
    localPhases: assertLocalPhases(state, intent),
    trajectory: assertTrajectoryFeature(state, intent),
  };
}

const statePairs = Object.keys(MOTION_CLIPS).flatMap((state, index, states) =>
  states.slice(index + 1).map((otherState) => [state, otherState]),
);

for (const [state, otherState] of statePairs) {
  const distance = poseDistance(
    sampleMotionClip({ t: 1.2, pointerX: 0.15, pointerY: -0.1, state, transition: 1, intent: STATE_INTENTS[state] }),
    sampleMotionClip({
      t: 1.2,
      pointerX: 0.15,
      pointerY: -0.1,
      state: otherState,
      transition: 1,
      intent: STATE_INTENTS[otherState],
    }),
  );

  if (distance < 0.08) {
    throw new Error(`states ${state} and ${otherState} are not distinct enough: ${distance.toFixed(3)}`);
  }
}

console.log(
  JSON.stringify(
    {
      jointCount: JOINT_CONTROLS.length,
      presetCount: Object.keys(RIG_POSE_PRESETS).length,
      clipCount: Object.keys(MOTION_CLIPS).length,
      intentCount: Object.keys(STATE_INTENTS).length,
      sampledStates: Object.keys(MOTION_CLIPS),
      databaseFrameCount: MOTION_DATABASE.length,
      databaseCounts,
      motionMetrics,
    },
    null,
    2,
  ),
);
