# Hive FYP Progress Log — 3D Ebee Avatar Update

**Project:** Hive / Hive Kiosk  
**Title:** AI Avatar for Academic Advising using Fine-Tuned Large Language Model  
**Update focus:** 3D Ebee avatar, GLB export, React integration, movement testing, and next production path  
**Updated date:** 4 June 2026  
**Current status:** Core Hive system works. 3D Ebee model loads in frontend. Basic whole-avatar movement works. Proper head/hand/wing movement still requires Maya rig animation export.

---

## 1. Current Project Summary

Hive is currently a working academic advising kiosk system with:

```text
React/Vite frontend
FastAPI backend
Fine-tuned Qwen3.5 2B LoRA model
RAG/rule fallback
Speech recognition input
Text-to-speech output
Portrait kiosk mode
Landscape technical/demo mode
2D Ebee avatar fallback
Experimental 3D Ebee avatar integration
```

The original stable system used a 2.5D Ebee avatar. The latest work focused on upgrading Ebee into a more realistic 3D avatar with movement and future lip-sync/body movement support.

---

## 2. Confirmed Existing Working System

### Backend

The backend remains unchanged and should not be modified for the 3D avatar work.

Backend path:

```bash
/home/jet/fyp-unsloth
```

Run backend:

```bash
cd ~/fyp-unsloth
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend endpoints:

```text
GET  http://127.0.0.1:8000/health
POST http://127.0.0.1:8000/ask
```

Expected health response:

```json
{"status":"ok"}
```

### Frontend

Frontend path:

```powershell
C:\Users\jeysa\Desktop\Final Years\frontend
```

Run frontend:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## 3. Original Avatar Status Before 3D Work

The stable avatar before this update was:

```text
2.5D Ebee avatar
React component: Avatar2D.tsx
CSS: Avatar2D.css
Image asset: hero-transparent.png
Background asset: hive-scene-bg.png
```

Stable files:

```text
frontend/src/components/Avatar2D.tsx
frontend/src/components/Avatar2D.css
frontend/src/assets/hero-transparent.png
frontend/src/assets/hive-scene-bg.png
```

This 2D version remains the emergency fallback and should not be deleted.

---

## 4. 3D Avatar Goal

The requested target was:

```text
More realistic Ebee avatar
Body movement
Head movement
Hand movement
Wing movement
Speaking movement
Lip-sync behavior
```

The ideal final behavior:

| Hive State | Avatar Behavior |
|---|---|
| READY | idle breathing / slight motion |
| LISTENING | lean forward / attentive head movement |
| THINKING | head tilt / slow body sway |
| SPEAKING | head nod / hand gestures / wing movement / mouth pulse |
| NEEDS_REVIEW | confused shake or error reaction |

---

## 5. 3D Source Asset Confirmed

The main 3D file provided:

```text
Ebee_Model_rig_New.mb
```

Type:

```text
Autodesk Maya binary file
```

Confirmed in Maya:

```text
Model opens successfully
Full Ebee body visible
Rig controllers visible
Body, head, arm, wing, leg groups visible
```

Important Maya model groups seen:

```text
Ebee_Model_mod_geo
Ebee_Model_mod_Head_grp
Ebee_Model_mod_Body_grp
Ebee_Model_mod_L_Hand_grp
Ebee_Model_mod_R_Hand_grp
Ebee_Model_mod_L_Leg_grp
Ebee_Model_mod_R_Leg_grp
Ebee_Model_mod_Wing_grp
```

Texture files available:

```text
Body_dif
Body_nor
Body_met
Palm_dif
Palm_nor
Palm_met
Shoes_dif
Shoes_nor
UppArmor_dif
wing_Diffuse
Face_dif
```

Notes:

```text
.tx files are Maya/Arnold texture cache files.
For web/GLB, PNG/TGA textures are preferred.
```

---

## 6. 3D Export Attempts Completed

### Attempt 1 — Full Rig FBX Export

Action:

```text
Maya full rig exported as FBX
Imported into Blender
```

Result:

```text
Failed / exploded model
Rig controllers, constraints, and skeleton objects exported badly
Blender view showed broken controller spikes and rig artifacts
```

Maya export warning included:

```text
Unable to find bind pose
Constraints export failed
Unsupported constraints export failed
```

Conclusion:

```text
Full Maya rig export is unsafe unless carefully selecting skeleton + skinned mesh and baking animation.
```

### Attempt 2 — Mesh-only FBX Export

Action:

```text
Selected Ebee_Model_mod_geo only
Used File → Export Selection
Disabled Animation / Skins / Constraints
Imported into Blender
```

Result:

```text
Passed
Clean static Ebee mesh imported into Blender
No exploded rig
No controller balls
No giant spikes
```

This became the first usable web model.

### Attempt 3 — GLB Export

Action:

```text
Blender exported mesh-only Ebee as GLB
```

Initial output:

```text
Untitled.glb / ebee_avatar.glb
Approx. size: 140 MB
```

Result:

```text
Valid GLB
Too large for smooth React/Vite rendering
```

### Attempt 4 — GLB Optimization

Action:

```text
Opened GLB in Blender
Unpacked resources
Used Blender Python script to resize textures
Exported optimized GLB
```

Result:

```text
Size reduced from ~140 MB to ~50 MB
React/browser loading became usable
```

Current optimized GLB path used by frontend:

```text
C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\ebee_avatar.glb
```

Important:

```text
The GLB must be in public/avatar, not src/assets/avatar, for the current setup.
```

---

## 7. Frontend 3D Integration Completed

Installed packages:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm install three @react-three/fiber @react-three/drei
npm audit fix
```

