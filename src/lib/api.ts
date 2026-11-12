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

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const errorMsg = data?.message || (res.status === 401 ? 'عدم دسترسی: لطفاً ابتدا وارد حساب کاربری خود شوید.' : `خطای سرور (${res.status})`);
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
    return request<{ user: ApiUser }>('/api/me', {
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
};
