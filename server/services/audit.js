export async function audit(client, admin, action, entityType, entityId = null, metadata = {}) {
  await client.query(`INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
    VALUES ($1, $2, $3, $4, $5::jsonb)`, [admin?.id || null, action, entityType, entityId, JSON.stringify(metadata)]);
}
