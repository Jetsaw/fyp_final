from __future__ import annotations

import argparse
from pathlib import Path

import maya.standalone


DEFAULT_SCENE = r"C:\Users\jeysa\Desktop\Ebee_New\Ebee_Model_rig_New.mb"
DEFAULT_OUTPUT = r"C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\ebee_new\ebee_new.fbx"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scene", default=DEFAULT_SCENE)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    maya.standalone.initialize(name="python")
    import maya.cmds as cmds
    import maya.mel as mel

    cmds.loadPlugin("fbxmaya", quiet=True)
    cmds.file(args.scene, open=True, force=True)

    mel.eval("FBXResetExport")
    mel.eval("FBXExportFileVersion -v FBX202000")
    mel.eval("FBXExportInAscii -v false")
    mel.eval("FBXExportSmoothingGroups -v true")
    mel.eval("FBXExportSmoothMesh -v true")
    mel.eval("FBXExportSkins -v true")
    mel.eval("FBXExportShapes -v false")
    mel.eval("FBXExportConstraints -v false")
    mel.eval("FBXExportCameras -v false")
    mel.eval("FBXExportLights -v false")
    mel.eval("FBXExportInputConnections -v true")
    mel.eval("FBXExportEmbeddedTextures -v false")

    export_roots = [node for node in ("|Group", "|Ebee_Model_mod_geo") if cmds.objExists(node)]
    if not export_roots:
        raise RuntimeError("Expected Ebee rig roots were not found in the Maya scene.")

    cmds.select(export_roots, replace=True)
    mel.eval(f'FBXExport -f "{output_path.as_posix()}" -s')

    print(f"exported {output_path}")
    maya.standalone.uninitialize()


if __name__ == "__main__":
    main()
