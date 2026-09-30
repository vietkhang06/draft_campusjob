'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BriefcaseBusiness,
  Search,
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  GraduationCap,
  Bookmark,
  Bell,
  Clock,
  SlidersHorizontal,
  Building2,
  ArrowRight,
  Check,
  Star,
  LocateFixed,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, labels, jobTypes, industries, fmtDate, salary } from '@/lib/shared';
import { Choice, Blank, Loading, Status, Form, Modal, Upload } from '@/components/common-ui';
import Workspace from './workspace';
import { useAuth } from '@/lib/auth-context';

function SignIn({ text = 'Đăng nhập', to = '/workspace' }: { text?: string; to?: string }) {
  return (
    <Link className="button" href={'/login?return_to=' + encodeURIComponent(to)}>
      {text}
    </Link>
  );
}

export default function Portal() {
  const path = usePathname() || '/';
  const { user, logout, refreshSession } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState('');

  const refresh = () =>
    api('session')
      .then(setSession)
      .catch((e) => setError(e.message));

  useEffect(() => {
    refresh();
  }, [user]);

  const u = user || session?.user;

  return (
    <>
      <header className="topbar">
        <div className="wrap header">
          <Link className="brand" href="/">
            <span className="brand-icon">
              <BriefcaseBusiness size={22} />
            </span>
            CampusJob
            <span className="badge" style={{ marginLeft: 0, fontSize: 10, letterSpacing: 0 }}>
              PRO
            </span>
          </Link>
          <nav className="nav" aria-label="Điều hướng chính">
            <Link className={path === '/' ? 'active' : ''} href="/">
              Tìm việc làm
            </Link>
            <Link className={path.startsWith('/companies') ? 'active' : ''} href="/companies">
              Doanh nghiệp
            </Link>
            <Link
              href={
                u?.role === 'employer'
                  ? '/workspace/jobs'
                  : u && ['admin', 'moderator'].includes(u.role)
                  ? '/workspace'
                  : '/workspace/cvs'
              }
            >
              {u?.role === 'employer'
                ? 'Quản lý tuyển dụng'
                : u && ['admin', 'moderator'].includes(u.role)
                ? 'Quản lý'
                : 'Hồ sơ & CV'}
            </Link>
          </nav>
          <div className="header-actions">
            {u ? (
              <>
                <Link className="icon-button" href="/workspace/notifications" aria-label="Thông báo">
                  <Bell size={18} />
                </Link>
                <Link className="button light" href="/workspace">
                  {labels[u.role] || u.role} <ArrowUpRight size={15} />
                </Link>
                <button
                  type="button"
                  className="button light small"
                  style={{ cursor: 'pointer', padding: '7px 10px' }}
                  onClick={() => logout()}
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <Link className="button light" href="/register">
                  Đăng ký
                </Link>
                <SignIn />
              </>
            )}
          </div>
        </div>
      </header>

      {error ? (
        <main className="wrap page">
          <div className="error-box">{error}</div>
          <button className="button" onClick={refresh}>
            Kết nối lại
          </button>
        </main>
      ) : path === '/' ? (
        <Jobs session={{ user: u }} />
      ) : path.startsWith('/jobs/') ? (
        <JobDetail id={path.split('/')[2]} session={{ user: u }} />
      ) : path === '/companies' ? (
        <Companies />
      ) : path.startsWith('/companies/') ? (
        <CompanyDetail id={path.split('/')[2]} session={{ user: u }} />
      ) : path.startsWith('/workspace') ? (
        <main className="wrap page">
          {!u ? (
            <div className="narrow panel" style={{ maxWidth: 440, margin: '40px auto', textAlign: 'center' }}>
              <BriefcaseBusiness size={40} color="#2d7958" style={{ margin: '0 auto 16px' }} />
              <h1>Chào mừng đến CampusJob</h1>
              <p className="muted" style={{ margin: '14px 0 24px' }}>
                Đăng nhập để tạo hồ sơ sinh viên, nộp CV hoặc quản lý tuyển dụng doanh nghiệp.
              </p>
              <div className="row center" style={{ gap: 12, justifyContent: 'center' }}>
                <Link href="/login" className="button">
                  Đăng nhập
                </Link>
                <Link href="/register" className="button light">
                  Đăng ký tài khoản
                </Link>
              </div>
            </div>
          ) : (
            <Workspace path={path} user={u} refreshSession={refreshSession} session={{ user: u }} />
          )}
        </main>
      ) : path === '/guidelines' ? (
        <Guidelines />
      ) : (
        <main className="wrap page">
          <Blank title="Không tìm thấy trang" description="Đường dẫn không còn tồn tại.">
            <Link href="/" className="button">
              Về trang tìm việc
            </Link>
          </Blank>
        </main>
      )}

      <footer className="footer">
        <div className="wrap">
          <div>
            <Link className="brand" style={{ fontSize: 19 }} href="/">
              CampusJob
            </Link>
            <p>Kết nối sinh viên và doanh nghiệp · Nhóm 11</p>
          </div>
          <div className="row">
            <Link href="/guidelines">Quy tắc & quyền riêng tư</Link>
            <Link href="/workspace/reports">Báo cáo vi phạm</Link>
            {u ? (
              <button
                type="button"
                onClick={() => logout()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  font: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Đăng xuất
              </button>
            ) : (
              <Link href="/login">Đăng nhập</Link>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}

export function JobCard({ job, session, saved = false, onRemove }: any) {
  const j = job;
  return (
    <article className="job-card">
      <div className="company-initial">
        {(j.company_name || 'DN')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((x: string) => x[0])
          .join('')}
      </div>
      <div className="job-main">
        <div className="row between">
          <div className="row">
            <span className="badge">{j.type}</span>
            {j.featured_until && new Date(j.featured_until).getTime() > Date.now() && (
              <span className="badge warn">Tin nổi bật · Tài trợ</span>
            )}
          </div>
          {saved ? (
            <button
              className="icon-button"
              aria-label="Bỏ lưu tin"
              onClick={async () => {
                try {
                  await api('saved/' + j.id, 'DELETE');
                  onRemove?.();
                  toast.success('Đã bỏ lưu tin.');
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            >
              <Bookmark fill="currentColor" size={17} />
            </button>
          ) : session?.user?.role === 'student' ? (
            <button
              className="icon-button"
              aria-label="Lưu tin tuyển dụng"
              onClick={async () => {
                try {
                  await api('saved/' + j.id, 'POST');
                  toast.success('Đã lưu tin vào danh sách của bạn.');
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            >
              <Bookmark size={17} />
            </button>
          ) : null}
        </div>
        <h3>
          <Link href={'/jobs/' + j.id}>{j.title}</Link>
        </h3>
        <Link className="subtitle" href={'/companies/' + j.company}>
          {j.company_name}
        </Link>
        <div className="job-meta">
          <span className="salary">{salary(j)}</span>
          <span>
            <MapPin size={14} />
            {j.city}
          </span>
          {j.distance != null && <span>{j.distance} km</span>}
        </div>
        <div className="job-meta">
          <span>
            <Clock size={14} />
            Hạn {fmtDate(j.deadline)}
          </span>
          {j.match != null && <span>Khớp {j.match}% kỹ năng</span>}
          {j.flag === 1 && <span className="badge warn">Đang được xem xét</span>}
        </div>
      </div>
    </article>
  );
}

function Jobs({ session }: any) {
  const [filters, setFilters] = useState<any>({
    q: '',
    city: '',
    industry: '',
    type: '',
    sort: 'recommended',
    schedule: '',
  });
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (f = filters) => {
    setBusy(true);
    setError('');
    try {
      setResult(await api('jobs?' + new URLSearchParams(Object.entries(f).filter(([, v]) => !!v) as any)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.city, filters.industry, filters.type, filters.sort, filters.schedule, filters.lat, filters.lng, filters.salary]);

  const set = (k: string, v: any) => setFilters({ ...filters, [k]: v });

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="row between">
            <div>
              <div className="eyebrow">VIỆC LÀM THÊM & THỰC TẬP</div>
              <h1>
                Bước đầu sự nghiệp.
                <br />
                Bắt đầu từ việc phù hợp.
              </h1>
              <p>Tìm công việc phù hợp với chuyên ngành và lịch học của bạn.</p>
            </div>
            <div className="employer-link" style={{ textAlign: 'right', color: '#c6d9d0', fontSize: 14 }}>
              <ShieldCheck size={30} style={{ marginLeft: 'auto', marginBottom: 10 }} />
              Doanh nghiệp xác thực
              <br />
              Tin tuyển dụng được kiểm duyệt
            </div>
          </div>
          <form
            className="searchbar"
            onSubmit={(e) => {
              e.preventDefault();
              const f = { ...filters, q: search };
              setFilters(f);
              load(f);
            }}
          >
            <div className="search-input">
              <Search className="search-icon" />
              <input
                aria-label="Vị trí, kỹ năng hoặc tên doanh nghiệp"
                placeholder="Vị trí, kỹ năng hoặc tên doanh nghiệp"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="location-picker" style={{ minWidth: 200 }}>
              <Choice
                value={filters.city}
                onChange={(v) => set('city', v)}
                placeholder="Tất cả địa điểm"
                options={result?.facets?.cities || []}
              />
            </div>
            <button className="button lime" disabled={busy}>
              Tìm việc làm <ArrowUpRight size={17} />
            </button>
          </form>
          <div className="quick-links">
            <span>Tìm nhanh:</span>
            {jobTypes.slice(0, 3).map((x) => (
              <button key={x} onClick={() => set('type', filters.type === x ? '' : x)}>
                {x}
              </button>
            ))}
            <button onClick={() => set('schedule', filters.schedule ? '' : 'buổi tối')}>Việc buổi tối</button>
            <button
              onClick={() => {
                if (!navigator.geolocation) return toast.error('Trình duyệt không hỗ trợ vị trí.');
                navigator.geolocation.getCurrentPosition(
                  (p) => setFilters({ ...filters, lat: p.coords.latitude, lng: p.coords.longitude }),
                  () => toast.error('Không lấy được vị trí. Bạn có thể chọn địa điểm bằng bộ lọc.'),
                );
              }}
            >
              <LocateFixed size={14} style={{ display: 'inline', marginRight: 6 }} />
              Gần tôi
            </button>
          </div>
        </div>
      </section>

      <main className="wrap page">
        <div className="columns">
          <aside className="panel filter-panel">
            <div className="panel-title">
              <h3>
                <SlidersHorizontal size={17} style={{ display: 'inline', marginRight: 9 }} />
                Bộ lọc
              </h3>
              <button
                className="subtitle"
                onClick={() => {
                  setSearch('');
                  const f = { q: '', city: '', industry: '', type: '', sort: 'recommended', schedule: '' };
                  setFilters(f);
                  load(f);
                }}
              >
                Xóa lọc
              </button>
            </div>
            <div className="filter-group">
              <label>Loại hình công việc</label>
              <Choice value={filters.type} onChange={(v) => set('type', v)} placeholder="Tất cả loại hình" options={jobTypes} />
            </div>
            <div className="filter-group">
              <label>Ngành nghề</label>
              <Choice
                value={filters.industry}
                onChange={(v) => set('industry', v)}
                placeholder="Tất cả ngành nghề"
                options={result?.facets?.industries || industries}
              />
            </div>
            <div className="filter-group">
              <label>Mức lương tối thiểu</label>
              <Choice
                value={filters.salary}
                onChange={(v) => set('salary', v)}
                placeholder="Không giới hạn"
                options={[
                  { value: '3000000', label: 'Từ 3 triệu' },
                  { value: '5000000', label: 'Từ 5 triệu' },
                  { value: '10000000', label: 'Từ 10 triệu' },
                ]}
              />
            </div>
            <div className="filter-group">
              <label>Thời gian làm việc</label>
              <Choice
                value={filters.schedule}
                onChange={(v) => set('schedule', v)}
                placeholder="Tất cả thời gian"
                options={['buổi sáng', 'buổi chiều', 'buổi tối', 'cuối tuần']}
              />
            </div>
            <div className="info-box" style={{ marginBottom: 0 }}>
              Không nộp phí giữ chỗ hoặc chuyển tiền để được nhận việc.
            </div>
          </aside>

          <section>
            <div className="results-top">
              <div>
                <h2>Cơ hội dành cho bạn</h2>
                <p className="subtitle">{result ? `${result.jobs.length} công việc phù hợp` : 'Đang tìm cơ hội…'}</p>
              </div>
              <div style={{ width: 155 }}>
                <Choice
                  value={filters.sort}
                  onChange={(v) => set('sort', v)}
                  options={[
                    { value: 'recommended', label: 'Độ uy tín' },
                    { value: 'newest', label: 'Mới nhất' },
                    { value: 'salary', label: 'Lương cao nhất' },
                  ]}
                />
              </div>
            </div>

            {error ? (
              <div className="panel">
                <div className="error-box">{error}</div>
                <button className="button light" onClick={() => load()}>
                  Thử lại
                </button>
              </div>
            ) : busy && !result ? (
              <Loading />
            ) : result?.jobs.length ? (
              result.jobs.map((j: any) => <JobCard key={j.id} job={j} session={session} />)
            ) : (
              <Blank
                title="Chưa có công việc phù hợp"
                description="Tin tuyển dụng sẽ xuất hiện sau khi doanh nghiệp được xác thực và tin được duyệt. Bạn có thể thay đổi bộ lọc hoặc quay lại sau."
              >
                <Link className="button light" href="/workspace">
                  Hoàn thiện hồ sơ của bạn <ArrowRight size={16} />
                </Link>
              </Blank>
            )}

            <div className="row" style={{ padding: '21px 2px', fontSize: 13, color: '#718078' }}>
              <ShieldCheck size={17} />
              Chỉ hiển thị tin đã duyệt và còn hạn tuyển dụng.
            </div>
          </section>

          <aside className="right-rail">
            <div className="aside-promo">
              <GraduationCap size={30} />
              <h3>
                Một hồ sơ tốt.
                <br />
                Nhiều cơ hội mới.
              </h3>
              <p>Thêm kỹ năng, kinh nghiệm và dự án để nhà tuyển dụng hiểu hơn về bạn.</p>
              <Link className="button" href="/workspace/cvs">
                Tạo CV của bạn <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="panel">
              <div className="eyebrow-dark">TÌM VIỆC AN TÂM</div>
              <div className="trust-note">
                <ShieldCheck />
                <div>
                  <strong>Doanh nghiệp xác thực</strong>
                  <p className="muted">Thông tin pháp lý được xét duyệt.</p>
                </div>
              </div>
              <div className="trust-note">
                <Check />
                <div>
                  <strong>Tin đăng được kiểm duyệt</strong>
                  <p className="muted">Rõ công việc, lương và quyền lợi.</p>
                </div>
              </div>
              <Link className="row subtitle" style={{ paddingTop: 18 }} href="/guidelines">
                Tìm hiểu quy tắc <ChevronRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function JobDetail({ id, session }: any) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [apply, setApply] = useState(false);
  const [hide, setHide] = useState(false);
  const [cvs, setCvs] = useState<any[]>([]);

  useEffect(() => {
    api('jobs/' + id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error)
    return (
      <main className="wrap page">
        <Blank title="Không thể mở tin tuyển dụng" description={error}>
          <Link href="/" className="button">
            Tìm công việc khác
          </Link>
        </Blank>
      </main>
    );

  if (!data)
    return (
      <main className="wrap page">
        <Loading />
      </main>
    );

  const j = data.job;
  const c = data.company;

  const open = async () => {
    try {
      setCvs((await api('cvs')).cvs);
      setApply(true);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <main className="wrap page">
      <Link className="subtitle" href="/">
        Tìm việc làm / {j.industry}
      </Link>
      <div className="panel" style={{ marginTop: 20, marginBottom: 24 }}>
        <div className="row between">
          <span className="badge">{j.type}</span>
          <Status value={j.status} />
        </div>
        <h1 style={{ margin: '15px 0' }}>{j.title}</h1>
        <Link href={'/companies/' + j.company} className="row muted">
          <Building2 size={18} />
          {j.company_name} <ShieldCheck size={16} />
        </Link>
        <div className="job-meta">
          <span className="salary">{salary(j)}</span>
          <span>
            <MapPin size={14} />
            {j.city}
          </span>
          <span>
            <Clock size={14} />
            Hạn ứng tuyển: {fmtDate(j.deadline)}
          </span>
          <span>Cần tuyển {j.vacancies} người</span>
        </div>
      </div>

      <div className="detail-layout">
        <article className="panel">
          {[
            ['Mô tả công việc', j.description],
            ['Kỹ năng tối thiểu', j.skills],
            ['Kỹ năng ưu tiên', j.preferred],
            ['Quyền lợi', j.benefits],
            ['Thời gian làm việc', j.schedule],
            ['Địa điểm làm việc', j.address],
          ]
            .filter((x) => x[1])
            .map(([t, v]) => (
              <section key={t}>
                <h2 className="section-title">{t}</h2>
                <p className="prose">{v}</p>
              </section>
            ))}
          {j.lat != null && (
            <a
              className="button light"
              style={{ marginTop: 20 }}
              href={`https://www.openstreetmap.org/?mlat=${j.lat}&mlon=${j.lng}#map=16/${j.lat}/${j.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={16} />
              Xem trên bản đồ
            </a>
          )}
        </article>

        <aside>
          {['admin', 'moderator'].includes(session?.user?.role) && (
            <div className="panel">
              <h3>Kiểm duyệt nội dung</h3>
              <button className="button light" style={{ marginTop: 15 }} onClick={() => setHide(true)}>
                Ẩn tạm để xem xét
              </button>
            </div>
          )}
          <div className="panel">
            <h3>Sẵn sàng ứng tuyển?</h3>
            <p className="subtitle" style={{ margin: '10px 0 18px' }}>
              Chọn CV phù hợp nhất với vị trí này. Hồ sơ được gửi trực tiếp đến doanh nghiệp.
            </p>
            {!session?.user ? (
              <Link className="button" href="/login">
                Đăng nhập để ứng tuyển
              </Link>
            ) : session.user.role === 'student' ? (
              <div className="stack">
                <button className="button" onClick={open}>
                  Ứng tuyển ngay <ArrowUpRight size={16} />
                </button>
                <button
                  className="button light"
                  onClick={async () => {
                    try {
                      await api('saved/' + id, 'POST');
                      toast.success('Đã lưu tin.');
                    } catch (e: any) {
                      toast.error(e.message);
                    }
                  }}
                >
                  <Bookmark size={17} />
                  Lưu công việc
                </button>
              </div>
            ) : (
              <p className="subtitle">Ứng tuyển dành cho tài khoản sinh viên.</p>
            )}
          </div>
          <div className="panel">
            <h3>{c.name}</h3>
            <p className="subtitle" style={{ margin: '12px 0' }}>
              {c.industry} · {c.size}
            </p>
            <Link className="file-link" href={'/companies/' + j.company}>
              Xem hồ sơ doanh nghiệp
            </Link>
          </div>
          <div className="info-box">Nếu có yêu cầu nộp phí hoặc dấu hiệu lừa đảo, hãy báo cáo trên trang doanh nghiệp.</div>
        </aside>
      </div>

      <Modal title="Ẩn tin để thẩm tra" open={hide} onClose={() => setHide(false)} description="Tin ngừng hiển thị và quay lại hàng đợi kiểm duyệt.">
        <Form
          fields={[{ name: 'reason', label: 'Lý do ẩn tin', type: 'textarea', required: true, full: true }]}
          submit="Ẩn tin tuyển dụng"
          onSubmit={async (d) => {
            await api('moderation/' + id + '/job', 'POST', { ...d, decision: 'hide' });
            window.location.href = '/workspace/moderation';
          }}
        />
      </Modal>

      <Modal title="Ứng tuyển công việc" description={j.title} open={apply} onClose={() => setApply(false)}>
        {cvs.length ? (
          <Form
            fields={[
              {
                name: 'cv',
                label: 'CV dùng ứng tuyển',
                required: true,
                options: cvs.map((c) => ({ value: c.id, label: c.name })),
                full: true,
              },
              { name: 'letter', label: 'Thư giới thiệu (không bắt buộc)', type: 'textarea', full: true },
            ]}
            initial={{ cv: cvs.find((c) => c.is_default)?.id || cvs[0].id }}
            submit="Gửi hồ sơ ứng tuyển"
            onSubmit={async (d) => {
              const r = await api('applications', 'POST', { ...d, job: id });
              toast.success('Hồ sơ đã được gửi.');
              window.location.href = '/workspace/applications/' + r.id;
            }}
          />
        ) : (
          <Blank title="Bạn chưa tạo CV" description="Tạo một CV để bắt đầu ứng tuyển.">
            <Link className="button" href="/workspace/cvs">
              Tạo CV
            </Link>
          </Blank>
        )}
      </Modal>
    </main>
  );
}

function Companies() {
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    api('companies?q=' + encodeURIComponent(q))
      .then(setData)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="wrap page">
      <div className="title-row">
        <div>
          <div className="eyebrow-dark">KẾT NỐI VỚI NHÀ TUYỂN DỤNG</div>
          <h1>Doanh nghiệp trên CampusJob</h1>
          <p>Tìm hiểu môi trường làm việc trước khi ứng tuyển.</p>
        </div>
      </div>
      <form
        className="searchbar"
        style={{ border: '1px solid #dfe7df', margin: '0 0 25px' }}
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tên doanh nghiệp hoặc ngành nghề"
          aria-label="Tìm doanh nghiệp"
        />
        <button className="button">Tìm kiếm</button>
      </form>
      {error ? (
        <div className="error-box">{error}</div>
      ) : !data ? (
        <Loading />
      ) : data.companies.length ? (
        <div className="grid3">
          {data.companies.map((c: any) => (
            <Link className="panel" key={c.id} href={'/companies/' + c.id}>
              <div className="company-initial">{c.name.slice(0, 2).toUpperCase()}</div>
              <h3 style={{ margin: '15px 0 7px' }}>{c.name}</h3>
              <p className="subtitle">{c.industry}</p>
              <div className="job-meta">
                <span>
                  <MapPin size={14} />
                  {c.address}
                </span>
              </div>
              <div className="row between" style={{ marginTop: 20 }}>
                <span className="badge">{c.open_jobs} việc đang tuyển</span>
                {c.rating && <span className="rating">★ {Number(c.rating).toFixed(1)}</span>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Blank title="Chưa có doanh nghiệp được công khai" description="Hồ sơ doanh nghiệp sẽ xuất hiện sau khi được quản trị viên xác thực.">
          <Link className="button" href="/workspace/company">
            Đăng ký doanh nghiệp
          </Link>
        </Blank>
      )}
    </main>
  );
}

function CompanyDetail({ id, session }: any) {
  const [data, setData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [report, setReport] = useState(false);
  const [evidence, setEvidence] = useState('');

  useEffect(() => {
    Promise.all([api('companies/' + id), api('jobs')])
      .then(([c, j]) => {
        setData(c.company);
        setJobs(j.jobs.filter((x: any) => x.company === id));
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error)
    return (
      <main className="wrap page">
        <Blank title="Không thể mở doanh nghiệp" description={error} />
      </main>
    );

  if (!data)
    return (
      <main className="wrap page">
        <Loading />
      </main>
    );

  return (
    <main className="wrap page">
      <div className="panel">
        <div className="row">
          <div className="company-initial">{data.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <span className="badge">
              <ShieldCheck size={14} />
              Đã xác thực
            </span>
            <h1 style={{ marginTop: 10 }}>{data.name}</h1>
          </div>
        </div>
        <div className="job-meta">
          <span>{data.industry}</span>
          <span>{data.size}</span>
          <span>
            <MapPin size={14} />
            {data.address}
          </span>
        </div>
        {data.flag === 1 && (
          <div className="info-box">Doanh nghiệp đang được xem xét sau phản ánh. Đây chưa phải kết luận vi phạm.</div>
        )}
      </div>

      <div className="detail-layout" style={{ marginTop: 24 }}>
        <section>
          <div className="panel">
            <h2>Về doanh nghiệp</h2>
            <p className="prose" style={{ marginTop: 18 }}>
              {data.description || 'Doanh nghiệp chưa bổ sung phần giới thiệu.'}
            </p>
            {data.website && (
              <a className="file-link" href={data.website} target="_blank" rel="noreferrer">
                Website doanh nghiệp ↗
              </a>
            )}
          </div>
          <h2 style={{ margin: '26px 0 18px' }}>Cơ hội đang mở ({jobs.length})</h2>
          {jobs.length ? (
            jobs.map((j) => <JobCard key={j.id} job={j} session={session} />)
          ) : (
            <Blank title="Chưa có vị trí đang tuyển" description="Hãy quay lại khi doanh nghiệp mở tin tuyển dụng mới." />
          )}
          <div className="panel" style={{ marginTop: 24 }}>
            <div className="panel-title">
              <h2>Đánh giá từ ứng viên</h2>
              <span className="rating">{data.rating ? `★ ${data.rating.toFixed(1)} / 5` : 'Chưa có đánh giá'}</span>
            </div>
            {data.reviews.map((r: any) => (
              <div className="record" key={r.id}>
                <div className="row between">
                  <strong>{r.student_name}</strong>
                  <span className="rating">
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                  </span>
                </div>
                <p className="prose">{r.comment}</p>
                <small>{fmtDate(r.created)}</small>
                {r.reply && (
                  <div className="info-box">
                    <strong>Phản hồi từ doanh nghiệp</strong>
                    <p>{r.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside>
          <div className="panel">
            <h3>Các chi nhánh</h3>
            {data.branches.map((b: any) => (
              <div className="record" key={b.id}>
                <strong>{b.name}</strong>
                <p className="subtitle">
                  {b.address} · {b.city}
                </p>
                {b.lat != null && (
                  <a
                    className="file-link"
                    href={`https://www.openstreetmap.org/?mlat=${b.lat}&mlon=${b.lng}#map=16/${b.lat}/${b.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Xem bản đồ
                  </a>
                )}
              </div>
            ))}
          </div>
          {session?.user?.role === 'student' && (
            <button className="button light" onClick={() => setReport(true)}>
              Báo cáo doanh nghiệp
            </button>
          )}
        </aside>
      </div>

      <Modal
        title="Báo cáo doanh nghiệp"
        open={report}
        onClose={() => setReport(false)}
        description="Mô tả sự việc và cung cấp minh chứng. Báo cáo chỉ được gửi đến bộ phận xử lý."
      >
        <Upload purpose="evidence" value={evidence} onChange={setEvidence} />
        <Form
          fields={[{ name: 'description', label: 'Nội dung phản ánh', type: 'textarea', required: true, full: true }]}
          submit="Gửi báo cáo"
          onSubmit={async (d) => {
            await api('reports', 'POST', { ...d, company: id, evidence });
            toast.success('Đã gửi báo cáo.');
            setReport(false);
          }}
        />
      </Modal>
    </main>
  );
}

function Guidelines() {
  return (
    <main className="wrap page narrow">
      <div className="panel">
        <h1>Quy tắc sử dụng & dữ liệu</h1>
        <h2 className="section-title">Tuyển dụng minh bạch</h2>
        <p>
          Không đăng công việc đa cấp, lừa đảo, yêu cầu phí giữ chỗ hoặc mô tả sai lương và quyền lợi. Doanh nghiệp cung cấp
          thông tin pháp lý chính xác và chịu trách nhiệm về nội dung đăng tải.
        </p>
        <h2 className="section-title">Ứng tuyển có trách nhiệm</h2>
        <p>
          Mỗi sinh viên có tối đa 5 hồ sơ chưa có kết quả cuối, gồm chờ xử lý, đã xem và hẹn phỏng vấn. Mỗi công việc chỉ
          được ứng tuyển một lần. Có thể rút hồ sơ khi chờ xử lý hoặc đã xem. Mỗi buổi phỏng vấn được đề nghị đổi lịch một
          lần.
        </p>
        <h2 className="section-title">Quyền truy cập dữ liệu</h2>
        <p>
          Thông tin doanh nghiệp, tin được duyệt và đánh giá được hiển thị công khai trong phạm vi truy cập của website. CV và
          thông tin liên hệ trong hồ sơ ứng tuyển chỉ dành cho sinh viên, nhà tuyển dụng phụ trách và nhân sự kiểm duyệt được
          phân quyền. Tệp giấy phép và minh chứng dành cho người tải lên và bộ phận kiểm duyệt.
        </p>
        <h2 className="section-title">Lưu giữ hồ sơ</h2>
        <p>
          Hệ thống lưu bản CV tại thời điểm ứng tuyển để bảo toàn quá trình tuyển dụng. CV đã dùng để ứng tuyển không thể xóa
          bằng thao tác xóa CV thông thường. Chủ tài khoản có thể gửi yêu cầu về dữ liệu cho người vận hành Nhóm 11 thông
          qua kênh liên hệ do nhóm công bố trước khi mở dịch vụ công khai.
        </p>
        <h2 className="section-title">Xử lý vi phạm</h2>
        <p>
          Hai vi phạm được xác nhận trong 6 tháng dẫn đến cảnh cáo. Từ vi phạm thứ ba, quản trị viên có thể khóa quyền ứng
          tuyển 30–90 ngày. Cờ cảnh báo doanh nghiệp không phải kết luận vi phạm; đình chỉ chỉ thực hiện sau khi quản trị viên
          xác minh.
        </p>
        <h2 className="section-title">Trạng thái dịch vụ</h2>
        <p>
          Hệ thống đăng nhập bảo mật độc lập với token ngắn hạn và refresh token HttpOnly cookie. Thông báo trong ứng dụng hoạt động độc lập;
          email xác minh và thông báo được gửi tự động qua hệ thống thư điện tử.
        </p>
      </div>
    </main>
  );
}