New files created:

```text
frontend/src/components/Avatar3D.tsx
frontend/src/components/Avatar3D.css
```

New public asset folder:

```text
frontend/public/avatar/
```

Current GLB location:

```text
frontend/public/avatar/ebee_avatar.glb
```

The frontend now loads the 3D Ebee model successfully.

---

## 8. Vite / GLB Import Issue Fixed

Initial error:

```text
Failed to parse source for import analysis because the content contains invalid JS syntax.
Need assetsInclude or use public folder.
```

Cause:

```text
Vite tried to parse .glb as JavaScript when importing from src/assets.
```

Fix used:

```text
Moved GLB to public/avatar/ebee_avatar.glb
Used direct public path in Avatar3D.tsx:
const ebeeUrl = "/avatar/ebee_avatar.glb";
```

Confirmed:

```text
http://localhost:5173/avatar/ebee_avatar.glb
```

loads/downloads the GLB.

---

## 9. 3D Avatar Visible in UI

Confirmed:

```text
Ebee appears in the Hive portrait kiosk UI.
Model loads correctly.
Optimized 50 MB GLB works in browser.
```

Current visual result:

```text
Full Ebee body visible
Position and scale adjusted
READY status chip visible
Kiosk UI still works
```

Working scale/framing values tested:

```tsx
const targetSize = 1.0;   // fully visible but small
```

Recommended next size:

```tsx
const targetSize = 1.45;
// or
const targetSize = 1.55;
```

Recommended camera:

```tsx
camera={{ position: [0, 0.1, 4.5], fov: 34 }}
```

Recommended group position:

```tsx
<group ref={rootRef} position={[0, -0.38, 0]}>
```

---

## 10. Current 3D Movement Status

### What works

```text
Whole-avatar movement works
Idle floating works
Whole body bounce works
Whole body rotate/sway works
Speaking state can show mouth pulse overlay
Avatar state mapping from App.tsx works
```

### What does not work properly yet

```text
Head movement does not work correctly
Hand movement does not work correctly
Wing movement does not work correctly
Individual body part control is unreliable
```

### Why individual part movement failed

The current GLB is a **mesh-only export**.

That means:

```text
React can move the whole avatar.
React cannot naturally rotate head/arms/wings from correct pivots.
```

Although GLB object names exist, the pivot centers are not correct for natural movement.

Observed console names:

```text
Scene Group
Ebee_Model_mod_Body_geo Mesh
```

The GLB includes object names, but mesh pivots are not suitable for natural movement.

Conclusion:

```text
Code-based individual animation is not the correct final path for this model.
```

---

## 11. Important Decision Made

Stop forcing individual movement from mesh-only GLB.

Final decision:

```text
Use Maya rig to create/bake animations.
Export animation clips.
React plays animation clips.
```

Correct professional path:

```text
Original Maya rig
→ create idle/listening/thinking/speaking animations
→ bake animation
→ export FBX with skinned mesh/skeleton
→ test in Blender
→ export animated GLB
→ React AnimationMixer/useAnimations plays clips
```

This is the only reliable way to get:

```text
real head movement
real hand movement
real wing movement
proper body movement
speaking gesture movement
```

---

## 12. Current Avatar Architecture

