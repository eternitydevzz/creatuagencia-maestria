// Ejemplos para el servidor simulado (solo pruebas locales). Están escritos a mano con el nivel de calidad que se espera
// de la IA real, para que la vista previa local sea representativa. Nicho de ejemplo: gimnasios boutique · agencia FitIA.

export const IDEAL = {
  resumen: 'Dueño de un gimnasio boutique o box de 150-400 socios que pierde altas porque nadie contesta el WhatsApp mientras da clase.',
  perfil: {
    quien: 'Propietario y entrenador, 32-45 años. Da clases mañana y tarde y contesta mensajes entre sesiones o a las 23:00.',
    tamano_negocio: '1 sede, 2-5 entrenadores, 150-400 socios, 40-80 consultas nuevas al mes',
    facturacion: '180.000-450.000 € al año',
    como_capta_hoy: 'Instagram, Google Maps y boca a boca. Las consultas llegan por WhatsApp y DM y se contestan horas después.',
    nivel_digital: 'Medio: usa software de reservas (Aimharder, Trainingym), pero nada automatiza la captación.',
    herramientas: 'WhatsApp Business, Instagram, Aimharder o Trainingym y, a veces, un Excel de leads',
  },
  coste_del_problema: '60 consultas/mes × 40 % que se enfrían × 30 % que se habrían apuntado × 65 €/mes × 8 meses de permanencia media ≈ 3.700 € de ingresos perdidos al mes (estimado)',
  dolores: [
    'Me escriben mientras estoy dando clase y cuando contesto ya se han apuntado en otro sitio.',
    'Los domingos por la noche tengo 15 WhatsApps y no sé por dónde empezar.',
    'Hacen la clase de prueba y luego no les vuelvo a escribir; se me pasa.',
    'Me paso más tiempo contestando mensajes que entrenando.',
    'En enero y septiembre me entra de todo y pierdo la mitad por no dar abasto.',
    'Contratar a alguien solo para contestar no me sale a cuenta.',
  ],
  deseos: [
    'Que cada persona que pregunta reciba respuesta al momento, aunque yo esté en clase.',
    'Tener las clases de prueba llenas sin estar pegado al móvil.',
    'Que alguien haga el seguimiento a los que prueban y no se apuntan.',
    'Recuperar las tardes.',
  ],
  momentos_de_compra: [
    'Las semanas antes de enero y de septiembre, cuando espera el pico de altas.',
    'Cuando invierte en anuncios de Meta y ve que las consultas no se convierten.',
    'Cuando la persona que llevaba recepción se va o reduce horas.',
    'Al abrir un horario nuevo o una segunda sala.',
  ],
  senales_compra: [
    'Publica en Instagram varias veces por semana y tiene historias recientes.',
    'Tiene más de 80 reseñas en Google y alguna queja de "no me contestaron".',
    'Tiene anuncios activos en la Biblioteca de anuncios de Meta.',
    'Ofrece clase de prueba gratuita en su web o en la bio.',
    'Tarda más de una hora en contestar un WhatsApp de prueba.',
  ],
  red_flags: [
    'Menos de 80 socios o a punto de cerrar.',
    'Quiere un número exacto de altas garantizado por contrato.',
    'No tiene WhatsApp Business ni quiere dar acceso.',
    'Forma parte de una cadena que decide desde la central.',
  ],
  donde_esta: [
    'Google Maps: "gimnasio boutique [ciudad]", "box crossfit [ciudad]", "entrenamiento personal [barrio]", filtrando por 4,5 estrellas o más.',
    'Instagram: #crossfit[ciudad], #gimnasio[ciudad], #entrenadorpersonal[ciudad]; prioriza a quien publica historias a diario.',
    'Biblioteca de anuncios de Meta: busca "clase de prueba gratis" + tu ciudad. Quien paga anuncios ya tiene el problema.',
    'Listados de afiliados CrossFit y de federaciones de entrenamiento funcional de tu provincia.',
    'Competiciones y quedadas locales (Hyrox, competiciones de box).',
  ],
  preguntas_cualificacion: [
    '¿Cuántas consultas nuevas os llegan al mes por WhatsApp e Instagram?',
    '¿Quién las contesta y cuánto se tarda de media?',
    '¿Qué pasa con los que hacen la clase de prueba y no se apuntan?',
    '¿Cuánto paga un socio al mes y cuánto tiempo se queda?',
    'Si mañana tuvierais 10 altas más al mes, ¿tendríais hueco en las clases?',
  ],
  avatar: { nombre: 'Javi, 38 años, dueño de un box de CrossFit con 220 socios en Valencia', dia_a_dia: 'A las 7:00 abre el box y da la primera clase. Entre clases contesta WhatsApps de pie en recepción. De 18:00 a 21:00 no suelta la pizarra y el móvil acumula mensajes. A las 23:00, en el sofá, contesta lo que puede y deja el resto para mañana.' },
  su_lenguaje: ['altas', 'bajas', 'clase de prueba', 'el WOD', 'la cuota', 'la cuesta de enero', 'no doy abasto', 'me escriben en plena clase'],
  objeciones: ['¿Y mis socios van a notar que es un robot?', 'Ya lo contesto yo, aunque sea tarde.', 'No tengo tiempo para montar nada.', '¿Cuánto me va a costar al mes?', '¿Y si no me trae ni una alta?'],
}

