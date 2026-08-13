import type { Metadata } from "next";
import { createS1Request, createS2Request, decide } from "@admind/decision-engine";
import { ShowcaseDemo } from "./components/ShowcaseDemo";

export const metadata: Metadata = {
  title: "AdMind — 广告必须出现，也不必毁掉剧情",
};

export default function Home() {
  const s1 = createS1Request("admind");
  const s2 = createS2Request("admind");
  return (
    <ShowcaseDemo
      scenarios={[
        { scenario: s1.scenario, baseline: decide(createS1Request("baseline")), admind: decide(s1) },
        { scenario: s2.scenario, baseline: decide(createS2Request("baseline")), admind: decide(s2) },
      ]}
    />
  );
}
