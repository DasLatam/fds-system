import { ImageResponse } from "next/og";

export const runtime = "edge";

// Simple emoji favicon: 📄✍️
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
        }}
      >
        <div style={{ fontSize: 64 }}>📄✍️</div>
      </div>
    ),
    { width: 128, height: 128 }
  );
}