export const OFFER = {
  oferta: {
    nombre: 'Agenda Llena para Gimnasios Boutique en 30 días',
    para_quien: 'Gimnasios boutique y boxes de 150-400 socios que reciben consultas por WhatsApp e Instagram y no dan abasto.',
    promesa: 'Cada consulta contestada en menos de 60 segundos y al menos 10 clases de prueba más reservadas al mes en 30 días.',
    mecanismo: 'Sistema Respuesta 60: un asistente entrenado con tus tarifas, horarios y forma de hablar contesta al instante en WhatsApp e Instagram, reserva la clase de prueba en tu calendario y escribe el día 1, 3 y 7 a quien no se apunta. No sustituye al equipo: evita que las consultas se enfríen mientras das clase.',
    incluye: [
      { entregable: 'Asistente de WhatsApp e Instagram 24/7', que_resuelve: 'Nadie espera más de un minuto, también a las 23:00 y en domingo', valor_percibido: '1.200 €' },
      { entregable: 'Reserva automática de clases de prueba', que_resuelve: 'La consulta termina en una cita en tu calendario, no en "ya te digo"', valor_percibido: '600 €' },
      { entregable: 'Seguimiento a quien prueba y no se apunta', que_resuelve: 'Recupera altas que hoy se pierden por no volver a escribir', valor_percibido: '800 €' },
      { entregable: 'Reactivación de antiguos socios', que_resuelve: 'Una campaña al trimestre a quien se dio de baja, con oferta de vuelta', valor_percibido: '500 €' },
      { entregable: 'Informe mensual en una página', que_resuelve: 'Sabes cuántas consultas, pruebas y altas ha generado el sistema', valor_percibido: '200 €' },
    ],
    garantia: 'Si en 30 días el sistema no ha reservado al menos 10 clases de prueba más, seguimos trabajando gratis hasta conseguirlo o te devolvemos la puesta en marcha. Solo pedimos que conectes tu WhatsApp Business y contestes las conversaciones que el asistente te pase.',
    precio: {
      setup: '690 €', mensual: '290 €/mes', valor_total_percibido: '3.300 €',
      justificacion: 'Hoy se te escapan cerca de 3.700 € al mes en consultas que se enfrían. Una persona solo para contestar cuesta más de 1.400 €/mes y no trabaja a las 23:00. Con una alta extra al mes el sistema casi se paga solo.',
    },
    bonos: [
      'Guion de clase de prueba que convierte en socio (resuelve "reservan pero no se apuntan")',
      'Ficha de Google Business optimizada y respuesta a reseñas (resuelve "no tengo tiempo para esto")',
      '30 días sin permanencia: si no te convence, lo apagamos',
    ],
    urgencia: 'Solo ponemos en marcha 4 gimnasios al mes para hacerlo bien, y antes del pico de enero las plazas se llenan.',
    pitch_30s: 'Ayudamos a gimnasios boutique a no perder ni una consulta. Un asistente entrenado con tus tarifas y horarios contesta en menos de un minuto por WhatsApp e Instagram, reserva la clase de prueba en tu calendario y hace el seguimiento a quien no se apunta. Tú sigues dando clase y las altas llegan igual. Si en 30 días no te ha reservado 10 clases de prueba más, seguimos gratis hasta conseguirlo.',
    objeciones: [
      { objecion: 'Es caro', respuesta: 'Tiene sentido mirarlo. Con lo que me cuentas pierdes unas 20 consultas al mes; si solo una se apunta, cubre la cuota. ¿Cuánto te deja un socio en un año?' },
      { objecion: 'Ya contesto yo', respuesta: 'Y se nota que lo cuidas. La pregunta es cuánto tardas cuando estás en clase. Si ahora te escribo como si fuera un cliente, ¿cuándo me contestarías?' },
      { objecion: 'Mis clientes notarán que es una IA', respuesta: 'Habla con tu tono y, en cuanto algo se sale de lo normal, te lo pasa. ¿Te enseño una conversación con tus propios horarios y precios?' },
      { objecion: 'No tengo tiempo para montarlo', respuesta: 'Por eso lo montamos nosotros: una llamada de 30 minutos y tus tarifas. En 7 días está funcionando. ¿Te va mejor el martes o el jueves?' },
      { objecion: '¿Y si no funciona?', respuesta: 'Para eso está la garantía: si en 30 días no hay 10 clases de prueba más, seguimos gratis o te devolvemos la puesta en marcha. ¿Qué más necesitarías para probarlo?' },
    ],
  },
  oferta_piloto: {
    nombre: 'Piloto Respuesta 60',
    que_incluye: 'Asistente de WhatsApp e Instagram y reserva de clases de prueba durante 21 días',
    precio: '190 €, todo incluido',
    duracion: '21 días',
    paso_a_principal: 'Si reserva al menos 8 clases de prueba en 21 días, pasas a la oferta principal con la puesta en marcha ya pagada: solo 290 €/mes.',
    como_proponerla: 'Para que no tengas que fiarte de mí: lo probamos 21 días por 190 €. Si no te reserva 8 clases de prueba, lo apagamos y no pasa nada. ¿Lo dejamos listo esta semana?',
  },
  escalera: [
    { nivel: 'Entrada', nombre: 'Piloto Respuesta 60', precio: '190 € / 21 días', incluye: 'Asistente 24/7 y reserva de pruebas', para_quien: 'Quien quiere probar sin riesgo' },
    { nivel: 'Principal', nombre: 'Agenda Llena', precio: '690 € + 290 €/mes', incluye: 'Todo lo anterior, seguimiento, reactivación e informe mensual', para_quien: 'Gimnasios de 150-400 socios' },
    { nivel: 'Premium', nombre: 'Agenda Llena + Captación', precio: '1.490 € + 690 €/mes', incluye: 'Todo lo anterior, anuncios en Meta y landing de captación', para_quien: 'Gimnasios que quieren crecer o abrir segunda sede' },
  ],
  numeros_agencia: {
    coste_entrega_mensual: 'Unos 45 € en herramientas (IA, API de WhatsApp, automatizaciones) y 2 horas de revisión al mes por cliente',
    margen_por_cliente: 'Unos 245 €/mes (84 %), más 690 € de puesta en marcha',
    clientes_para_5000_mes: '17 clientes en la oferta principal, o 8 en la principal y 4 en premium',
  },
}

