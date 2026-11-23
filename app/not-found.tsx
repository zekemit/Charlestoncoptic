import Link from "next/link";
import { Container } from "@/components/PageHeader";

export default function NotFound() {
  return (
    <Container className="max-w-3xl">
      <h1>We can&rsquo;t find that page</h1>
      <p className="mt-5 max-w-prose text-xl">
        The address may have changed when we moved to our new website. These pages will get you where you need to go.
      </p>
      <ul className="mt-8 flex flex-wrap gap-3">
        <li>
          <Link href="/" className="btn btn-primary">
            Home
          </Link>
        </li>
        <li>
          <Link href="/visit-us" className="btn btn-outline">
            Visit us
          </Link>
        </li>
        <li>
          <Link href="/contact" className="btn btn-outline">
            Contact us
          </Link>
        </li>
      </ul>
    </Container>
  );
}
