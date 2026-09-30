'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  ArrowUpRight,
  FileText,
  BriefcaseBusiness,
  CalendarDays,
  ShieldCheck,
  Users,
  Check,
  Download,
  Bell,
  Send,
  ArrowLeft,
  Settings,
  Building2,
  KeyRound,
  LoaderCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { api, labels, industries, jobTypes, fmtDate, fmtTime, salary } from '@/lib/shared';
import { Blank, Loading, Form, Choice, Modal, Status, Upload, DataTable, Field } from '@/components/common-ui';
import { JobCard } from './portal';

function useData(path: string) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      setData(await api(path));
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    setData(null);
    load();
  }, [path]);

  return { data, error, load };
}

function State({ data, error, load, children }: any) {
  if (error)
    return (
      <div className="panel">
        <div className="error-box" role="alert">
          {error}
        </div>
        <div className="row">
          <button className="button light" onClick={load}>
            Thử lại
          </button>
          <Link className="button light" href="/workspace/company">
            Hồ sơ doanh nghiệp
          </Link>
        </div>
      </div>
    );
  if (!data) return <Loading />;
  return children;
}

function Title({ title, subtitle, children }: any) {
  return (
    <div className="title-row">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

async function perform(path: string, data: any, load?: () => any, message = 'Đã cập nhật.') {
  const r = await api(path, 'POST', data);
  toast.success(message);
  await load?.();
  return r;
}

function Confirm({ label, title, description, onConfirm, danger = false }: any) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className={'button small ' + (danger ? 'danger' : 'light')}>{label}</button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || label}</AlertDialogTitle>
          <AlertDialogDescription>
            {description || 'Kiểm tra lại trước khi xác nhận thao tác này.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Quay lại</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              try {
                await onConfirm();
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
          >
            Xác nhận
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function Workspace({ path, user, refreshSession, session }: any) {
  const part = path.split('/')[2] || 'overview';
  const id = path.split('/')[3];

  const menus: any = {
    student: [
      ['overview', 'Tổng quan'],
      ['profile', 'Hồ sơ cá nhân'],
      ['cvs', 'CV của tôi'],
      ['saved', 'Việc đã lưu'],
      ['recommendations', 'Gợi ý việc làm'],
      ['applications', 'Ứng tuyển'],
      ['interviews', 'Phỏng vấn'],
      ['reports', 'Báo cáo'],
      ['notifications', 'Thông báo'],
    ],
    employer: [
      ['overview', 'Tổng quan'],
      ['company', 'Doanh nghiệp'],
      ['branches', 'Chi nhánh'],
      ['jobs', 'Tin tuyển dụng'],
      ['applications', 'Ứng viên'],
      ['interviews', 'Phỏng vấn'],
      ['reviews', 'Đánh giá'],
      ['services', 'Dịch vụ'],
      ['reports', 'Báo cáo'],
      ['notifications', 'Thông báo'],
    ],
    moderator: [
      ['overview', 'Tổng quan'],
      ['moderation', 'Kiểm duyệt'],
      ['profile', 'Cá nhân'],
      ['notifications', 'Thông báo'],
    ],
    admin: [
      ['overview', 'Tổng quan'],
      ['admin', 'Quản trị hệ thống'],
      ['moderation', 'Kiểm duyệt'],
      ['analytics', 'Báo cáo thống kê'],
      ['services', 'Gói dịch vụ'],
      ['profile', 'Cá nhân'],
      ['notifications', 'Thông báo'],
    ],
  };

  const allowed =
    menus[user.role]?.some((m: any) => m[0] === part) ||
    (part === 'applications' && id && ['admin', 'moderator'].includes(user.role));

  return (
    <>
      <div className="row between" style={{ marginBottom: 18 }}>
        <div className="subtitle">
          Không gian làm việc <span style={{ margin: '0 9px' }}>/</span>
          <strong>{labels[user.role] || user.role}</strong>
        </div>
        <span className="subtitle">{user.name}</span>
      </div>

      <nav className="pillnav" aria-label="Chức năng tài khoản">
        {menus[user.role]?.map(([p, t]: string[]) => (
          <Link
            className={part === p ? 'active' : ''}
            key={p}
            href={'/workspace' + (p === 'overview' ? '' : '/' + p)}
          >
            {t}
          </Link>
        ))}
      </nav>

      {!allowed ? (
        <Blank
          title="Chức năng không thuộc vai trò hiện tại"
          description="Dùng thanh điều hướng để mở chức năng của tài khoản."
        />
      ) : part === 'overview' ? (
        <Overview user={user} />
      ) : part === 'profile' ? (
        <Profile user={user} refresh={refreshSession} />
      ) : part === 'cvs' ? (
        id ? (
          <CVDocument id={id} user={user} />
        ) : (
          <CVs user={user} />
        )
      ) : part === 'saved' || part === 'recommendations' ? (
        <Saved kind={part} user={user} />
      ) : part === 'company' ? (
        <CompanyForm />
      ) : part === 'branches' ? (
        <Branches />
      ) : part === 'jobs' ? (
        <EmployerJobs id={id} />
      ) : part === 'applications' ? (
        <Applications user={user} id={id} />
      ) : part === 'interviews' ? (
        <Interviews />
      ) : part === 'reviews' ? (
        <EmployerReviews />
      ) : part === 'reports' ? (
        <Reports user={user} />
      ) : part === 'notifications' ? (
        <Notifications user={user} refresh={refreshSession} session={session} />
      ) : part === 'moderation' ? (
        <Moderation user={user} />
      ) : part === 'admin' ? (
        <Admin />
      ) : part === 'analytics' ? (
        <Analytics />
      ) : part === 'services' ? (
        <Services user={user} />
      ) : null}
    </>
  );
}

function Overview({ user }: any) {
  const items =
    user.role === 'student'
      ? [
          {
            title: 'Hồ sơ năng lực',
            body: 'Tạo nhiều CV theo từng định hướng nghề nghiệp.',
            link: 'cvs',
            icon: FileText,
          },
          {
            title: 'Quá trình ứng tuyển',
            body: 'Theo dõi hồ sơ, lời mời và kết quả tuyển dụng.',
            link: 'applications',
            icon: BriefcaseBusiness,
          },
          {
            title: 'Lịch phỏng vấn',
            body: 'Xác nhận tham gia hoặc đề nghị đổi lịch.',
            link: 'interviews',
            icon: CalendarDays,
          },
        ]
      : user.role === 'employer'
      ? [
          {
            title: 'Xác thực doanh nghiệp',
            body: 'Hoàn thiện thông tin pháp lý trước khi đăng tin.',
            link: 'company',
            icon: ShieldCheck,
          },
          {
            title: 'Tin tuyển dụng',
            body: 'Tạo và theo dõi các vị trí đang tuyển.',
            link: 'jobs',
            icon: BriefcaseBusiness,
          },
          {
            title: 'Quản lý ứng viên',
            body: 'Xem CV, mời phỏng vấn và ghi nhận kết quả.',
            link: 'applications',
            icon: Users,
          },
        ]
      : [
          {
            title: 'Hàng đợi kiểm duyệt',
            body: 'Xem tin mới và thẩm tra các báo cáo vi phạm.',
            link: 'moderation',
            icon: ShieldCheck,
          },
          {
            title: user.role === 'admin' ? 'Quản trị hệ thống' : 'Thông báo',
            body:
              user.role === 'admin'
                ? 'Xác thực pháp lý, cấp quyền và xử lý chế tài.'
                : 'Theo dõi những nội dung cần xử lý.',
            link: user.role === 'admin' ? 'admin' : 'notifications',
            icon: Settings,
          },
          {
            title: user.role === 'admin' ? 'Thống kê & báo cáo' : 'Hồ sơ cá nhân',
            body:
              user.role === 'admin'
                ? 'Tám nhóm báo cáo từ dữ liệu hoạt động thực tế.'
                : 'Cập nhật thông tin tài khoản của bạn.',
            link: user.role === 'admin' ? 'analytics' : 'profile',
            icon: FileText,
          },
        ];

  return (
    <>
      <Title
        title={'Xin chào, ' + (user.name || '').split(' ').slice(-1)[0]}
        subtitle="Tiếp tục công việc của bạn trên CampusJob."
      />
      <div className="grid3">
        {items.map((x) => (
          <Link className="panel" href={'/workspace/' + x.link} key={x.link}>
            <x.icon size={28} />
            <h2 style={{ fontSize: 21, margin: '20px 0 10px' }}>{x.title}</h2>
            <p className="muted" style={{ fontSize: 14, minHeight: 46 }}>
              {x.body}
            </p>
            <span className="row" style={{ fontSize: 14, fontWeight: 600, marginTop: 22 }}>
              Mở chức năng <ArrowUpRight size={16} />
            </span>
          </Link>
        ))}
      </div>
      {user.role === 'student' && (
        <div className="info-box">
          Bạn có thể duy trì tối đa 5 hồ sơ chưa có kết quả cuối. Hoàn thiện trường, chuyên ngành và tạo CV trước khi ứng tuyển.
        </div>
      )}
      {user.role === 'employer' && (
        <div className="info-box">
          Trình tự đăng tin: gửi hồ sơ doanh nghiệp → được xác thực → thêm chi nhánh → gửi tin tuyển dụng để kiểm duyệt.
        </div>
      )}
    </>
  );
}

const profileFields: Field[] = [
  { name: 'name', label: 'Họ và tên', required: true },
  { name: 'phone', label: 'Số điện thoại', type: 'tel' },
  { name: 'studentCode', label: 'Mã số sinh viên' },
  { name: 'school', label: 'Trường đang theo học', required: true },
  { name: 'major', label: 'Chuyên ngành', required: true },
  { name: 'graduation', label: 'Năm tốt nghiệp dự kiến', type: 'number', min: 1950, max: 2100 },
  {
    name: 'availability',
    label: 'Trạng thái tìm việc',
    options: [
      { value: 'looking', label: 'Đang tìm việc' },
      { value: 'not_looking', label: 'Không tìm việc' },
      { value: 'employed', label: 'Đã có việc' },
    ],
  },
  { name: 'about', label: 'Giới thiệu', type: 'textarea', full: true },
];

function Profile({ user, refresh }: any) {
  const [avatar, setAvatar] = useState(user.profile?.avatar || '');

  return (
    <>
      <Title title="Hồ sơ cá nhân" subtitle={user.email} />
      <div className="panel narrow">
        {user.role === 'student' && <Upload purpose="avatar" value={avatar} onChange={setAvatar} />}
        <Form
          fields={
            user.role === 'student'
              ? profileFields
              : profileFields.filter((x) => ['name', 'phone', 'about'].includes(x.name))
          }
          initial={{ ...user.profile, name: user.name }}
          submit="Lưu thay đổi"
          onSubmit={async (d) => {
            await perform('profile', { ...user.profile, ...d, avatar }, refresh);
          }}
        />
      </div>

      <ChangePasswordCard />

      {user.role === 'student' && <SchoolVerification />}
    </>
  );
}

function ChangePasswordCard() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 10) {
      setError('Mật khẩu mới phải có tối thiểu 10 ký tự.');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{10,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setBusy(true);
    try {
      await api('auth/change-password', 'POST', { oldPassword, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel narrow" style={{ marginTop: 24 }}>
      <div className="row" style={{ gap: 10, marginBottom: 16 }}>
        <KeyRound size={22} color="#2d7958" />
        <h2 style={{ fontSize: 20, margin: 0 }}>Đổi mật khẩu tài khoản</h2>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit} className="stack">
        <label className="field full">
          <span>Mật khẩu hiện tại</span>
          <input
            type="password"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            disabled={busy}
          />
        </label>

        <label className="field full">
          <span>Mật khẩu mới</span>
          <input
            type="password"
            required
            placeholder="Tối thiểu 10 ký tự, có hoa, thường, số, ký tự đặc biệt"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={busy}
          />
        </label>

        <label className="field full">
          <span>Xác nhận mật khẩu mới</span>
          <input
            type="password"
            required
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={busy}
          />
        </label>

        <button type="submit" className="button" disabled={busy} style={{ alignSelf: 'start', marginTop: 10 }}>
          {busy ? (
            <>
              <LoaderCircle className="animate-spin" size={16} /> Đang cập nhật…
            </>
          ) : (
            'Cập nhật mật khẩu'
          )}
        </button>
      </form>
    </div>
  );
}

const cvFields: Field[] = [
  { name: 'name', label: 'Tên CV', required: true },
  { name: 'phone', label: 'Số điện thoại liên hệ', type: 'tel' },
  { name: 'summary', label: 'Giới thiệu & mục tiêu nghề nghiệp', type: 'textarea', required: true, full: true },
  { name: 'education', label: 'Học vấn', type: 'textarea', required: true, full: true },
  {
    name: 'skills',
    label: 'Kỹ năng',
    type: 'textarea',
    required: true,
    full: true,
    hint: 'Phân tách bằng dấu phẩy hoặc xuống dòng để tính độ phù hợp.',
  },
  { name: 'experience', label: 'Kinh nghiệm làm việc', type: 'textarea', full: true },
  { name: 'projects', label: 'Dự án đã thực hiện', type: 'textarea', full: true },
  { name: 'certificates', label: 'Chứng chỉ', type: 'textarea', full: true },
  { name: 'portfolio', label: 'Liên kết portfolio', type: 'url', full: true },
  { name: 'is_default', label: 'CV mặc định', type: 'checkbox', hint: 'Ưu tiên CV này khi ứng tuyển.', full: true },
];

function CVs({ user }: any) {
  const s = useData('cvs');
  const [edit, setEdit] = useState<any>(null);
  const [view, setView] = useState<any>(null);

  return (
    <>
      <Title title="CV của tôi" subtitle="Mỗi định hướng nghề nghiệp, một hồ sơ phù hợp.">
        <button className="button" onClick={() => setEdit({})}>
          <Plus size={17} />
          Tạo CV mới
        </button>
      </Title>
      <State {...s}>
        {s.data?.cvs.length ? (
          <div className="grid2">
            {s.data.cvs.map((c: any) => (
              <div className="panel" key={c.id}>
                <div className="row between">
                  <FileText size={27} />
                  {c.is_default === 1 && <span className="badge">Mặc định</span>}
                </div>
                <h2 style={{ margin: '16px 0 7px', fontSize: 22 }}>{c.name}</h2>
                <p className="subtitle">Cập nhật {fmtDate(c.updated)}</p>
                <p className="subtitle" style={{ margin: '10px 0 18px' }}>
                  {c.data.skills}
                </p>
                <div className="row">
                  <button className="button small" onClick={() => setEdit(c)}>
                    Chỉnh sửa
                  </button>
                  <button className="button small light" onClick={() => setView(c)}>
                    Xem CV
                  </button>
                  <Link className="button small light" href={'/workspace/cvs/' + c.id}>
                    In / lưu PDF
                  </Link>
                  <Confirm
                    label="Xóa"
                    danger
                    description="CV chưa dùng ứng tuyển sẽ bị xóa. CV đã nộp được giữ lại để bảo toàn lịch sử."
                    onConfirm={async () => {
                      await api('cvs/' + c.id, 'DELETE');
                      await s.load();
                      toast.success('Đã xóa CV.');
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Blank
            title="CV đầu tiên mở ra cơ hội mới"
            description="Bắt đầu với học vấn, kỹ năng và những dự án bạn đã làm."
          >
            <button className="button" onClick={() => setEdit({})}>
              <Plus size={16} />
              Tạo CV
            </button>
          </Blank>
        )}
      </State>
      <Modal
        title={edit?.id ? 'Chỉnh sửa CV' : 'Tạo CV mới'}
        open={!!edit}
        onClose={() => setEdit(null)}
        description="CV đã nộp trước đây không thay đổi khi bạn chỉnh sửa bản này."
      >
        {edit && (
          <Form
            fields={cvFields}
            initial={{ ...edit, ...edit.data }}
            submit="Lưu CV"
            onSubmit={async (d) => {
              await perform('cvs' + (edit.id ? '/' + edit.id : ''), d, s.load);
              setEdit(null);
            }}
          />
        )}
      </Modal>
      <Modal
        title={view?.name || 'CV'}
        open={!!view}
        onClose={() => setView(null)}
        description="Bản xem hồ sơ năng lực."
      >
        {view && <CVPreview value={{ ...view.data, name: user.name, email: user.email, cvName: view.name }} />}
      </Modal>
    </>
  );
}

function CVPreview({ value: v }: any) {
  return (
    <article>
      <h2>{v.name}</h2>
      <p className="subtitle">
        {v.email} {v.phone && ' · ' + v.phone}
      </p>
      {[
        ['Mục tiêu nghề nghiệp', v.summary],
        ['Học vấn', v.education],
        ['Kỹ năng', v.skills],
        ['Kinh nghiệm', v.experience],
        ['Dự án', v.projects],
        ['Chứng chỉ', v.certificates],
      ]
        .filter((x) => x[1])
        .map(([t, x]) => (
          <section key={t}>
            <h3 className="section-title">{t}</h3>
            <p className="prose">{x}</p>
          </section>
        ))}
      {v.portfolio && (
        <a className="file-link" href={v.portfolio} target="_blank" rel="noreferrer">
          Portfolio ↗
        </a>
      )}
    </article>
  );
}

function Saved({ kind, user }: any) {
  const s = useData(kind);
  return (
    <>
      <Title
        title={kind === 'saved' ? 'Việc làm đã lưu' : 'Gợi ý theo hồ sơ của bạn'}
        subtitle={
          kind === 'saved'
            ? 'Những cơ hội bạn muốn tìm hiểu thêm.'
            : 'Xếp theo mức khớp kỹ năng CV mặc định và chuyên ngành.'
        }
      />
      <State {...s}>
        {s.data?.jobs.length ? (
          <div className="grid2">
            {s.data.jobs.map((j: any) => (
              <JobCard key={j.id} job={j} session={{ user }} saved={kind === 'saved'} onRemove={s.load} />
            ))}
          </div>
        ) : (
          <Blank
            title={kind === 'saved' ? 'Bạn chưa lưu công việc nào' : 'Chưa có công việc để gợi ý'}
            description="Khám phá các tin tuyển dụng được duyệt trên CampusJob."
          >
            <Link className="button" href="/">
              Tìm việc làm
            </Link>
          </Blank>
        )}
      </State>
    </>
  );
}

const companyFields: Field[] = [
  { name: 'name', label: 'Tên pháp lý doanh nghiệp', required: true, full: true },
  { name: 'tax', label: 'Mã số thuế', required: true },
  { name: 'industry', label: 'Lĩnh vực hoạt động', required: true },
  { name: 'address', label: 'Địa chỉ trụ sở', required: true, full: true },
  { name: 'phone', label: 'Số điện thoại', type: 'tel', required: true },
  { name: 'email', label: 'Email công ty', type: 'email', required: true },
  { name: 'website', label: 'Website', type: 'url' },
  {
    name: 'size',
    label: 'Quy mô nhân sự',
    required: true,
    options: ['1–10 nhân sự', '11–50 nhân sự', '51–200 nhân sự', '201–500 nhân sự', 'Trên 500 nhân sự'],
  },
  { name: 'hr', label: 'Họ tên người đại diện / HR', required: true, full: true },
  { name: 'description', label: 'Giới thiệu doanh nghiệp', type: 'textarea', full: true },
];

function CompanyForm() {
  const s = useData('company');
  const [license, setLicense] = useState('');

  useEffect(() => {
    if (s.data?.company) setLicense(s.data.company.license || '');
  }, [s.data]);

  return (
    <>
      <Title
        title="Hồ sơ doanh nghiệp"
        subtitle="Thông tin pháp lý được quản trị viên xác thực trước khi bạn đăng tin."
      />
      <State {...s}>
        <div className="panel narrow">
          {s.data?.company && (
            <div style={{ marginBottom: 24 }}>
              <Status value={s.data.company.status} />
              {s.data.company.reason && <div className="info-box">{s.data.company.reason}</div>}
            </div>
          )}
          {s.data?.company?.status === 'suspended' ? (
            <p>Doanh nghiệp đã bị đình chỉ và không thể gửi lại hồ sơ.</p>
          ) : (
            <>
              <Upload purpose="license" value={license} onChange={setLicense} />
              <Form
                key={s.data?.company?.updated || 'new'}
                fields={companyFields}
                initial={s.data?.company || {}}
                submit="Gửi hồ sơ xác thực"
                onSubmit={async (d) => {
                  await perform('company', { ...d, license }, s.load, 'Đã gửi hồ sơ chờ xác thực.');
                }}
              />
              {s.data?.company?.status === 'active' && (
                <div className="info-box">
                  Thay đổi thông tin pháp lý sẽ đưa doanh nghiệp về trạng thái chờ xác thực; các tin sẽ tạm ngừng hiển thị
                  cho đến khi hồ sơ được duyệt lại.
                </div>
              )}
            </>
          )}
        </div>
      </State>
    </>
  );
}

const branchFields: Field[] = [
  { name: 'name', label: 'Tên chi nhánh', required: true, full: true },
  { name: 'city', label: 'Tỉnh / thành phố', required: true, full: true },
  { name: 'address', label: 'Địa chỉ làm việc', required: true, full: true },
  { name: 'lat', label: 'Vĩ độ', type: 'number', min: -90, max: 90 },
  { name: 'lng', label: 'Kinh độ', type: 'number', min: -180, max: 180 },
];

function Branches() {
  const s = useData('branches');
  const [edit, setEdit] = useState<any>(null);

  return (
    <>
      <Title title="Chi nhánh" subtitle="Mỗi tin tuyển dụng phải gắn với một địa điểm làm việc cụ thể.">
        <button className="button" onClick={() => setEdit({})}>
          <Plus size={17} />
          Thêm chi nhánh
        </button>
      </Title>
      <State {...s}>
        {s.data?.branches.length ? (
          <div className="grid2">
            {s.data.branches.map((b: any) => (
              <div className="panel" key={b.id}>
                <h2>{b.name}</h2>
                <p style={{ margin: '10px 0' }}>{b.address}</p>
                <p className="subtitle">
                  {b.city}
                  {b.lat != null && ` · ${b.lat}, ${b.lng}`}
                </p>
                <div className="form-actions">
                  <button className="button light small" onClick={() => setEdit(b)}>
                    Chỉnh sửa
                  </button>
                  <Confirm
                    label="Xóa"
                    danger
                    onConfirm={async () => {
                      await api('branches/' + b.id, 'DELETE');
                      s.load();
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Blank title="Chưa có chi nhánh" description="Thêm địa điểm làm việc để bắt đầu tạo tin tuyển dụng." />
        )}
      </State>
      <Modal
        title="Thông tin chi nhánh"
        open={!!edit}
        onClose={() => setEdit(null)}
        description="Thay đổi địa điểm của tin đang tuyển sẽ đưa các tin đó về hàng đợi kiểm duyệt."
      >
        {edit && (
          <Form
            fields={branchFields}
            initial={edit}
            submit="Lưu chi nhánh"
            onSubmit={async (d) => {
              await perform('branches' + (edit.id ? '/' + edit.id : ''), d, s.load);
              setEdit(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

const jobFields: Field[] = [
  { name: 'title', label: 'Tên vị trí tuyển dụng', required: true, full: true },
  { name: 'branch', label: 'Chi nhánh', required: true, options: [] },
  { name: 'industry', label: 'Ngành nghề', required: true, options: industries },
  { name: 'type', label: 'Loại hình công việc', required: true, options: jobTypes },
  { name: 'vacancies', label: 'Số lượng cần tuyển', type: 'number', required: true, min: 1, max: 10000 },
  { name: 'salary_min', label: 'Lương từ (VNĐ)', type: 'number', min: 0, hint: 'Để trống cả hai mức nếu thỏa thuận.' },
  { name: 'salary_max', label: 'Lương đến (VNĐ)', type: 'number', min: 0 },
  {
    name: 'salary_unit',
    label: 'Đơn vị lương',
    options: [
      { value: 'month', label: 'Theo tháng' },
      { value: 'hour', label: 'Theo giờ' },
    ],
  },
  { name: 'deadline', label: 'Hạn ứng tuyển', type: 'datetime-local', required: true },
  { name: 'description', label: 'Mô tả công việc', type: 'textarea', required: true, full: true },
  {
    name: 'skills',
    label: 'Kỹ năng tối thiểu',
    type: 'textarea',
    required: true,
    full: true,
    hint: 'Ngăn cách bằng dấu phẩy hoặc xuống dòng.',
  },
  { name: 'preferred', label: 'Kỹ năng ưu tiên', type: 'textarea', full: true },
  { name: 'schedule', label: 'Thời gian làm việc / số buổi mỗi tuần', type: 'textarea', required: true, full: true },
  { name: 'benefits', label: 'Quyền lợi', type: 'textarea', required: true, full: true },
];

function localDate(v: string) {
  if (!v) return '';
  const d = new Date(v);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function EmployerJobs({ id }: any) {
  const s = useData('my-jobs');
  const b = useData('branches');
  const [edit, setEdit] = useState<any>(id === 'new' ? {} : null);

  return (
    <>
      <Title title="Tin tuyển dụng" subtitle="Tin mới và tin chỉnh sửa cần được kiểm duyệt trước khi hiển thị.">
        <button className="button" onClick={() => setEdit({})}>
          <Plus size={17} />
          Đăng tin tuyển dụng
        </button>
      </Title>
      <State {...s}>
        {s.data?.jobs.length ? (
          <div className="stack">
            {s.data.jobs.map((j: any) => (
              <div className="panel" key={j.id}>
                <div className="row between">
                  <div>
                    <Status value={j.status} />
                    <h2 style={{ marginTop: 12, fontSize: 23 }}>
                      <Link href={'/jobs/' + j.id}>{j.title}</Link>
                    </h2>
                  </div>
                  <span className="subtitle">Hạn {fmtDate(j.deadline)}</span>
                </div>
                <div className="job-meta">
                  <span>{j.applications} hồ sơ</span>
                  <span>{j.views} lượt xem</span>
                  <span>
                    {j.hired}/{j.vacancies} đã tuyển
                  </span>
                  <span>{salary(j)}</span>
                </div>
                {j.hired >= j.vacancies && j.status === 'open' && (
                  <div className="info-box">Đã đủ số lượng cần tuyển. Bạn có thể đóng tin này.</div>
                )}
                {j.reason && <div className="info-box">Kiểm duyệt: {j.reason}</div>}
                <div className="form-actions">
                  <button className="button small" onClick={() => setEdit({ ...j, deadline: localDate(j.deadline) })}>
                    Chỉnh sửa & gửi duyệt
                  </button>
                  <Link className="button light small" href="/workspace/applications">
                    Xem ứng viên
                  </Link>
                  {['open', 'paused'].includes(j.status) && (
                    <>
                      <Confirm
                        label={j.status === 'open' ? 'Tạm dừng' : 'Mở lại'}
                        onConfirm={() =>
                          perform('jobs/' + j.id + '/state', { status: j.status === 'open' ? 'paused' : 'open' }, s.load)
                        }
                      />
                      <Confirm
                        label="Đóng tin"
                        onConfirm={() => perform('jobs/' + j.id + '/state', { status: 'closed' }, s.load)}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Blank title="Chưa có tin tuyển dụng" description="Doanh nghiệp đã xác thực có thể gửi tin mới để kiểm duyệt.">
            <button className="button" onClick={() => setEdit({})}>
              Tạo tin đầu tiên
            </button>
          </Blank>
        )}
      </State>
      <Modal
        title={edit?.id ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng'}
        open={!!edit}
        onClose={() => setEdit(null)}
        description="Mô tả rõ công việc, thời gian, lương và quyền lợi."
      >
        {!b.data?.branches.length ? (
          <div className="info-box">
            Cần hoàn tất hồ sơ doanh nghiệp và thêm chi nhánh trước.{' '}
            <Link className="file-link" href="/workspace/branches">
              Quản lý chi nhánh
            </Link>
          </div>
        ) : (
          edit && (
            <Form
              fields={jobFields.map((f) =>
                f.name === 'branch'
                  ? { ...f, options: b.data.branches.map((x: any) => ({ value: x.id, label: x.name })) }
                  : f,
              )}
              initial={{ salary_unit: 'month', vacancies: 1, ...edit }}
              submit="Gửi tin để kiểm duyệt"
              onSubmit={async (d) => {
                await perform(
                  'jobs' + (edit.id ? '/' + edit.id : ''),
                  { ...d, deadline: new Date(d.deadline).toISOString() },
                  s.load,
                  'Đã gửi tin chờ kiểm duyệt.',
                );
                setEdit(null);
              }}
            />
          )
        )}
      </Modal>
    </>
  );
}

function Applications({ user, id }: any) {
  const [sort, setSort] = useState('time');
  const s = useData('applications' + (id ? '/' + id : '?sort=' + sort));

  return (
    <>
      <Title
        title={id ? 'Chi tiết hồ sơ ứng tuyển' : user.role === 'student' ? 'Hồ sơ đã ứng tuyển' : 'Quản lý ứng viên'}
        subtitle={
          id
            ? 'Theo dõi hồ sơ và trao đổi trong từng bước tuyển dụng.'
            : user.role === 'student'
            ? 'Tình trạng xử lý từ lúc nộp đến kết quả cuối.'
            : 'Điểm phù hợp là tỷ lệ kỹ năng bắt buộc xuất hiện trong CV.'
        }
      >
        {!id && user.role === 'employer' && (
          <div style={{ width: 220 }}>
            <Choice
              value={sort}
              onChange={setSort}
              options={[
                { value: 'time', label: 'Nộp trước' },
                { value: 'match', label: 'Phù hợp nhất' },
              ]}
            />
          </div>
        )}
      </Title>
      <State {...s}>
        {id ? (
          <ApplicationDetail user={user} data={s.data} reload={s.load} />
        ) : s.data?.applications.length ? (
          <div className="stack">
            {s.data.applications.map((a: any) => (
              <Link className="panel" key={a.id} href={'/workspace/applications/' + a.id}>
                <div className="row between">
                  <h2 style={{ fontSize: 22 }}>{a.title}</h2>
                  <Status value={a.status} />
                </div>
                <p className="muted" style={{ marginTop: 10 }}>
                  {user.role === 'student' ? a.company_name : a.student_name}
                </p>
                <div className="job-meta">
                  <span>Nộp {fmtDate(a.created)}</span>
                  <span>Khớp {a.score}% kỹ năng</span>
                  <span>
                    Xem hồ sơ <ArrowUpRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Blank
            title="Chưa có hồ sơ ứng tuyển"
            description={
              user.role === 'student'
                ? 'Chọn công việc và gửi CV phù hợp để bắt đầu.'
                : 'Hồ sơ sẽ xuất hiện khi có sinh viên ứng tuyển vào tin của bạn.'
            }
          />
        )}
      </State>
    </>
  );
}

function ApplicationDetail({ user, data, reload }: any) {
  const [modal, setModal] = useState('');
  const [evidence, setEvidence] = useState('');

  if (!data) return null;
  const a = data.application;
  const i = data.interview;
  const student = user.id === a.student;
  const employer = user.id === a.owner;

  const update = async (status: string, reason = '') => {
    const r = await perform('applications/' + a.id, { status, reason }, reload);
    if (r.filled) toast.info('Đã đủ số lượng tuyển. Bạn có thể đóng tin trong mục Tin tuyển dụng.');
  };

  const close = () => setModal('');

  return (
    <>
      <Link className="row subtitle" href="/workspace/applications" style={{ marginBottom: 15 }}>
        <ArrowLeft size={15} />
        Danh sách hồ sơ
      </Link>
      <div className="detail-layout">
        <section className="panel">
          <div className="row between">
            <h2>{a.title}</h2>
            <Status value={a.status} />
          </div>
          <p className="muted" style={{ marginTop: 10 }}>
            {a.company_name} · Nộp {fmtTime(a.created)}
          </p>
          {a.reason && <div className="info-box">{a.reason}</div>}
          <div className="form-actions">
            {student && ['pending', 'viewed'].includes(a.status) && (
              <Confirm
                label="Rút hồ sơ"
                danger
                description="Bạn không thể ứng tuyển lại cùng tin sau khi rút hồ sơ."
                onConfirm={() => update('withdrawn')}
              />
            )}
            {employer && a.status === 'pending' && (
              <Confirm label="Đánh dấu đã xem" onConfirm={() => update('viewed')} />
            )}
            {employer && a.status === 'viewed' && (
              <>
                <button className="button" onClick={() => setModal('invite')}>
                  Mời phỏng vấn
                </button>
                <button className="button light" onClick={() => setModal('reject')}>
                  Từ chối hồ sơ
                </button>
              </>
            )}
            {employer && a.status === 'interview' && i && new Date(i.time).getTime() <= Date.now() && (
              <>
                <Confirm label="Ghi nhận trúng tuyển" onConfirm={() => update('hired')} />
                <button className="button light" onClick={() => setModal('not_hired')}>
                  Không trúng tuyển
                </button>
              </>
            )}
            {student && ['hired', 'not_hired', 'rejected'].includes(a.status) && !data.review && (
              <button className="button" onClick={() => setModal('review')}>
                Đánh giá doanh nghiệp
              </button>
            )}
            {employer && (i || a.status === 'hired') && (
              <button className="button light" onClick={() => setModal('report')}>
                Báo cáo vi phạm
              </button>
            )}
          </div>

          {i && (
            <div className="info-box">
              <div className="row between">
                <h3>Lịch phỏng vấn</h3>
                <Status value={i.response} />
              </div>
              <p>
                <strong>{fmtTime(i.time)}</strong> (giờ Việt Nam)
              </p>
              <p>
                {i.mode === 'online' ? 'Trực tuyến' : 'Trực tiếp'}:{' '}
                {i.mode === 'online' ? (
                  <a href={i.location} className="file-link" target="_blank" rel="noreferrer">
                    Mở liên kết phỏng vấn
                  </a>
                ) : (
                  i.location
                )}
              </p>
              <p className="prose">{i.message}</p>
              {i.response === 'reschedule_requested' && (
                <p>
                  Đề nghị đổi sang {fmtTime(i.proposed)}: {i.request_reason}
                </p>
              )}
              {i.decision && <p>Phản hồi: {i.decision}</p>}
              <div className="form-actions">
                {student && i.response === 'invited' && (
                  <Confirm
                    label="Xác nhận tham gia"
                    onConfirm={() => perform('interviews/' + a.id + '/confirm', {}, reload)}
                  />
                )}
                {student && !i.reschedule_used && ['invited', 'confirmed'].includes(i.response) && (
                  <button className="button light small" onClick={() => setModal('reschedule')}>
                    Đề nghị đổi lịch
                  </button>
                )}
                {employer && i.response === 'reschedule_requested' && (
                  <button className="button small" onClick={() => setModal('resolve')}>
                    Xử lý đổi lịch
                  </button>
                )}
              </div>
            </div>
          )}

          <h3 className="section-title">CV đã nộp · {a.snapshot?.cvName}</h3>
          <CVPreview value={a.snapshot} />

          {a.letter && (
            <>
              <h3 className="section-title">Thư giới thiệu</h3>
              <p className="prose">{a.letter}</p>
            </>
          )}

          {data.review && (
            <div className="info-box">
              <strong>Đánh giá đã gửi: {data.review.rating}/5 sao</strong>
              <p>{data.review.comment}</p>
              {data.review.reply && <p>Phản hồi: {data.review.reply}</p>}
            </div>
          )}
        </section>

        <aside>
          <div className="panel">
            <h3>Lịch sử xử lý</h3>
            {data.history?.map((h: any) => (
              <div className="record" key={h.id}>
                <strong className="subtitle">
                  {labels[h.action] ||
                    ({
                      interview_confirm: 'Xác nhận phỏng vấn',
                      interview_reschedule: 'Đề nghị đổi lịch',
                      interview_resolve: 'Xử lý đổi lịch',
                    } as any)[h.action] ||
                    h.action}
                </strong>
                <p className="subtitle">{fmtTime(h.created)}</p>
              </div>
            ))}
          </div>

          {i && (student || employer) && <Chat application={a.id} user={user} />}
        </aside>
      </div>

      <Modal
        title={
          modal === 'invite'
            ? 'Mời phỏng vấn'
            : modal === 'review'
            ? 'Đánh giá doanh nghiệp'
            : modal === 'report'
            ? 'Báo cáo vi phạm'
            : modal === 'reschedule'
            ? 'Đề nghị đổi lịch'
            : modal === 'resolve'
            ? 'Xử lý đề nghị đổi lịch'
            : 'Kết quả xử lý hồ sơ'
        }
        open={!!modal}
        onClose={close}
      >
        {modal === 'invite' ? (
          <Form
            fields={[
              {
                name: 'time',
                label: 'Ngày giờ phỏng vấn (giờ trên thiết bị)',
                type: 'datetime-local',
                required: true,
                full: true,
              },
              {
                name: 'mode',
                label: 'Hình thức',
                options: [
                  { value: 'onsite', label: 'Trực tiếp' },
                  { value: 'online', label: 'Trực tuyến' },
                ],
                required: true,
                full: true,
              },
              { name: 'location', label: 'Địa điểm hoặc liên kết', required: true, full: true },
              { name: 'message', label: 'Lời nhắn', type: 'textarea', required: true, full: true },
            ]}
            initial={{ mode: 'onsite' }}
            submit="Gửi lời mời"
            onSubmit={async (d) => {
              await perform('interviews/' + a.id, { ...d, time: new Date(d.time).toISOString() }, reload);
              close();
            }}
          />
        ) : modal === 'reschedule' ? (
          <Form
            fields={[
              { name: 'time', label: 'Thời gian đề nghị', type: 'datetime-local', required: true, full: true },
              { name: 'reason', label: 'Lý do', type: 'textarea', required: true, full: true },
            ]}
            submit="Gửi đề nghị (tối đa một lần)"
            onSubmit={async (d) => {
              await perform(
                'interviews/' + a.id + '/reschedule',
                { ...d, time: new Date(d.time).toISOString() },
                reload,
              );
              close();
            }}
          />
        ) : modal === 'resolve' ? (
          <Form
            fields={[
              {
                name: 'decision',
                label: 'Quyết định',
                options: [
                  { value: 'yes', label: 'Chấp nhận lịch đề nghị' },
                  { value: 'no', label: 'Giữ lịch cũ' },
                ],
                required: true,
                full: true,
              },
              { name: 'reason', label: 'Phản hồi cho ứng viên', type: 'textarea', required: true, full: true },
            ]}
            initial={{ decision: 'yes' }}
            submit="Gửi quyết định"
            onSubmit={async (d) => {
              await perform('interviews/' + a.id + '/resolve', { ...d, accept: d.decision === 'yes' }, reload);
              close();
            }}
          />
        ) : modal === 'review' ? (
          <Form
            fields={[
              {
                name: 'rating',
                label: 'Điểm đánh giá',
                required: true,
                options: [1, 2, 3, 4, 5].map((x) => ({ value: String(x), label: x + ' sao' })),
                full: true,
              },
              { name: 'comment', label: 'Nhận xét trải nghiệm', type: 'textarea', required: true, full: true },
            ]}
            submit="Gửi đánh giá công khai"
            onSubmit={async (d) => {
              await perform('reviews', { ...d, application: a.id }, reload);
              close();
            }}
          />
        ) : modal === 'report' ? (
          <>
            <Upload purpose="evidence" value={evidence} onChange={setEvidence} />
            <Form
              fields={[
                {
                  name: 'kind',
                  label: 'Loại vi phạm',
                  options: [
                    { value: 'no_show', label: 'Vắng phỏng vấn đã xác nhận' },
                    { value: 'left_early', label: 'Tự ý bỏ việc trong tuần đầu' },
                  ],
                  required: true,
                  full: true,
                },
                { name: 'start_date', label: 'Ngày bắt đầu làm (nếu báo bỏ việc)', type: 'datetime-local', full: true },
                { name: 'left_date', label: 'Ngày bỏ việc (nếu báo bỏ việc)', type: 'datetime-local', full: true },
                { name: 'description', label: 'Sự việc, thời điểm và căn cứ', type: 'textarea', required: true, full: true },
              ]}
              submit="Gửi báo cáo"
              onSubmit={async (d) => {
                await perform(
                  'reports',
                  {
                    ...d,
                    application: a.id,
                    evidence,
                    start_date: d.start_date ? new Date(d.start_date).toISOString() : undefined,
                    left_date: d.left_date ? new Date(d.left_date).toISOString() : undefined,
                  },
                  reload,
                );
                close();
              }}
            />
          </>
        ) : modal ? (
          <Form
            fields={[{ name: 'reason', label: 'Lý do quyết định', type: 'textarea', required: true, full: true }]}
            submit="Xác nhận kết quả"
            onSubmit={async (d) => {
              await update(modal === 'reject' ? 'rejected' : 'not_hired', d.reason);
              close();
            }}
          />
        ) : null}
      </Modal>
    </>
  );
}

function Chat({ application, user }: any) {
  const s = useData('messages/' + application);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(s.load, 20000);
    return () => clearInterval(t);
  }, [application]);

  return (
    <div className="panel">
      <div className="panel-title">
        <h3>Trao đổi tuyển dụng</h3>
        <button className="subtitle" onClick={s.load}>
          Làm mới
        </button>
      </div>
      {s.error && <p className="error-box">{s.error}</p>}
      <div style={{ maxHeight: 320, overflow: 'auto' }}>
        {s.data?.messages.map((m: any) => (
          <div className={'chat-message ' + (m.sender === user.id ? 'own' : '')} key={m.id}>
            <strong className="subtitle">{m.name}</strong>
            <p className="prose" style={{ fontSize: 14 }}>
              {m.body}
            </p>
            <small>{fmtTime(m.created)}</small>
          </div>
        ))}
        {s.data && !s.data.messages.length && <p className="subtitle">Bắt đầu trao đổi với bên tuyển dụng.</p>}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api('messages/' + application, 'POST', { body });
            setBody('');
            s.load();
          } catch (e: any) {
            toast.error(e.message);
          } finally {
            setBusy(false);
          }
        }}
        style={{ marginTop: 18 }}
      >
        <textarea
          aria-label="Tin nhắn"
          placeholder="Viết tin nhắn…"
          maxLength={4000}
          value={body}
          required
          onChange={(e) => setBody(e.target.value)}
        />
        <button className="button small" style={{ marginTop: 10 }} disabled={busy}>
          <Send size={14} />
          Gửi
        </button>
      </form>
    </div>
  );
}

function Interviews() {
  const s = useData('interviews');
  return (
    <>
      <Title title="Lịch phỏng vấn" subtitle="Ngày giờ hiển thị theo múi giờ Việt Nam (UTC+7)." />
      <State {...s}>
        {s.data?.interviews.length ? (
          <div className="grid2">
            {s.data.interviews.map((i: any) => (
              <Link className="panel" key={i.id} href={'/workspace/applications/' + i.application_id}>
                <div className="row between">
                  <CalendarDays size={26} />
                  <Status value={i.response} />
                </div>
                <h2 style={{ fontSize: 21, marginTop: 20 }}>{i.title}</h2>
                <p style={{ marginTop: 12 }}>{fmtTime(i.time)}</p>
                <p className="subtitle">
                  {i.company_name} · {i.student_name}
                </p>
                <p className="subtitle">{i.mode === 'online' ? 'Trực tuyến' : 'Trực tiếp'}</p>
              </Link>
            ))}
          </div>
        ) : (
          <Blank
            title="Chưa có lịch phỏng vấn"
            description="Lời mời sẽ xuất hiện tại đây khi nhà tuyển dụng hẹn phỏng vấn."
          />
        )}
      </State>
    </>
  );
}

function EmployerReviews() {
  const s = useData('reviews');
  const [reply, setReply] = useState<any>(null);

  return (
    <>
      <Title title="Đánh giá doanh nghiệp" subtitle="Mỗi đánh giá có một lượt phản hồi từ doanh nghiệp." />
      <State {...s}>
        {s.data?.reviews.length ? (
          <div className="panel">
            {s.data.reviews.map((r: any) => (
              <div className="record" key={r.id}>
                <div className="row between">
                  <h3>{r.student_name}</h3>
                  <span className="rating">{'★'.repeat(r.rating)}</span>
                </div>
                <p className="prose">{r.comment}</p>
                <p className="subtitle">
                  {fmtDate(r.created)}
                  {r.hidden ? ' · Đã ẩn bởi bộ phận kiểm duyệt' : ''}
                </p>
                {r.reply ? (
                  <div className="info-box">Phản hồi: {r.reply}</div>
                ) : (
                  <button className="button small light" style={{ marginTop: 12 }} onClick={() => setReply(r)}>
                    Phản hồi
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Blank title="Chưa có đánh giá" description="Ứng viên có thể đánh giá khi hồ sơ đã có kết quả cuối." />
        )}
      </State>
      <Modal title="Phản hồi đánh giá" open={!!reply} onClose={() => setReply(null)}>
        {reply && (
          <Form
            fields={[{ name: 'reply', label: 'Nội dung phản hồi', type: 'textarea', required: true, full: true }]}
            submit="Đăng phản hồi"
            onSubmit={async (d) => {
              await perform('reviews/' + reply.id, d, s.load);
              setReply(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

function Reports({ user }: any) {
  const s = useData('reports');
  return (
    <>
      <Title title="Báo cáo đã gửi" subtitle="Theo dõi kết quả thẩm tra các phản ánh của bạn." />
      <div className="info-box">
        {user.role === 'student'
          ? 'Để phản ánh doanh nghiệp, mở trang thông tin doanh nghiệp và chọn “Báo cáo doanh nghiệp”.'
          : 'Để phản ánh sinh viên, mở chi tiết hồ sơ ứng tuyển và chọn “Báo cáo vi phạm”.'}
      </div>
      <State {...s}>
        {s.data?.reports.length ? (
          <div className="panel">
            {s.data.reports.map((r: any) => (
              <div className="record" key={r.id}>
                <div className="row between">
                  <h3>{labels[r.kind]}</h3>
                  <Status value={r.status} />
                </div>
                <p className="subtitle">
                  Đối tượng:{' '}
                  {s.data.companies?.find((x: any) => x.id === r.target)?.name ||
                    s.data.users?.find((x: any) => x.id === r.target)?.name ||
                    'Chưa xác định'}
                </p>
                <p className="prose">{r.description}</p>
                <p className="subtitle">Gửi {fmtTime(r.created)}</p>
                {r.evidence && (
                  <a className="file-link" href={'/api/files/' + r.evidence} target="_blank" rel="noreferrer">
                    Xem minh chứng
                  </a>
                )}
                {r.decision && <div className="info-box">Kết luận: {r.decision}</div>}
              </div>
            ))}
          </div>
        ) : (
          <Blank
            title="Bạn chưa gửi báo cáo"
            description="Phản ánh đúng sự việc và cung cấp minh chứng để bộ phận kiểm duyệt có thể xử lý."
          />
        )}
      </State>
    </>
  );
}

function Notifications({ user, refresh, session }: any) {
  const s = useData('notifications');
  const [prefs, setPrefs] = useState(user.profile?.emailPreferences || {});
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Title title="Thông báo" subtitle="Các cập nhật liên quan đến hồ sơ và quá trình tuyển dụng.">
        <button
          className="button light"
          onClick={async () => {
            try {
              await perform('notifications', {}, s.load);
            } catch (e: any) {
              toast.error(e.message);
            }
          }}
        >
          Đánh dấu tất cả đã đọc
        </button>
      </Title>
      <div className="detail-layout">
        <section>
          <State {...s}>
            {s.data?.notifications.length ? (
              <div className="panel">
                {s.data.notifications.map((n: any) => (
                  <div className="notice" key={n.id} style={{ opacity: n.read ? 0.7 : 1 }}>
                    <div className="row between">
                      <strong>{n.title}</strong>
                      {!n.read && <span className="badge">Mới</span>}
                    </div>
                    <p className="subtitle">{n.body}</p>
                    <div className="row between" style={{ marginTop: 10 }}>
                      <small>{fmtTime(n.created)}</small>
                      <Link
                        className="file-link"
                        href={n.url || '#'}
                        onClick={() => api('notifications/' + n.id, 'POST', {}).catch(() => {})}
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Blank
                title="Bạn đã cập nhật tất cả"
                description="Thông báo mới sẽ xuất hiện khi có hoạt động liên quan đến bạn."
              />
            )}
          </State>
        </section>
        <aside className="panel">
          <h3>Thông báo qua email</h3>
          <p className="subtitle" style={{ margin: '12px 0' }}>
            {session.emailConfigured
              ? 'Email được gửi đến ' + user.email
              : 'Email chưa được người vận hành cấu hình. Bạn vẫn nhận thông báo trong ứng dụng.'}
          </p>
          {[
            ['application', 'Ứng tuyển & kết quả'],
            ['interview', 'Lịch phỏng vấn'],
            ['moderation', 'Kiểm duyệt'],
            ['deadline', 'Hạn tuyển dụng'],
            ['review', 'Đánh giá'],
            ['message', 'Tin nhắn'],
            ['report', 'Báo cáo'],
            ['sanction', 'Cảnh cáo & chế tài'],
          ].map(([k, v]) => (
            <label className="row between" key={k} style={{ fontSize: 14, padding: '10px 0' }}>
              {v}
              <Switch
                checked={prefs[k] !== false}
                onCheckedChange={(v) => setPrefs({ ...prefs, [k]: v })}
                aria-label={v}
              />
            </label>
          ))}
          <button
            className="button"
            style={{ marginTop: 15 }}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await perform(
                  'profile',
                  { ...user.profile, name: user.name, emailPreferences: prefs },
                  refresh,
                  'Đã lưu tùy chọn.',
                );
              } catch (e: any) {
                toast.error(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Lưu tùy chọn
          </button>
        </aside>
      </div>
    </>
  );
}

function Moderation({ user }: any) {
  const s = useData('moderation');
  const [edit, setEdit] = useState<any>(null);

  return (
    <>
      <Title
        title="Hàng đợi kiểm duyệt"
        subtitle="Tin tuyển dụng, phản ánh và nội dung đánh giá cần được xem xét."
      />
      <State {...s}>
        <Tabs defaultValue="jobs">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="jobs">Tin chờ duyệt ({s.data?.jobs.length || 0})</TabsTrigger>
            <TabsTrigger value="reports">Báo cáo ({s.data?.reports.length || 0})</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          </TabsList>
          <TabsContent value="jobs">
            {s.data?.jobs.length ? (
              <div className="stack">
                {s.data.jobs.map((j: any) => (
                  <div className="panel" key={j.id}>
                    <div className="row between">
                      <h2 style={{ fontSize: 23 }}>{j.title}</h2>
                      <span className="badge">{j.type}</span>
                    </div>
                    <p className="muted" style={{ margin: '12px 0' }}>
                      {j.company_name} · <Status value={j.company_status} />
                    </p>
                    <p className="subtitle">
                      {salary(j)} · Hạn {fmtDate(j.deadline)}
                    </p>
                    <p className="prose" style={{ margin: '15px 0' }}>
                      {j.description}
                    </p>
                    <p className="subtitle">Yêu cầu: {j.skills}</p>
                    <p className="subtitle">Thời gian: {j.schedule}</p>
                    <p className="subtitle">Quyền lợi: {j.benefits}</p>
                    <div className="form-actions">
                      <Link className="button light small" href={'/jobs/' + j.id}>
                        Xem toàn bộ tin
                      </Link>
                      <button className="button small" onClick={() => setEdit({ kind: 'job', ...j })}>
                        Xét duyệt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Blank title="Không có tin đang chờ duyệt" description="Tin mới từ doanh nghiệp sẽ xuất hiện tại đây." />
            )}
          </TabsContent>
          <TabsContent value="reports">
            {s.data?.reports.length ? (
              <div className="panel">
                {s.data.reports.map((r: any) => (
                  <div className="record" key={r.id}>
                    <div className="row between">
                      <h3>
                        {labels[r.kind]} · {r.target_name || 'Đối tượng cần xác minh'}
                      </h3>
                      <Status value={r.status} />
                    </div>
                    <p className="subtitle">Người báo cáo: {r.reporter_name}</p>
                    <p className="prose">{r.description}</p>
                    {r.evidence && (
                      <a className="file-link" href={'/api/files/' + r.evidence} target="_blank" rel="noreferrer">
                        Đọc minh chứng
                      </a>
                    )}
                    {r.application && (
                      <Link
                        className="button light small"
                        style={{ marginLeft: 10 }}
                        href={'/workspace/applications/' + r.application}
                      >
                        Hồ sơ liên quan
                      </Link>
                    )}
                    {r.recommendation ? (
                      <div className="info-box">Kết luận sơ bộ: {r.recommendation}</div>
                    ) : (
                      <div className="form-actions">
                        <button className="button small" onClick={() => setEdit({ ...r, kind: 'report' })}>
                          Thẩm tra & đề xuất
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Blank title="Không có báo cáo chờ thẩm tra" />
            )}
          </TabsContent>
          <TabsContent value="reviews">
            <div className="panel">
              {s.data?.reviews.length ? (
                s.data.reviews.map((r: any) => (
                  <div className="record" key={r.id}>
                    <div className="row between">
                      <h3>{r.company_name}</h3>
                      <span className="rating">{r.rating}/5 sao</span>
                    </div>
                    <p className="prose">{r.comment}</p>
                    <div className="form-actions">
                      <span className="subtitle">{r.hidden ? 'Đã ẩn' : 'Đang công khai'}</span>
                      <button className="button small light" onClick={() => setEdit({ ...r, kind: 'review' })}>
                        {r.hidden ? 'Khôi phục' : 'Ẩn đánh giá'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">Chưa có đánh giá.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </State>
      <Modal
        title={
          edit?.kind === 'job'
            ? 'Quyết định kiểm duyệt'
            : edit?.kind === 'report'
            ? 'Kết luận thẩm tra'
            : 'Kiểm duyệt đánh giá'
        }
        open={!!edit}
        onClose={() => setEdit(null)}
      >
        {edit && (
          <Form
            fields={
              edit.kind === 'job'
                ? [
                    {
                      name: 'decision',
                      label: 'Quyết định',
                      options: [
                        { value: 'approve', label: 'Duyệt tin' },
                        { value: 'reject', label: 'Từ chối và yêu cầu chỉnh sửa' },
                      ],
                      required: true,
                      full: true,
                    },
                    { name: 'reason', label: 'Nhận xét kiểm duyệt', type: 'textarea', required: true, full: true },
                  ]
                : edit.kind === 'report'
                ? [
                    {
                      name: 'recommendation',
                      label: 'Kết luận sơ bộ & đề xuất xử lý',
                      type: 'textarea',
                      required: true,
                      full: true,
                    },
                  ]
                : [{ name: 'reason', label: 'Lý do', type: 'textarea', required: true, full: true }]
            }
            submit="Lưu quyết định"
            onSubmit={async (d) => {
              await perform('moderation/' + edit.id + '/' + edit.kind, { ...d, hidden: !edit.hidden }, s.load);
              setEdit(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

function Admin() {
  const s = useData('admin/overview');
  const [edit, setEdit] = useState<any>(null);

  return (
    <>
      <Title
        title="Quản trị hệ thống"
        subtitle="Xác thực pháp lý, quản lý quyền và xử lý vi phạm có căn cứ."
      />
      <State {...s}>
        <div className="grid3" style={{ marginBottom: 24 }}>
          {[
            ['Doanh nghiệp chờ xác thực', s.data?.companies?.filter((c: any) => c.status === 'pending').length || 0],
            [
              'Báo cáo chưa có kết luận',
              s.data?.reports?.filter((r: any) => ['pending', 'reviewed'].includes(r.status)).length || 0,
            ],
            ['Tài khoản đã đăng ký', s.data?.users?.length || 0],
          ].map(([t, n]) => (
            <div className="panel" key={t}>
              <p className="subtitle">{t}</p>
              <div className="stat">{n}</div>
            </div>
          ))}
        </div>
        <Tabs defaultValue="companies">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="companies">Doanh nghiệp</TabsTrigger>
            <TabsTrigger value="users">Tài khoản & quyền</TabsTrigger>
            <TabsTrigger value="reports">Kết luận vi phạm</TabsTrigger>
            <TabsTrigger value="sanctions">Chế tài</TabsTrigger>
            <TabsTrigger value="audit">Nhật ký</TabsTrigger>
            <TabsTrigger value="operations">Vận hành</TabsTrigger>
          </TabsList>
          <TabsContent value="companies">
            <div className="panel">
              {s.data?.companies?.length ? (
                s.data.companies.map((c: any) => (
                  <div className="record" key={c.id}>
                    <div className="row between">
                      <h2 style={{ fontSize: 22 }}>{c.name}</h2>
                      <Status value={c.status} />
                    </div>
                    <div className="grid2" style={{ marginTop: 15, fontSize: 14 }}>
                      <div>
                        <p>
                          Mã số thuế: <strong>{c.tax}</strong>
                        </p>
                        <p>Trụ sở: {c.address}</p>
                        <p>
                          Lĩnh vực: {c.industry} · {c.size}
                        </p>
                      </div>
                      <div>
                        <p>HR: {c.hr}</p>
                        <p>Email: {c.email}</p>
                        <p>Điện thoại: {c.phone}</p>
                      </div>
                    </div>
                    {c.license && (
                      <a href={'/api/files/' + c.license} className="file-link" target="_blank" rel="noreferrer">
                        Giấy phép kinh doanh
                      </a>
                    )}
                    {c.flag === 1 && (
                      <div className="info-box">
                        Có cờ cảnh báo cần xem xét. Không đồng nghĩa doanh nghiệp đã vi phạm.
                      </div>
                    )}
                    {c.reason && <p className="subtitle">Kết quả gần nhất: {c.reason}</p>}
                    <div className="form-actions">
                      {c.status === 'pending' && (
                        <button className="button small" onClick={() => setEdit({ ...c, kind: 'company' })}>
                          Xét duyệt hồ sơ
                        </button>
                      )}
                      {c.flag === 1 && (
                        <button className="button small light" onClick={() => setEdit({ ...c, kind: 'clear_flag' })}>
                          Gỡ cờ sau thẩm tra
                        </button>
                      )}
                      {c.status === 'active' && (
                        <button className="button small light" onClick={() => setEdit({ ...c, kind: 'suspend' })}>
                          Xem xét đình chỉ
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">Chưa có doanh nghiệp đăng ký.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="users">
            <div className="panel">
              {s.data?.users?.map((u: any) => (
                <div className="record" key={u.id}>
                  <div className="row between">
                    <div>
                      <h3>{u.name}</h3>
                      <p className="subtitle">{u.email}</p>
                    </div>
                    <Status value={u.role} />
                  </div>
                  <div className="form-actions">
                    {['student', 'moderator'].includes(u.role) && (
                      <Confirm
                        label={u.role === 'student' ? 'Cấp quyền kiểm duyệt' : 'Thu hồi quyền kiểm duyệt'}
                        description="Quyền được áp dụng tại máy chủ ngay sau khi xác nhận. Người dùng không được tự thay đổi quyền."
                        onConfirm={() =>
                          perform(
                            'admin/' + u.id + '/role',
                            { role: u.role === 'student' ? 'moderator' : 'student' },
                            s.load,
                          )
                        }
                      />
                    )}{' '}
                    {u.role === 'student' && (
                      <button className="button small light" onClick={() => setEdit({ ...u, kind: 'lock' })}>
                        Khóa quyền ứng tuyển
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reports">
            <div className="panel">
              {s.data?.reports?.length ? (
                s.data.reports.map((r: any) => (
                  <div className="record" key={r.id}>
                    <div className="row between">
                      <h3>{labels[r.kind]}</h3>
                      <Status value={r.status} />
                    </div>
                    <p className="subtitle">
                      Đối tượng:{' '}
                      {s.data.companies?.find((x: any) => x.id === r.target)?.name ||
                        s.data.users?.find((x: any) => x.id === r.target)?.name ||
                        'Chưa xác định'}
                    </p>
                    <p className="prose">{r.description}</p>
                    <p className="subtitle">Gửi {fmtTime(r.created)}</p>
                    {r.evidence && (
                      <a className="file-link" href={'/api/files/' + r.evidence} target="_blank" rel="noreferrer">
                        Xem minh chứng
                      </a>
                    )}
                    {r.application && (
                      <Link
                        className="button small light"
                        href={'/workspace/applications/' + r.application}
                        style={{ marginLeft: 10 }}
                      >
                        Đối chiếu hồ sơ
                      </Link>
                    )}
                    {r.recommendation && <div className="info-box">Thẩm tra: {r.recommendation}</div>}
                    {r.decision ? (
                      <div className="info-box">Kết luận: {r.decision}</div>
                    ) : (
                      <div className="form-actions">
                        <button className="button small" onClick={() => setEdit({ ...r, kind: 'report' })}>
                          Kết luận báo cáo
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="muted">Chưa có báo cáo.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="sanctions">
            <div className="panel">
              <DataTable
                rows={(s.data?.sanctions || []).map((x: any) => ({
                  ...x,
                  kind: labels[x.kind],
                  target:
                    s.data.users.find((u: any) => u.id === x.target)?.name ||
                    s.data.companies.find((c: any) => c.id === x.target)?.name ||
                    x.target,
                  created: fmtDate(x.created),
                  until: x.until ? fmtDate(x.until) : 'Không thời hạn',
                }))}
                columns={[
                  { key: 'target', label: 'Đối tượng' },
                  { key: 'kind', label: 'Chế tài' },
                  { key: 'reason', label: 'Căn cứ' },
                  { key: 'created', label: 'Bắt đầu' },
                  { key: 'until', label: 'Kết thúc' },
                ]}
              />
            </div>
          </TabsContent>
          <TabsContent value="audit">
            <div className="panel">
              <DataTable
                rows={(s.data?.audit || []).map((x: any) => ({
                  ...x,
                  created: fmtTime(x.created),
                  actor_name: x.actor_name || 'Hệ thống',
                }))}
                columns={[
                  { key: 'created', label: 'Thời gian' },
                  { key: 'actor_name', label: 'Người thực hiện' },
                  { key: 'entity', label: 'Đối tượng' },
                  { key: 'action', label: 'Thao tác' },
                  { key: 'detail', label: 'Nội dung' },
                ]}
              />
            </div>
          </TabsContent>
          <TabsContent value="operations">
            <div className="panel">
              <h2>Tác vụ vận hành</h2>
              <p className="muted" style={{ margin: '15px 0' }}>
                Đóng tin quá hạn, tạo nhắc hết hạn và xử lý hàng đợi email. Tin quá hạn luôn bị chặn ứng tuyển kể cả
                trước khi tác vụ chạy.
              </p>
              <div className="info-box">
                {s.data?.emailConfigured
                  ? 'Nhà cung cấp email đã được cấu hình.'
                  : 'Chưa cấu hình nhà cung cấp email. Hệ thống lưu hàng đợi và không báo gửi thành công khi chưa gửi thật.'}
              </div>
              <DataTable
                rows={(s.data?.mail || []).map((m: any) => ({ ...m, status: labels[m.status] }))}
                columns={[
                  { key: 'status', label: 'Trạng thái email' },
                  { key: 'total', label: 'Số lượng' },
                ]}
              />
              <button
                className="button"
                style={{ marginTop: 20 }}
                onClick={async () => {
                  try {
                    const r = await perform('admin/maintenance', {}, s.load, 'Đã chạy tác vụ vận hành.');
                    if (r.email === 'not_configured') toast.info('Email chưa được cấu hình.');
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}
              >
                Chạy tác vụ ngay
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </State>
      <Modal
        title={
          edit?.kind === 'company'
            ? 'Xét duyệt doanh nghiệp'
            : edit?.kind === 'suspend'
            ? 'Đình chỉ doanh nghiệp'
            : edit?.kind === 'lock'
            ? 'Khóa quyền ứng tuyển'
            : edit?.kind === 'clear_flag'
            ? 'Gỡ cờ cảnh báo'
            : 'Kết luận báo cáo'
        }
        open={!!edit}
        onClose={() => setEdit(null)}
      >
        {edit && (
          <Form
            fields={
              edit.kind === 'company'
                ? [
                    {
                      name: 'decision',
                      label: 'Quyết định',
                      options: [
                        { value: 'approve', label: 'Xác thực & kích hoạt' },
                        { value: 'reject', label: 'Từ chối hồ sơ' },
                      ],
                      required: true,
                      full: true,
                    },
                    { name: 'reason', label: 'Căn cứ xét duyệt', type: 'textarea', required: true, full: true },
                  ]
                : edit.kind === 'lock'
                ? [
                    {
                      name: 'days',
                      label: 'Số ngày khóa (30–90)',
                      type: 'number',
                      min: 30,
                      max: 90,
                      required: true,
                      full: true,
                    },
                    { name: 'reason', label: 'Lý do và căn cứ vi phạm', type: 'textarea', required: true, full: true },
                  ]
                : edit.kind === 'report'
                ? [
                    {
                      name: 'result',
                      label: 'Kết quả xác minh',
                      options: [
                        { value: 'confirm', label: 'Xác nhận vi phạm' },
                        { value: 'dismiss', label: 'Không đủ căn cứ / bác báo cáo' },
                      ],
                      required: true,
                      full: true,
                    },
                    { name: 'decision', label: 'Kết luận và căn cứ', type: 'textarea', required: true, full: true },
                  ]
                : [
                    {
                      name: 'reason',
                      label:
                        edit.kind === 'clear_flag'
                          ? 'Căn cứ gỡ cờ'
                          : 'Căn cứ đình chỉ (phải có báo cáo đã xác nhận)',
                      type: 'textarea',
                      required: true,
                      full: true,
                    },
                  ]
            }
            submit="Lưu quyết định quản trị"
            onSubmit={async (d) => {
              const act = edit.kind === 'suspend' ? 'company' : edit.kind;
              await perform(
                'admin/' + edit.id + '/' + act,
                { ...d, decision: edit.kind === 'suspend' ? 'suspend' : d.decision, confirm: d.result === 'confirm' },
                s.load,
              );
              setEdit(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

const reportColumns: Record<string, any[]> = {
  monthly: [
    ['month', 'Tháng'],
    ['industry', 'Ngành nghề'],
    ['type', 'Loại hình'],
    ['total', 'Số tin'],
  ],
  pending: [
    ['kind', 'Loại'],
    ['title', 'Tên'],
    ['created', 'Ngày gửi'],
  ],
  sanctions: [
    ['name', 'Tài khoản'],
    ['kind', 'Chế tài'],
    ['reason', 'Căn cứ'],
    ['until', 'Hết hạn'],
  ],
  top: [
    ['name', 'Doanh nghiệp'],
    ['views', 'Lượt xem'],
    ['applications', 'Ứng tuyển'],
  ],
  hires: [
    ['industry', 'Ngành nghề'],
    ['total', 'Trúng tuyển'],
  ],
  funnel: [
    ['title', 'Tin tuyển dụng'],
    ['views', 'Lượt xem'],
    ['applications', 'Ứng tuyển'],
    ['interviews', 'Phỏng vấn'],
    ['hired', 'Trúng tuyển'],
  ],
  ratings: [
    ['name', 'Doanh nghiệp'],
    ['month', 'Tháng'],
    ['average', 'Điểm trung bình'],
    ['total', 'Số đánh giá'],
  ],
  students: [
    ['name', 'Sinh viên'],
    ['applications', 'Hồ sơ'],
    ['skill_match', 'Khớp kỹ năng TB (%)'],
    ['interviews', 'Phỏng vấn'],
    ['interview_rate', 'Tỷ lệ mời (%)'],
  ],
};

const reportNames: Record<string, string> = {
  monthly: '01 · Tin tuyển dụng theo tháng',
  pending: '02 · Hàng đợi xét duyệt',
  sanctions: '03 · Cảnh cáo và chế tài',
  top: '04 · Doanh nghiệp thu hút ứng viên',
  hires: '05 · Kết quả trúng tuyển',
  funnel: '06 · Phễu tuyển dụng',
  ratings: '07 · Xu hướng đánh giá',
  students: '08 · Mức độ hoạt động sinh viên',
};

function Analytics() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('monthly');
  const s = useData('admin/reports' + query);

  const exportCSV = () => {
    const columns = reportColumns[tab];
    const quote = (v: any) => {
      let str = String(v ?? '');
      if (/^[=+@-]/.test(str)) str = "'" + str;
      return '"' + str.replaceAll('"', '""') + '"';
    };
    const text =
      '\uFEFF' +
      [
        columns.map((c) => quote(c[1])).join(','),
        ...s.data[tab].map((r: any) => columns.map((c) => quote(r[c[0]])).join(',')),
      ].join('\r\n');
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    link.href = url;
    link.download = 'campusjob-' + tab + '.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Title title="Báo cáo & thống kê" subtitle="Số liệu được tính trực tiếp từ các hoạt động đã ghi nhận." />
      <div className="panel" style={{ marginBottom: 22 }}>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            const p = new URLSearchParams();
            if (from) p.set('from', new Date(from + 'T00:00:00+07:00').toISOString());
            if (to) p.set('to', new Date(to + 'T23:59:59.999+07:00').toISOString());
            setQuery('?' + p.toString());
          }}
        >
          <label className="field" style={{ margin: 0 }}>
            Từ ngày
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="field" style={{ margin: 0 }}>
            Đến ngày
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button className="button" style={{ alignSelf: 'end' }}>
            Áp dụng
          </button>
        </form>
      </div>
      <State {...s}>
        <div className="panel">
          <div className="row between" style={{ marginBottom: 25 }}>
            <div style={{ minWidth: 280, maxWidth: '100%' }}>
              <Choice
                value={tab}
                onChange={setTab}
                options={Object.entries(reportNames).map(([value, label]) => ({ value, label }))}
              />
            </div>
            <button className="button light" onClick={exportCSV}>
              <Download size={16} />
              Xuất CSV
            </button>
          </div>
          <DataTable
            rows={(s.data?.[tab] || []).map((r: any) => ({
              ...r,
              ...(r.kind ? { kind: labels[r.kind] || r.kind } : {}),
              ...(r.created ? { created: fmtDate(r.created) } : {}),
              ...(r.until ? { until: fmtDate(r.until) } : {}),
            }))}
            columns={reportColumns[tab]?.map(([key, label]) => ({ key, label })) || []}
          />
          {tab === 'students' && (
            <div className="info-box">
              “Khớp kỹ năng” là tỷ lệ kỹ năng bắt buộc xuất hiện trong CV đã nộp. Đây là chỉ số hỗ trợ, không kết luận
              chất lượng hoặc năng lực ứng viên.
            </div>
          )}
          {tab === 'funnel' && (
            <div className="info-box">
              Các cột đếm sự kiện xảy ra trong kỳ được chọn; đây không phải phân tích theo cùng một nhóm ứng viên.
            </div>
          )}
        </div>
      </State>
    </>
  );
}

function SchoolVerification() {
  const s = useData('school-verification');

  return (
    <div className="panel narrow" style={{ marginTop: 24 }}>
      <h2>Xác thực email trường</h2>
      <p className="subtitle" style={{ margin: '12px 0 20px' }}>
        Xác nhận quyền truy cập hộp thư .edu.vn; không thay thế việc xác minh nội dung CV.
      </p>
      <State {...s}>
        {s.data?.verification?.verified ? (
          <div className="info-box">
            <ShieldCheck size={20} />
            Đã xác thực {s.data.verification.email} ngày {fmtDate(s.data.verification.verified)}.
          </div>
        ) : !s.data?.available ? (
          <div className="info-box">
            Chức năng sẽ mở khi người vận hành cấu hình dịch vụ gửi email. Hệ thống không tự cấp nhãn xác thực.
          </div>
        ) : (
          <>
            <Form
              fields={[{ name: 'email', label: 'Email trường (.edu.vn)', type: 'email', required: true, full: true }]}
              initial={{ email: s.data.verification?.email || '' }}
              submit="Gửi mã xác thực"
              onSubmit={async (d) => {
                await perform('school-verification/send', d, s.load, 'Mã đã được gửi đến email trường.');
              }}
            />
            {s.data.verification && (
              <div style={{ marginTop: 25 }}>
                <Form
                  fields={[{ name: 'code', label: 'Mã 6 chữ số', required: true, full: true }]}
                  submit="Xác nhận email"
                  onSubmit={async (d) => {
                    await perform('school-verification/confirm', d, s.load, 'Email trường đã được xác thực.');
                  }}
                />
              </div>
            )}
          </>
        )}
      </State>
    </div>
  );
}

function Services({ user }: any) {
  const s = useData('plans');
  const o = useData(user.role === 'employer' ? 'orders' : 'plans');
  const j = useData(user.role === 'employer' ? 'my-jobs' : 'plans');
  const [edit, setEdit] = useState<any>(null);
  const [purchase, setPurchase] = useState<any>(null);

  return (
    <>
      <Title
        title={user.role === 'admin' ? 'Gói dịch vụ tuyển dụng' : 'Dịch vụ tuyển dụng'}
        subtitle="Gói tin nổi bật chỉ được kích hoạt sau xác nhận thanh toán từ cổng thanh toán."
      >
        {user.role === 'admin' && (
          <button className="button" onClick={() => setEdit({})}>
            <Plus size={16} />
            Tạo gói dịch vụ
          </button>
        )}
      </Title>
      <State {...s}>
        {!s.data?.available && (
          <div className="info-box">
            Thanh toán chưa được cấu hình. Không thể tạo giao dịch hoặc kích hoạt tin nổi bật lúc này.
          </div>
        )}
        {s.data?.plans.length ? (
          <div className="grid3">
            {s.data.plans.map((p: any) => (
              <div className="panel" key={p.id}>
                <h2>{p.name}</h2>
                <p className="stat" style={{ marginTop: 15, fontSize: 27 }}>
                  {p.amount.toLocaleString('vi-VN')} đ
                </p>
                <p className="muted">{p.days} ngày hiển thị nổi bật</p>
                <p className="subtitle" style={{ marginTop: 10 }}>
                  Tin vẫn phải còn hạn và được kiểm duyệt.
                </p>
                <div className="form-actions">
                  {user.role === 'admin' ? (
                    <Confirm
                      label={p.active ? 'Ngừng bán' : 'Mở bán'}
                      onConfirm={() => perform('plans/' + p.id, { active: !p.active }, s.load)}
                    />
                  ) : (
                    <button className="button" disabled={!s.data.available} onClick={() => setPurchase(p)}>
                      Chọn tin & thanh toán
                    </button>
                  )}
                </div>
                {!p.active && <span className="badge warn">Đã ngừng bán</span>}
              </div>
            ))}
          </div>
        ) : (
          <Blank
            title="Chưa có gói dịch vụ"
            description={
              user.role === 'admin'
                ? 'Tạo gói với mức giá và thời lượng do nhóm quyết định. Không có bảng giá mẫu được tạo sẵn.'
                : 'Người vận hành chưa mở bán gói tin nổi bật.'
            }
          />
        )}
      </State>

      {user.role === 'employer' && (
        <div className="panel" style={{ marginTop: 25 }}>
          <h2 style={{ marginBottom: 20 }}>Lịch sử giao dịch</h2>
          {o.error ? (
            <div className="error-box">{o.error}</div>
          ) : (
            <DataTable
              rows={(o.data?.orders || []).map((x: any) => ({
                ...x,
                status: labels[x.status] || x.status,
                created: fmtTime(x.created),
                amount: x.amount.toLocaleString('vi-VN') + ' đ',
              }))}
              columns={[
                { key: 'name', label: 'Gói' },
                { key: 'title', label: 'Tin tuyển dụng' },
                { key: 'amount', label: 'Số tiền' },
                { key: 'status', label: 'Trạng thái' },
                { key: 'created', label: 'Tạo lúc' },
              ]}
            />
          )}
          <button className="button light small" style={{ marginTop: 16 }} onClick={o.load}>
            Cập nhật trạng thái
          </button>
        </div>
      )}

      <Modal
        title="Tạo gói tin nổi bật"
        open={!!edit}
        onClose={() => setEdit(null)}
        description="Giá được tính bằng VNĐ. Giá gói đã tạo không được sửa để bảo toàn lịch sử giao dịch."
      >
        <Form
          fields={[
            { name: 'name', label: 'Tên gói', required: true, full: true },
            { name: 'amount', label: 'Giá gói (VNĐ)', type: 'number', required: true, min: 10000, max: 100000000 },
            { name: 'days', label: 'Số ngày nổi bật', type: 'number', required: true, min: 1, max: 365 },
          ]}
          submit="Tạo gói"
          onSubmit={async (d) => {
            await perform('plans', d, s.load);
            setEdit(null);
          }}
        />
      </Modal>

      <Modal
        title="Thanh toán gói tin nổi bật"
        open={!!purchase}
        onClose={() => setPurchase(null)}
        description={
          purchase ? `${purchase.name} · ${purchase.amount.toLocaleString('vi-VN')} đ · ${purchase.days} ngày` : ''
        }
      >
        {j.data?.jobs?.filter((x: any) => x.status === 'open').length ? (
          <Form
            fields={[
              {
                name: 'job',
                label: 'Tin tuyển dụng cần làm nổi bật',
                required: true,
                full: true,
                options: j.data.jobs
                  .filter((x: any) => x.status === 'open')
                  .map((x: any) => ({ value: x.id, label: x.title })),
              },
            ]}
            submit="Tiếp tục đến cổng thanh toán"
            onSubmit={async (d) => {
              const r = await api('orders', 'POST', { ...d, plan: purchase.id });
              window.location.href = r.url;
            }}
          />
        ) : (
          <p>Cần có tin đã được duyệt và đang tuyển trước khi mua gói.</p>
        )}
      </Modal>
    </>
  );
}

function CVDocument({ id, user }: any) {
  const s = useData('cvs');
  const c = s.data?.cvs?.find((x: any) => x.id === id);

  return (
    <State {...s}>
      {c ? (
        <div className="panel narrow">
          <div className="row between no-print" style={{ marginBottom: 30 }}>
            <Link className="subtitle" href="/workspace/cvs">
              ← CV của tôi
            </Link>
            <button className="button" onClick={() => window.print()}>
              <Download size={16} />
              In / lưu thành PDF
            </button>
          </div>
          <CVPreview value={{ ...c.data, name: user.name, email: user.email, cvName: c.name }} />
        </div>
      ) : (
        <Blank title="Không tìm thấy CV" description="CV có thể đã bị xóa hoặc không thuộc tài khoản của bạn." />
      )}
    </State>
  );
}
