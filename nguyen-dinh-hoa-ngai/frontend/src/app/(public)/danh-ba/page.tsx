/**
 * @project NguyenDinhHoaNgai
 * @file src/app/(public)/danh-ba/page.tsx
 * @description Member contact directory with search, filters, and privacy masking
 * @version 1.0.0
 * @updated 2026-07-24
 */

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookUser, EyeOff, ExternalLink, Lock, Mail, MapPin, Phone, Search } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePeople } from '@/hooks/use-people';
import type { Person } from '@/types';

interface ContactDisplay {
  phone: string | null;
  email: string | null;
  address: string | null;
  zalo: string | null;
  facebook: string | null;
  masked: boolean;
}

function getContactDisplay(person: Person, canViewContacts: boolean): ContactDisplay {
  if (!canViewContacts || person.privacy_level === 2) {
    return { phone: null, email: null, address: null, zalo: null, facebook: null, masked: true };
  }
  return {
    phone: person.phone,
    email: person.email,
    address: person.address || person.hometown,
    zalo: person.zalo,
    facebook: person.facebook,
    masked: false,
  };
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

export default function DanhBaPage() {
  const { data: people, isLoading, error } = usePeople();
  const { user, isAdmin } = useAuth();
  const canViewContacts = Boolean(user && isAdmin);
  const [search, setSearch] = useState('');
  const [generationFilter, setGenerationFilter] = useState('all');
  const [chiFilter, setChiFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const generations = useMemo(
    () => [...new Set((people ?? []).map((person) => person.generation))].sort((a, b) => a - b),
    [people]
  );
  const chis = useMemo(
    () => [...new Set((people ?? []).flatMap((person) => person.chi === null ? [] : [person.chi]))].sort((a, b) => a - b),
    [people]
  );

  const filteredPeople = useMemo(() => {
    const query = normalize(search.trim());
    return (people ?? []).filter((person) => {
      if (statusFilter === 'living' && !person.is_living) return false;
      if (statusFilter === 'deceased' && person.is_living) return false;
      if (generationFilter !== 'all' && person.generation !== Number(generationFilter)) return false;
      if (chiFilter !== 'all' && person.chi !== Number(chiFilter)) return false;
      if (genderFilter !== 'all' && person.gender !== Number(genderFilter)) return false;
      if (!query) return true;

      const searchable = [person.display_name, person.first_name, person.middle_name];
      if (canViewContacts && person.privacy_level !== 2) {
        searchable.push(person.phone, person.email, person.address, person.hometown);
      }
      return normalize(searchable.filter(Boolean).join(' ')).includes(query);
    });
  }, [people, search, statusFilter, generationFilter, chiFilter, genderFilter, canViewContacts]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
          <BookUser className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Danh bạ liên lạc</h1>
          <p className="text-sm text-muted-foreground">Thông tin liên lạc của các thành viên trong dòng họ</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3"><CardTitle className="text-base">Bộ lọc</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={canViewContacts ? 'Tìm theo tên, SĐT, email...' : 'Tìm theo tên...'}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={generationFilter} onValueChange={setGenerationFilter}>
              <SelectTrigger><SelectValue placeholder="Đời" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đời</SelectItem>
                {generations.map((generation) => <SelectItem key={generation} value={String(generation)}>Đời {generation}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={chiFilter} onValueChange={setChiFilter}>
              <SelectTrigger><SelectValue placeholder="Chi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chi</SelectItem>
                {chis.map((chi) => <SelectItem key={chi} value={String(chi)}>Chi {chi}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger><SelectValue placeholder="Giới tính" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="1">Nam</SelectItem>
                <SelectItem value="2">Nữ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="living">Còn sống</SelectItem>
                <SelectItem value="deceased">Đã mất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardDescription>{isLoading ? 'Đang tải...' : `${filteredPeople.length} thành viên`}</CardDescription>
            {!canViewContacts && (
              <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />Đăng nhập quản trị để xem liên hệ</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-12 text-center text-destructive">Không thể tải danh bạ.</div>
          ) : isLoading ? (
            <div className="space-y-4 p-6">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14" />)}</div>
          ) : filteredPeople.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Không tìm thấy thành viên phù hợp</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Họ tên</TableHead>
                    <TableHead>Đời</TableHead>
                    <TableHead className="min-w-[140px]">Điện thoại</TableHead>
                    <TableHead className="min-w-[190px]">Email</TableHead>
                    <TableHead className="min-w-[210px]">Địa chỉ</TableHead>
                    <TableHead>Liên kết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeople.map((person) => {
                    const contact = getContactDisplay(person, canViewContacts);
                    const hidden = <span className="flex items-center gap-1 text-sm text-muted-foreground"><EyeOff className="h-3 w-3" />Ẩn</span>;
                    return (
                      <TableRow key={person.id}>
                        <TableCell>
                          <Link href={`/thanh-vien/${person.id}`} className="flex items-center gap-3 hover:underline">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white ${person.gender === 2 ? 'bg-pink-500' : 'bg-blue-500'}`}>
                              {person.display_name.charAt(person.display_name.length - 1)}
                            </div>
                            <div>
                              <div className="font-medium">{person.display_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {person.gender === 1 ? 'Nam' : person.gender === 2 ? 'Nữ' : 'Chưa rõ'}{!person.is_living && ' · Đã mất'}
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell><Badge variant="outline">{person.generation}</Badge></TableCell>
                        <TableCell>{contact.masked ? hidden : contact.phone ? <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-sm hover:underline"><Phone className="h-3 w-3" />{contact.phone}</a> : '—'}</TableCell>
                        <TableCell>{contact.masked ? hidden : contact.email ? <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-sm hover:underline"><Mail className="h-3 w-3" />{contact.email}</a> : '—'}</TableCell>
                        <TableCell>{contact.masked ? hidden : contact.address ? <span className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3 shrink-0" /><span className="max-w-[190px] truncate">{contact.address}</span></span> : '—'}</TableCell>
                        <TableCell>
                          {contact.masked ? hidden : (
                            <div className="flex gap-2">
                              {contact.zalo && <Badge variant="secondary">Zalo</Badge>}
                              {contact.facebook && <a href={contact.facebook} target="_blank" rel="noopener noreferrer"><Badge variant="secondary" className="gap-1">FB<ExternalLink className="h-2.5 w-2.5" /></Badge></a>}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
