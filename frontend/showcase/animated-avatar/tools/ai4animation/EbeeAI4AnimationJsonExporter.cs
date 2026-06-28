#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;

public class EbeeAI4AnimationJsonExporter : EditorWindow {
    private enum EbeeState {
        READY,
        LISTENING,
        THINKING,
        SPEAKING,
        NEEDS_REVIEW
    }

    private class RigMapIndex {
        public Dictionary<string, string> PathToGroup = new Dictionary<string, string>();
        public Dictionary<string, string> UniqueSuffixToPath = new Dictionary<string, string>();
        public HashSet<string> AmbiguousSuffixes = new HashSet<string>();
    }

    private MotionEditor editor;
    private TextAsset rigMapJson;
    private EbeeState state = EbeeState.SPEAKING;
    private string outputPath = "Assets/../DeepLearning/ebee_ai4animation_export.json";
    private float exportFramerate = 30f;
    private int maxFramesPerSequence = 240;
    private int minimumNodePoseCoverage = 637;
    private bool selectedSequenceOnly = false;

    private static readonly string[] JointGroups = new string[] {
        "root", "spine", "chest", "neck", "head", "facePlate", "antenna",
        "shoulderL", "elbowL", "wristL", "fingersL",
        "shoulderR", "elbowR", "wristR", "fingersR",
        "hipL", "kneeL", "ankleL", "toesL",
        "hipR", "kneeR", "ankleR", "toesR",
        "wingL", "wingR", "tail"
    };

    [MenuItem("AI4Animation/Exporter/Ebee JSON Runtime Exporter")]
    private static void Open() {
        GetWindow<EbeeAI4AnimationJsonExporter>("Ebee JSON Exporter");
    }

    private void OnGUI() {
        editor = (MotionEditor)EditorGUILayout.ObjectField("Motion Editor", editor, typeof(MotionEditor), true);
        rigMapJson = (TextAsset)EditorGUILayout.ObjectField("Ebee Rig Map JSON", rigMapJson, typeof(TextAsset), false);
        state = (EbeeState)EditorGUILayout.EnumPopup("State", state);
        outputPath = EditorGUILayout.TextField("Output JSON", outputPath);
        exportFramerate = Mathf.Max(1f, EditorGUILayout.FloatField("Export Framerate", exportFramerate));
        maxFramesPerSequence = Mathf.Max(12, EditorGUILayout.IntField("Max Frames / Sequence", maxFramesPerSequence));
        minimumNodePoseCoverage = Mathf.Max(1, EditorGUILayout.IntField("Minimum NodePose Coverage", minimumNodePoseCoverage));
        selectedSequenceOnly = EditorGUILayout.Toggle("Selected Sequence Only", selectedSequenceOnly);

        EditorGUI.BeginDisabledGroup(editor == null || rigMapJson == null);
        if (GUILayout.Button("Export Current AI4Animation Asset")) {
            Export();
        }
        EditorGUI.EndDisabledGroup();
    }

