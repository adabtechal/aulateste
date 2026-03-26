const supabase = require('../lib/supabase');
const evolutionApi = require('./evolutionApi');

async function getActiveInstance() {
  const { data } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('status', 'connected')
    .limit(1)
    .single();
  return data;
}

async function sendTextMessage(leadId, text) {
  const instance = await getActiveInstance();
  if (!instance) {
    throw Object.assign(new Error('Nenhuma instância WhatsApp conectada'), { statusCode: 400 });
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('phone')
    .eq('id', leadId)
    .single();

  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  const result = await evolutionApi.sendText(instance.instance_name, lead.phone, text);

  await supabase.from('message_log').insert({
    lead_id: leadId,
    direction: 'outgoing',
    message_type: 'text',
    content: text,
    whatsapp_message_id: result?.key?.id,
    status: 'sent'
  });

  return result;
}

async function sendMediaMessage(leadId, mediaUrl, caption, mimetype) {
  const instance = await getActiveInstance();
  if (!instance) {
    throw Object.assign(new Error('Nenhuma instância WhatsApp conectada'), { statusCode: 400 });
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('phone')
    .eq('id', leadId)
    .single();

  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  const result = await evolutionApi.sendMedia(instance.instance_name, lead.phone, mediaUrl, caption, mimetype);

  await supabase.from('message_log').insert({
    lead_id: leadId,
    direction: 'outgoing',
    message_type: 'image',
    content: caption,
    media_url: mediaUrl,
    whatsapp_message_id: result?.key?.id,
    status: 'sent'
  });

  return result;
}

async function sendScheduledMessage(scheduled) {
  const instance = await getActiveInstance();
  if (!instance) throw new Error('No connected WhatsApp instance');

  const { data: lead } = await supabase
    .from('leads')
    .select('name, phone, company')
    .eq('id', scheduled.lead_id)
    .single();

  if (!lead) throw new Error('Lead not found');

  const autoMsg = scheduled.auto_messages;
  let text = autoMsg.message_template
    .replace(/\{\{name\}\}/g, lead.name || '')
    .replace(/\{\{phone\}\}/g, lead.phone || '')
    .replace(/\{\{company\}\}/g, lead.company || '');

  let result;
  if (autoMsg.message_type === 'image' && autoMsg.media_url) {
    result = await evolutionApi.sendMedia(instance.instance_name, lead.phone, autoMsg.media_url, text);
  } else {
    result = await evolutionApi.sendText(instance.instance_name, lead.phone, text);
  }

  await supabase.from('message_log').insert({
    lead_id: scheduled.lead_id,
    direction: 'auto',
    message_type: autoMsg.message_type,
    content: text,
    media_url: autoMsg.media_url,
    whatsapp_message_id: result?.key?.id,
    status: 'sent'
  });

  return result;
}

module.exports = { sendTextMessage, sendMediaMessage, sendScheduledMessage, getActiveInstance };
