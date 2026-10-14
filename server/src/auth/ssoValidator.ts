export interface SsoUser {
  userId: string;
  username: string;
  email: string;
  roles: string[];
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
  // Test/Development amacıyla mock ticket desteği (Örn: dev_ticket_123 veya test_...)
  if (process.env.NODE_ENV !== 'production' && ticket.startsWith('dev_')) {
    return {
      userId: `user-${ticket.replace('dev_', '')}`,
      username: `Kürşat_${ticket.slice(4, 9)}`,
      email: 'dev@yorukgames.com',
      roles: ['ROLE_USER'],
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
      }),
    });

    if (!response.ok) {
      console.warn(`[SSO] Ticket validation failed with status ${response.status}`);
      return null;
    }

    const data = (await response.json()) as SsoUser;
    return data;
  } catch (err) {
    console.error('[SSO] Platform authentication request error:', err);
    return null;
  }
}
