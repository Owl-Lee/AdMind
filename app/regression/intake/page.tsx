import type { Metadata } from "next";
import { ReviewIntakeLab } from "./ReviewIntakeLab";

export const metadata: Metadata = {
  title: "S2 Reviewed Label Intake · AdMind",
  description: "Validates a local schema-v2 S2 calibration export and previews label-only regression deltas without uploading or overwriting tracked data.",
  openGraph: {
    title: "S2 Reviewed Label Intake · AdMind",
    description: "Validates a local schema-v2 S2 calibration export and previews label-only regression deltas without uploading or overwriting tracked data.",
    images: [],
  },
  twitter: {
    title: "S2 Reviewed Label Intake · AdMind",
    description: "Validates a local schema-v2 S2 calibration export and previews label-only regression deltas without uploading or overwriting tracked data.",
    images: [],
  },
};

export default function ReviewIntakePage() {
  return <ReviewIntakeLab />;
}
