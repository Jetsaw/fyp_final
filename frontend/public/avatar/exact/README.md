# Exact Ebee Avatar Assets

Place transparent Ebee assets in this folder to make the kiosk avatar look exactly like the source model.

For step-by-step export settings, see `EXPORT_GUIDE.md`.

For the source files found on this machine, see `SOURCE_ASSETS_FOUND.md`.

For a Maya setup helper, see `maya_prepare_exact_ebee_render.py`.

For the automated Maya pose and sequence renderer, see `frontend/scripts/render_maya_ebee_poses.py`.

For PNG-to-WebM conversion commands, see `CONVERT_RENDERED_FRAMES.md`.

Final moving-avatar files:

```text
idle.webm
listening.webm
thinking.webm
speaking.webm
error.webm
```

Final moving-avatar PNG sequence fallback:

```text
idle/frame-00.png ... idle/frame-07.png
listening/frame-00.png ... listening/frame-07.png
thinking/frame-00.png ... thinking/frame-07.png
speaking/frame-00.png ... speaking/frame-07.png
error/frame-00.png ... error/frame-07.png
```

Optional exact pose files:

```text
idle.png
listening.png
thinking.png
speaking.png
error.png
```

Recommended export:

```text
Format: WebM with alpha / transparency
Resolution: 1080x1920 for portrait kiosk, or at least 720x1280
Background: transparent
Framing: full-body Ebee centered, feet near bottom safe area
Looping: seamless where possible
```

Behavior:

```text
READY       -> idle.webm
LISTENING   -> listening.webm
THINKING    -> thinking.webm
SPEAKING    -> speaking.webm
NEEDS_REVIEW -> error.webm
```

Fallback order:

```text
1. state WebM loop in this folder
2. state PNG frame sequence in this folder
3. state PNG pose in this folder
4. base exact Ebee PNG at src/assets/ebee-exact-transparent.png
```

Runtime QA:

```text
AvatarExact sets data-asset-mode="video", "sequence", "pose", or "base"
AvatarExact sets data-avatar-state="idle", "listening", "thinking", "speaking", or "error"
```

Use these attributes in browser dev tools when checking which exact avatar asset is currently displayed.

Check assets:

```powershell
npm run avatar:check
```

This verifies alpha transparency and reports WebM, PNG sequence, and still-pose availability.

Check final readiness:

```powershell
npm run avatar:ready
```

This passes when each state has either a transparent WebM loop or a complete transparent PNG frame sequence.
