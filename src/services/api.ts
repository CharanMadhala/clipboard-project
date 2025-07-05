const API_BASE_URL = '/api';

export interface Clip {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface ClipFormData {
  title: string;
  content: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async getClips(): Promise<Clip[]> {
    return this.request<Clip[]>('/clips');
  }

  async createClip(data: ClipFormData): Promise<Clip> {
    return this.request<Clip>('/clips', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClip(id: string, data: ClipFormData): Promise<Clip> {
    return this.request<Clip>(`/clips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClip(id: string): Promise<void> {
    await this.request<void>(`/clips/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();