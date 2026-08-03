/**
 * @project NguyenDinhHoaNgai
 * @file src/app/admin/nhap-lieu/page.tsx
 * @description Admin page: import family tree from GEDCOM / CSV / JSON
 * @version 1.0.0
 * @updated 2026-07-23
 */

'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle2, AlertCircle, FileUp, Download } from 'lucide-react';
import { parseImport, type ImportPayload } from '@/lib/import/parsers';
import { importPeopleAction } from './actions';

export default function NhapLieuPage() {
  const [filename, setFilename] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [parsed, setParsed] = useState<ImportPayload | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);
  const [pending, startTransition] = useTransition();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setContent(text);
      try {
        const p = parseImport(file.name, text);
        setParsed(p);
      } catch (err) {
        setParsed({ people: [], families: [], source: 'csv', warnings: [String(err)] });
      }
    };
    reader.readAsText(file);
  };

  const handleParse = () => {
    if (!filename || !content) return;
    setResult(null);
    const p = parseImport(filename, content);
    setParsed(p);
  };

  const handleImport = () => {
    if (!parsed) return;
    startTransition(async () => {
      const r = await importPeopleAction(parsed);
      setResult(r);
    });
  };

  const downloadSample = (fmt: 'csv' | 'json' | 'gedcom') => {
    let sample = '';
    let ext = '';
    if (fmt === 'csv') {
      ext = 'csv';
      sample = [
        'handle,ten,ho,ten_dem,ten_goi,gioi_tinh,doi,chi,nam_sinh,noi_sinh,nam_mat,noi_mat,ngay_gio,con_song,nghe,que,ghichu',
        'IMP0001,Nguyễn Đình A,Nguyễn Đình,,A,1,1,1,1880,Làng Hòa Ngãi,1945,Làng Hòa Ngãi,15/7,0,Nông dân,Hà Nam,Thủy tổ nhánh A',
        'IMP0002,Nguyễn Thị B,Nguyễn,Thị,B,2,1,1,1885,Làng Hòa Ngãi,1948,Làng Hòa Ngãi,20/3,0,Nội trợ,Hà Nam,',
        'IMP0003,Nguyễn Đình C,Nguyễn Đình,,C,1,2,1,1910,Hà Nam,1980,Hà Nội,18/2,0,Giáo viên,Hà Nam,',
      ].join('\n');
    } else if (fmt === 'json') {
      ext = 'json';
      sample = JSON.stringify({
        people: [
          { handle: 'IMP0001', display_name: 'Nguyễn Đình A', surname: 'Nguyễn Đình', first_name: 'A', gender: 1, generation: 1, chi: 1, birth_year: 1880, death_year: 1945, death_lunar: '15/7', is_living: false, occupation: 'Nông dân', hometown: 'Làng Hòa Ngãi, Hà Nam' },
          { handle: 'IMP0002', display_name: 'Nguyễn Thị B', surname: 'Nguyễn', middle_name: 'Thị', first_name: 'B', gender: 2, generation: 1, birth_year: 1885, death_year: 1948, is_living: false },
          { handle: 'IMP0003', display_name: 'Nguyễn Đình C', surname: 'Nguyễn Đình', first_name: 'C', gender: 1, generation: 2, birth_year: 1910, is_living: false, occupation: 'Giáo viên' },
        ],
        families: [
          { father_handle: 'IMP0001', mother_handle: 'IMP0002', child_handles: ['IMP0003'], marriage_date: '1908-02-15', marriage_place: 'Làng Hòa Ngãi' },
        ],
      }, null, 2);
    } else {
      ext = 'ged';
      sample = [
        '0 HEAD',
        '1 SOUR NDHN-Import',
        '1 GEDC',
        '2 VERS 7.0',
        '2 FORM LINEAGE-LINKED',
        '1 CHAR UTF-8',
        '0 @I1@ INDI',
        '1 NAME Nguyễn Đình /Tổ/',
        '1 SEX M',
        '1 BIRT',
        '2 DATE 1850',
        '2 PLAC Làng Hòa Ngãi, Hà Nam',
        '1 DEAT',
        '2 DATE 1925',
        '1 OCCU Nông dân',
        '0 @I2@ INDI',
        '1 NAME Nguyễn Thị /Bà/',
        '1 SEX F',
        '1 BIRT',
        '2 DATE 1855',
        '0 @F1@ FAM',
        '1 HUSB @I1@',
        '1 WIFE @I2@',
        '1 CHIL @I3@',
        '1 MARR',
        '2 DATE 1875',
        '2 PLAC Làng Hòa Ngãi',
        '0 @I3@ INDI',
        '1 NAME Nguyễn Đình /Cả/',
        '1 SEX M',
        '1 BIRT',
        '2 DATE 1880',
        '0 TRLR',
      ].join('\n');
    }
    const blob = new Blob([sample], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mau-import.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nhập dữ liệu cây gia phả</h1>
        <p className="text-sm text-muted-foreground">
          Import từ file GEDCOM (.ged), CSV (.csv) hoặc JSON (.json). Tải mẫu bên dưới để xem cấu trúc.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Tải file lên
            </CardTitle>
            <CardDescription>Hỗ trợ: .ged (GEDCOM 7.0), .csv, .json</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Chọn file</Label>
              <Input id="file" type="file" accept=".ged,.csv,.json,text/plain" onChange={handleFile} />
              {filename && (
                <p className="text-xs text-muted-foreground">
                  Đã chọn: <span className="font-mono">{filename}</span> ({content.length.toLocaleString()} ký tự)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paste">Hoặc dán nội dung</Label>
              <Textarea
                id="paste"
                rows={6}
                placeholder="Dán nội dung file vào đây..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (!filename) setFilename('pasted.txt');
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleParse} disabled={!content}>
                <FileText className="mr-2 h-4 w-4" /> Phân tích
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadSample('csv')}>
                <Download className="mr-1 h-3 w-3" /> CSV mẫu
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadSample('json')}>
                <Download className="mr-1 h-3 w-3" /> JSON mẫu
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadSample('gedcom')}>
                <Download className="mr-1 h-3 w-3" /> GEDCOM mẫu
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kết quả phân tích</CardTitle>
            <CardDescription>
              {parsed ? (
                <span>
                  {parsed.people.length} người · {parsed.families.length} gia đình · nguồn: <span className="font-mono">{parsed.source}</span>
                </span>
              ) : 'Chưa có dữ liệu'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {parsed?.warnings.map((w, i) => (
              <Alert key={i} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Cảnh báo</AlertTitle>
                <AlertDescription>{w}</AlertDescription>
              </Alert>
            ))}
            {parsed && parsed.people.length > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Sẵn sàng nhập</AlertTitle>
                <AlertDescription>
                  Tìm thấy {parsed.people.length} người, {parsed.families.length} gia đình. Bấm &quot;Nhập vào hệ thống&quot; để thêm vào CSDL.
                </AlertDescription>
              </Alert>
            )}

            {parsed && parsed.people.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded border bg-muted/30 p-2 text-xs">
                <table className="w-full">
                  <thead className="sticky top-0 bg-background">
                    <tr className="text-left">
                      <th className="p-1">Handle</th>
                      <th className="p-1">Tên</th>
                      <th className="p-1">Đời</th>
                      <th className="p-1">Năm sinh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.people.slice(0, 50).map((p) => (
                      <tr key={p.handle} className="border-t">
                        <td className="p-1 font-mono">{p.handle}</td>
                        <td className="p-1">{p.display_name}</td>
                        <td className="p-1">{p.generation ?? '-'}</td>
                        <td className="p-1">{p.birth_year ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.people.length > 50 && (
                  <p className="mt-2 text-muted-foreground">... và {parsed.people.length - 50} người khác</p>
                )}
              </div>
            )}

            <Button onClick={handleImport} disabled={!parsed || parsed.people.length === 0 || pending} className="w-full">
              <FileUp className="mr-2 h-4 w-4" />
              {pending ? 'Đang nhập...' : `Nhập ${parsed?.people.length ?? 0} người vào hệ thống`}
            </Button>

            {result && (
              <Alert variant={result.errors.length > 0 ? 'destructive' : 'default'}>
                {result.errors.length > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                <AlertTitle>Kết quả</AlertTitle>
                <AlertDescription>
                  Đã thêm: <strong>{result.inserted}</strong> · Bỏ qua (trùng handle): {result.skipped}
                  {result.errors.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-xs">
                      {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                      {result.errors.length > 5 && <li>... và {result.errors.length - 5} lỗi khác</li>}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
