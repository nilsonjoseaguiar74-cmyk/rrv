"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ManagementLoginForm() {
  const [feedback, setFeedback] = useState("");
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("Opening management…");
    router.push("/gestao");
  }

  return (
    <form className="mgmt-login-form" onSubmit={handleSubmit}>
      <label>
        <span>Email</span>
        <input type="email" name="email" autoComplete="email" required />
      </label>
      <label>
        <span>Password</span>
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      <button type="submit">Sign in <b>→</b></button>
      <small role="status">{feedback || "Provisional access for this foundation phase. Authentication will be connected next."}</small>
    </form>
  );
}
