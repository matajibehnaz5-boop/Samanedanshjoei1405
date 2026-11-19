export interface ApiUser {
  id: string;
  email: string;
  name: string;
  studentId: string;
  role: 'student' | 'admin';
  profile: Record<string, any>;
  field: string;
  term: string;
  institute: string;
  phone: string;
  avatar: string;
  gpa: number | null;
  creditsPassed: number | null;
  creditsTotal: number | null;
  createdAt: string;
}

export interface ApiChatMessage {
  id: number;
  userId: string;
  sender: string;
  avatar: string | null;
  text: string;
  role: string;
  createdAt: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
  studentId?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export type UpdateMeParams = Partial<{
  name: string;
  studentId: string;
  field: string;
  term: string;
  institute: string;
  phone: string;
  avatar: string;
  gpa: number | null;
  creditsPassed: number | null;
  creditsTotal: number | null;
}>;

export interface EduGroup {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
  createdAt: string;
}

export interface EduField {
  id: string;
  name: string;
  level: string;
  employeeCount: number;
  createdAt: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  personnelCode: string;
  phone: string;
  position: string;
  groupId: string | null;
  groupName: string;
  fieldId: string | null;
  fieldName: string;
  createdAt: string;
}

export interface CreateEduGroupParams {
  name: string;
  head?: string;
}

export interface CreateEduFieldParams {
  name: string;
  level?: string;
}

export interface CreateEmployeeParams {
  firstName: string;
  lastName: string;
  nationalId: string;
  personnelCode?: string;
  phone?: string;
  position?: string;
  groupId?: string | null;
  fieldId?: string | null;
}

export type AcademicRank = 'مربی' | 'استادیار' | 'دانشیار' | 'استاد';
export type ProfessorAccessLevel = 'view' | 'advisor' | 'referee' | 'group_head';

export interface ProfessorSpecialty {
  id: string;
  name: string;
  professorCount: number;
  createdAt: string;
}

export interface Professor {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  personnelCode: string;
  phone: string;
  email: string;
  academicRank: AcademicRank;
  groupId: string | null;
  groupName: string;
  fieldId: string | null;
  fieldName: string;
  specialtyId: string | null;
  specialtyName: string;
  capacity: number;
  accessLevel: ProfessorAccessLevel;
  createdAt: string;
}

export interface CreateProfessorParams {
  firstName: string;
  lastName: string;
  nationalId: string;
  personnelCode?: string;
  phone?: string;
  email?: string;
  academicRank: AcademicRank;
  groupId?: string | null;
  fieldId?: string | null;
  specialtyId?: string | null;
  capacity: number;
  accessLevel?: ProfessorAccessLevel;
}

export interface ProfessorThesis {
  id: string;
  title: string;
  studentName: string;
  role: 'advisor' | 'co_advisor' | 'referee';
  status?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  studentNumber: string;
  phone: string;
  fieldId: string | null;
  fieldName: string;
  groupId: string | null;
  groupName: string;
  createdAt: string;
}

export interface CreateStudentParams {
  firstName: string;
  lastName: string;
  nationalId: string;
  studentNumber: string;
  phone?: string;
  fieldId?: string | null;
  groupId?: string | null;
}

export interface BulkStudentRow {
  rowNumber?: number;
  firstName: string;
  lastName: string;
  nationalId: string;
  studentNumber: string;
  phone?: string;
  fieldName?: string;
  groupName?: string;
}

export interface BulkStudentError {
  rowNumber: number;
  reason: string;
}

export interface BulkAddStudentsResponse {
  insertedCount: number;
  duplicateCount: number;
  errorCount: number;
  errors: BulkStudentError[];
}

const ALLOWED_PROFILE_KEYS = [
  'name',
  'studentId',
  'field',
  'term',
  'institute',
  'phone',
  'avatar',
  'gpa',
  'creditsPassed',
  'creditsTotal',
] as const;

function mapApiErrorMessage(status: number, serverMessage?: string, endpoint?: string): string {
  const msg = (serverMessage || '').trim();
  const lower = msg.toLowerCase();

  if (lower.includes('invalid email or password length')) {
    return 'طول ایمیل یا رمز عبور معتبر نیست.';
  }
  if (lower.includes('invalid email or password')) {
    return 'ایمیل یا رمز عبور اشتباه است.';
  }
  if (lower.includes('email and password are required')) {
    return 'لطفاً ایمیل و رمز عبور را وارد نمایید.';
  }
  if (lower.includes('valid email')) {
    return 'لطفاً یک ایمیل معتبر وارد نمایید.';
  }
  if (lower.includes('password must be between')) {
    return 'رمز عبور باید بین ۶ تا ۱۲۸ کاراکتر باشد.';
  }
  if (lower.includes('name is required')) {
    return 'نام و نام خانوادگی الزامی است (حداکثر ۱۰۰ کاراکتر).';
  }
  if (lower.includes('student id must not exceed')) {
    return 'شماره دانشجویی نباید بیشتر از ۵۰ کاراکتر باشد.';
  }
  if (lower.includes('email is already registered')) {
    return 'این ایمیل قبلاً در سامانه ثبت شده است.';
  }
  if (lower.includes('registration with administrator email is forbidden')) {
    return 'ثبت‌نام با ایمیل مدیر سیستم مجاز نیست.';
  }
  if (lower.includes('current password is incorrect')) {
    return 'رمز عبور فعلی اشتباه است.';
  }
  if (lower.includes('api route not found') || (status === 404 && (!msg || /^[\x00-\x7F]+$/.test(msg)))) {
    return 'خطای سرور: سرویس احراز هویت یافت نشد. لطفاً وضعیت سرور را بررسی کنید.';
  }
  if (status === 404 && msg) {
    return msg;
  }
  if (status === 423 || lower.includes('temporarily locked')) {
    return 'حساب کاربری به دلیل تلاش‌های ناموفق موقتاً قفل شده است. لطفاً کمی بعد دوباره تلاش کنید.';
  }
  if (status === 429 || lower.includes('too many')) {
    return 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً چند دقیقه دیگر دوباره تلاش کنید.';
  }
  if (status === 401) {
    if (endpoint?.includes('/auth/login')) {
      return 'ایمیل یا رمز عبور اشتباه است.';
    }
    return 'عدم دسترسی: لطفاً ابتدا وارد حساب کاربری خود شوید.';
  }
  if (status >= 500) {
    return 'خطای سرور در پردازش درخواست. لطفاً لحظاتی دیگر دوباره تلاش کنید.';
  }
  if (msg) {
    return msg;
  }
  return `خطای سرور (${status})`;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'same-origin',
    });
  } catch {
    throw new Error('خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const errorMsg = mapApiErrorMessage(res.status, data?.message, endpoint);
    const error = new Error(errorMsg);
    (error as any).status = res.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  async register(params: RegisterParams): Promise<{ user: ApiUser }> {
    return request<{ user: ApiUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async login(params: LoginParams): Promise<{ user: ApiUser }> {
    return request<{ user: ApiUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async logout(): Promise<{ message: string }> {
    return request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });
  },

  // User Profile
  async getMe(): Promise<{ user: ApiUser }> {
    return request<{ user: ApiUser }>('/api/auth/me', {
      method: 'GET',
    });
  },

  async updateMe(fields: UpdateMeParams): Promise<{ user: ApiUser }> {
    // Strictly filter to allowed fields only
    const filtered: Record<string, any> = {};
    for (const key of ALLOWED_PROFILE_KEYS) {
      if (fields[key] !== undefined) {
        filtered[key] = fields[key];
      }
    }

    return request<{ user: ApiUser }>('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(filtered),
    });
  },

  async changePassword(params: ChangePasswordParams): Promise<{ message: string }> {
    return request<{ message: string }>('/api/me/password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Chat Messages
  async getMessages(after?: number): Promise<{ messages: ApiChatMessage[] }> {
    const query = after !== undefined && after !== null ? `?after=${after}` : '';
    return request<{ messages: ApiChatMessage[] }>(`/api/messages${query}`, {
      method: 'GET',
    });
  },

  async sendMessage(text: string): Promise<{ message: ApiChatMessage }> {
    return request<{ message: ApiChatMessage }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // Educational Affairs (Admin Only)
  async getEduGroups(): Promise<{ groups: EduGroup[] }> {
    return request<{ groups: EduGroup[] }>('/api/admin/edu-groups', {
      method: 'GET',
    });
  },

  async addEduGroup(params: CreateEduGroupParams): Promise<{ group: EduGroup }> {
    return request<{ group: EduGroup }>('/api/admin/edu-groups', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async deleteEduGroup(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/edu-groups/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async getEduFields(): Promise<{ fields: EduField[] }> {
    return request<{ fields: EduField[] }>('/api/admin/edu-fields', {
      method: 'GET',
    });
  },

  async addEduField(params: CreateEduFieldParams): Promise<{ field: EduField }> {
    return request<{ field: EduField }>('/api/admin/edu-fields', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async deleteEduField(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/edu-fields/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async getEmployees(): Promise<{ employees: Employee[] }> {
    return request<{ employees: Employee[] }>('/api/admin/employees', {
      method: 'GET',
    });
  },

  async addEmployee(params: CreateEmployeeParams): Promise<{ employee: Employee }> {
    return request<{ employee: Employee }>('/api/admin/employees', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async deleteEmployee(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/employees/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Professor Affairs (Admin Only)
  async getProfessorSpecialties(): Promise<{ specialties: ProfessorSpecialty[] }> {
    return request<{ specialties: ProfessorSpecialty[] }>('/api/admin/professor-specialties', {
      method: 'GET',
    });
  },

  async addProfessorSpecialty(name: string): Promise<{ specialty: ProfessorSpecialty }> {
    return request<{ specialty: ProfessorSpecialty }>('/api/admin/professor-specialties', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async deleteProfessorSpecialty(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/professor-specialties/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async getProfessors(): Promise<{ professors: Professor[] }> {
    return request<{ professors: Professor[] }>('/api/admin/professors', {
      method: 'GET',
    });
  },

  async addProfessor(params: CreateProfessorParams): Promise<{ professor: Professor }> {
    return request<{ professor: Professor }>('/api/admin/professors', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async deleteProfessor(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/professors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async updateProfessorAccess(
    id: string,
    accessLevel: ProfessorAccessLevel
  ): Promise<{ message: string; professor: Professor }> {
    return request<{ message: string; professor: Professor }>(
      `/api/admin/professors/${encodeURIComponent(id)}/access`,
      {
        method: 'PATCH',
        body: JSON.stringify({ accessLevel }),
      }
    );
  },

  async getProfessorTheses(id: string): Promise<{ theses: ProfessorThesis[] }> {
    return request<{ theses: ProfessorThesis[] }>(
      `/api/admin/professors/${encodeURIComponent(id)}/theses`,
      {
        method: 'GET',
      }
    );
  },

  // Student Affairs (Admin Only)
  async getStudents(q?: string): Promise<{ students: Student[] }> {
    const query = q && q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    return request<{ students: Student[] }>(`/api/admin/students${query}`, {
      method: 'GET',
    });
  },

  async addStudent(params: CreateStudentParams): Promise<{ student: Student }> {
    return request<{ student: Student }>('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async bulkAddStudents(rows: BulkStudentRow[]): Promise<BulkAddStudentsResponse> {
    return request<BulkAddStudentsResponse>('/api/admin/students/bulk', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },

  async deleteStudent(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/students/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
