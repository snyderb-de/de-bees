import { FlyoverMap } from "@/components/flyover-map";
import { KEEPERS } from "@/lib/keepers";

export default function Home() {
  return <FlyoverMap keepers={KEEPERS} variant="home" />;
}
