/**
 * @project NguyenDinhHoaNgai
 * @file src/components/people/person-detail.tsx
 * @description Person full profile view
 * @version 1.0.0
 * @updated 2026-07-23
 */

import Link from 'next/link';
import type { Person, Family, Child } from '@/types';

interface Props {
  person: Person;
  families: Family[];
  children: Child[];
  allPeople: Person[];
}

export function PersonDetail({ person, families, children, allPeople }: Props) {
  const peopleById = new Map(allPeople.map((p) => [p.id, p]));

  const ownFamilies = families.filter(
    (f) => f.father_id === person.id || f.mother_id === person.id
  );

  const parentFamilyIds = children
    .filter((c) => c.person_id === person.id)
    .map((c) => c.family_id);
  const parentFamilies = families.filter((f) => parentFamilyIds.includes(f.id));

  const parents = parentFamilies
    .flatMap((f) => [f.father_id, f.mother_id])
    .filter((id): id is string => Boolean(id))
    .map((id) => peopleById.get(id))
    .filter((p): p is Person => Boolean(p));

  const spouses = ownFamilies
    .flatMap((f) => {
      const ids: string[] = [];
      if (f.father_id === person.id && f.mother_id) ids.push(f.mother_id);
      if (f.mother_id === person.id && f.father_id) ids.push(f.father_id);
      return ids;
    })
    .map((id) => peopleById.get(id))
    .filter((p): p is Person => Boolean(p));

  const ownChildren = ownFamilies
    .flatMap((f) => children.filter((c) => c.family_id === f.id))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => peopleById.get(c.person_id))
    .filter((p): p is Person => Boolean(p));

  const siblings = parentFamilies
    .flatMap((f) =>
      children.filter((c) => c.family_id === f.id && c.person_id !== person.id)
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => peopleById.get(c.person_id))
    .filter((p): p is Person => Boolean(p));

  const daughtersAndSonsInLaw = ownChildren.flatMap((child) => {
    const childFamilies = families.filter(
      (f) => f.father_id === child.id || f.mother_id === child.id
    );
    return childFamilies
      .flatMap((f) => {
        if (f.father_id === child.id && f.mother_id) {
          const spouse = peopleById.get(f.mother_id);
          return spouse ? [{ spouse, of: child }] : [];
        }
        if (f.mother_id === child.id && f.father_id) {
          const spouse = peopleById.get(f.father_id);
          return spouse ? [{ spouse, of: child }] : [];
        }
        return [];
      })
      .filter(
        (item, index, arr) => arr.findIndex((x) => x.spouse.id === item.spouse.id) === index
      );
  });

  const Field = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <div>
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-0.5">{value}</dd>
      </div>
    );
  };

  const PersonLink = ({ p }: { p: Person }) => (
    <Link
      href={`/thanh-vien/${p.id}`}
      className="block rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <div className="font-medium">{p.display_name}</div>
      <div className="text-xs text-muted-foreground">
        Đời {p.generation}
        {!p.is_living && ' †'}
      </div>
    </Link>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <aside className="lg:col-span-1">
        <div className="rounded-lg border bg-card p-6 text-center">
          {person.avatar_url ? (
            <img
              src={person.avatar_url}
              alt={person.display_name}
              className="mx-auto h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-muted text-5xl font-semibold text-muted-foreground">
              {person.display_name.charAt(0)}
            </div>
          )}
          <h1 className="mt-4 text-2xl font-bold">{person.display_name}</h1>
          {!person.is_living && <p className="text-sm text-muted-foreground">Đã mất †</p>}
          <p className="mt-1 text-sm text-muted-foreground">
            Đời {person.generation}
            {person.chi && ` · Chi ${person.chi}`}
          </p>
        </div>

        <dl className="mt-6 space-y-4 rounded-lg border bg-card p-6">
          <Field label="Họ" value={person.surname} />
          <Field label="Tên đệm" value={person.middle_name} />
          <Field label="Tên" value={person.first_name} />
          <Field label="Giới tính" value={person.gender === 1 ? 'Nam' : person.gender === 2 ? 'Nữ' : null} />
          <Field
            label="Năm sinh"
            value={`${person.birth_year ?? '?'}${person.birth_place ? ` tại ${person.birth_place}` : ''}`}
          />
          {!person.is_living && (
            <>
              <Field
                label="Năm mất"
                value={`${person.death_year ?? '?'}${person.death_place ? ` tại ${person.death_place}` : ''}`}
              />
              <Field label="Ngày giỗ âm lịch" value={person.death_lunar} />
            </>
          )}
          <Field label="Nghề nghiệp" value={person.occupation} />
          <Field label="Quê quán" value={person.hometown} />
          {person.phone && <Field label="Điện thoại" value={person.phone} />}
          {person.email && <Field label="Email" value={person.email} />}
          {person.address && <Field label="Địa chỉ" value={person.address} />}
        </dl>
      </aside>

      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Quan hệ gia đình</h2>

          {parents.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Cha mẹ</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {parents.map((p) => <PersonLink key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {siblings.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Anh chị em ruột</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {siblings.map((p) => <PersonLink key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {spouses.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Vợ / Chồng</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {spouses.map((p) => <PersonLink key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {ownChildren.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Con ({ownChildren.length})</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {ownChildren.map((p) => <PersonLink key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {daughtersAndSonsInLaw.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Con dâu / Con rể ({daughtersAndSonsInLaw.length})
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {daughtersAndSonsInLaw.map(({ spouse, of }) => {
                  const label = of.gender === 1 ? 'Con dâu' : 'Con rể';
                  return (
                    <Link
                      key={`${spouse.id}-${of.id}`}
                      href={`/thanh-vien/${spouse.id}`}
                      className="block rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <div className="font-medium">{spouse.display_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {label} của {of.display_name} · Đời {spouse.generation}
                        {!spouse.is_living && ' †'}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {parents.length === 0 && spouses.length === 0 && ownChildren.length === 0 && daughtersAndSonsInLaw.length === 0 && siblings.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có thông tin quan hệ.</p>
          )}
        </section>

        {person.biography && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Tiểu sử</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{person.biography}</p>
          </section>
        )}

        {person.notes && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Ghi chú</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{person.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}
