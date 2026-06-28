# Convert Rendered Frames to App Assets

After running `maya_prepare_exact_ebee_render.py` in Maya, render each state as a transparent PNG sequence under:

```text
C:\Users\jeysa\Desktop\Final Years\avatar_renders_exact
```

The frontend expects final files here:

```text
C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\exact
```

## Best Final Format

Convert each transparent PNG sequence into WebM with alpha:

```powershell
ffmpeg -framerate 24 -i "C:\Users\jeysa\Desktop\Final Years\avatar_renders_exact\idle\idle.%04d.png" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 "C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\exact\idle.webm"
ffmpeg -framerate 24 -i "C:\Users\jeysa\Desktop\Final Years\avatar_renders_exact\listening\listening.%04d.png" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 "C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\exact\listening.webm"
ffmpeg -framerate 24 -i "C:\Users\jeysa\Desktop\Final Years\avatar_renders_exact\thinking\thinking.%04d.png" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 "C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\exact\thinking.webm"
ffmpeg -framerate 24 -i "C:\Users\jeysa\Desktop\Final Years\avatar_renders_exact\speaking\speaking.%04d.png" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 "C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\exact\speaking.webm"
ffmpeg -framerate 24 -i "C:\Users\jeysa\Desktop\Final Years\avatar_renders_exact\error\error.%04d.png" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 "C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\exact\error.webm"
```

## Easier Interim Format

If WebM conversion is not ready, copy one transparent PNG frame per state:

```text
idle.png
listening.png
thinking.png
speaking.png
error.png
```

The app will use the PNG pose before falling back to the base static Ebee.

## Validate

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm run avatar:check
npm run avatar:ready
```

`avatar:ready` passes only when all five WebM loops exist.
