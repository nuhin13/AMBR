export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-wide py-16 md:py-28">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