export const SITE = {
  meta: { title: 'Agenda Llena para gimnasios boutique · FitIA', description: 'Cada consulta de WhatsApp e Instagram contestada en menos de 60 segundos y más clases de prueba reservadas. En marcha en 7 días.' },
  nav_cta: 'Ver mi demo',
  hero: {
    eyebrow: 'Para gimnasios boutique y boxes',
    titulo: 'Cada consulta contestada en 60 segundos, también a las 23:00',
    subtitulo: 'Un asistente entrenado con tus tarifas y horarios contesta por WhatsApp e Instagram, reserva la clase de prueba y hace el seguimiento. En marcha en 7 días.',
    cta: 'Quiero ver mi demo',
    nota: 'Te la enseñamos con los datos de tu gimnasio. 15 minutos, sin compromiso.',
    pruebas: ['En marcha en 7 días', 'Sin permanencia', 'Garantía de 30 días'],
  },
  problema: {
    titulo: 'Cada mensaje sin contestar es un socio que se apunta en otro sitio',
    intro: 'La gente escribe a tres gimnasios a la vez y se queda con el primero que contesta. Mientras das clase, tus consultas se enfrían.',
    puntos: [
      { titulo: 'Consultas que se enfrían', texto: 'Te escriben a las 19:00, en plena clase. Cuando contestas a las 22:00 ya han reservado en otro sitio.', coste: '−1.800 €/mes' },
      { titulo: 'Pruebas que no vuelven', texto: 'Hacen la clase de prueba, les gusta y nadie les escribe al día siguiente para cerrar el alta.', coste: '−1.200 €/mes' },
      { titulo: 'Tu tiempo, en el móvil', texto: 'Una hora al día contestando lo mismo: precios, horarios, si hay aparcamiento.', coste: '−30 h/mes' },
    ],
  },
  solucion: {
    titulo: 'Un asistente que atiende como tú, sin descanso',
    texto: 'Lo entrenamos con tus tarifas, horarios, normas y forma de hablar. Contesta, cualifica y reserva. Lo que no sabe, te lo pasa.',
    beneficios: [
      { titulo: 'Respuesta en menos de 60 segundos', texto: 'En WhatsApp e Instagram, a cualquier hora, también en domingo.' },
      { titulo: 'Clases de prueba en tu calendario', texto: 'Reserva en tu software de reservas y envía el recordatorio.' },
      { titulo: 'Seguimiento a los que no se apuntan', texto: 'Mensajes el día 1, 3 y 7 después de la prueba, con tu tono.' },
      { titulo: 'Tú decides cuándo entrar', texto: 'Cualquier conversación delicada te llega al móvil al momento.' },
    ],
  },
  comparativa: {
    titulo: 'Tres formas de atender tus consultas',
    columnas: ['Sin sistema', 'Contratar a alguien', 'Con FitIA'],
    filas: [
      { aspecto: 'Coste al mes', valores: ['0 €, pero pierdes altas', 'Desde 1.400 €', '290 €'] },
      { aspecto: 'Horario de atención', valores: ['Cuando puedes', 'Su jornada', '24 horas, 7 días'] },
      { aspecto: 'Tiempo de respuesta', valores: ['De 2 a 12 horas', 'Minutos, si no está ocupado', 'Menos de 60 segundos'] },
      { aspecto: 'Seguimiento a los que no se apuntan', valores: ['Casi nunca', 'Si se acuerda', 'Automático: día 1, 3 y 7'] },
      { aspecto: 'En enero y septiembre', valores: ['Se te acumulan', 'Se satura', 'Atiende a todos a la vez'] },
    ],
  },
  como_funciona: {
    titulo: 'En marcha en 7 días',
    pasos: [
      { titulo: 'Llamada de 30 minutos', texto: 'Nos cuentas tarifas, horarios, normas y cómo hablas con tus clientes.', plazo: 'Día 1' },
      { titulo: 'Lo entrenamos y lo probamos', texto: 'Configuramos el asistente y te lo enseñamos con conversaciones reales antes de activarlo.', plazo: 'Días 2-5' },
      { titulo: 'Activado en tu WhatsApp e Instagram', texto: 'Empieza a contestar y a reservar. El primer mes lo revisamos cada semana.', plazo: 'Día 7' },
    ],
  },
  para_quien: {
    titulo: 'Trabajamos solo con gimnasios que encajan',
    si: ['Tienes un gimnasio boutique, box o estudio con 150-400 socios.', 'Recibes más de 30 consultas al mes por WhatsApp o Instagram.', 'Das clase y no puedes contestar al momento.', 'Ofreces clase de prueba y quieres llenarla.'],
    no: ['Eres una cadena que decide desde la central.', 'Quieres un número exacto de altas garantizado por contrato.', 'No quieres usar WhatsApp Business con tus clientes.'],
  },
  oferta: {
    titulo: 'Todo lo que necesitas para no perder una consulta más',
    nombre: 'Agenda Llena para Gimnasios Boutique',
    incluye: ['Asistente de WhatsApp e Instagram 24/7', 'Reserva automática de clases de prueba', 'Seguimiento a quien prueba y no se apunta', 'Reactivación de antiguos socios cada trimestre', 'Informe mensual en una página'],
    precio: '690 € + 290 €/mes',
    precio_anclaje: '3.300 €',
    garantia: 'Si en 30 días no ha reservado 10 clases de prueba más, seguimos gratis hasta conseguirlo o te devolvemos la puesta en marcha.',
    bonos: ['Guion de clase de prueba que convierte en socio', 'Ficha de Google Business optimizada', '30 días sin permanencia'],
    escasez: 'Solo 4 gimnasios nuevos al mes',
    cta: 'Reservar mi plaza',
  },
  resultados: {
    titulo: 'Lo que cambia el primer mes',
    nota: 'Estimaciones para gimnasios de 150-400 socios; dependen de tu volumen de consultas.',
    cifras: [{ cifra: '< 60 s', texto: 'tiempo de respuesta, a cualquier hora' }, { cifra: '+10', texto: 'clases de prueba reservadas al mes' }, { cifra: '−30 h', texto: 'al mes contestando mensajes' }],
  },
  garantia: {
    titulo: '10 clases de prueba en 30 días, o seguimos gratis',
    texto: 'Si en los primeros 30 días el asistente no ha reservado al menos 10 clases de prueba más que antes, seguimos trabajando sin coste hasta conseguirlo o te devolvemos la puesta en marcha. Solo te pedimos que conectes tu WhatsApp Business y contestes las conversaciones que te pase.',
  },
  nota_fundador: {
    titulo: 'Por qué solo trabajamos con gimnasios',
    texto: 'Nos especializamos en gimnasios porque el problema siempre es el mismo: la gente escribe mientras estás dando clase y se enfría antes de que puedas contestar. Conocemos vuestros horarios, vuestras temporadas altas y cómo habláis con los socios. Por eso no trabajamos con otros sectores, no pedimos permanencia y no prometemos lo que no podemos medir.',
    firma: 'El equipo de FitIA',
  },
  faq: [
    { pregunta: '¿Cuánto cuesta?', respuesta: '690 € de puesta en marcha y 290 € al mes, sin permanencia. Si pierdes más de una alta al mes por no contestar a tiempo, se paga solo.' },
    { pregunta: 'Ya contesto yo por WhatsApp, ¿para qué lo necesito?', respuesta: 'Para las horas en las que no puedes: en clase, por la noche y en fin de semana. Tú sigues viendo todas las conversaciones y puedes entrar cuando quieras.' },
    { pregunta: '¿Mis clientes notarán que es una IA?', respuesta: 'Habla con tu tono y con tus datos reales. Si alguien pregunta algo delicado o quiere hablar contigo, te lo pasa al momento.' },
    { pregunta: '¿Cuánto tiempo me va a quitar?', respuesta: 'Una llamada de 30 minutos para empezar y 10 minutos a la semana el primer mes para revisar conversaciones.' },
    { pregunta: '¿Qué pasa si no funciona?', respuesta: 'Si en 30 días no ha reservado 10 clases de prueba más, seguimos gratis hasta conseguirlo o te devolvemos la puesta en marcha.' },
  ],
  cta_final: { titulo: 'Mira cómo contestaría a tus clientes', texto: 'Te preparamos una demo con tus horarios y tarifas y te la enseñamos en 15 minutos.', cta: 'Quiero ver mi demo' },
  footer: 'Asistentes de IA para gimnasios boutique y boxes.',
}

