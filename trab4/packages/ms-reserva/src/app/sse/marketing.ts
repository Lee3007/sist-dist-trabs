const clients: Record<string, any> = {};
const interests: Record<string, string[]> = {};

export const sendSseUpdate = (destination: string, data: any) => {
  const interestedUsers = interests[destination] || [];
  console.log(
    `Sending SSE update for destination ${destination} to ${interestedUsers.length} user(s)`
  );
  const connectedClients =
    interests[destination]?.map((userId) => clients[userId]) || [];
  connectedClients.forEach((client) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

export const addSseClient = (email: string, res: any) => {
  clients[email] = res;
};

export const removeSseClient = (email: string) => {
  Object.keys(interests).forEach((key) => {
    interests[key] = interests[key].filter((userId) => userId !== email);
  });
  delete clients[email];
  console.log(`User ${email} removed from all interests.`);
};

export const removeUserInterest = (email: string, interest: string) => {
  if (interests[interest]) {
    interests[interest] = interests[interest].filter(
      (userId) => userId !== email
    );
    console.log(`User ${email} removed interest in ${interest}`);
  } else {
    console.log(`Interest ${interest} not found for user ${email}`);
  }
};

export const registerUserInterest = (email: string, interest: string) => {
  if (!interests[interest]) {
    interests[interest] = [];
  }
  if (!interests[interest].includes(email)) {
    interests[interest].push(email);
    console.log(`User ${email} registered interest in ${interest}`);
  } else {
    console.log(`User ${email} already registered interest in ${interest}`);
  }
};

export const getUserInterests = (email: string): string[] => {
  const userInterests: string[] = [];
  Object.keys(interests).forEach((key) => {
    if (interests[key].includes(email)) {
      userInterests.push(key);
    }
  });
  return userInterests;
};
