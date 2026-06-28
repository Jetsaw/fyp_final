from __future__ import annotations

import argparse
import math
import os
import shutil
from pathlib import Path

import maya.standalone


DEFAULT_SCENE = r"C:\Users\jeysa\Desktop\Ebee_New\Ebee_Model_rig_New.mb"
DEFAULT_OUTPUT = r"C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\exact"

POSES = ("idle", "listening", "thinking", "speaking", "error")


def find_one(cmds, basename: str) -> str | None:
    matches = cmds.ls(basename, long=True) or []
    if matches:
        return matches[0]

    all_transforms = cmds.ls(type="transform", long=True) or []
    for transform in all_transforms:
        if transform.rsplit("|", 1)[-1] == basename:
            return transform
    return None


def find_deform(cmds, basename: str) -> str | None:
    for match in cmds.ls(basename, long=True) or []:
        if "|DeformationSystem|" in match:
            return match
    return find_one(cmds, basename)


def set_rotate(cmds, node: str | None, rx: float = 0, ry: float = 0, rz: float = 0) -> None:
    if not node:
        return
    for attr, value in (("rotateX", rx), ("rotateY", ry), ("rotateZ", rz)):
        plug = f"{node}.{attr}"
        if cmds.objExists(plug):
            try:
                cmds.setAttr(plug, value)
            except RuntimeError:
                pass


def set_translate(cmds, node: str | None, tx: float = 0, ty: float = 0, tz: float = 0) -> None:
    if not node:
        return
    for attr, value in (("translateX", tx), ("translateY", ty), ("translateZ", tz)):
        plug = f"{node}.{attr}"
        if cmds.objExists(plug):
            try:
                cmds.setAttr(plug, value)
            except RuntimeError:
                pass


def set_pivot(cmds, node: str | None, pivot: tuple[float, float, float]) -> None:
    if not node:
        return
    try:
        cmds.xform(node, worldSpace=True, rotatePivot=pivot, scalePivot=pivot)
    except RuntimeError:
        pass


def reset_controls(cmds, controls: dict[str, str | None]) -> None:
    for node in controls.values():
        if not node:
            continue
        set_rotate(cmds, node)
        set_translate(cmds, node)


def wave(value: float, amount: float) -> float:
    return math.sin(value * math.tau) * amount


def apply_pose(cmds, pose: str, controls: dict[str, str | None], phase: float = 0) -> None:
    reset_controls(cmds, controls)

    if pose == "idle":
        set_translate(cmds, controls["root"], 0, wave(phase, 0.035), 0)
        set_rotate(cmds, controls["head"], -2 + wave(phase, 2.4), wave(phase + 0.2, 2), wave(phase, 1.4))
        set_rotate(cmds, controls["shoulder_l"], 0, 0, -38 + wave(phase + 0.25, 3.4))
        set_rotate(cmds, controls["shoulder_r"], 0, 0, 38 - wave(phase + 0.25, 3.4))
        return

    if pose == "listening":
        set_translate(cmds, controls["root"], 0, wave(phase, 0.025), 0)
        set_rotate(cmds, controls["head"], -5 + wave(phase, 2), -8 + wave(phase + 0.1, 3), -6 + wave(phase, 2))
        set_rotate(cmds, controls["shoulder_l"], 0, 0, -44 + wave(phase, 2.5))
        set_rotate(cmds, controls["shoulder_r"], 0, -12, -58 + wave(phase, 7))
        return

    if pose == "thinking":
        set_translate(cmds, controls["root"], 0, wave(phase, 0.018), 0)
        set_rotate(cmds, controls["head"], 3 + wave(phase, 1.4), wave(phase + 0.15, 2), 8 + wave(phase, 1.8))
        set_rotate(cmds, controls["shoulder_r"], 0, 0, 42 + wave(phase + 0.2, 2.4))
        set_rotate(cmds, controls["shoulder_l"], 0, 16, -86 + wave(phase, 5))
        return

    if pose == "speaking":
        set_translate(cmds, controls["root"], 0, wave(phase, 0.03), 0)
        set_rotate(cmds, controls["head"], -4 + wave(phase, 2.2), 4 + wave(phase + 0.1, 2.5), wave(phase, 1.8))
        set_rotate(cmds, controls["shoulder_l"], 0, 0, -42 + wave(phase + 0.2, 2.2))
        set_rotate(cmds, controls["shoulder_r"], 0, -8, -122 + wave(phase, 22))
        return

    if pose == "error":
        set_translate(cmds, controls["root"], wave(phase * 3, 0.018), 0, 0)
        set_rotate(cmds, controls["head"], 8, wave(phase * 2, 2.5), -8 + wave(phase * 2, 2.5))
        set_rotate(cmds, controls["shoulder_l"], 0, -12, -68 + wave(phase * 2, 3.5))
        set_rotate(cmds, controls["shoulder_r"], 0, 12, 68 - wave(phase * 2, 3.5))


