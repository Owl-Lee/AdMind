import type { Metadata } from "next";
import { ProtectionCalibrationLab } from "./ProtectionCalibrationLab";

export const metadata: Metadata = {
  title: "S2 Protection Calibration · AdMind",
  description: "Refines AdMind's product-reviewed S2 protection boxes with normalized, auditable coordinates.",
  openGraph: {
    title: "S2 Protection Calibration · AdMind",
    description: "Refines AdMind's product-reviewed S2 protection boxes with normalized, auditable coordinates.",
    images: [],
  },
  twitter: {
    title: "S2 Protection Calibration · AdMind",
    description: "Refines AdMind's product-reviewed S2 protection boxes with normalized, auditable coordinates.",
    images: [],
  },
};

export default function ProtectionCalibrationPage() {
  return <ProtectionCalibrationLab />;
}