Current temporary architecture:

```text
React Avatar3D
↓
Loads public/avatar/ebee_avatar.glb
↓
Moves whole avatar with useFrame()
↓
Displays state chip
↓
Displays fake robot mouth pulse while SPEAKING
```

Future final architecture:

```text
React Avatar3D
↓
Loads animated Ebee GLB
↓
useAnimations() reads clips:
  - idle
  - listening
  - thinking
  - speaking
↓
App.tsx avatar state controls clip switching
↓
TTS speaking triggers speaking clip + mouth pulse
```

---

## 13. Current Frontend File Changes

### App.tsx

Current avatar state type:

```tsx
type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "error";
```

3D state mapping added:

```tsx
const avatar3DState: Avatar3DState =
  avatarState === "listening"
    ? "LISTENING"
    : avatarState === "thinking"
      ? "THINKING"
      : avatarState === "speaking"
        ? "SPEAKING"
        : avatarState === "error"
          ? "NEEDS_REVIEW"
          : "READY";
```

Fallback switch added:

```tsx
const USE_3D_AVATAR = true;
```

Emergency rollback:

```tsx
const USE_3D_AVATAR = false;
```

This restores the original 2D avatar.

### Avatar3D.tsx

Current purpose:

```text
Load GLB
Auto-center model
Auto-scale model
Apply whole-avatar movement
Show status chip
Show mouth pulse while speaking
```

### Avatar3D.css

Current purpose:

```text
Contain canvas
Prevent 3D layer from swallowing full page
Style READY/LISTENING/THINKING/SPEAKING chip
Style mouth pulse overlay
```

---

## 14. Current Frontend File Structure

```text
frontend/
├─ public/
│  └─ avatar/
│     └─ ebee_avatar.glb
│
├─ src/
│  ├─ App.tsx
│  ├─ App.css
│  ├─ main.tsx
│  ├─ index.css
│  │
│  ├─ components/
│  │  ├─ Avatar2D.tsx
│  │  ├─ Avatar2D.css
│  │  ├─ Avatar3D.tsx
│  │  └─ Avatar3D.css
│  │
│  └─ assets/
│     ├─ hero-transparent.png
│     ├─ hive-scene-bg.png
│     └─ hero.png
│
├─ package.json
├─ package-lock.json
├─ vite.config.ts
└─ index.html
```

---

## 15. Current Recommended Runtime Mode

For final demo safety:

```tsx
const USE_3D_AVATAR = false;
```

Use 2D avatar if the final presentation is near and stability is the highest priority.

For continued 3D development:

```tsx
const USE_3D_AVATAR = true;
```

Use 3D avatar for testing and refinement.

---

## 16. Next Required Work — Proper Animated Ebee

### Priority 1 — Create Maya Animation Clips

Open:

```text
Ebee_Model_rig_New.mb
```

Create these animations:

```text
idle        frames 1–120
listening   frames 1–72
thinking    frames 1–72
speaking    frames 1–96
```

Recommended minimum movement:

#### idle

```text
Slight body breathing
Slight head turn
Small wing movement
Small hand movement
```

#### listening

```text
Head leans forward
Body slight forward pose
Small attentive hand/wing motion
```

#### thinking

```text
Head tilt
Body slow sway
One hand slight motion
```

#### speaking

```text
Head nod
Hands gesture lightly
Wings move faster
Body subtle bounce
```

---

## 17. Maya Beginner Animation Steps

### Set timeline

```text
Start frame: 1
End frame: 120
FPS: 24
```

### Create first idle animation

Frame 1:

```text
Select root/body control
Select head control
Select hand controls
Select wing controls if visible
Press S
```

Frame 40:

```text
Move body slightly up
Rotate head slightly left
Move hands slightly
Move wings slightly
Press S
```

Frame 80:

```text
Move body slightly down
Rotate head slightly right
Move hands opposite
Move wings opposite
Press S
```

Frame 120:

```text
Return close to frame 1 pose
Press S
```

Press play to preview.

Save as:

```text
ebee_idle_v1.mb
```

---

## 18. Correct Maya Export for Animated Version

The previous full rig export exploded. The next export must be more careful.

### Select

Select:

```text
Ebee_Model_mod_geo
DeformationSystem / Root_M / skeleton if visible
```

Avoid:

```text
NURBS curve controllers
yellow/blue/red controller curves
camera
light
extra panels
```

### Export

Use:

```text
File → Export Selection
```