def create_portrait_setup(cmds, width: int, height: int) -> str:
    cmds.setAttr("defaultResolution.width", width)
    cmds.setAttr("defaultResolution.height", height)
    cmds.setAttr("defaultResolution.deviceAspectRatio", float(width) / float(height))
    cmds.setAttr("defaultRenderGlobals.imageFormat", 32)
    cmds.setAttr("defaultRenderGlobals.animation", 0)
    cmds.setAttr("defaultRenderGlobals.outFormatControl", 0)
    cmds.setAttr("defaultRenderGlobals.extensionPadding", 4)
    cmds.setAttr("defaultRenderGlobals.putFrameBeforeExt", 1)
    cmds.setAttr("defaultRenderGlobals.currentRenderer", "mayaSoftware", type="string")

    for attr, value in (
        ("defaultRenderQuality.edgeAntiAliasing", 1),
        ("defaultRenderQuality.shadingSamples", 2),
        ("defaultRenderQuality.maxShadingSamples", 8),
        ("defaultRenderQuality.useMultiPixelFilter", 1),
    ):
        if cmds.objExists(attr):
            try:
                cmds.setAttr(attr, value)
            except RuntimeError:
                pass

    camera_transform, camera_shape = cmds.camera(name="Hive_Ebee_Exact_Camera")
    bbox = cmds.exactWorldBoundingBox("|Ebee_Model_mod_geo")
    center_x = (bbox[0] + bbox[3]) / 2
    center_y = (bbox[1] + bbox[4]) / 2
    depth_front = max(abs(bbox[2]), abs(bbox[5]))
    cmds.setAttr(f"{camera_transform}.translateX", 0)
    cmds.setAttr(f"{camera_transform}.translateY", center_y + 0.08)
    cmds.setAttr(f"{camera_transform}.translateZ", depth_front + 16.5)
    cmds.setAttr(f"{camera_transform}.rotateX", -1)
    cmds.setAttr(f"{camera_transform}.rotateY", 0)
    cmds.setAttr(f"{camera_transform}.rotateZ", 0)
    cmds.setAttr(f"{camera_shape}.focalLength", 58)
    cmds.setAttr(f"{camera_shape}.verticalFilmAperture", 1.6)
    cmds.setAttr(f"{camera_shape}.horizontalFilmAperture", 0.9)
    cmds.setAttr(f"{camera_shape}.renderable", 1)

    locator = cmds.spaceLocator(name="Hive_Ebee_Exact_Camera_Target")[0]
    cmds.setAttr(f"{locator}.translateX", center_x)
    cmds.setAttr(f"{locator}.translateY", center_y + 0.08)
    cmds.setAttr(f"{locator}.translateZ", 0)
    constraint = cmds.aimConstraint(
        locator,
        camera_transform,
        aimVector=(0, 0, -1),
        upVector=(0, 1, 0),
        worldUpType="vector",
        worldUpVector=(0, 1, 0),
    )[0]
    cmds.delete(constraint, locator)

    for cam in cmds.ls(type="camera") or []:
        if cam != camera_shape:
            try:
                cmds.setAttr(f"{cam}.renderable", 0)
            except RuntimeError:
                pass

    key = cmds.directionalLight(name="Hive_Ebee_Key_Light", intensity=2.8)
    key_parent = cmds.listRelatives(key, parent=True, fullPath=True)[0]
    cmds.setAttr(f"{key_parent}.rotateX", -32)
    cmds.setAttr(f"{key_parent}.rotateY", 28)
    cmds.setAttr(f"{key_parent}.rotateZ", -18)

    fill = cmds.ambientLight(name="Hive_Ebee_Fill_Light", intensity=0.42)
    fill_parent = cmds.listRelatives(fill, parent=True, fullPath=True)[0]
    cmds.setAttr(f"{fill_parent}.translateY", 120)

    return camera_transform