    private void Export() {
        MotionData data = editor.GetAsset();
        if (data == null) {
            throw new InvalidOperationException("MotionEditor has no active MotionData asset.");
        }

        Actor actor = editor.GetActor();
        if (actor == null) {
            throw new InvalidOperationException("MotionEditor has no Actor in the active scene.");
        }

        RigMapIndex rigMap = ParseRigMapGroups(rigMapJson.text);
        if (rigMap.PathToGroup.Count < minimumNodePoseCoverage) {
            throw new InvalidOperationException(
                "Rig map contains only " + rigMap.PathToGroup.Count + " paths, below required coverage " + minimumNodePoseCoverage + "."
            );
        }

        string absoluteOutputPath = Path.GetFullPath(outputPath);
        Directory.CreateDirectory(Path.GetDirectoryName(absoluteOutputPath));

        StringBuilder json = new StringBuilder(1024 * 1024);
        json.AppendLine("{");
        WriteProperty(json, 1, "schema", "ai4animation-motion-export/v1", true);
        WriteProperty(json, 1, "source", "sebastianstarke/AI4Animation MotionEditor", true);
        WriteProperty(json, 1, "avatar", "Ebee", true);
        WriteProperty(json, 1, "state", state.ToString(), true);
        json.AppendLine(Indent(1) + "\"nodePose\": {");
        WriteProperty(json, 2, "rigMapPathCount", rigMap.PathToGroup.Count, true);
        WriteProperty(json, 2, "minimumCoverage", minimumNodePoseCoverage, false);
        json.AppendLine(Indent(1) + "},");
        json.AppendLine(Indent(1) + "\"clips\": [");
        json.AppendLine(Indent(2) + "{");
        WriteProperty(json, 3, "name", data.GetName(), true);
        WriteProperty(json, 3, "state", state.ToString(), true);
        json.AppendLine(Indent(3) + "\"frames\": [");

        int written = 0;
        Sequence[] sequences = data.Sequences ?? new Sequence[0];
        for (int sequenceIndex = 0; sequenceIndex < sequences.Length; sequenceIndex++) {
            if (selectedSequenceOnly && sequenceIndex != 0) {
                continue;
            }

            Sequence sequence = sequences[sequenceIndex];
            float start = data.GetFrame(sequence.Start).Timestamp;
            float end = data.GetFrame(sequence.End).Timestamp;
            float step = 1f / exportFramerate;
            int frameIndex = 0;

            for (float timestamp = start; timestamp <= end && frameIndex < maxFramesPerSequence; timestamp += step) {
                editor.LoadFrame(timestamp);
                if (written > 0) {
                    json.AppendLine(",");
                }
                int nodePoseCount = WriteFrame(json, actor, rigMap, data.GetName(), sequenceIndex, written, timestamp - start);
                if (nodePoseCount < minimumNodePoseCoverage) {
                    throw new InvalidOperationException(
                        "Frame " + written + " produced only " + nodePoseCount + " nodePose entries, below required coverage " + minimumNodePoseCoverage + ". " +
                        "Check that the AI4Animation scene hierarchy matches Ebee rig-map paths."
                    );
                }
                written += 1;
                frameIndex += 1;
            }
        }

        json.AppendLine();
        json.AppendLine(Indent(3) + "]");
        json.AppendLine(Indent(2) + "}");
        json.AppendLine(Indent(1) + "]");
        json.AppendLine("}");

        File.WriteAllText(absoluteOutputPath, json.ToString());
        AssetDatabase.Refresh();
        Debug.Log("Exported Ebee AI4Animation JSON frames: " + written + " -> " + absoluteOutputPath);
    }

    private int WriteFrame(
        StringBuilder json,
        Actor actor,
        RigMapIndex rigMap,
        string clipName,
        int sequenceIndex,
        int frameIndex,
        float time
    ) {
        Dictionary<string, List<Vector3>> jointRotations = new Dictionary<string, List<Vector3>>();

        json.AppendLine(Indent(4) + "{");
        WriteProperty(json, 5, "id", clipName + "-" + state + "-" + sequenceIndex.ToString("000") + "-" + frameIndex.ToString("0000"), true);
        WriteProperty(json, 5, "state", state.ToString(), true);
        WriteProperty(json, 5, "time", Round(time), true);
        WriteControls(json, 5);
        WritePhases(json, 5);
        WriteTrajectory(json, 5);

        json.AppendLine(Indent(5) + "\"nodePose\": {");
        int nodeCount = 0;
        foreach (Transform transform in EnumerateTransforms(actor.GetRoot())) {
            string nodePath = ResolveContractPath(transform, rigMap);
            if (string.IsNullOrEmpty(nodePath) || !rigMap.PathToGroup.TryGetValue(nodePath, out string group)) {
                continue;
            }

            Vector3 radians = ToSignedRadians(transform.localEulerAngles);
            if (!jointRotations.ContainsKey(group)) {
                jointRotations[group] = new List<Vector3>();
            }
            jointRotations[group].Add(radians);

            if (nodeCount > 0) {
                json.AppendLine(",");
            }
            json.Append(Indent(6));
            WriteJsonString(json, nodePath);
            json.Append(": ");
            WriteVector3(json, radians);
            nodeCount += 1;
        }
        json.AppendLine();
        json.AppendLine(Indent(5) + "},");

        json.AppendLine(Indent(5) + "\"joints\": {");
        for (int index = 0; index < JointGroups.Length; index++) {
            string group = JointGroups[index];
            Vector3 average = Average(jointRotations.ContainsKey(group) ? jointRotations[group] : null);
            json.Append(Indent(6));
            WriteJsonString(json, group);
            json.Append(": ");
            WriteVector3(json, average);
            json.AppendLine(index < JointGroups.Length - 1 ? "," : "");
        }
        json.AppendLine(Indent(5) + "}");
        json.Append(Indent(4) + "}");
        return nodeCount;
    }

