'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-destructive">Đã xảy ra lỗi</h1>
      <p className="mt-4 text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-8 underline">
        Thử lại
      </button>
    </main>
  );
}
