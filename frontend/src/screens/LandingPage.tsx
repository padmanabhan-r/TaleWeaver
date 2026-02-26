interface Props {
  onStoryMode: () => void;
  onStudyMode: () => void;
}

const LandingPage = ({ onStoryMode, onStudyMode }: Props) => {
  return (
    <div
      className="h-screen w-full flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 70% 50% at 20% 90%, rgba(134, 239, 172, 0.35) 0%, transparent 70%),
          radial-gradient(ellipse 60% 40% at 80% 10%, rgba(186, 230, 253, 0.45) 0%, transparent 70%),
          linear-gradient(175deg, #BAE6FD 0%, #E0F2FE 30%, #DCFCE7 70%, #BBF7D0 100%)
        `,
      }}
    >
      {/* Atmospheric clouds */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute rounded-full cloud-drift"
          style={{ width: "500px", height: "130px", top: "5%", left: "-10%", background: "radial-gradient(ellipse, rgba(255,255,255,0.28) 0%, transparent 70%)" }}
        />
        <div
          className="absolute rounded-full cloud-drift-slow"
          style={{ width: "600px", height: "120px", top: "60%", right: "-15%", background: "radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)" }}
        />
        <div
          className="absolute rounded-full cloud-drift-slow"
          style={{ width: "350px", height: "90px", bottom: "12%", left: "5%", background: "radial-gradient(ellipse, rgba(255,255,255,0.15) 0%, transparent 70%)" }}
        />
      </div>

      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {["14%,18%", "82%,12%", "8%,55%", "92%,60%", "50%,8%", "70%,82%", "28%,88%"].map((pos, i) => {
          const [left, top] = pos.split(",");
          return (
            <span
              key={i}
              className="absolute text-yellow-300 select-none"
              style={{ left, top, fontSize: `${14 + (i % 3) * 6}px`, opacity: 0.6 + (i % 3) * 0.1 }}
            >
              ✦
            </span>
          );
        })}
      </div>

      {/* Title */}
      <div className="z-10 text-center mb-8">
        <h1
          className="font-bangers tracking-wide mb-2"
          style={{
            fontSize: "clamp(3rem, 8vw, 5.5rem)",
            background: "linear-gradient(135deg, #7C3AED 0%, #DB2777 40%, #D97706 70%, #059669 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "none",
            filter: "drop-shadow(2px 3px 0px rgba(124, 58, 237, 0.2))",
          }}
        >
          TaleWeaver
        </h1>
        <p className="font-comic-neue text-lg md:text-xl text-teal-700/80 font-bold">
          Where every child's story begins
        </p>
      </div>

      {/* Mode cards */}
      <div className="z-10 flex flex-col sm:flex-row gap-5 w-full max-w-2xl px-2">

        {/* Story Mode */}
        <button
          onClick={onStoryMode}
          className="flex-1 rounded-3xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 hover:-translate-y-3 hover:scale-105 hover:shadow-2xl active:scale-95"
          style={{
            background: "linear-gradient(145deg, #F3E8FF 0%, #FDF2F8 40%, #FCE7F3 100%)",
            border: "3px solid rgba(168, 85, 247, 0.3)",
            boxShadow: "0 8px 32px rgba(168, 85, 247, 0.2)",
          }}
        >
          <span style={{ fontSize: "4rem" }}>📖</span>
          <div className="text-center">
            <h2 className="font-bangers text-3xl text-purple-800 tracking-wide mb-1">Story Time</h2>
            <p className="font-comic-neue text-sm text-purple-600 leading-snug max-w-[200px]">
              Listen to magical tales with your favourite storyteller
            </p>
          </div>
          <span
            className="font-bangers text-lg tracking-wide px-8 py-2 rounded-full transition-all duration-200 hover:scale-105"
            style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B)", color: "#451A03" }}
          >
            Let's Go!
          </span>
        </button>

        {/* Study Mode */}
        <button
          onClick={onStudyMode}
          className="flex-1 rounded-3xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 hover:-translate-y-3 hover:scale-105 hover:shadow-2xl active:scale-95"
          style={{
            background: "linear-gradient(145deg, #ECFDF5 0%, #F0FFF4 40%, #D1FAE5 100%)",
            border: "3px solid rgba(16, 185, 129, 0.3)",
            boxShadow: "0 8px 32px rgba(16, 185, 129, 0.2)",
          }}
        >
          <span style={{ fontSize: "4rem" }}>🌟</span>
          <div className="text-center">
            <h2 className="font-bangers text-3xl text-emerald-800 tracking-wide mb-1">Learn & Explore</h2>
            <p className="font-comic-neue text-sm text-emerald-600 leading-snug max-w-[200px]">
              Discover maths, science, reading and art through fun adventures
            </p>
          </div>
          <span
            className="font-bangers text-lg tracking-wide px-8 py-2 rounded-full transition-all duration-200 hover:scale-105"
            style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B)", color: "#451A03" }}
          >
            Let's Learn!
          </span>
        </button>

      </div>

      {/* Bottom flower row */}
      <div className="z-10 mt-8 text-2xl select-none tracking-widest">
        🌸🌼🌻🌺🌸
      </div>
    </div>
  );
};

export default LandingPage;
