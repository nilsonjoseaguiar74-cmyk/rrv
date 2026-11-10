import Link from "next/link";
import { RRVLogo } from "@/components/brand/RRVLogo";
import { ManagementLoginForm } from "@/components/management/ManagementLoginForm";

export default function ManagementLogin() {
  return (
    <main className="mgmt-login">
      <Link className="mgmt-login-brand" href="/" aria-label="Back to RRV.digital">
        <RRVLogo variant="monochrome" />
      </Link>

      <section className="mgmt-login-layout">
        <div className="mgmt-login-title">
          <span>Private workspace</span>
          <h1>Management<br />system.</h1>
        </div>

        <ManagementLoginForm />
      </section>
    </main>
  );
}
