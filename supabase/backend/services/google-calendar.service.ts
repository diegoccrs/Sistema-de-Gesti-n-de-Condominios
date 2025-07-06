import { Injectable } from '@angular/core';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class GoogleCalendarService {
  private clientId = '188019915786-2okk9vktvokplqm6grat4q2ksseub134.apps.googleusercontent.com'; // ⬅️ Reemplaza con el tuyo
  private tokenClient: any;
   accessToken: string = '';  // 👈 AÑADE ESTA LÍNEA

  constructor() {}

  initClient(): void {
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: 'https://www.googleapis.com/auth/calendar.events',
      callback: '', // se asigna dinámicamente
    });
  }

 async signIn(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
      } else {
        this.accessToken = resp.access_token; // 👈 GUÁRDALO AQUÍ
        resolve();
      }
    };

    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}


  async createEvent(summary: string, description: string, date: string): Promise<any> {
  const event = {
    summary,
    description,
    start: { date },
    end: { date },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${this.accessToken}`, // 👈 USAR EL TOKEN GUARDADO
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const errorText = await res.text(); // 👈 esto te da detalles útiles
    throw new Error('Error al crear el evento: ' + errorText);
  }

  return res.json();
}
}