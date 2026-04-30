export type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

const clients = new Set<SSEClient>();

export function addClient(client: SSEClient) {
  clients.add(client);
}

export function removeClient(client: SSEClient) {
  clients.delete(client);
}

export function broadcast(event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const client of clients) {
    try {
      client.controller.enqueue(message);
    } catch {
      clients.delete(client);
    }
  }
}