Export as:

```text
C:\Users\jeysa\Desktop\Ebee_New\ebee_idle_anim.fbx
```

### FBX settings

```text
Geometry: ON
Smoothing Groups: ON
Smooth Mesh: ON

Animation: ON
Bake Animation: ON
Start: 1
End: 120

Deformed Models: ON
Skins: ON
Blend Shapes: ON

Constraints: OFF
Cameras: OFF
Lights: OFF
```

---

## 19. Blender Animated GLB Test

Open Blender.

Delete all:

```text
A
X
Delete
```

Import FBX:

```text
File → Import → FBX
```

Choose:

```text
ebee_idle_anim.fbx
```

Test:

```text
Press Play
```

Expected:

```text
Ebee moves with idle animation
No explosion
No controller spikes
No broken mesh
```

If it explodes:

```text
Wrong objects were exported from Maya
Need to adjust selection
```

If it works:

```text
File → Export → glTF 2.0
Format: GLB Binary
Animation: ON
Materials: Export
```

Export as:

```text
C:\Users\jeysa\Desktop\Ebee_New\ebee_animated_idle.glb
```

---

## 20. Future React Animation System

Once animated GLB is ready, React should use:

```text
useGLTF()
useAnimations()
AnimationAction.fadeIn()
AnimationAction.fadeOut()
```

Expected final React animation control:

```text
READY       → idle clip
LISTENING   → listening clip
THINKING    → thinking clip
SPEAKING    → speaking clip
NEEDS_REVIEW → thinking/error clip
```

---

## 21. Current Known Issues

### Issue 1 — 3D avatar only whole-body moves

Cause:

```text
Current GLB is mesh-only.
No usable rig/skeleton animation.
```

Status:

```text
Accepted limitation for temporary 3D version.
```

### Issue 2 — Individual React mesh movement not natural

Cause:

```text
Pivots are not located at shoulder/head/wing joints.
```

Status:

```text
Do not continue this path.
Use Maya baked animation instead.
```

### Issue 3 — 3D file size

Original:

```text
~140 MB
```

Optimized:

```text
~50 MB
```

Status:

```text
Acceptable for local FYP demo, but still heavy.
```

### Issue 4 — WebGL context lost

Seen in console during heavy/failed loads:

```text
THREE.WebGLRenderer: Context Lost.
```

Likely causes:

```text
large model
bad GLB request path
runtime error
heavy environment/light setup
```

Current mitigation:

```text
optimized GLB to 50 MB
removed Environment
kept dpr=1
used public/avatar path
```

---

## 22. Stable Demo Recommendation

If presentation is very soon, use:

```tsx
const USE_3D_AVATAR = false;
```

Reason:

```text
2D avatar is stable
Voice input/output works
Backend works
Kiosk UI works
3D avatar movement still under development
```

If showing 3D progress is required, use 3D as a technical extension:

```text
"Experimental 3D Ebee model has been integrated and loaded successfully.
Full realistic movement requires Maya rig animation export, which is identified as the next production step."
```

---

## 23. Recommended FYP Report Wording for 3D Avatar Work

```text
A 3D Ebee avatar model was integrated experimentally into the Hive kiosk frontend using React Three Fiber and Three.js. The original Maya rigged model was converted into a web-compatible GLB format and optimized from approximately 140 MB to 50 MB for browser rendering. The current implementation supports model loading, state-based whole-avatar motion, and a speaking-state mouth pulse overlay. Individual head, hand, and wing motion requires a future rigged animation export workflow from Maya, where animation clips are baked into the model and played in the frontend.
```

Do not claim full body-rig animation is completed yet.

---

## 24. Final Updated Status

```text
Core AI system: completed
Backend API: working
RAG/rule fallback: working
Voice input: working
Voice output: working
2D avatar: stable
3D avatar model export: completed
3D GLB optimization: completed
3D model frontend loading: completed
3D whole-avatar movement: partially working
3D individual body movement: not completed
Lip-sync: fake mouth pulse only
Proper realistic animation: requires Maya baked animation next
```

---

## 25. Immediate Next Action

Do this next:

```text
1. Keep 2D avatar as fallback.
2. Open original Maya rig file.
3. Create one simple idle animation using rig controls.
4. Export FBX with baked animation + skins.
5. Test FBX animation in Blender.
6. If successful, export animated GLB.
7. Then update React to play animation clips.
```

This is now the correct path for realistic Ebee movement.