def render_pose(cmds, camera: str, output_dir: Path, pose: str) -> Path:
    prefix = output_dir / pose
    cmds.setAttr("defaultRenderGlobals.imageFilePrefix", str(prefix).replace("\\", "/"), type="string")
    rendered = cmds.render(camera)
    expected = output_dir / f"{pose}.png"

    candidates = [Path(rendered)] if rendered else []
    candidates.extend(output_dir.glob(f"{pose}*.png"))
    for candidate in candidates:
        if candidate.exists():
            if candidate.resolve() != expected.resolve():
                shutil.copyfile(candidate, expected)
            return expected
    raise RuntimeError(f"Could not find rendered PNG for {pose}")


def render_sequence_frame(cmds, camera: str, output_dir: Path, pose: str, frame_index: int) -> Path:
    sequence_dir = output_dir / pose
    sequence_dir.mkdir(parents=True, exist_ok=True)
    frame_name = f"frame-{frame_index:02d}"
    prefix = sequence_dir / frame_name
    cmds.setAttr("defaultRenderGlobals.imageFilePrefix", str(prefix).replace("\\", "/"), type="string")
    rendered = cmds.render(camera)
    expected = sequence_dir / f"{frame_name}.png"

    candidates = [Path(rendered)] if rendered else []
    candidates.extend(sequence_dir.glob(f"{frame_name}*.png"))
    for candidate in candidates:
        if candidate.exists():
            if candidate.resolve() != expected.resolve():
                shutil.copyfile(candidate, expected)
            return expected
    raise RuntimeError(f"Could not find rendered sequence PNG for {pose} frame {frame_index}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scene", default=DEFAULT_SCENE)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    parser.add_argument("--width", type=int, default=840)
    parser.add_argument("--height", type=int, default=1188)
    parser.add_argument("--poses", nargs="+", choices=POSES, default=list(POSES))
    parser.add_argument("--sequence", action="store_true")
    parser.add_argument("--frames", type=int, default=8)
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    maya.standalone.initialize(name="python")
    import maya.cmds as cmds

    cmds.file(args.scene, open=True, force=True)

    controls = {
        "root": find_one(cmds, "Ebee_Model_mod_Ebee_mod_grp"),
        "chest": find_one(cmds, "Ebee_Model_mod_Body_grp"),
        "head": find_one(cmds, "Ebee_Model_mod_Head_grp"),
        "shoulder_l": find_one(cmds, "Ebee_Model_mod_L_Hand_grp"),
        "shoulder_r": find_one(cmds, "Ebee_Model_mod_R_Hand_grp"),
        "elbow_l": find_one(cmds, "Ebee_Model_mod_L_Palm_grp"),
        "elbow_r": find_one(cmds, "Ebee_Model_mod_R_Palm_grp"),
        "wrist_l": find_one(cmds, "Ebee_Model_mod_L_Palm_grp"),
        "wrist_r": find_one(cmds, "Ebee_Model_mod_R_Palm_grp"),
    }

    missing = [name for name, node in controls.items() if node is None]
    if missing:
        raise RuntimeError(f"Missing expected controls: {', '.join(missing)}")

    set_pivot(cmds, controls["head"], (0.0, 3.66, 0.07))
    set_pivot(cmds, controls["shoulder_l"], (0.23, 3.35, 0.05))
    set_pivot(cmds, controls["shoulder_r"], (-0.23, 3.35, 0.05))
    set_pivot(cmds, controls["elbow_l"], (0.82, 3.31, -0.11))
    set_pivot(cmds, controls["elbow_r"], (-0.82, 3.31, -0.11))

    camera = create_portrait_setup(cmds, args.width, args.height)

    for pose in args.poses:
        if args.sequence:
            for frame_index in range(args.frames):
                phase = frame_index / args.frames
                apply_pose(cmds, pose, controls, phase)
                cmds.currentTime(frame_index + 1)
                output = render_sequence_frame(cmds, camera, output_dir, pose, frame_index)
                print(f"rendered {pose} frame {frame_index:02d}: {output}")
        else:
            apply_pose(cmds, pose, controls)
            cmds.currentTime(1)
            output = render_pose(cmds, camera, output_dir, pose)
            print(f"rendered {pose}: {output}")

    maya.standalone.uninitialize()


if __name__ == "__main__":
    main()
