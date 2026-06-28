# Ebee Avatar AI4Animation Handoff

This project loads the real Ebee FBX from `public/avatar/ebee_new/ebee_new.fbx`, maps the current rig through `public/avatar/ebee_new/ebee_rig_map.json`, and selects the Unity-produced AI4Animation runtime database from `public/avatar/ebee_new/ebee_ai4animation_motion_database.json`.

Current production runtime status:

- source: Unity AI4Animation prepared project full-rig Ebee batch export
- schema: `ai4animation-motion-export/v1`
- runtime frames: 180 total, 36 per avatar state
- full rig coverage: 750 exact `nodePose` paths per frame
- manifest selection: `runtimeMotionDatabase: true`

The normal kiosk UI hides the raw joint lab and exposes customer-facing motion controls instead: Greet, Rest, Listen, and Speak. The raw Joint Control panel is only a debug tool for checking the motion database, DB blend, smoothness, group joints, and exact rig-node overrides.

The current web runtime also applies a controlled behavior layer after the motion database sample. This layer prevents the FBX bind/source pose from reading as a wide T-pose in the customer-facing Rest state, removes random whole-body shake from the normal states, and drives separate bone-level behaviors for idle, greeting, speaking, and listening. The normal kiosk runtime keeps the imported database available for status/debug proof, but its default DB blend starts at `0` so raw exact-node source motion cannot shake or deform the customer-facing avatar unless a developer intentionally raises the debug DB slider.

Use this guide when exporting full-joint Ebee motion from AI4Animation and promoting it into the app.

## Required project artifacts

- `public/avatar/ebee_new/ebee_rig_map.json`
- `public/avatar/ebee_new/ebee_ai4animation_contract.json`
- `public/avatar/ebee_new/ebee_ai4animation_export.schema.json`
- `public/avatar/ebee_new/ebee_avatar_manifest.json`

Regenerate these before giving the rig to an animator or motion-export step:

```sh
npm run avatar:rig:export
npm run avatar:ai4animation:contract:export
npm run avatar:ai4animation:schema:export
npm run avatar:manifest:export
npm run avatar:ai4animation:handoff:export
npm run avatar:ai4animation:handoff:package:verify
```

The handoff export writes `dist/ebee_ai4animation_handoff`. That package contains the exact runtime `ebee_new.fbx`, the `sourceimages` texture folder, the rig map, the AI4Animation contract, the export JSON schema, this guide, and `handoff_manifest.json` with checksums, node counts, controls, states, production gates, and install commands.

It also includes `tools/ai4animation/EbeeAI4AnimationJsonExporter.cs`, a Unity Editor helper for the upstream AI4Animation project. Copy it into an AI4Animation Unity project under `Assets/Editor` and open `AI4Animation/Exporter/Ebee JSON Runtime Exporter`. The exporter uses `MotionEditor`, `MotionData`, and `Actor` frame sampling to write `ai4animation-motion-export/v1` JSON with trajectory samples, local phases, high-level joints, and exact `nodePose` rotations for the Ebee rig map paths.

```sh
npm run avatar:ai4animation:unity-project:prepare -- <AI4Animation-Unity-project-dir>
npm run avatar:ai4animation:unity-project:prepare:verify
npm run avatar:ai4animation:unity-exporter:install -- <AI4Animation-Unity-project-dir>
npm run avatar:ai4animation:unity-exporter:install:verify
npm run avatar:ai4animation:unity-exporter:verify
```

The prepare command clones or updates `https://github.com/sebastianstarke/AI4Animation.git` into the target directory, then installs the Ebee exporter. The local prepared Unity project used for the current production export is `C:\Users\jeysa\Desktop\AI4Animation_Ebee`.

The installer validates that the target checkout looks like the upstream AI4Animation Unity project by finding `MotionEditor.cs`, `MotionData.cs`, and `Actor.cs` under `Assets/Scripts`, then copies the Ebee exporter to `Assets/Editor/EbeeAI4AnimationJsonExporter.cs`.

## Export contract

The raw export must use schema `ai4animation-motion-export/v1`. It may provide either top-level `frames` or named `clips`. Each frame should include per-joint rotation tuples in radians, keyed by the joint names from `ebee_ai4animation_contract.json`.

Each frame may also include `trajectory` or `feature.trajectory`: short-horizon local-space path samples with `time`, `position`, and `direction` XZ tuples. The runtime uses these trajectory samples together with controls, local phases, and joint rotations when selecting AI4Animation-style motion frames.

For full joint control, each frame may include exact rig-node rotations using `nodePose`, `nodes`, `fineJoints`, or `feature.nodePose`. These keys must be the `path` values from `public/avatar/ebee_new/ebee_rig_map.json`; the current Ebee contract exposes 750 controllable node paths.

The app importer converts that raw export into the runtime motion database consumed by `RiggedEbeeAvatar`. That runtime database drives smooth joint interpolation over every mapped rig node instead of only moving a few high-level body parts.

## Checked import flow

Replace `<raw-export-json>` with the AI4Animation export path and `<runtime-json>` with a temporary output path, for example `dist/ebee_ai4animation_motion.json`.

