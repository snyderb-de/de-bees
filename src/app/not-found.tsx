import Link from "next/link";
import { EngravedBee } from "@/components/engraved-bee";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-center px-5 py-28 text-center">
      <EngravedBee immediate className="h-auto w-40" />
      <p className="eyebrow mt-8">Plate not found</p>
      <h1 className="display title-l mt-4">This page flew the hive.</h1>
      <p className="lede mt-4">
        There&apos;s no entry here — but the register is full of keepers worth
        meeting.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-gilt">
          Back to the ledger
        </Link>
        <Link href="/keepers" className="btn-quiet">
          The Register
        </Link>
      </div>
    </div>
  );
}
