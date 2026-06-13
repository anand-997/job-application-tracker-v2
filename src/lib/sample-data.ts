import { uuid, nowISO } from './utils';
import type { JobApplication, StatusValue } from '@/types';

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
function dateDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const SAMPLE_JD = `We are looking for a Senior SDET with 5+ years of experience in test automation.
Required skills: Playwright, Selenium, TypeScript, API testing, CI/CD pipelines, Docker, Kubernetes.
You will design scalable automation frameworks, mentor QA engineers, and own quality across releases.
Strong understanding of REST, GraphQL, performance testing and observability is expected.`;

const SAMPLE_RESUME = `Pramod Dutta — SDET / QA Lead
Skills: Playwright, Selenium, TypeScript, JavaScript, API testing, Postman, CI/CD, Jenkins, Docker, Git.
Experience: 6 years building automation frameworks, leading QA teams, REST and GraphQL testing.
Education: B.Tech Computer Science.`;

interface Seed {
  company: string;
  role: string;
  status: StatusValue;
  source: JobApplication['source'];
  appliedAgo: number;
  lastActivityAgo: number;
  workMode: JobApplication['workMode'];
  jobType: JobApplication['jobType'];
  salaryMin?: number;
  salaryMax?: number;
  priority: JobApplication['priority'];
  skills: string[];
  location: string;
  followUpInDays?: number;
  responseDeadlineInDays?: number;
  resumeVersion?: string;
  withDocs?: boolean;
  favorite?: boolean;
  rounds?: number;
  roundsDone?: number;
}

const SEEDS: Seed[] = [
  { company: 'Infosys', role: 'SDET Manager', status: 'interview', source: 'referral', appliedAgo: 8, lastActivityAgo: 2, workMode: 'hybrid', jobType: 'fulltime', salaryMin: 1800000, salaryMax: 2500000, priority: 'dream', skills: ['Playwright', 'Selenium', 'TypeScript', 'CI/CD', 'Docker'], location: 'Bengaluru', followUpInDays: -2, resumeVersion: 'QA_Lead_v3', withDocs: true, favorite: true, rounds: 5, roundsDone: 2 },
  { company: 'Google', role: 'Software Engineer in Test', status: 'screening', source: 'linkedin', appliedAgo: 5, lastActivityAgo: 1, workMode: 'onsite', jobType: 'fulltime', salaryMin: 4000000, salaryMax: 6000000, priority: 'dream', skills: ['Java', 'Selenium', 'Distributed Systems'], location: 'Hyderabad', resumeVersion: 'SDE_Resume_v2', favorite: true },
  { company: 'Razorpay', role: 'QA Automation Engineer', status: 'applied', source: 'naukri', appliedAgo: 3, lastActivityAgo: 3, workMode: 'remote', jobType: 'fulltime', salaryMin: 1200000, salaryMax: 1800000, priority: 'high', skills: ['Cypress', 'API testing', 'Postman'], location: 'Remote', followUpInDays: 4 },
  { company: 'Zoho', role: 'Test Engineer', status: 'follow_up', source: 'company_portal', appliedAgo: 12, lastActivityAgo: 5, workMode: 'onsite', jobType: 'fulltime', salaryMin: 900000, salaryMax: 1400000, priority: 'medium', skills: ['Manual', 'JIRA', 'SQL'], location: 'Chennai', followUpInDays: -1 },
  { company: 'Swiggy', role: 'SDET II', status: 'assignment', source: 'linkedin', appliedAgo: 9, lastActivityAgo: 1, workMode: 'hybrid', jobType: 'fulltime', salaryMin: 2200000, salaryMax: 3000000, priority: 'high', skills: ['Rest Assured', 'Java', 'Kafka'], location: 'Bengaluru', resumeVersion: 'Backend_QA_v1', rounds: 4, roundsDone: 2 },
  { company: 'Flipkart', role: 'Quality Lead', status: 'offer', source: 'referral', appliedAgo: 20, lastActivityAgo: 1, workMode: 'hybrid', jobType: 'fulltime', salaryMin: 3000000, salaryMax: 4200000, priority: 'dream', skills: ['Leadership', 'Playwright', 'Performance'], location: 'Bengaluru', responseDeadlineInDays: 3, favorite: true, resumeVersion: 'QA_Lead_v3' },
  { company: 'Unstop', role: 'Junior QA (Intern)', status: 'wishlist', source: 'unstop', appliedAgo: 1, lastActivityAgo: 1, workMode: 'remote', jobType: 'internship', salaryMin: 25000, salaryMax: 40000, priority: 'low', skills: ['Manual', 'Selenium'], location: 'Remote' },
  { company: 'Postman', role: 'API Test Engineer', status: 'negotiating', source: 'linkedin', appliedAgo: 25, lastActivityAgo: 2, workMode: 'remote', jobType: 'fulltime', salaryMin: 2800000, salaryMax: 3500000, priority: 'high', skills: ['API testing', 'Newman', 'JavaScript'], location: 'Remote', responseDeadlineInDays: 6, resumeVersion: 'API_Specialist_v1' },
  { company: 'TCS', role: 'Automation Tester', status: 'rejected', source: 'naukri', appliedAgo: 30, lastActivityAgo: 10, workMode: 'onsite', jobType: 'fulltime', salaryMin: 700000, salaryMax: 1000000, priority: 'low', skills: ['Selenium', 'UFT'], location: 'Pune' },
  { company: 'Internshala', role: 'SDET Trainee', status: 'accepted', source: 'internshala', appliedAgo: 40, lastActivityAgo: 3, workMode: 'hybrid', jobType: 'internship', salaryMin: 35000, salaryMax: 50000, priority: 'medium', skills: ['Python', 'PyTest'], location: 'Gurugram' },
  { company: 'Glassdoor', role: 'QA Analyst', status: 'withdrawn', source: 'glassdoor', appliedAgo: 35, lastActivityAgo: 15, workMode: 'remote', jobType: 'contract', salaryMin: 1100000, salaryMax: 1500000, priority: 'low', skills: ['Manual', 'Accessibility'], location: 'Remote' },
  { company: 'Paytm', role: 'SDET III', status: 'applied', source: 'company_portal', appliedAgo: 45, lastActivityAgo: 45, workMode: 'onsite', jobType: 'fulltime', salaryMin: 2500000, salaryMax: 3300000, priority: 'medium', skills: ['Appium', 'Mobile', 'Java'], location: 'Noida' },
];

