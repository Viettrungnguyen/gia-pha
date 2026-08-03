'use client';

import { useState, useMemo } from 'react';
import { usePeople } from '@/hooks/use-people';
import { PersonCard } from '@/components/people/person-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, X } from 'lucide-react';

export default function ThanhVienPage() {
  const { data: people, isLoading, error } = usePeople();
  const [search, setSearch] = useState('');
  const [genFilter, setGenFilter] = useState<string>('all');
  const [chiFilter, setChiFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

  const filtered = useMemo(() => {
    if (!people) return [];
    return people.filter((p) => {
      if (search) {
        const haystack = normalize(`${p.display_name} ${p.first_name || ''} ${p.middle_name || ''}`);
        if (!haystack.includes(normalize(search))) return false;
      }
      if (genFilter !== 'all' && p.generation !== parseInt(genFilter)) return false;
      if (chiFilter !== 'all' && p.chi !== parseInt(chiFilter)) return false;
      if (statusFilter === 'living' && !p.is_living) return false;
      if (statusFilter === 'deceased' && p.is_living) return false;
      return true;
    });
  }, [people, search, genFilter, chiFilter, statusFilter]);

  const generations = useMemo(
    () => people ? Array.from(new Set(people.map((p) => p.generation))).sort((a, b) => a - b) : [],
    [people]
  );
  const chis = useMemo(
    () => people ? Array.from(new Set(people.filter((p) => p.chi).map((p) => p.chi!))).sort((a, b) => a - b) : [],
    [people]
  );

  const clearFilters = () => {
    setSearch('');
    setGenFilter('all');
    setChiFilter('all');
    setStatusFilter('all');
  };

  const hasFilters = search || genFilter !== 'all' || chiFilter !== 'all' || statusFilter !== 'all';

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Thành viên</h1>
          <p className="text-sm text-muted-foreground">
            {people ? `${people.length} người trong ${generations.length} đời` : 'Đang tải...'}
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={genFilter}
              onChange={(e) => setGenFilter(e.target.value)}
              aria-label="Lọc theo đời"
            >
              <option value="all">Tất cả đời</option>
              {generations.map((g) => (
                <option key={g} value={g}>Đời {g}</option>
              ))}
            </select>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={chiFilter}
              onChange={(e) => setChiFilter(e.target.value)}
              aria-label="Lọc theo chi"
            >
              <option value="all">Tất cả chi</option>
              {chis.map((c) => (
                <option key={c} value={c}>Chi {c}</option>
              ))}
            </select>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái"
            >
              <option value="all">Tất cả</option>
              <option value="living">Còn sống</option>
              <option value="deceased">Đã mất</option>
            </select>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />
              Xóa bộ lọc
            </Button>
          )}
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Lỗi khi tải dữ liệu: {error.message}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {hasFilters ? (
              <>
                <p>Không tìm thấy kết quả phù hợp.</p>
                <Button variant="link" onClick={clearFilters}>Xóa bộ lọc</Button>
              </>
            ) : (
              <p>Chưa có thành viên nào trong database.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Hiển thị {filtered.length} / {people?.length ?? 0} người
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