```sh
npm run avatar:ai4animation:validate -- <raw-export-json>
npm run avatar:ai4animation:import -- <raw-export-json> <runtime-json>
npm run avatar:ai4animation:runtime:check -- <runtime-json>
npm run avatar:ai4animation:status
npm run avatar:ai4animation:promote -- <runtime-json> public/avatar/ebee_new/ebee_ai4animation_motion_database.json
npm run avatar:ai4animation:install -- public/avatar/ebee_new/ebee_ai4animation_motion_database.json
npm run avatar:manifest:export
npm run avatar:pipeline
npm run avatar:ai4animation:production:ready
```

Promotion requires at least 12 frames per state for production motion. The `--allow-sample` flag exists only for local fixture checks and must not be used to write sample-only data into `public/avatar/ebee_new`.

For a real Unity export, the production install can be run as one command:

```sh
npm run avatar:ai4animation:production:install -- <raw-export-json>
```

That command regenerates the rig contract and schema, validates the raw Unity JSON, imports it into the runtime database shape, promotes it without `--allow-sample`, installs it into `public/avatar/ebee_new/ebee_ai4animation_motion_database.json`, regenerates the manifest, runs the avatar pipeline, and finishes with `npm run avatar:ai4animation:production:ready`.

## Runtime proof

For the current installed Unity export, `npm run avatar:pipeline`, `npm run avatar:ai4animation:production:ready`, and `npm run avatar:browser` should pass. The browser avatar debug panel should show:

- motion database loaded
- rig map loaded
- AI4Animation contract loaded
- `runtimeMotionDatabase` true in the manifest check
- motion source schema `ai4animation-motion-export/v1`
- trajectory samples present in `npm run avatar:ai4animation:runtime:check`
- exact `nodePose` data present in `npm run avatar:ai4animation:runtime:check`
- Fine Motion reports 750 nodes
- Motion DB reports 180 loaded frames

If the debug panel still reports `procedural-ai4animation-adapter`, the app is still using the fallback motion source and the real AI4Animation runtime database has not been installed.

Use `npm run avatar:ai4animation:status` for a non-failing JSON report of each production requirement, including manifest selection, runtime database source, sample-data rejection, per-state frame counts, and exact `nodePose` coverage.

The strict production gate is `npm run avatar:ai4animation:production:ready`. It should fail while the avatar is using fallback motion and pass only after `public/avatar/ebee_new/ebee_ai4animation_motion_database.json` is installed, selected by the manifest, marked `runtimeMotionDatabase: true`, and contains production frame/nodePose coverage.

## UI motion controls

The production UI is avatar-first and inspired by physical AI kiosk screens like the LiveX reference. The side Joint Control panel should not be visible in the normal route; it appears only when `debugMode` is enabled or the URL includes `?avatarDebug=1`.

For pose debugging, the runtime accepts a hidden `avatarPose` URL parameter such as `?avatarPose=shoulderL=0,0,1.4;shoulderR=0,0,-1.4`. This is only for calibration screenshots and should not be used as the normal kiosk URL.

Use the customer-facing Avatar Motion controls for demos:

- Greet: forces the speaking/greeting motion state for a short demo.
- Rest: forces the READY/resting motion state.
- Listen: forces the attentive listening state.
- Speak: forces the expressive speaking state.

The app still changes avatar state automatically during real use: microphone listening maps to `LISTENING`, backend wait maps to `THINKING`, speech synthesis maps to `SPEAKING`, and errors map to `NEEDS_REVIEW`.

The controlled behavior layer lives in `RiggedEbeeAvatar`. It applies smooth damped bone rotations to head, neck, spine, chest, shoulders, elbows, wrists, fingers, hips, and knees while keeping the top-level FBX object fixed and grounded. Normal idle uses only small breathing, head motion, eye micro-movement, non-deforming eye-light blinking, and weight-shift values. Speaking adds calm presenter-style head motion, restrained alternating hand/finger motion, faceplate movement, and available teeth/tongue joint movement. App speech synthesis `onboundary` events feed a `speechPulse` prop so faceplate/teeth/tongue intensity follows utterance timing when the browser exposes speech boundaries, with a small procedural fallback while speaking. Greeting raises the left-side arm and adds a short wave motion; the app plays it once for greeting intents, then returns to speaking or idle.

The current FBX does not expose morph targets on the visible Ebee meshes, so runtime facial animation is bone/object based. The safe visible facial controls found in Three.js are the eye bones (`Eye_L`, `Eye_R`), faceplate bones, teeth joints, tongue joints, and eye material emissive intensity. The Maya face setup also contains eyelid/lip helper layers, but those are not visible production Ebee meshes and should not be enabled blindly without an artist validating materials and deformation in the source DCC/Unity file.

For screenshot/testing only, `?avatarDemo=resting|greeting|listening|speaking` can force a behavior state. Normal kiosk URLs should not include this parameter.

Use `npm run avatar:receptionist:verify` as the single acceptance gate for the current kiosk avatar runtime. It runs the deformation guard, root-stability guard, behavior contract, facial-rig proof, AI4Animation production status, and browser-rendered motion verification.
