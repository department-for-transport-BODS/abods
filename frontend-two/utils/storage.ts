import { Session, User } from "@/types";

class StorageEntry<T> {
  constructor(private readonly key: string) {}

  get(): T | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      console.error(`Failed to parse ${this.key} from localStorage`);
      return null;
    }
  }

  set(value: T): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.key, JSON.stringify(value));
  }

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.key);
  }
}

class SessionStore extends StorageEntry<Session> {
  constructor() {
    super("session");
  }

  isAlive(): boolean {
    const session = this.get();
    if (!session?.expiresAt) return false;
    return new Date().toISOString() <= session.expiresAt;
  }
}

export const sessionStore = new SessionStore();
export const userStore = new StorageEntry<User>("user");
