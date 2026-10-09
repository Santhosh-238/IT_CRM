export async function logAuditEvent(data) {
  const timestamp = new Date();
  const ip = data.ipAddress || '127.0.0.1';

  console.log(`🛡️ [Audit Log] [${data.action}] on ${data.entity} (${data.entityId}) by ${data.userName} (${data.userRole}) - IP: ${ip} | ${data.details}`);

  return {
    id: `audit-${Date.now()}`,
    ...data,
    timestamp,
    ipAddress: ip,
  };
}

export default { logAuditEvent };
