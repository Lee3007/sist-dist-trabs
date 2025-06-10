const clients: Record<number, any[]> = {};

export const sendSseUpdate = (bookingId: number, data: any) => {
  const connectedClients = clients[bookingId] || [];
  console.log(
    `Sending SSE update for booking #${bookingId} to ${connectedClients.length} client(s)`
  );

  connectedClients.forEach((client) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

export const addSseClient = (bookingId: number, res: any) => {
  if (!clients[bookingId]) {
    clients[bookingId] = [];
  }

  clients[bookingId].push(res);
  console.log(
    `Client added for booking #${bookingId}. Total clients: ${clients[bookingId].length}`
  );
};

export const removeSseClient = (bookingId: number, res: any) => {
  clients[bookingId] = clients[bookingId]?.filter((client) => client !== res);
  console.log(
    `Client added for booking #${bookingId}. Total clients: ${clients[bookingId].length}`
  );
};