export const AGENT = {
  negocio: { nombre: 'Studio Pulso', rubro: 'gimnasio boutique de entrenamiento en grupo', descripcion: 'Clases reducidas de fuerza y HIIT con entrenador, máximo 10 personas por sesión.', ubicacion: 'Calle Alcalá 142, Madrid', horario: 'L-V 7:00-21:30, S 9:00-14:00', telefono: '612 345 678', web: 'studiopulso.example', zona_horaria: 'Europe/Madrid' },
  servicios: [
    { nombre: 'Clase de prueba', descripcion: 'Una sesión para conocer el método', precio: 'Gratis', duracion: '50 min' },
    { nombre: 'Bono mensual ilimitado', descripcion: 'Clases ilimitadas de lunes a sábado', precio: '89 €/mes', duracion: '' },
    { nombre: 'Bono 8 clases', descripcion: 'Ocho clases al mes', precio: '65 €/mes', duracion: '50 min' },
    { nombre: 'Entrenamiento personal', descripcion: 'Sesión individual con plan a medida', precio: '40 €', duracion: '60 min' },
    { nombre: 'Valoración inicial', descripcion: 'Medición y objetivos', precio: '25 €', duracion: '30 min' },
    { nombre: 'Bono parejas', descripcion: 'Dos personas, clases ilimitadas', precio: '149 €/mes', duracion: '' },
  ],
  secretaria: { nombre: 'Lucía', tono: 'cercano y motivador', saludo: '¡Hola! Soy Lucía, de Studio Pulso. ¿Te cuento cómo funcionan las clases o quieres reservar una de prueba?' },
  politicas: ['Las clases se pueden cancelar hasta 4 horas antes sin coste.', 'Se paga por domiciliación o tarjeta el día 1 de cada mes.', 'No hay permanencia en ningún bono.'],
  faq: [
    { pregunta: '¿Hace falta experiencia?', respuesta: 'No. El entrenador adapta cada ejercicio a tu nivel.' },
    { pregunta: '¿Hay duchas?', respuesta: 'Sí, vestuarios con duchas y taquillas.' },
    { pregunta: '¿Puedo congelar el bono?', respuesta: 'Sí, hasta 30 días al año avisando con una semana.' },
    { pregunta: '¿Cuántas personas hay por clase?', respuesta: 'Máximo 10, para que el entrenador te corrija.' },
    { pregunta: '¿Dónde aparco?', respuesta: 'Hay un parking público a 50 metros.' },
  ],
  datos_cita: ['nombre', 'teléfono', 'día y hora preferidos'],
}
