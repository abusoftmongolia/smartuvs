"use client";
import { btnPrimary } from "@/components/ui";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className={btnPrimary}>
      Хэвлэх / PDF хадгалах
    </button>
  );
}
