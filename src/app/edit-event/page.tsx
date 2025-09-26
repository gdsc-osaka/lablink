import { Suspense } from "react";
import EditEventClient from "./EditEventClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditEventClient />
    </Suspense>
  );
}
