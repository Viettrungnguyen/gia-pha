/**
 * @project NguyenDinhHoaNgai
 * @file src/components/people/parent-combobox.tsx
 * @description Parent picker combobox
 * @version 1.1.0
 * @updated 2026-07-24
 */

'use client';

import { useState } from 'react';
import { useSearchPeople } from '@/hooks/use-people';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';

interface Props {
  selectedId?: string;
  selectedName?: string;
  onSelect: (id: string, displayName: string) => void;
  placeholder?: string;
}

export function ParentCombobox({
  selectedId,
  selectedName,
  onSelect,
  placeholder = 'Tìm theo tên...',
}: Props) {
  const [search, setSearch] = useState('');
  const { data: results } = useSearchPeople(search);

  const handleSelect = (id: string, name: string) => {
    onSelect(id, name);
    setSearch('');
  };

  const handleClear = () => onSelect('', '');

  if (selectedId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between p-2">
          <span className="truncate text-sm font-medium">{selectedName ?? 'Đã chọn'}</span>
          <Button variant="ghost" size="sm" type="button" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {search.length >= 2 && results && results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-md border bg-card shadow-sm">
          {results.slice(0, 10).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p.id, p.display_name)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <div className="font-medium">{p.display_name}</div>
              <div className="text-xs text-muted-foreground">
                Đời {p.generation}
                {p.birth_year ? ` · ${p.birth_year}` : ''}
                {!p.is_living ? ' †' : ''}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}