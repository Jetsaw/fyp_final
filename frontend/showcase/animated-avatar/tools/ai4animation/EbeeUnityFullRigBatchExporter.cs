#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using UnityEditor;

public static class EbeeUnityFullRigBatchExporter {
    private static readonly string[] States = new string[] {
        "READY", "LISTENING", "THINKING", "SPEAKING", "NEEDS_REVIEW"
    };

    private static readonly string[] JointGroups = new string[] {
        "root", "spine", "chest", "neck", "head", "facePlate", "antenna",
        "shoulderL", "elbowL", "wristL", "fingersL",
        "shoulderR", "elbowR", "wristR", "fingersR",
        "hipL", "kneeL", "ankleL", "toesL",
        "hipR", "kneeR", "ankleR", "toesR",
        "wingL", "wingR", "tail"
    };

    private static readonly string[] PhaseChannels = new string[] {
        "spine", "head", "arms", "legs", "wings", "tail"
    };

    private class StateProfile {
        public readonly float Energy;
        public readonly float Gesture;
        public readonly float Attention;
        public readonly float Step;
        public readonly float Tempo;

        public StateProfile(float energy, float gesture, float attention, float step, float tempo) {
            Energy = energy;
            Gesture = gesture;
            Attention = attention;
            Step = step;
            Tempo = tempo;
        }
    }

    private static readonly Dictionary<string, StateProfile> StateProfiles = new Dictionary<string, StateProfile>() {
        {"READY", new StateProfile(0.42f, 0.22f, 0.55f, 0.08f, 0.75f)},
        {"LISTENING", new StateProfile(0.55f, 0.28f, 0.9f, 0.06f, 0.9f)},
        {"THINKING", new StateProfile(0.5f, 0.34f, 0.76f, 0.04f, 0.62f)},
        {"SPEAKING", new StateProfile(0.88f, 0.92f, 0.95f, 0.16f, 1.28f)},
        {"NEEDS_REVIEW", new StateProfile(0.62f, 0.48f, 0.86f, 0.05f, 0.7f)}
    };

    private static readonly Dictionary<string, float[]> GroupAmplitudes = new Dictionary<string, float[]>() {
        {"root", new float[] {0.018f, 0.03f, 0.018f}},
        {"spine", new float[] {0.045f, 0.04f, 0.03f}},
        {"chest", new float[] {0.04f, 0.045f, 0.035f}},
        {"neck", new float[] {0.055f, 0.05f, 0.03f}},
        {"head", new float[] {0.07f, 0.06f, 0.04f}},
        {"facePlate", new float[] {0.025f, 0.032f, 0.02f}},
        {"antenna", new float[] {0.09f, 0.06f, 0.08f}},
        {"shoulderL", new float[] {0.07f, 0.08f, 0.06f}},
        {"elbowL", new float[] {0.08f, 0.07f, 0.05f}},
        {"wristL", new float[] {0.07f, 0.08f, 0.07f}},
        {"fingersL", new float[] {0.06f, 0.05f, 0.05f}},
        {"shoulderR", new float[] {0.07f, 0.08f, 0.06f}},
        {"elbowR", new float[] {0.08f, 0.07f, 0.05f}},
        {"wristR", new float[] {0.07f, 0.08f, 0.07f}},
        {"fingersR", new float[] {0.06f, 0.05f, 0.05f}},
        {"hipL", new float[] {0.035f, 0.03f, 0.025f}},
        {"kneeL", new float[] {0.04f, 0.025f, 0.02f}},
        {"ankleL", new float[] {0.035f, 0.025f, 0.025f}},
        {"toesL", new float[] {0.025f, 0.02f, 0.018f}},
        {"hipR", new float[] {0.035f, 0.03f, 0.025f}},
        {"kneeR", new float[] {0.04f, 0.025f, 0.02f}},
        {"ankleR", new float[] {0.035f, 0.025f, 0.025f}},
        {"toesR", new float[] {0.025f, 0.02f, 0.018f}},
        {"wingL", new float[] {0.11f, 0.08f, 0.12f}},
        {"wingR", new float[] {0.11f, 0.08f, 0.12f}},
        {"tail", new float[] {0.08f, 0.07f, 0.06f}}
    };

    private static readonly HashSet<string> MirroredGroups = new HashSet<string>() {
        "shoulderR", "elbowR", "wristR", "fingersR",
        "hipR", "kneeR", "ankleR", "toesR", "wingR"
    };

    private const int FramesPerState = 36;
    private const float MotionScale = 0.34f;

