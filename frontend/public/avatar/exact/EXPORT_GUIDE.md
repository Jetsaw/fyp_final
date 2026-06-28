# Export Guide: Exact Moving Ebee

The frontend is already wired to show exact Ebee motion if transparent video loops are placed in this folder. Use this guide when exporting from the real Maya Ebee model.

Known source files on this machine are listed in `SOURCE_ASSETS_FOUND.md`.

Maya setup helper:

```text
maya_prepare_exact_ebee_render.py
```

Frame conversion commands:

```text
CONVERT_RENDERED_FRAMES.md
```

Automated exact Ebee renderer:

```text
frontend/scripts/render_maya_ebee_poses.py
```

Recommended source file:

```text
C:\Users\jeysa\Desktop\Ebee_New\Ebee_Model_rig_New.mb
```

## Best Final Output Files

Export these exact filenames into:

```text
C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\exact
```

```text
idle.webm
listening.webm
thinking.webm
speaking.webm
error.webm
```

If `ffmpeg` or transparent WebM export is not available, the app also accepts transparent PNG frame sequences as final moving assets:

```text
idle/frame-00.png ... idle/frame-07.png
listening/frame-00.png ... listening/frame-07.png
thinking/frame-00.png ... thinking/frame-07.png
speaking/frame-00.png ... speaking/frame-07.png
error/frame-00.png ... error/frame-07.png
```

Generate the current Maya-rendered sequence pack with:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
& "C:\Program Files\Autodesk\Maya2027\bin\mayapy.exe" ".\scripts\render_maya_ebee_poses.py" --sequence --frames 8
```

## Easier Interim Output Files

If transparent WebM loops are too slow to produce, export transparent PNG still poses first:

```text
idle.png
listening.png
thinking.png
speaking.png
error.png
```

This will not give full joint motion, but it lets the kiosk show exact Ebee state poses from the real model instead of using one repeated static fallback.

Generate the still pose PNGs with:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
& "C:\Program Files\Autodesk\Maya2027\bin\mayapy.exe" ".\scripts\render_maya_ebee_poses.py"
```

## Recommended Animations

```text
idle.webm
- 4 to 6 seconds
- subtle breathing
- small head movement
- small wing motion

listening.webm
- 3 to 4 seconds
- lean forward
- attentive head movement
- light wing movement

thinking.webm
- 3 to 4 seconds
- head tilt
- slow sway
- slight hand movement

speaking.webm
- 4 to 6 seconds
- head nod
- hand gesture
- wing movement
- mouth/face pulse if available

error.webm
- 2 to 3 seconds
- small confused shake
- then return to neutral
```

## Render Settings

```text
Format: WebM for loops, PNG for still poses
Alpha: enabled / transparent background
Resolution: 1080x1920 preferred, 720x1280 minimum
Framing: full-body Ebee centered
Feet: near bottom safe area, not cropped
Camera: locked front-facing portrait view
Lighting: same across all loops
Looping: seamless for idle, listening, thinking, speaking
```

If WebM alpha export is not available directly from the 3D tool, render PNG sequence with transparent background, then convert to WebM with alpha.

## App Behavior

The frontend maps states like this:

```text
READY        -> idle.webm
LISTENING    -> listening.webm
THINKING     -> thinking.webm
SPEAKING     -> speaking.webm
NEEDS_REVIEW -> error.webm
```

If a video is missing, the app tries the same state PNG sequence:

```text
READY        -> idle/frame-00.png ... frame-07.png
LISTENING    -> listening/frame-00.png ... frame-07.png
THINKING     -> thinking/frame-00.png ... frame-07.png
SPEAKING     -> speaking/frame-00.png ... frame-07.png
NEEDS_REVIEW -> error/frame-00.png ... frame-07.png
```

If the sequence is missing, the app tries the same state PNG pose:

```text
READY        -> idle.png
LISTENING    -> listening.png
THINKING     -> thinking.png
SPEAKING     -> speaking.png
NEEDS_REVIEW -> error.png
```

If the state PNG is also missing, the app uses:

```text
src/assets/ebee-exact-transparent.png
```

## Validation

After placing the files, run:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm run avatar:check
```

Expected final result:

```text
idle: 8/8 transparent frames found
listening: 8/8 transparent frames found
thinking: 8/8 transparent frames found
speaking: 8/8 transparent frames found
error: 8/8 transparent frames found
```
