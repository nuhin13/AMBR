import { notFound } from "next/navigation";

/** Any unknown storefront URL renders the localised 404 inside the store layout. */
export default function CatchAll() {
  notFound();
}
