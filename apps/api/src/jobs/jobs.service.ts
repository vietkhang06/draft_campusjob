import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { JOB_TYPES } from '@campusjob/contracts';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(6371 * c * 10) / 10;
}

function words(v: string): string[] {
  return (v || '')
    .split(/[,;\n]/)
    .map((s) => s.trim().toLocaleLowerCase('vi'))
    .filter(Boolean);
}

function matchSkills(cvSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills.length) return 0;
  const matches = requiredSkills.filter((req) => cvSkills.includes(req));
  return Math.round((100 * matches.length) / requiredSkills.length);
}

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  async listPublicJobs(q: any = {}) {
    const now = new Date();

    const where: any = {
      status: 'open',
      deadline: { gt: now },
      company: { status: 'active' },
    };

    if (q.q) {
      const search = String(q.q).trim().slice(0, 150);
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { skills: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (q.type) where.type = q.type;
    if (q.industry) where.industry = q.industry;
    if (q.city) where.branch = { city: q.city };
    if (q.schedule) where.schedule = { contains: q.schedule, mode: 'insensitive' };
    if (q.salary) {
      const minSalary = Number(q.salary);
      if (Number.isFinite(minSalary)) {
        where.salaryMax = { gte: minSalary };
      }
    }

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            flag: true,
            reviews: { where: { hidden: false }, select: { rating: true } },
            jobs: { select: { status: true } },
            ownerId: true,
          },
        },
        branch: {
          select: {
            city: true,
            address: true,
            lat: true,
            lng: true,
          },
        },
        views: { select: { id: true } },
        savedBy: { select: { id: true } },
      },
      take: 500,
    });

    const reportsCount = await this.prisma.report.groupBy({
      by: ['targetId'],
      where: { status: 'confirmed', targetType: 'company' },
      _count: { id: true },
    });
    const reportMap = new Map<string, number>();
    for (const r of reportsCount) {
      reportMap.set(r.targetId, r._count.id);
    }

    const rows = jobs.map((j) => {
      const reviews = j.company.reviews;
      const reviewCount = reviews.length;
      const avgRating =
        reviewCount > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount : 0;
      const allCompanyJobs = j.company.jobs.length;
      const activeJobs = j.company.jobs.filter((x) =>
        ['open', 'closed', 'paused'].includes(x.status),
      ).length;
      const confirmedReports = reportMap.get(j.company.id) || 0;

      const reputation =
        40.0 * (activeJobs / Math.max(1, allCompanyJobs)) +
        12.0 * avgRating -
        10.0 * confirmedReports;

      const isFeatured = j.featuredUntil && j.featuredUntil > now;

      let distance: number | null = null;
      if (q.lat && q.lng && j.branch.lat != null && j.branch.lng != null) {
        distance = haversine(
          Number(q.lat),
          Number(q.lng),
          j.branch.lat,
          j.branch.lng,
        );
      }

      return {
        id: j.id,
        company: j.companyId,
        company_name: j.company.name,
        branch: j.branchId,
        title: j.title,
        industry: j.industry,
        type: j.type,
        description: j.description,
        skills: j.skills,
        preferred: j.preferred,
        vacancies: j.vacancies,
        salary_min: j.salaryMin,
        salary_max: j.salaryMax,
        salary_unit: j.salaryUnit,
        schedule: j.schedule,
        benefits: j.benefits,
        deadline: j.deadline.toISOString(),
        featured_until: j.featuredUntil?.toISOString() || null,
        status: j.status,
        flag: j.company.flag,
        city: j.branch.city,
        address: j.branch.address,
        lat: j.branch.lat,
        lng: j.branch.lng,
        rating: reviewCount ? avgRating : null,
        review_count: reviewCount,
        views: j.views.length,
        saves: j.savedBy.length,
        reputation,
        isFeatured: !!isFeatured,
        distance,
        created: j.createdAt.toISOString(),
      };
    });

    if (q.lat && q.lng) {
      rows.sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
    } else if (q.sort === 'newest') {
      rows.sort((a, b) => b.created.localeCompare(a.created));
    } else if (q.sort === 'salary') {
      rows.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
    } else {
      // Default recommended: featured first, then reputation desc, then created desc
      rows.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        if (b.reputation !== a.reputation) return b.reputation - a.reputation;
        return b.created.localeCompare(a.created);
      });
    }

    const cities = await this.prisma.branch.findMany({
      where: {
        jobs: {
          some: {
            status: 'open',
            deadline: { gt: now },
            company: { status: 'active' },
          },
        },
      },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });

    const industries = await this.prisma.job.findMany({
      where: { status: 'open', deadline: { gt: now } },
      select: { industry: true },
      distinct: ['industry'],
      orderBy: { industry: 'asc' },
    });

    return {
      jobs: rows,
      facets: {
        cities: cities.map((c) => c.city),
        industries: industries.map((i) => i.industry),
      },
    };
  }

  async getJobDetail(jobId: string, currentUserId?: string, userRole?: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        branch: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng.');
    }

    const now = new Date();
    const isPubliclyAvailable =
      job.status === 'open' && job.deadline > now && job.company.status === 'active';

    if (!isPubliclyAvailable) {
      if (
        !currentUserId ||
        (job.company.ownerId !== currentUserId &&
          !['admin', 'moderator'].includes(userRole || ''))
      ) {
        throw new NotFoundException('Tin tuyển dụng không còn nhận hồ sơ.');
      }
    }

    if (currentUserId && isPubliclyAvailable) {
      const today = now.toISOString().slice(0, 10);
      await this.prisma.jobView.upsert({
        where: {
          jobId_visitorId_day: {
            jobId: job.id,
            visitorId: currentUserId,
            day: today,
          },
        },
        create: {
          jobId: job.id,
          visitorId: currentUserId,
          day: today,
        },
        update: {},
      });
    }

    return {
      job: {
        id: job.id,
        company: job.companyId,
        company_name: job.company.name,
        company_status: job.company.status,
        owner: job.company.ownerId,
        title: job.title,
        industry: job.industry,
        type: job.type,
        description: job.description,
        skills: job.skills,
        preferred: job.preferred,
        vacancies: job.vacancies,
        salary_min: job.salaryMin,
        salary_max: job.salaryMax,
        salary_unit: job.salaryUnit,
        schedule: job.schedule,
        benefits: job.benefits,
        deadline: job.deadline.toISOString(),
        featured_until: job.featuredUntil?.toISOString() || null,
        status: job.status,
        city: job.branch.city,
        address: job.branch.address,
        lat: job.branch.lat,
        lng: job.branch.lng,
      },
      company: {
        id: job.company.id,
        name: job.company.name,
        industry: job.company.industry,
        size: job.company.size,
        description: job.company.description,
        website: job.company.website,
        flag: job.company.flag,
      },
    };
  }

  async getEmployerJobs(userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId: userId },
    });
    if (!company) {
      throw new NotFoundException('Chưa có hồ sơ doanh nghiệp.');
    }

    const jobs = await this.prisma.job.findMany({
      where: { companyId: company.id },
      include: {
        applications: {
          select: { id: true, status: true },
        },
        views: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        status: j.status,
        deadline: j.deadline.toISOString(),
        salary_min: j.salaryMin,
        salary_max: j.salaryMax,
        salary_unit: j.salaryUnit,
        vacancies: j.vacancies,
        reason: j.reason,
        applications: j.applications.length,
        hired: j.applications.filter((a) => a.status === 'hired').length,
        views: j.views.length,
        created: j.createdAt.toISOString(),
      })),
    };
  }

  async saveJobPost(userId: string, jobId: string | null, data: any) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId: userId },
    });
    if (!company || company.status !== 'active') {
      throw new ForbiddenException('Doanh nghiệp phải được xác thực và đang hoạt động.');
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: data.branch, companyId: company.id },
    });
    if (!branch) {
      throw new BadRequestException('Vui lòng chọn chi nhánh của doanh nghiệp.');
    }

    if (!JOB_TYPES.includes(data.type)) {
      throw new BadRequestException('Loại công việc không hợp lệ.');
    }

    const salaryMin =
      data.salary_min !== '' && data.salary_min != null ? Number(data.salary_min) : null;
    const salaryMax =
      data.salary_max !== '' && data.salary_max != null ? Number(data.salary_max) : null;

    if (
      (salaryMin === null) !== (salaryMax === null) ||
      (salaryMin !== null && salaryMin > salaryMax!)
    ) {
      throw new BadRequestException('Khoảng lương không hợp lệ.');
    }

    const deadline = new Date(data.deadline);
    if (isNaN(deadline.getTime()) || deadline <= new Date()) {
      throw new BadRequestException('Hạn nộp hồ sơ phải ở tương lai.');
    }

    const jobData = {
      branchId: data.branch,
      title: String(data.title || '').trim().slice(0, 200),
      industry: String(data.industry || '').trim().slice(0, 100),
      type: data.type,
      description: String(data.description || '').trim(),
      skills: String(data.skills || '').trim().slice(0, 2000),
      preferred: String(data.preferred || '').trim().slice(0, 2000),
      vacancies: Math.max(1, Math.trunc(Number(data.vacancies || 1))),
      salaryMin,
      salaryMax,
      salaryUnit: ['hour', 'month'].includes(data.salary_unit) ? data.salary_unit : 'month',
      schedule: String(data.schedule || '').trim().slice(0, 2000),
      benefits: String(data.benefits || '').trim().slice(0, 5000),
      deadline,
      status: 'pending',
      reason: null,
    };

    let job;
    if (jobId) {
      const existing = await this.prisma.job.findFirst({
        where: { id: jobId, companyId: company.id },
      });
      if (!existing) {
        throw new ForbiddenException('Tin tuyển dụng không thuộc doanh nghiệp của bạn.');
      }
      job = await this.prisma.job.update({
        where: { id: jobId },
        data: jobData,
      });
    } else {
      job = await this.prisma.job.create({
        data: {
          ...jobData,
          companyId: company.id,
        },
      });
    }

    await this.auditService.log('job', job.id, 'submitted', {}, userId);
    await this.notificationsService.notifyStaff('moderation', 'Tin tuyển dụng chờ duyệt', job.title);

    return { id: job.id };
  }

  async changeState(userId: string, jobId: string, newStatus: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId: userId },
    });
    if (!company) {
      throw new ForbiddenException('Chưa có hồ sơ doanh nghiệp.');
    }

    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId: company.id },
    });
    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng.');
    }

    if (job.deadline <= new Date()) {
      throw new ConflictException('Tin tuyển dụng đã hết hạn.');
    }

    const allowedTransitions: Record<string, string[]> = {
      open: ['paused', 'closed'],
      paused: ['open', 'closed'],
    };

    if (!allowedTransitions[job.status]?.includes(newStatus)) {
      throw new ConflictException('Không thể chuyển trạng thái tin tuyển dụng.');
    }

    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: newStatus },
    });

    await this.auditService.log('job', jobId, newStatus, {}, userId);
    return { ok: true };
  }

  async saveJob(studentId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        status: 'open',
        deadline: { gt: new Date() },
        company: { status: 'active' },
      },
    });
    if (!job) {
      throw new NotFoundException('Tin không còn công khai.');
    }

    await this.prisma.savedJob.upsert({
      where: {
        studentId_jobId: {
          studentId,
          jobId,
        },
      },
      create: {
        studentId,
        jobId,
      },
      update: {},
    });

    return { ok: true };
  }

  async unsaveJob(studentId: string, jobId: string) {
    await this.prisma.savedJob.deleteMany({
      where: { studentId, jobId },
    });
    return { ok: true };
  }

  async getSavedJobs(studentId: string) {
    const saved = await this.prisma.savedJob.findMany({
      where: { studentId },
      include: {
        job: {
          include: {
            company: { select: { name: true } },
            branch: { select: { city: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      jobs: saved.map((s) => ({
        id: s.job.id,
        title: s.job.title,
        company: s.job.companyId,
        company_name: s.job.company.name,
        city: s.job.branch.city,
        type: s.job.type,
        deadline: s.job.deadline.toISOString(),
        salary_min: s.job.salaryMin,
        salary_max: s.job.salaryMax,
        salary_unit: s.job.salaryUnit,
        featured_until: s.job.featuredUntil?.toISOString() || null,
      })),
    };
  }

  async getRecommendations(studentId: string, profile: any) {
    const cv = await this.prisma.cV.findFirst({
      where: { studentId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    const cvData = (cv?.data as Record<string, any>) || {};
    const cvSkills = words(cvData.skills || '');

    const { jobs } = await this.listPublicJobs({});

    const history = await this.prisma.application.findMany({
      where: { studentId },
      include: { job: { select: { industry: true } } },
    });

    const industryCount = new Map<string, number>();
    for (const h of history) {
      const ind = h.job.industry;
      industryCount.set(ind, (industryCount.get(ind) || 0) + 1);
    }

    const studentMajor = ((profile?.major as string) || '__').toLowerCase();

    const recommended = jobs
      .map((j: any) => {
        const match = matchSkills(cvSkills, words(j.skills));
        const historyAffinity = Math.min(
          10,
          (industryCount.get(j.industry) || 0) * 2,
        );
        const majorMatch = j.industry.toLowerCase().includes(studentMajor);

        return {
          ...j,
          match,
          historyAffinity,
          majorMatch,
        };
      })
      .sort((a, b) => {
        const scoreA = a.match + 20 * (a.majorMatch ? 1 : 0) + a.historyAffinity;
        const scoreB = b.match + 20 * (b.majorMatch ? 1 : 0) + b.historyAffinity;
        return scoreB - scoreA;
      });

    return { jobs: recommended };
  }
}
