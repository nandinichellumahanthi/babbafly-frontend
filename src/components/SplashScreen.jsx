import { useEffect, useState } from "react";

function SplashScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 4500);
    const doneTimer = setTimeout(() => onFinish(), 5000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen ${fading ? "splash-fade-out" : ""}`}>
      <div className="splash-orbit">
        <span className="orbit-dot dot-1"></span>
        <span className="orbit-dot dot-2"></span>
        <span className="orbit-dot dot-3"></span>
      </div>

      <div className="splash-content">
        <h1 className="splash-logo">
          {"BabbaFly".split("").map((char, i) => (
            <span
              key={i}
              className="splash-letter"
              style={{ animationDelay: `${0.3 + i * 0.08}s` }}
            >
              {char}
            </span>
          ))}
          <span className="splash-rocket">🚀</span>
        </h1>
        <p className="splash-tagline">Buy & Sell Electronics, The Smart Way</p>
        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;