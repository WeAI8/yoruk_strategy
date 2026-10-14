export interface SsoUser {
  userId: string;
  user_id?: string;
  username: string;
  email: string;
  roles: string[];
  valid?: boolean;
}

export interface TicketExchangeConfig {
  platformAuthUrl: string;
  clientId: string;
  clientSecret: string;
}

export async function exchangeTicket(
  ticket: string,
  config: TicketExchangeConfig
): Promise<SsoUser | null> {
  // Test/Development ve Hızlı Demo amacıyla dev_ bilet desteği
  const allowDevTickets = process.env.ALLOW_DEV_TICKETS !== 'false';
  if ((process.env.NODE_ENV !== 'production' || allowDevTickets) && ticket.startsWith('dev_')) {
    const cleanId = ticket.replace('dev_', '');
    return {
      userId: `user-${cleanId}`,
      username: `Kürşat_${ticket.slice(4, 9)}`,
      email: 'dev@yorukgames.com',
      roles: ['ROLE_USER'],
      valid: true,
    };
  }

  try {
    const response = await fetch(config.platformAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!response.ok) {
      console.warn(`[SSO] Ticket validation failed with status ${response.status}`);
      return null;
    }

    const data = (await response.json()) as SsoUser;
    const resolvedUserId = data.userId || data.user_id;
    if (!resolvedUserId || data.valid === false) {
      return null;
    }

    return {
      userId: resolvedUserId,
      username: data.username,
      email: data.email,
      roles: data.roles || ['ROLE_USER'],
      valid: true,
    };
  } catch (err) {
    console.error('[SSO] Platform authentication request error:', err);
    return null;
  }
}
