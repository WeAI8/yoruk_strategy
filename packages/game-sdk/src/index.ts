/**
 * YORUK GAMES — GAME CLIENT INTEGRATION SDK
 *
 * Harici oyun istemcileri (HTML5, WebGL, Unity WebGL, Unreal Pixel Streaming, Node.js game servers)
 * için tek tıkla şifresiz oturum (SSO Ticket Exchange) protokolü.
 */

export interface PlayerSession {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  valid: boolean;
}

export interface ExchangeTicketRequest {
  ticket: string;
  clientId: string;
  clientSecret: string;
  client_id?: string;
  client_secret?: string;
}

export interface ExchangeTicketResponse {
  valid?: boolean;
  userId?: string;
  user_id?: string;
  username: string;
  email: string;
  roles: string[];
}

export interface YorukSdkOptions {
  apiBaseUrl?: string;
  clientId: string;
  clientSecret: string;
  autoExtractTicket?: boolean;
}

export class YorukGameClient {
  private apiBaseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private currentSession: PlayerSession | null = null;

  constructor(options: YorukSdkOptions) {
    this.apiBaseUrl = options.apiBaseUrl || 'http://localhost:8080';
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
  }

  /**
   * Tarayıcı URL'indeki (?ticket=tkt_...) parametresini otomatik ayıklar.
   */
  public static getTicketFromUrl(): string | null {
    if (typeof window === 'undefined' || !window.location) {
      return null;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('ticket');
  }

  /**
   * 60 saniyelik tek kullanımlık bileti Yoruk Games Platformu ile takas eder.
   */
  public async authenticate(ticket?: string): Promise<PlayerSession> {
    const finalTicket = ticket || YorukGameClient.getTicketFromUrl();

    if (!finalTicket) {
      throw new Error(
        '[YorukSDK] Geçerli bir bilet (ticket) bulunamadı. URL parametresini veya açık bileti kontrol edin.'
      );
    }

    const payload: ExchangeTicketRequest = {
      ticket: finalTicket,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    };

    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/exchange-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `[YorukSDK] Bilet takası başarısız oldu (${response.status}): ${err.message || 'Geçersiz veya süresi dolmuş bilet'}`
      );
    }

    const data: ExchangeTicketResponse = await response.json();
    const resolvedUserId = data.userId || data.user_id || '';

    this.currentSession = {
      userId: resolvedUserId,
      username: data.username,
      email: data.email,
      roles: data.roles || [],
      valid: data.valid !== undefined ? data.valid : Boolean(resolvedUserId),
    };

    return this.currentSession;
  }

  /**
   * Aktif oyuncu oturumunu döner.
   */
  public getPlayer(): PlayerSession | null {
    return this.currentSession;
  }

  /**
   * Oturumun geçerli olup olmadığını kontrol eder.
   */
  public isAuthenticated(): boolean {
    return this.currentSession !== null && this.currentSession.valid;
  }
}

export default YorukGameClient;
