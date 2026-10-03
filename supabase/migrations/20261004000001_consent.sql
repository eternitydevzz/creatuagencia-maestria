-- MaestrIA · constancia de que el alumno aceptó, al vincular un número de WhatsApp, informar a sus clientes de que hablan con un
-- asistente virtual y de que se guardan sus mensajes (ver política de privacidad). Lo escribe solo el servidor.
alter table public.whatsapp_connections add column consent_at timestamptz;
