'use client';

import React, { useState } from 'react';
import { Search, LoaderCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { labels, api, API_BASE } from '@/lib/shared';

export function Choice({
  value,
  onChange,
  options,
  placeholder = 'Chọn',
  name,
}: {
  value: any;
  onChange: (v: string) => void;
  options: any[];
  placeholder?: string;
  name?: string;
}) {
  return (
    <Select value={String(value || '__all')} onValueChange={(v) => onChange(v === '__all' ? '' : v)} name={name}>
      <SelectTrigger className="select-control" aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {!options.some((x) => (typeof x === 'string' ? x : x.value) === '') && (
          <SelectItem value="__all">{placeholder}</SelectItem>
        )}
        {options.map((x) => {
          const v = typeof x === 'string' ? x : x.value;
          return (
            <SelectItem key={v} value={String(v || '__all')}>
              {typeof x === 'string' ? x : x.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function Blank({
  title = 'Chưa có dữ liệu',
  description = 'Dữ liệu sẽ xuất hiện khi có hoạt động trên hệ thống.',
  children,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Empty className="empty-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children}
    </Empty>
  );
}

export function Loading() {
  return (
    <div className="stack" aria-label="Đang tải">
      <Skeleton className="h-10 w-60" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function Status({ value }: { value: string }) {
  return (
    <span
      className={
        'badge ' +
        (['pending', 'reviewed', 'invited', 'reschedule_requested', 'warning'].includes(value)
          ? 'warn'
          : ['rejected', 'suspended', 'application_lock', 'dismissed'].includes(value)
          ? 'error'
          : '')
      }
    >
      {labels[value] || value}
    </span>
  );
}

export type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: any[];
  hint?: string;
  full?: boolean;
  min?: number;
  max?: number;
};

export function Form({
  fields,
  initial = {},
  submit,
  onSubmit,
}: {
  fields: Field[];
  initial?: any;
  submit: string;
  onSubmit: (d: any) => Promise<any>;
}) {
  const [values, setValues] = useState<any>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          await onSubmit(values);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="responsive-form">
        {fields.map((f) => (
          <label className={'field ' + (f.full ? 'full' : '')} key={f.name}>
            <span>
              {f.label}
              {f.required && <span aria-label="bắt buộc"> *</span>}
            </span>
            {f.options ? (
              <Choice
                value={values[f.name] || ''}
                onChange={(v) => setValues({ ...values, [f.name]: v })}
                options={f.options}
                placeholder={f.label}
              />
            ) : f.type === 'textarea' ? (
              <textarea
                value={values[f.name] || ''}
                required={f.required}
                maxLength={10000}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              />
            ) : f.type === 'checkbox' ? (
              <div className="checkbox-line">
                <Checkbox
                  checked={!!values[f.name]}
                  onCheckedChange={(v) => setValues({ ...values, [f.name]: v })}
                />
                <span>{f.hint}</span>
              </div>
            ) : (
              <input
                type={f.type || 'text'}
                step={f.type === 'number' ? 'any' : undefined}
                value={values[f.name] ?? ''}
                min={f.min}
                max={f.max}
                required={f.required}
                maxLength={f.type === 'text' || !f.type ? 1000 : undefined}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              />
            )}
            {f.hint && f.type !== 'checkbox' && <span className="hint">{f.hint}</span>}
          </label>
        ))}
      </div>
      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}
      <button className="button" disabled={busy}>
        {busy ? (
          <>
            <LoaderCircle className="animate-spin" size={17} />
            Đang lưu…
          </>
        ) : (
          submit
        )}
      </button>
    </form>
  );
}

export function Modal({
  title,
  description,
  open,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description || 'Vui lòng kiểm tra nội dung trước khi xác nhận.'}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function Upload({
  purpose,
  value,
  onChange,
}: {
  purpose: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="field">
      <label htmlFor={'upload-' + purpose}>
        {purpose === 'avatar'
          ? 'Ảnh đại diện'
          : purpose === 'license'
          ? 'Giấy phép kinh doanh'
          : 'Minh chứng'}{' '}
        (PNG, JPEG, PDF · tối đa 5 MB)
      </label>
      <input
        id={'upload-' + purpose}
        type="file"
        accept={purpose === 'avatar' ? '.png,.jpg,.jpeg' : '.png,.jpg,.jpeg,.pdf'}
        disabled={busy}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setError('');
          const d = new FormData();
          d.set('file', f);
          d.set('purpose', purpose);
          try {
            const j = await api('files', 'POST', d);
            onChange(j.id);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && <span>Đang tải tệp…</span>}
      {value && (
        <a className="file-link" href={`${API_BASE}/files/${value}`} target="_blank" rel="noreferrer">
          Xem tệp đã tải lên
        </a>
      )}
      {error && <div className="error-box">{error}</div>}
    </div>
  );
}

export function DataTable({
  rows,
  columns,
}: {
  rows: any[];
  columns: {
    key: string;
    label: string;
  }[];
}) {
  return (
    <div className="table-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key}>{c.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((r, i) => (
              <TableRow key={r.id || i}>
                {columns.map((c) => (
                  <TableCell key={c.key}>{String(r[c.key] ?? '—')}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                Chưa có dữ liệu trong khoảng thời gian này.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