    private IEnumerable<Transform> EnumerateTransforms(Transform root) {
        if (root == null) {
            yield break;
        }

        Stack<Transform> stack = new Stack<Transform>();
        stack.Push(root);
        while (stack.Count > 0) {
            Transform current = stack.Pop();
            yield return current;
            for (int child = current.childCount - 1; child >= 0; child--) {
                stack.Push(current.GetChild(child));
            }
        }
    }

    private void WriteControls(StringBuilder json, int depth) {
        json.AppendLine(Indent(depth) + "\"controls\": {");
        WriteProperty(json, depth + 1, "facing", 0f, true);
        WriteProperty(json, depth + 1, "energy", state == EbeeState.SPEAKING ? 0.9f : 0.62f, true);
        WriteProperty(json, depth + 1, "gesture", state == EbeeState.SPEAKING ? 1f : 0.35f, true);
        WriteProperty(json, depth + 1, "attention", state == EbeeState.READY ? 0.45f : 0.85f, true);
        WriteProperty(json, depth + 1, "step", 0.2f, false);
        json.AppendLine(Indent(depth) + "},");
    }

    private void WritePhases(StringBuilder json, int depth) {
        string[] channels = new string[] {"spine", "head", "arms", "legs", "wings", "tail"};
        json.AppendLine(Indent(depth) + "\"localPhases\": {");
        for (int index = 0; index < channels.Length; index++) {
            json.Append(Indent(depth + 1));
            WriteJsonString(json, channels[index]);
            json.Append(": {\"sin\": 0, \"cos\": 1, \"amplitude\": 1}");
            json.AppendLine(index < channels.Length - 1 ? "," : "");
        }
        json.AppendLine(Indent(depth) + "},");
    }

    private void WriteTrajectory(StringBuilder json, int depth) {
        float[] times = new float[] {-0.25f, 0f, 0.35f, 0.7f, 1.05f};
        json.AppendLine(Indent(depth) + "\"trajectory\": [");
        for (int index = 0; index < times.Length; index++) {
            float z = Mathf.Max(0f, times[index]) * 0.22f;
            json.Append(Indent(depth + 1));
            json.Append("{\"time\": ");
            json.Append(Round(times[index]));
            json.Append(", \"position\": [0, ");
            json.Append(Round(z));
            json.Append("], \"direction\": [0, 1]}");
            json.AppendLine(index < times.Length - 1 ? "," : "");
        }
        json.AppendLine(Indent(depth) + "],");
    }

    private RigMapIndex ParseRigMapGroups(string json) {
        RigMapIndex index = new RigMapIndex();
        foreach (string group in JointGroups) {
            string marker = "\"" + group + "\"";
            int groupIndex = json.IndexOf(marker, StringComparison.Ordinal);
            if (groupIndex < 0) {
                continue;
            }

            int nextGroupIndex = int.MaxValue;
            foreach (string other in JointGroups) {
                if (other == group) {
                    continue;
                }
                int otherIndex = json.IndexOf("\"" + other + "\"", groupIndex + marker.Length, StringComparison.Ordinal);
                if (otherIndex > groupIndex && otherIndex < nextGroupIndex) {
                    nextGroupIndex = otherIndex;
                }
            }

            string section = json.Substring(groupIndex, (nextGroupIndex == int.MaxValue ? json.Length : nextGroupIndex) - groupIndex);
            int search = 0;
            while (true) {
                int pathKey = section.IndexOf("\"path\"", search, StringComparison.Ordinal);
                if (pathKey < 0) {
                    break;
                }

                int colon = section.IndexOf(":", pathKey, StringComparison.Ordinal);
                int firstQuote = section.IndexOf("\"", colon + 1, StringComparison.Ordinal);
                int secondQuote = section.IndexOf("\"", firstQuote + 1, StringComparison.Ordinal);
                if (colon < 0 || firstQuote < 0 || secondQuote < 0) {
                    break;
                }

                string path = section.Substring(firstQuote + 1, secondQuote - firstQuote - 1);
                if (!index.PathToGroup.ContainsKey(path)) {
                    index.PathToGroup.Add(path, group);
                    RegisterSuffixes(index, path);
                }
                search = secondQuote + 1;
            }
        }
        return index;
    }

