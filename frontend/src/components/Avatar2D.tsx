import "./Avatar2D.css";
import mascotImg from "../assets/hero-transparent.png";
import sceneBg from "../assets/hive-scene-bg.png";

type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "error";

type Props = {
    state?: AvatarState;
    subtitle?: string;
};

export default function Avatar2D({
    state = "idle",
    subtitle = "",
}: Props) {
    const statusText: Record<AvatarState, string> = {
        idle: "READY",
        listening: "LISTENING",
        thinking: "THINKING",
        speaking: "SPEAKING",
        error: "NEEDS REVIEW",
    };

    const caption =
        state === "listening"
            ? "I am listening..."
            : state === "thinking"
                ? "Checking programme rules..."
                : state === "speaking"
                    ? subtitle || "Here is the answer."
                    : state === "error"
                        ? "I need verified programme information for that."
                        : "Ready to help with Intelligent Robotics prerequisites, BYOC choices, and progression.";

    return (
        <section className={`avatar-scene avatar-${state}`}>
            <div
                className="avatar-scene-bg"
                style={{ backgroundImage: `url(${sceneBg})` }}
            />

            <div className="avatar-scene-overlay" />

            <div className="avatar-scene-top">
                <div>
                    <div className="avatar-scene-label">HIVE AVATAR</div>
                    <div className="avatar-scene-title">E-Bee Advisor</div>
                </div>

                <div className={`avatar-status avatar-status-${state}`}>
                    <span className="avatar-status-dot" />
                    <span>{statusText[state]}</span>
                </div>
            </div>

            <div className="avatar-scene-stage">
                <div className="avatar-energy-ring ring-one" />
                <div className="avatar-energy-ring ring-two" />
                <div className="avatar-floor-glow" />

                <img
                    className="avatar-mascot"
                    src={mascotImg}
                    alt="Hive E-Bee mascot"
                />
            </div>

            <div className="avatar-scene-bottom-text">{caption}</div>
        </section>
    );
}
