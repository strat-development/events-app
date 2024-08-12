"use client"

import { AuthModal } from "@/features/AuthModal";
import { Modal } from "@/features/Modal";
import { useModal } from "@/hooks/useModal";
import { useState } from "react";

export default function Home() {
  const authModal = useModal();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <AuthModal />
      <button onClick={
        () => {
          authModal.onOpen();
        }
      }>
        Open Auth Modal
      </button>
    </main>
  );
}
