import type { Metadata } from "next";
import { VisionRegressionLab } from "./VisionRegressionLab";

export const metadata: Metadata = {
  title: "S2 Vision Regression Lab · AdMind",
  description: "Replays AdMind's fixed paused-frame set and reports project-local detector and placement agreement.",
};

export default function RegressionPage() {
  return <VisionRegressionLab />;
}
