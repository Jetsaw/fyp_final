# FYP Master Backup And Cleanup Report

Date: 2026-06-10  
Project: `C:\Users\jeysa\Desktop\Final Years`

## Summary

A full backup was created first, then the working project was cleaned. The next-version UI now uses the generated-video avatar path, while the previous live animated/AI4Animation avatar system was moved into a standalone showcase folder.

## Backup

Backup location:

```text
D:\fyp master backup
```

Backup contents:

```text
D:\fyp master backup\Final Years
D:\fyp master backup\wsl\fyp-unsloth.tar.gz
```

Verified backup sizes:

| Backup Item | Size |
| --- | ---: |
| Windows project backup | 3.647 GB |
| WSL project archive | 15.073 GB |

The WSL backup archive contains the active WSL project:

```text
Ubuntu-24.04:/home/jet/fyp-unsloth
```

## Working Project After Cleanup

Current working project:

```text
C:\Users\jeysa\Desktop\Final Years
```

Final checked size:

| Item | Size |
| --- | ---: |
| Full working project | 0.463 GB |
| Frontend | 0.458 GB |
| Animated avatar showcase | 0.335 GB |
| Backend | 0.005 GB |

## Main UI Change

The main UI was changed from the live rigged avatar system to the generated-video avatar path.

Main app now uses:

```text
frontend\src\components\AvatarExact.tsx
frontend\src\components\AvatarExact.css
frontend\public\avatar\exact
```

The main app no longer references:

```text
RiggedEbeeAvatar
Avatar3D
ebeeRigController
@react-three
three
frontend\public\avatar\ebee_new
```

## Animated Avatar Showcase

The live animated/AI4Animation avatar system was moved to:

```text
frontend\showcase\animated-avatar
```

Moved showcase contents include:

```text
frontend\showcase\animated-avatar\src\components\RiggedEbeeAvatar.tsx
frontend\showcase\animated-avatar\src\components\ebeeRigController.ts
frontend\showcase\animated-avatar\src\components\Avatar3D.tsx
frontend\showcase\animated-avatar\src\components\Avatar3D.css
frontend\showcase\animated-avatar\public\avatar\ebee_new
frontend\showcase\animated-avatar\public\avatar\ebee_avatar.glb
frontend\showcase\animated-avatar\scripts
frontend\showcase\animated-avatar\tools\ai4animation
frontend\showcase\animated-avatar\docs\AVATAR_AI4ANIMATION_HANDOFF.md
```

A showcase README was added:

```text
frontend\showcase\animated-avatar\README.md
```

## Removed From Working Project

Generated/runtime clutter removed:

```text
frontend\artifacts
frontend\dist
frontend\node_modules
frontend\avatar-pipeline-latest.log
frontend\vite-dev-5174.log
frontend\vite-dev-5174.err.log
.dist
frontend\output
```

Backend cleanup removed:

```text
hive-backend\test-results
hive-backend\test_results_extended.json
hive-backend\app\**\__pycache__
hive-backend\data\sessions\test/debug/final/ali session JSON files
```

## WSL Cleanup

Active WSL project:

```text
Ubuntu-24.04:/home/jet/fyp-unsloth
```

WSL size before cleanup:

```text
about 23 GB
```

WSL size after cleanup:

```text
9.5 GB
```

Kept:

```text
/home/jet/fyp-unsloth/app
/home/jet/fyp-unsloth/scripts
/home/jet/fyp-unsloth/data
/home/jet/fyp-unsloth/.env
/home/jet/fyp-unsloth/.venv
/home/jet/fyp-unsloth/outputs/qwen35_2b_lora_out_v17
/home/jet/fyp-unsloth/qwen35_2b_lora_out_v17.tar.gz
```

Removed old WSL model output folders:

```text
qwen35_2b_lora_out_base
qwen35_2b_lora_out_v4
qwen35_2b_lora_out_v5
qwen35_2b_lora_out_v6
qwen35_2b_lora_out_v7
qwen35_2b_lora_out_v8
qwen35_2b_lora_out_v9
qwen35_2b_lora_out_v9_1
qwen35_2b_lora_out_v10
qwen35_2b_lora_out_v11
qwen35_2b_lora_out_v12
qwen35_2b_lora_out_v13
qwen35_2b_lora_out_v14
qwen35_2b_lora_out_v15
qwen35_2b_lora_out_v16
```

Only this model output remains:

```text
qwen35_2b_lora_out_v17
```

## Path Fixes

Old backend paths pointing to:

```text
C:\Users\jeysa\Desktop\Hive
```

were updated to:

```text
C:\Users\jeysa\Desktop\Final Years\hive-backend
```

Updated files included:

```text
frontend\README.md
frontend\scripts\generate-course-knowledge.mjs
frontend\scripts\apply-backend-rag-patch.ps1
frontend\scripts\check-backend-rag-patch-status.ps1
frontend\scripts\restore-backend-rag-patch.ps1
frontend\scripts\start-commercial-kiosk.ps1
frontend\scripts\start-hive-backend-docker.ps1
```

## Verification

Passed:

```powershell
npm install
npm run build
npm run course:validate
```

`npm install` result:

```text
153 packages installed
0 vulnerabilities
```

`npm run build` result:

```text
TypeScript build passed
Vite production build passed
```

`npm run course:validate` result:

```text
Course knowledge validation passed
Programmes: 2
- Applied AI: 9 terms
- Intelligent Robotics: 9 terms
```

Live frontend checks:

```text
http://127.0.0.1:5174/                     OK 200
http://127.0.0.1:5174/avatar/exact/idle.png OK 200
```

`npm run kiosk:check` result:

```text
Frontend ready: yes
Backend ready: no
```

Backend readiness was `no` because no backend server was running at the time of the check.

## Current Dev Server

Frontend dev server was started and verified at:

```text
http://127.0.0.1:5174/
```

## Notes

- The backup was verified before cleanup.
- The generated `frontend\dist` folder was removed again after build verification.
- The main UI is now prepared for generated `.webm` avatar loops under:

```text
frontend\public\avatar\exact
```

