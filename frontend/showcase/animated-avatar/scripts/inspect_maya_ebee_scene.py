from __future__ import annotations

import json
import os
import sys

import maya.standalone


DEFAULT_SCENE = r"C:\Users\jeysa\Desktop\Ebee_New\Ebee_Model_rig_New.mb"
DEFAULT_OUTPUT = r"C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\exact\maya_scene_inspection.json"


def main() -> None:
    scene_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SCENE
    output_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_OUTPUT

    maya.standalone.initialize(name="python")

    import maya.cmds as cmds

    cmds.file(scene_path, open=True, force=True)

    meshes = cmds.ls(type="mesh", long=True) or []
    joints = cmds.ls(type="joint", long=True) or []
    cameras = cmds.ls(type="camera", long=True) or []
    transforms = cmds.ls(type="transform", long=True) or []
    nurbs_curves = cmds.ls(type="nurbsCurve", long=True) or []

    top_level = cmds.ls(assemblies=True, long=True) or []

    data = {
        "scene_path": scene_path,
        "mesh_count": len(meshes),
        "joint_count": len(joints),
        "camera_count": len(cameras),
        "transform_count": len(transforms),
        "nurbs_curve_count": len(nurbs_curves),
        "top_level": top_level[:80],
        "meshes": meshes[:120],
        "joints": joints[:120],
        "cameras": cameras,
        "nurbs_curves": nurbs_curves[:120],
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(json.dumps(data, indent=2))

    maya.standalone.uninitialize()


if __name__ == "__main__":
    main()
