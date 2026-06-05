"use client";

import Link from "next/link";
import { useState } from "react";

const compassAreas = [
  { key: "relationships", label: "Relationships", angle: 30 },
  { key: "income", label: "Income", angle: 60 },
  { key: "health", label: "Health", angle: 120 },
  { key: "spirituality", label: "Spirituality", angle: 150 },
  { key: "investments", label: "Investments", angle: 210 },
  { key: "network", label: "Network", angle: 240 },
  { key: "knowledge", label: "Knowledge", angle: 300 },
  { key: "lifestyle", label: "Lifestyle", angle: 330 },
];

function getLabelAnchorStyle(angle: number) {
  const radius = 39;
  const radians = (angle * Math.PI) / 180;

  return {
    left: `${50 + radius * Math.sin(radians)}%`,
    top: `${50 - radius * Math.cos(radians)}%`,
  };
}

function getLabelTextStyle(angle: number) {
  const radialRotation = angle - 90;
  const isLeftSide = angle > 180;

  return {
    transform: isLeftSide
      ? `rotate(${radialRotation + 180}deg) translate(-100%, -50%)`
      : `rotate(${radialRotation}deg) translate(0%, -50%)`,
    transformOrigin: "0% 50%",
  };
}

export function CompassArchiveWheel() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  return (
    <div
      className="relative z-10 mt-8 h-[430px] w-[430px] perspective-[900px] md:h-[560px] md:w-[560px]"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        setTilt({
  x: y * -16,
  y: x * 16,
});
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformOrigin: "50% 88%",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="absolute inset-[14%]">
          <img
            src="/images/compass/compass-polished-wheel-v1.png"
            alt="Polished Compass archive wheel"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[5%] -translate-x-1/2 text-center">
            <p className="text-sm font-semibold text-[#E7C98B]">N</p>
            <p className="text-xs text-[#E7C98B]/70">0°</p>
          </div>

          <div className="absolute right-[5%] top-1/2 -translate-y-1/2 text-center">
            <p className="text-sm font-semibold text-[#E7C98B]">E</p>
            <p className="text-xs text-[#E7C98B]/70">90°</p>
          </div>

          <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm font-semibold text-[#E7C98B]">S</p>
            <p className="text-xs text-[#E7C98B]/70">180°</p>
          </div>

          <div className="absolute left-[5%] top-1/2 -translate-y-1/2 text-center">
            <p className="text-sm font-semibold text-[#E7C98B]">W</p>
            <p className="text-xs text-[#E7C98B]/70">270°</p>
          </div>
        </div>

        <div className="absolute inset-0">
          {compassAreas.map((area) => (
            <div
              key={area.key}
              className="absolute"
              style={getLabelAnchorStyle(area.angle)}
            >
              <Link
                href={`/compass/archive/${area.key}`}
                className="absolute whitespace-nowrap rounded-full border border-[#3A3224] bg-black/55 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-[#E7C98B] backdrop-blur-sm transition hover:border-[#d8b15f] hover:bg-[#21190F] hover:text-[#f1dfb4] md:text-xs"
                style={getLabelTextStyle(area.angle)}
              >
                {area.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}