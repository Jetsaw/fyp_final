"""
Maya helper for preparing exact Ebee avatar renders for the Hive kiosk.

Usage:
1. Open the real rig:
   C:\\Users\\jeysa\\Desktop\\Ebee_New\\Ebee_Model_rig_New.mb
2. Open Maya Script Editor.
3. Paste/run this script in the Python tab.
4. Animate each state using the frame ranges below.
5. Render transparent PNG sequences, then convert them to WebM or copy still PNGs.

This script does not animate Ebee for you. It prepares consistent output folders,
camera framing, timeline ranges, and transparent render settings.
"""

from __future__ import annotations

import os

import maya.cmds as cmds


FRONTEND_EXACT_DIR = r"C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\exact"
RENDER_ROOT = r"C:\Users\jeysa\Desktop\Final Years\avatar_renders_exact"

STATE_RANGES = {
    "idle": (1, 120),
    "listening": (130, 210),
    "thinking": (220, 300),
    "speaking": (310, 430),
    "error": (440, 500),
}


def ensure_dir(path: str) -> None:
    if not os.path.exists(path):
        os.makedirs(path)


def setup_camera() -> str:
    camera_name = "Hive_Ebee_Portrait_Camera"
    if not cmds.objExists(camera_name):
        camera_transform, _ = cmds.camera(name=camera_name)
    else:
        camera_transform = camera_name

    cmds.setAttr(f"{camera_transform}.translateX", 0)
    cmds.setAttr(f"{camera_transform}.translateY", 5.2)
    cmds.setAttr(f"{camera_transform}.translateZ", 13.5)
    cmds.setAttr(f"{camera_transform}.rotateX", -8)
    cmds.setAttr(f"{camera_transform}.rotateY", 0)
    cmds.setAttr(f"{camera_transform}.rotateZ", 0)

    shape = cmds.listRelatives(camera_transform, shapes=True, fullPath=True)[0]
    cmds.setAttr(f"{shape}.focalLength", 55)
    cmds.setAttr(f"{shape}.verticalFilmAperture", 1.35)
    cmds.lookThru(camera_transform)
    return camera_transform


def setup_render_settings() -> None:
    cmds.setAttr("defaultResolution.width", 1080)
    cmds.setAttr("defaultResolution.height", 1920)
    cmds.setAttr("defaultResolution.deviceAspectRatio", 1080 / 1920)

    cmds.setAttr("defaultRenderGlobals.imageFormat", 32)  # PNG
    cmds.setAttr("defaultRenderGlobals.animation", 1)
    cmds.setAttr("defaultRenderGlobals.extensionPadding", 4)
    cmds.setAttr("defaultRenderGlobals.putFrameBeforeExt", 1)

    # Transparent background for PNG sequences.
    if cmds.objExists("defaultArnoldRenderOptions"):
        cmds.setAttr("defaultArnoldRenderOptions.background", 0)
    for attr in ("defaultRenderGlobals.enableDefaultLight",):
        if cmds.objExists(attr):
            try:
                cmds.setAttr(attr, 1)
            except Exception:
                pass

    if cmds.objExists("defaultRenderGlobals"):
        cmds.setAttr("defaultRenderGlobals.currentRenderer", "arnold", type="string")


def create_output_folders() -> None:
    ensure_dir(RENDER_ROOT)
    ensure_dir(FRONTEND_EXACT_DIR)
    for state in STATE_RANGES:
        ensure_dir(os.path.join(RENDER_ROOT, state))


def set_state_range(state: str) -> None:
    start, end = STATE_RANGES[state]
    cmds.playbackOptions(min=start, max=end, animationStartTime=start, animationEndTime=end)
    cmds.currentTime(start)
    cmds.setAttr("defaultRenderGlobals.startFrame", start)
    cmds.setAttr("defaultRenderGlobals.endFrame", end)
    cmds.setAttr("defaultRenderGlobals.byFrameStep", 1)
    cmds.workspace(fileRule=["images", os.path.join(RENDER_ROOT, state)])
    cmds.setAttr("defaultRenderGlobals.imageFilePrefix", f"{state}/{state}", type="string")


def print_instructions(camera_name: str) -> None:
    print("\nHive exact Ebee render setup complete.")
    print(f"Camera: {camera_name}")
    print(f"Render root: {RENDER_ROOT}")
    print(f"Frontend exact folder: {FRONTEND_EXACT_DIR}")
    print("\nState frame ranges:")
    for state, (start, end) in STATE_RANGES.items():
        print(f"- {state}: frames {start}-{end}")
    print("\nRun set_state_range('idle'), set_state_range('listening'), etc. before rendering each sequence.")
    print("After rendering, convert each PNG sequence to:")
    for state in STATE_RANGES:
        print(f"- {os.path.join(FRONTEND_EXACT_DIR, state + '.webm')}")
    print("\nIf WebM export is not ready, save a transparent still pose as:")
    for state in STATE_RANGES:
        print(f"- {os.path.join(FRONTEND_EXACT_DIR, state + '.png')}")


def main() -> None:
    create_output_folders()
    camera_name = setup_camera()
    setup_render_settings()
    set_state_range("idle")
    print_instructions(camera_name)


main()
