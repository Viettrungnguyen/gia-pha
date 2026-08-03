export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4 text-muted-foreground">Trang không tồn tại.</p>
      <a href="/" className="mt-8 inline-block text-primary hover:underline">
        ← Về trang chủ
      </a>
    </main>
  );
}