export function buildSampleApplications(): JobApplication[] {
  const now = nowISO();
  return SEEDS.map((s) => {
    const rounds = (s.rounds ?? 0) > 0
      ? Array.from({ length: s.rounds! }, (_, i) => ({
          id: uuid(),
          roundNumber: i + 1,
          type: (['phone', 'technical', 'video', 'hr', 'final'] as const)[i % 5],
          outcome: i < (s.roundsDone ?? 0) ? ('passed' as const) : ('pending' as const),
          completedDate: i < (s.roundsDone ?? 0) ? isoDaysAgo(s.lastActivityAgo + i) : undefined,
          interviewer: i < (s.roundsDone ?? 0) ? 'Hiring Panel' : undefined,
        }))
      : [];

    return {
      id: uuid(),
      company: s.company,
      role: s.role,
      location: s.location,
      jobUrl: `https://careers.example.com/${s.company.toLowerCase()}`,
      source: s.source,
      status: s.status,
      statusHistory: [
        { status: 'applied', timestamp: isoDaysAgo(s.appliedAgo), changedBy: 'user' },
        ...(s.status !== 'applied'
          ? [{ status: s.status, timestamp: isoDaysAgo(s.lastActivityAgo), changedBy: 'user' as const }]
          : []),
      ],
      appliedDate: isoDaysAgo(s.appliedAgo).slice(0, 10),
      followUpDate: s.followUpInDays != null ? dateDaysFromNow(s.followUpInDays) : undefined,
      responseDeadline: s.responseDeadlineInDays != null ? dateDaysFromNow(s.responseDeadlineInDays) : undefined,
      lastActivityDate: isoDaysAgo(s.lastActivityAgo),
      salaryMin: s.salaryMin,
      salaryMax: s.salaryMax,
      salaryCurrency: 'INR',
      salaryType: 'annual',
      jobType: s.jobType,
      workMode: s.workMode,
      skills: s.skills,
      jdText: s.withDocs ? SAMPLE_JD : undefined,
      jdFileName: s.withDocs ? `${s.company}_JD.pdf` : undefined,
      jdSource: s.withDocs ? 'upload' : undefined,
      jdAddedAt: s.withDocs ? isoDaysAgo(s.appliedAgo) : undefined,
      resumeText: s.withDocs ? SAMPLE_RESUME : undefined,
      resumeFileName: s.resumeVersion ? `${s.resumeVersion}.pdf` : undefined,
      resumeVersion: s.resumeVersion,
      resumeSource: s.withDocs ? 'upload' : undefined,
      resumeAddedAt: s.withDocs ? isoDaysAgo(s.appliedAgo) : undefined,
      notes: '',
      tags: s.priority === 'dream' ? ['priority'] : [],
      priority: s.priority,
      isFavorite: !!s.favorite,
      interviewRounds: rounds,
      createdAt: isoDaysAgo(s.appliedAgo),
      updatedAt: now,
    };
  });
}
