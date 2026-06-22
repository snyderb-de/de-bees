import type { Metadata } from "next";
import { FlyoverMap } from "@/components/flyover-map";
import { KEEPERS } from "@/lib/keepers";

export const metadata: Metadata = {
  title: "The Map",
  description:
    "A Three.js flyover map of Delaware's registered beekeepers, county by county.",
};

export default function MapPage() {
  return <FlyoverMap keepers={KEEPERS} variant="map" />;
}
