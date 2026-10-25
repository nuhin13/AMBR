import StoreLayout from "./(store)/layout";
import StoreNotFound from "./(store)/not-found";

/** Unmatched URLs get the branded 404 inside the normal storefront chrome. */
export default function NotFound() {
  return (
    <StoreLayout>
      <StoreNotFound />
    </StoreLayout>
  );
}