    private void RegisterSuffixes(RigMapIndex index, string path) {
        string[] parts = path.Split('/');
        for (int start = 0; start < parts.Length; start++) {
            string suffix = string.Join("/", parts, start, parts.Length - start);
            if (index.AmbiguousSuffixes.Contains(suffix)) {
                continue;
            }
            if (index.UniqueSuffixToPath.ContainsKey(suffix)) {
                index.UniqueSuffixToPath.Remove(suffix);
                index.AmbiguousSuffixes.Add(suffix);
            } else {
                index.UniqueSuffixToPath.Add(suffix, path);
            }
        }
    }

    private string ResolveContractPath(Transform transform, RigMapIndex rigMap) {
        string exact = GetContractPath(transform);
        if (rigMap.PathToGroup.ContainsKey(exact)) {
            return exact;
        }

        List<string> localParts = GetTransformPathParts(transform);
        for (int start = 0; start < localParts.Count; start++) {
            string suffix = string.Join("/", localParts.ToArray(), start, localParts.Count - start);
            if (rigMap.UniqueSuffixToPath.TryGetValue(suffix, out string matchedPath)) {
                return matchedPath;
            }
        }

        return null;
    }

    private string GetContractPath(Transform transform) {
        List<string> parts = GetTransformPathParts(transform);
        int groupIndex = parts.IndexOf("Group");
        if (groupIndex > 0) {
            parts.RemoveRange(0, groupIndex);
        }
        return string.Join("/", parts.ToArray());
    }

    private List<string> GetTransformPathParts(Transform transform) {
        List<string> parts = new List<string>();
        Transform current = transform;
        while (current != null) {
            if (!string.IsNullOrEmpty(current.name)) {
                parts.Add(current.name);
            }
            current = current.parent;
        }
        parts.Reverse();
        return parts;
    }

    private static Vector3 ToSignedRadians(Vector3 eulerDegrees) {
        return new Vector3(
            Mathf.Deg2Rad * Mathf.DeltaAngle(0f, eulerDegrees.x),
            Mathf.Deg2Rad * Mathf.DeltaAngle(0f, eulerDegrees.y),
            Mathf.Deg2Rad * Mathf.DeltaAngle(0f, eulerDegrees.z)
        );
    }

    private static Vector3 Average(List<Vector3> values) {
        if (values == null || values.Count == 0) {
            return Vector3.zero;
        }

        Vector3 sum = Vector3.zero;
        foreach (Vector3 value in values) {
            sum += value;
        }
        return sum / values.Count;
    }

    private static void WriteProperty(StringBuilder json, int depth, string key, string value, bool comma) {
        json.Append(Indent(depth));
        WriteJsonString(json, key);
        json.Append(": ");
        WriteJsonString(json, value);
        json.AppendLine(comma ? "," : "");
    }

    private static void WriteProperty(StringBuilder json, int depth, string key, float value, bool comma) {
        json.Append(Indent(depth));
        WriteJsonString(json, key);
        json.Append(": ");
        json.Append(Round(value));
        json.AppendLine(comma ? "," : "");
    }

    private static void WriteProperty(StringBuilder json, int depth, string key, int value, bool comma) {
        json.Append(Indent(depth));
        WriteJsonString(json, key);
        json.Append(": ");
        json.Append(value.ToString(CultureInfo.InvariantCulture));
        json.AppendLine(comma ? "," : "");
    }

    private static void WriteVector3(StringBuilder json, Vector3 value) {
        json.Append("[");
        json.Append(Round(value.x));
        json.Append(", ");
        json.Append(Round(value.y));
        json.Append(", ");
        json.Append(Round(value.z));
        json.Append("]");
    }

    private static void WriteJsonString(StringBuilder json, string value) {
        json.Append("\"");
        json.Append(value.Replace("\\", "\\\\").Replace("\"", "\\\""));
        json.Append("\"");
    }

    private static string Round(float value) {
        return value.ToString("0.#####", CultureInfo.InvariantCulture);
    }

    private static string Indent(int depth) {
        return new string(' ', depth * 2);
    }
}
#endif