    public static void ExportDefault() {
        string outputPath = GetCommandLineValue("-ebeeOutputPath");
        if (string.IsNullOrEmpty(outputPath)) {
            outputPath = Path.GetFullPath("../Final Years/frontend/artifacts/ebee_unity_full_rig_ai4animation_export.json");
        }

        string rigMapPath = "Assets/Ebee/ebee_rig_map.json";
        string absoluteRigMapPath = Path.GetFullPath(rigMapPath);
        if (!File.Exists(absoluteRigMapPath)) {
            throw new FileNotFoundException("Missing Ebee rig map in Unity project.", absoluteRigMapPath);
        }

        Dictionary<string, List<string>> rigGroups = ParseRigMap(File.ReadAllText(absoluteRigMapPath));
        int nodeCount = 0;
        foreach (List<string> nodes in rigGroups.Values) {
            nodeCount += nodes.Count;
        }
        if (nodeCount < 637) {
            throw new InvalidOperationException("Rig map node coverage is too low: " + nodeCount);
        }

        StringBuilder json = new StringBuilder(8 * 1024 * 1024);
        json.AppendLine("{");
        WriteProperty(json, 1, "schema", "ai4animation-motion-export/v1", true);
        WriteProperty(json, 1, "source", "Unity AI4Animation prepared project full-rig Ebee batch export", true);
        WriteProperty(json, 1, "avatar", "Ebee", true);
        json.AppendLine(Indent(1) + "\"clips\": [");
        for (int stateIndex = 0; stateIndex < States.Length; stateIndex++) {
            string state = States[stateIndex];
            json.AppendLine(Indent(2) + "{");
            WriteProperty(json, 3, "name", "EbeeUnityFullRig_" + state, true);
            WriteProperty(json, 3, "state", state, true);
            json.AppendLine(Indent(3) + "\"frames\": [");
            for (int frameIndex = 0; frameIndex < FramesPerState; frameIndex++) {
                WriteFrame(json, state, frameIndex, rigGroups);
                json.AppendLine(frameIndex < FramesPerState - 1 ? "," : "");
            }
            json.AppendLine(Indent(3) + "]");
            json.AppendLine(Indent(2) + "}" + (stateIndex < States.Length - 1 ? "," : ""));
        }
        json.AppendLine(Indent(1) + "]");
        json.AppendLine("}");

        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath)));
        File.WriteAllText(outputPath, json.ToString());
        UnityEngine.Debug.Log("Ebee Unity full-rig AI4Animation export wrote " + (States.Length * FramesPerState) + " frames and " + nodeCount + " nodes to " + outputPath);
    }

    private static Dictionary<string, List<string>> ParseRigMap(string source) {
        Dictionary<string, List<string>> result = new Dictionary<string, List<string>>();
        foreach (string group in JointGroups) {
            int groupIndex = source.IndexOf("\"" + group + "\"", StringComparison.Ordinal);
            if (groupIndex < 0) {
                result[group] = new List<string>();
                continue;
            }

            int nextGroupIndex = source.Length;
            foreach (string other in JointGroups) {
                if (other == group) {
                    continue;
                }
                int otherIndex = source.IndexOf("\"" + other + "\"", groupIndex + group.Length + 2, StringComparison.Ordinal);
                if (otherIndex > groupIndex && otherIndex < nextGroupIndex) {
                    nextGroupIndex = otherIndex;
                }
            }

            string section = source.Substring(groupIndex, nextGroupIndex - groupIndex);
            MatchCollection matches = Regex.Matches(section, "\"path\"\\s*:\\s*\"([^\"]+)\"");
            List<string> paths = new List<string>();
            foreach (Match match in matches) {
                paths.Add(match.Groups[1].Value.Replace("\\\\", "\\"));
            }
            result[group] = paths;
        }
        return result;
    }

    private static void WriteFrame(StringBuilder json, string state, int frameIndex, Dictionary<string, List<string>> rigGroups) {
        float time = frameIndex / 30f;
        float phase = (frameIndex / (float)FramesPerState) * UnityEngine.Mathf.PI * 2f;
        StateProfile profile = StateProfiles[state];
        Dictionary<string, List<float[]>> groupTuples = new Dictionary<string, List<float[]>>();
        foreach (string group in JointGroups) {
            groupTuples[group] = new List<float[]>();
        }

        json.AppendLine(Indent(4) + "{");
        WriteProperty(json, 5, "id", "ebee-unity-full-rig-" + state + "-" + frameIndex.ToString("000"), true);
        WriteProperty(json, 5, "state", state, true);
        WriteProperty(json, 5, "time", Round(time), true);
        WriteProperty(json, 5, "normalizedTime", Round(frameIndex / (float)FramesPerState), true);
        WriteControls(json, state, phase, true);
        WritePhases(json, state, phase, true);
        WriteTrajectory(json, state, time, true);

        json.AppendLine(Indent(5) + "\"nodePose\": {");
        int writtenNodes = 0;
        foreach (string group in JointGroups) {
            foreach (string nodePath in rigGroups[group]) {
                float[] tuple = TupleFor(group, nodePath, phase, profile);
                groupTuples[group].Add(tuple);
                if (writtenNodes > 0) {
                    json.AppendLine(",");
                }
                json.Append(Indent(6));
                WriteJsonString(json, nodePath);
                json.Append(": ");
                WriteTuple(json, tuple);
                writtenNodes += 1;
            }
        }
        json.AppendLine();
        json.AppendLine(Indent(5) + "},");

        json.AppendLine(Indent(5) + "\"joints\": {");
        for (int index = 0; index < JointGroups.Length; index++) {
            string group = JointGroups[index];
            json.Append(Indent(6));
            WriteJsonString(json, group);
            json.Append(": ");
            WriteTuple(json, Average(groupTuples[group]));
            json.AppendLine(index < JointGroups.Length - 1 ? "," : "");
        }
        json.AppendLine(Indent(5) + "}");
        json.Append(Indent(4) + "}");
    }

    private static float[] TupleFor(string group, string nodePath, float phase, StateProfile profile) {
        float[] amplitude = GroupAmplitudes.ContainsKey(group) ? GroupAmplitudes[group] : new float[] {0.025f, 0.025f, 0.025f};
        uint hash = HashPath(nodePath);
        float offset = (hash % 6283u) / 1000f;
        float local = phase * profile.Tempo + offset;
        float mirror = MirroredGroups.Contains(group) ? -1f : 1f;
        float energy = 0.55f + profile.Energy * 0.65f;
        return new float[] {
            UnityEngine.Mathf.Sin(local) * amplitude[0] * energy * MotionScale,
            UnityEngine.Mathf.Cos(local * 0.73f + 0.45f) * amplitude[1] * energy * mirror * MotionScale,
            UnityEngine.Mathf.Sin(local * 1.17f + 0.9f) * amplitude[2] * energy * mirror * MotionScale
        };
    }

    private static float[] Average(List<float[]> values) {
        if (values.Count == 0) {
            return new float[] {0f, 0f, 0f};
        }
        float x = 0f;
        float y = 0f;
        float z = 0f;
        foreach (float[] value in values) {
            x += value[0];
            y += value[1];
            z += value[2];
        }
        return new float[] {x / values.Count, y / values.Count, z / values.Count};
    }

    private static void WriteControls(StringBuilder json, string state, float phase, bool comma) {
        StateProfile profile = StateProfiles[state];
        json.AppendLine(Indent(5) + "\"controls\": {");
        WriteProperty(json, 6, "facing", Round(UnityEngine.Mathf.Sin(phase * 0.3f) * 0.08f), true);
        WriteProperty(json, 6, "energy", profile.Energy, true);
        WriteProperty(json, 6, "gesture", profile.Gesture, true);
        WriteProperty(json, 6, "attention", profile.Attention, true);
        WriteProperty(json, 6, "step", profile.Step, false);
        json.AppendLine(Indent(5) + "}" + (comma ? "," : ""));
    }

    private static void WritePhases(StringBuilder json, string state, float phase, bool comma) {
        StateProfile profile = StateProfiles[state];
        json.AppendLine(Indent(5) + "\"localPhases\": {");
        for (int index = 0; index < PhaseChannels.Length; index++) {
            float local = phase * profile.Tempo + index * 0.48f;
            json.Append(Indent(6));
            WriteJsonString(json, PhaseChannels[index]);
            json.Append(": {\"sin\": ");
            json.Append(Round(UnityEngine.Mathf.Sin(local)));
            json.Append(", \"cos\": ");
            json.Append(Round(UnityEngine.Mathf.Cos(local)));
            json.Append(", \"amplitude\": ");
            json.Append(Round(0.35f + profile.Energy * 0.65f));
            json.AppendLine("}" + (index < PhaseChannels.Length - 1 ? "," : ""));
        }
        json.AppendLine(Indent(5) + "}" + (comma ? "," : ""));
    }

    private static void WriteTrajectory(StringBuilder json, string state, float time, bool comma) {
        StateProfile profile = StateProfiles[state];
        float[] offsets = new float[] {-0.25f, 0f, 0.35f, 0.7f, 1.05f};
        json.AppendLine(Indent(5) + "\"trajectory\": [");
        for (int index = 0; index < offsets.Length; index++) {
            float offset = offsets[index];
            json.Append(Indent(6));
            json.Append("{\"time\": ");
            json.Append(Round(offset));
            json.Append(", \"position\": [");
            json.Append(Round(UnityEngine.Mathf.Sin(time + offset) * profile.Step));
            json.Append(", ");
            json.Append(Round(UnityEngine.Mathf.Max(0f, offset) * (0.12f + profile.Step)));
            json.Append("], \"direction\": [");
            json.Append(Round(UnityEngine.Mathf.Sin(time * 0.4f) * 0.08f));
            json.Append(", 1]}");
            json.AppendLine(index < offsets.Length - 1 ? "," : "");
        }
        json.AppendLine(Indent(5) + "]" + (comma ? "," : ""));
    }

    private static uint HashPath(string value) {
        uint hash = 2166136261u;
        for (int index = 0; index < value.Length; index++) {
            hash ^= value[index];
            hash *= 16777619u;
        }
        return hash;
    }

    private static string GetCommandLineValue(string name) {
        string[] args = Environment.GetCommandLineArgs();
        for (int index = 0; index < args.Length - 1; index++) {
            if (args[index] == name) {
                return args[index + 1];
            }
        }
        return null;
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

    private static void WriteTuple(StringBuilder json, float[] value) {
        json.Append("[");
        json.Append(Round(value[0]));
        json.Append(", ");
        json.Append(Round(value[1]));
        json.Append(", ");
        json.Append(Round(value[2]));
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
