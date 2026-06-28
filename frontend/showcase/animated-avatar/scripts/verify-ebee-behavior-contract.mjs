import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");
const avatarPath = path.resolve("src/components/RiggedEbeeAvatar.tsx");
const appSource = fs.readFileSync(appPath, "utf8");
const avatarSource = fs.readFileSync(avatarPath, "utf8");

const greetingPatternMatch = appSource.match(/return\s+\/\^(.+?)\$\/i\.test\(text\.trim\(\)\)/s);
const greetingPattern = greetingPatternMatch ? new RegExp(`^${greetingPatternMatch[1]}$`, "i") : null;
const requiredGreetings = ["Hi", "Hello", "Good morning", "Good afternoon", "Hey"];

const checks = [
  {
    name: "required-greeting-phrases",
    passed: Boolean(greetingPattern) && requiredGreetings.every((phrase) => greetingPattern.test(phrase)),
    detail: `Required phrases: ${requiredGreetings.join(", ")}`,
  },
  {
    name: "greeting-intent-starts-greeting-demo",
    passed: /if\s*\(isGreetingIntent\(question\)\)[\s\S]*?startMotionDemo\("greeting",\s*1800\)/.test(appSource),
    detail: "Greeting user messages must start a 1.8 second greeting behavior.",
  },
  {
    name: "manual-greeting-demo-duration",
    passed: /demo\s*===\s*"greeting"\s*\?\s*1800/.test(appSource),
    detail: "The Greet motion control should use the same 1-2 second wave duration.",
  },
  {
    name: "greeting-behavior-maps-to-avatar",
    passed: /motionDemo\s*===\s*"greeting"\s*\?\s*"greeting"/.test(appSource),
    detail: "The avatar behavior prop must enter the greeting state during the demo.",
  },
  {
    name: "greeting-uses-transition-wave",
    passed: /greetingProgress\s*=\s*THREE\.MathUtils\.clamp\(transition,\s*0,\s*1\)/.test(avatarSource),
    detail: "Greeting wave timing must use transition progress, not an unrelated clock.",
  },
  {
    name: "behavior-transition-under-one-second",
    passed: /const\s+BEHAVIOR_TRANSITION_SECONDS\s*=\s*0\.55\s*;/.test(avatarSource),
    detail: "Behavior changes should be damped and quick enough for 1-2 second greeting.",
  },
  {
    name: "greeting-left-arm-and-hand",
    passed:
      /if\s*\(behavior\s*===\s*"greeting"\)[\s\S]*?shoulderL:[\s\S]*?elbowL:[\s\S]*?wristL:[\s\S]*?fingersL:/m.test(
        avatarSource,
      ),
    detail: "Greeting should drive left shoulder, elbow, wrist, and fingers separately.",
  },
  {
    name: "speaking-alternates-left-right-hands",
    passed: /leftGesture[\s\S]*rightGesture[\s\S]*fingersL:[\s\S]*fingersR:/m.test(avatarSource),
    detail: "Speaking should include subtle alternating left/right hand motion.",
  },
  {
    name: "speech-boundary-drives-face-pulse",
    passed:
      /const\s+\[speechPulse,\s*setSpeechPulse\]\s*=\s*useState\(0\)/.test(appSource) &&
      /utterance\.onboundary\s*=\s*\(\)\s*=>\s*\{[\s\S]*?setSpeechPulse\(1\)/.test(appSource) &&
      /speechPulse=\{speechPulse\}/.test(appSource),
    detail: "Speech synthesis boundary events should drive avatar face/mouth intensity.",
  },
  {
    name: "avatar-face-uses-speech-pulse",
    passed: /speechPulse:\s*number[\s\S]*const talk = behavior === "speaking" \? Math\.max\(proceduralTalk, speechPulse\)/m.test(
      avatarSource,
    ),
    detail: "Avatar facial motion should use speechPulse while speaking.",
  },
];

const failed = checks.filter((check) => !check.passed);
const result = {
  appPath,
  avatarPath,
  checks,
};

if (failed.length > 0) {
  throw new Error(`Ebee behavior contract checks failed: ${JSON.stringify(result, null, 2)}`);
}

console.log(JSON.stringify(result, null, 2));
