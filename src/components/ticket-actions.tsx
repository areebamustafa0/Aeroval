"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-outline btn-sm">
      <Printer size={13} /> Print ticket
    </button>
  );
}