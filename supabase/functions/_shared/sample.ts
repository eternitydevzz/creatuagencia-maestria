// Proyecto de ejemplo (clínica dental): salida REAL de Claude, generada una vez con generate (cliente ideal, oferta, landing) y con
// la ficha del agente. Lo copia a la cuenta del alumno la función `load-sample`. No contiene datos de ninguna persona real.
// Para regenerarlo: crear un proyecto con estos mismos `fields`, generar los cuatro entregables y volcar el resultado aquí.
// deno-lint-ignore-file no-explicit-any
export const SAMPLE: {
  fields: { selected_problems: string[]; selected_nichos: string[]; agency_name: string; business_metrics: Record<string, number>; pricing_settings: Record<string, string>; agency_contact: Record<string, string> }
  ideal_client: Record<string, any>; agency_offer: Record<string, any>; agency_site: Record<string, any>; agent: { business_name: string; config: Record<string, any> }
} = {
 "fields": {
  "selected_problems": [
   "atencion_leads",
   "seguimientos",
   "landing",
   "captacion"
  ],
  "selected_nichos": [
   "Clínicas dentales con 2-3 sillones"
  ],
  "agency_name": "Dentia",
  "business_metrics": {
   "leads": 200,
   "ad_spend": 600,
   "ticket": 700,
   "conversion": 20
  },
  "pricing_settings": {
   "mode": "aggressive"
  },
  "agency_contact": {}
 },
 "ideal_client": {
  "avatar": {
   "nombre": "Laura Méndez, 44 años, odontóloga y dueña de una clínica dental de 3 sillones en un barrio residencial, con 7 personas en plantilla",
   "dia_a_dia": "A las 8:30 abre la clínica y a las 9:00 ya está en el sillón 1 con una endodoncia, mientras el teléfono de recepción suena sin que nadie pueda cogerlo porque Marta está cobrando. De 14:00 a 16:00 come en 20 minutos y dedica el resto a revisar planes de tratamiento y a firmar pedidos al depósito dental. De 16:00 a 20:30 encadena revisiones e higienes, y la última cita siempre se alarga. A las 22:30, en el sofá, abre el WhatsApp de la clínica y encuentra 9 mensajes sin contestar, tres de ellos preguntando precio de implantes desde el viernes."
  },
  "deseos": [
   "Quiero que cada persona que escribe tenga respuesta en el momento y una cita en la agenda, sin que Marta tenga que dejar lo que está haciendo.",
   "Quiero cerrar más presupuestos de implantes y ortodoncia, que son los que me dan de comer, sin tener que perseguir a nadie yo.",
   "Quiero tener la agenda llena de lunes a viernes y dejar de ver sillones vacíos por anulaciones de última hora.",
   "Quiero saber cuánto meto en anuncios y cuántos pacientes me salen de ahí, y que no dependa todo del boca a boca."
  ],
  "perfil": {
   "quien": "Odontólogo o odontóloga titular y propietario, de 38 a 55 años, que pasa el 80 % de su jornada pasando consulta y el resto gestionando personal, proveedores y números. Delega la agenda en la recepcionista y no tiene un minuto para el marketing. Suele tener socio o pareja en la clínica y decide solo o con una persona más.",
   "facturacion": "Entre 350.000 € y 600.000 € al año (estimación del sector para clínicas de 2-3 sillones con ticket medio de 700 € por tratamiento).",
   "herramientas": "Software de gestión clínica (Gesden, Clinic Cloud, Dentalink u Ortoplus), WhatsApp Business en un móvil compartido, teléfono fijo, perfil de Google Business, Doctoralia, Instagram, Facebook, Meta Ads o Google Ads con presupuesto pequeño, web en WordPress o Wix hecha hace 4-6 años, y TPV o financiación con entidad externa para tratamientos grandes.",
   "nivel_digital": "Usa a diario el software de gestión clínica y WhatsApp Business desde el móvil de recepción. Tiene ficha de Google y una cuenta de Instagram que lleva la higienista o una sobrina. No tiene respuestas automáticas, ni seguimiento de presupuestos, ni una web que convierta: la suya tiene años, carga lenta en el móvil y no tiene botón de WhatsApp a la vista. Los anuncios los lleva un freelance o los lanza él mismo con el botón de promocionar.",
   "como_capta_hoy": "La mayoría viene por boca a boca, por la ficha de Google Maps y por pasar por delante de la clínica. Algunos llegan por Doctoralia y por unos 600 € al mes en anuncios de Meta o Google, normalmente de implantes, ortodoncia invisible o primera visita gratis. El fallo está en lo que pasa después: las consultas de mediodía, de después de las 20:30 y del fin de semana se contestan horas o días tarde. Los presupuestos que el paciente se lleva a casa para pensarlo nadie los llama, y no saben cuántos pacientes les trae cada euro de anuncios.",
   "tamano_negocio": "Una sede con 2 o 3 sillones y de 5 a 9 personas: 1 o 2 odontólogos fijos, 1 o 2 colaboradores que vienen por días (implantólogo, ortodoncista), 1 o 2 higienistas, 1 o 2 auxiliares y 1 recepcionista. Atiende entre 400 y 600 citas al mes, y de las unas 200 consultas nuevas que recibe salen unos 40 pacientes nuevos."
  },
  "dolores": [
   "Me escriben a las once de la noche preguntando cuánto cuesta un implante, lo veo al día siguiente a las dos y ya se han ido a otra clínica.",
   "Marta no puede coger el teléfono y cobrar a la vez, y yo no voy a dejar a un paciente con la boca abierta para contestar un WhatsApp.",
   "Doy un montón de presupuestos de implantes y de ortodoncia, el paciente me dice que se lo piensa y no vuelvo a saber de él. Nadie le llama.",
   "Pago anuncios todos los meses y no tengo ni idea de cuántos pacientes me traen. Lo único que sé es que me escriben para preguntar precio y desaparecen.",
   "Me abrieron una franquicia a dos calles con primera visita gratis y limpieza a 19 euros, y no puedo competir con eso a base de precio.",
   "Los lunes tengo huecos en la agenda porque los del viernes no confirmaron y a nadie le dio tiempo a llamar para rellenarlos.",
   "Tengo cientos de pacientes en la ficha que no han vuelto a la revisión en dos años y no tengo a nadie que los llame."
  ],
  "resumen": "Odontólogo propietario de una clínica independiente de 2 o 3 sillones en barrio o ciudad media que recibe unas 200 consultas al mes por teléfono, WhatsApp e Instagram. Pierde pacientes de implantes y ortodoncia porque nadie contesta a tiempo y los presupuestos entregados se quedan sin llamar mientras las cadenas y las mutuas le quitan la primera visita.",
  "red_flags": [
   "Pertenece a una cadena o franquicia (Vitaldent, Sanitas, Adeslas, Caredent): decide una central y tú no vas a hablar con quien firma.",
   "Clínica que vive casi solo de pacientes de mutua con precios de baremo: ticket bajo y nada de margen para invertir.",
   "Lista de espera de más de un mes para primera visita y ningún interés en tratamientos de ticket alto: no le duele captar y no va a comprar.",
   "En la primera llamada solo pregunta el precio, regatea antes de oír cifras o pide que se lo hagas gratis para probar: te comerá horas y no cerrará."
  ],
  "donde_esta": [
   "Google Maps: busca «clínica dental [barrio o ciudad]» y «dentista cerca de [barrio]». Filtra las de 50 a 300 reseñas, descarta cadenas y lee las reseñas de 1 a 3 estrellas buscando quejas por el teléfono o por las respuestas.",
   "Biblioteca de anuncios de Meta: busca «implantes dentales», «ortodoncia invisible» y «primera visita gratis», filtra por España y apunta las clínicas independientes de tu provincia con anuncios activos.",
   "Doctoralia: entra en «Dentista en [ciudad]» y quédate con las clínicas que tienen pocas opiniones o la agenda online desactivada, porque dependen del teléfono.",
   "Instagram: busca los hashtags #dentista[ciudad] (por ejemplo #dentistavalencia), #clinicadental[ciudad] e #implantesdentales[ciudad], y escribe a las cuentas que publican casos de antes y después.",
   "Expodental en IFEMA Madrid, los cursos de los colegios oficiales de dentistas de cada provincia y los congresos de SEPA y SEDCYDO: son los sitios donde el propietario sale de la clínica y tiene tiempo para hablar."
  ],
  "objeciones": [
   "Mis pacientes quieren hablar con una persona, no con un robot. Aquí somos una clínica de trato cercano.",
   "Ya tengo recepcionista. No necesito pagar otra cosa para que haga lo mismo.",
   "Ya pagué a una agencia de marketing seis meses y no vi ni un paciente más. ¿Por qué iba a ser distinto esta vez?",
   "Esto toca datos de salud de mis pacientes. ¿Es legal con la protección de datos? No quiero problemas con el Colegio.",
   "No tengo tiempo para configurar nada ni para aprender otra herramienta. Si me va a quitar horas, no me interesa."
  ],
  "su_lenguaje": [
   "primera visita",
   "presupuesto aceptado / presupuesto que se queda en el cajón",
   "plan de tratamiento",
   "huecos en agenda y sillón vacío",
   "pacientes que no vienen o anulan a última hora",
   "pacientes de mutua frente a pacientes privados",
   "revisiones e higienes pendientes",
   "las cadenas y las franquicias"
  ],
  "senales_compra": [
   "Ficha de Google Maps con 50 a 300 reseñas y nota de 4,5 o más, pero alguna reseña que dice que no cogen el teléfono o que tardaron días en contestar: buen servicio y mala atención al contacto.",
   "Anuncios activos en la Biblioteca de anuncios de Meta sobre implantes, ortodoncia invisible o primera visita gratis: ya gasta en captar y tiene presupuesto.",
   "Web antigua, lenta en el móvil, sin botón de WhatsApp a la vista y con un formulario genérico de contacto.",
   "Instagram activo con casos de antes y después de estética o implantes: le interesan los tratamientos de ticket alto y quiere vender más de eso.",
   "Oferta publicada en InfoJobs o Indeed buscando recepcionista o auxiliar con atención telefónica: tiene el problema ahora mismo."
  ],
  "coste_del_problema": "Unos 5.600 € al mes que se escapan (estimación). Supuestos: llegan 200 consultas al mes. El 30 % entra a mediodía, después de las 20:30 o en fin de semana y se contesta tarde: 60 consultas. La mitad de esas ya ha pedido cita en otra clínica cuando por fin le respondes: 30 consultas perdidas. Con tu 20 % de cierre, son 6 pacientes × 700 € = 4.200 € al mes. A eso se suma el seguimiento de presupuestos: estimamos unos 20 presupuestos al mes que el paciente se lleva para pensarlo y que nadie vuelve a llamar. Recuperar solo 2 con un recordatorio a los 3 y a los 10 días son 2 × 700 € = 1.400 € al mes. Total: 4.200 € + 1.400 € = 5.600 € al mes, unos 67.000 € al año. Además, de los 600 € al mes en anuncios, una parte se pierde en contactos que nadie atiende a tiempo. Como referencia, el pack completo cuesta 590 € al mes: se paga con menos de un paciente recuperado.",
  "momentos_de_compra": [
   "Septiembre y enero: agenda floja tras vacaciones o tras la cuesta de enero, justo cuando más pacientes buscan ortodoncia para los niños o se deciden con el implante que llevan meses posponiendo.",
   "Se le va la recepcionista o se coge una baja: durante semanas nadie coge el teléfono con fiabilidad y nota en directo cuántas consultas se pierden.",
   "Acaba de invertir en algo caro y tiene que amortizarlo: un escáner intraoral, un tercer sillón, un implantólogo nuevo por días o ortodoncia invisible.",
   "Abre una cadena o franquicia cerca o le entra alguna reseña de 1 estrella por no contestar el teléfono, y siente que está perdiendo pacientes de su propio barrio."
  ],
  "preguntas_cualificacion": [
   "¿Cuántas consultas nuevas os entran al mes entre teléfono, WhatsApp e Instagram, y quién las contesta mientras estáis con pacientes?",
   "Si un paciente escribe un sábado a las 21:00 preguntando por un implante, ¿cuándo recibe respuesta?",
   "¿Cuántos presupuestos de implantes u ortodoncia entregáis al mes, cuántos se aceptan y quién llama a los que dicen que se lo piensan?",
   "¿Tenéis huecos en la agenda o anulaciones de última hora cada semana, y cuánto invertís en anuncios ahora mismo sabiendo o no cuántos pacientes os traen?",
   "Si vemos que esto te recupera al menos un par de pacientes al mes, ¿lo decides tú o lo tienes que hablar con alguien más?"
  ]
 },
 "agency_offer": {
  "oferta": {
   "bonos": [
    "Rescate de presupuestos del último trimestre: en la primera semana cargamos los presupuestos de implantes y ortodoncia no aceptados de los últimos 90 días y les lanzamos el seguimiento. Resuelve el «¿y cuándo voy a notar algo?», porque los primeros pacientes que responden suelen ser estos.",
    "Revisión de tus anuncios y de tu ficha de Google: en una sesión de 45 minutos revisamos lo que te lleva el freelance en Meta o Google y tu ficha de Google Business, y te decimos qué cambiar. Resuelve el «ya pago anuncios y no sé si sirven».",
    "Formación de 30 minutos para Marta, con una hoja de una página que explica qué hace el asistente, cuándo le pasa una conversación y cómo confirma las citas en vuestro software. Resuelve el «mi recepcionista no va a tener tiempo de aprender nada nuevo»."
   ],
   "nombre": "Sillón Lleno para Clínicas Dentales en 60 días",
   "precio": {
    "setup": "1.290 €",
    "mensual": "490 €/mes",
    "justificacion": "Con 200 consultas al mes, en torno al 30 % (unas 60) llegan a mediodía, después de las 20:30 o en fin de semana (estimación del sector). Si por contestar tarde pierdes solo 6 de esas personas, son 4.200 € al mes con tu ticket medio de 700 €. Y eso sin contar los presupuestos de implantes y ortodoncia que nadie llama. La cuota de 490 € se paga con menos de un paciente nuevo al mes. Contratar a una segunda recepcionista te costaría unos 2.100 € al mes de coste empresa, no estaría a las 23:00 ni los sábados y seguiría sin tiempo para llamar a cada presupuesto 4 veces.",
    "valor_total_percibido": "9.000 €"
   },
   "incluye": [
    {
     "entregable": "Asistente de WhatsApp 24/7 con tus precios orientativos, tus tratamientos y tu horario",
     "que_resuelve": "La persona que pregunta por un implante a las 23:00 o el sábado recibe respuesta en menos de 60 segundos y deja pedida su primera visita. Marta solo la confirma en Gesden o en tu software al día siguiente.",
     "valor_percibido": "2.400 €"
    },
    {
     "entregable": "Seguimiento automático de presupuestos de implantes y ortodoncia",
     "que_resuelve": "Cada paciente que dice «me lo pienso» recibe 4 mensajes en 30 días, con la opción de financiación y un enlace para resolver dudas. Recuperas presupuestos que hoy se quedan en el cajón.",
     "valor_percibido": "1.800 €"
    },
    {
     "entregable": "Recordatorios de cita con confirmación y relleno de huecos",
     "que_resuelve": "El paciente confirma o anula con un toque 48 y 24 horas antes. Si alguien anula, el sistema ofrece el hueco a pacientes en espera, y el lunes deja de abrir con sillones vacíos.",
     "valor_percibido": "1.500 €"
    },
    {
     "entregable": "Campaña de reactivación de pacientes sin revisión en los últimos 18 meses",
     "que_resuelve": "Los pacientes dormidos que ya tienes en la ficha vuelven a revisión e higiene, que es donde aparecen los siguientes tratamientos, sin que nadie tenga que pasarse tardes llamando.",
     "valor_percibido": "1.200 €"
    },
    {
     "entregable": "Landing de implantes y ortodoncia preparada para móvil, con botón de WhatsApp visible",
     "que_resuelve": "Quien llega desde tus anuncios o desde Google Maps encuentra en 2 segundos precio orientativo, financiación y un botón para escribir. Deja de ver una web lenta de hace 5 años y marcharse.",
     "valor_percibido": "1.100 €"
    },
    {
     "entregable": "Informe mensual de consultas, citas y origen de cada paciente",
     "que_resuelve": "Sabes cuántas consultas entraron, cuántas acabaron en cita, cuántas llegaron por anuncios y cuánto te cuesta cada paciente nuevo. Dejas de pagar anuncios a ciegas.",
     "valor_percibido": "1.000 €"
    }
   ],
   "promesa": "Todas las consultas de WhatsApp contestadas en menos de 60 segundos, también a las 23:00 y en fin de semana, y al menos 6 pacientes nuevos más al mes en 60 días.",
   "garantia": "Si a los 60 días de la puesta en marcha el sistema no ha generado al menos 6 citas de primera visita o presupuestos aceptados en un mes, no pagas la cuota del mes siguiente y seguimos trabajando sin coste hasta 2 meses más hasta llegar a esa cifra. Si aun así no se consigue, cancelas sin permanencia y sin pagar nada más. Cuentan las citas que pide el asistente y los presupuestos que se aceptan tras un mensaje de seguimiento, todo registrado en el informe. Condiciones: el asistente tiene que estar conectado al WhatsApp de la clínica, nos tienes que pasar la lista de presupuestos pendientes en la primera semana y recepción tiene que confirmar en menos de 24 horas laborables las citas que propone el asistente.",
   "urgencia": "Pongo en marcha como máximo 2 clínicas por semana, porque cada asistente se configura y se prueba a mano con los precios y la agenda de cada clínica. El precio de lanzamiento de 1.290 € + 490 €/mes es solo para las 5 primeras clínicas: a partir de la sexta pasa a 1.990 € + 590 €/mes. Además, solo trabajo con una clínica por barrio, así que si entra otra de tu zona, la plaza deja de estar disponible.",
   "mecanismo": "Sistema Respuesta 60: un asistente entrenado con tus precios orientativos, tus tratamientos y tus huecos contesta cada consulta en menos de 60 segundos, pregunta qué tratamiento busca y si viene por privado o por mutua, y le ofrece cita. Si no reserva, o si se lleva el presupuesto a casa, el sistema le vuelve a escribir los días 2, 7, 15 y 30 sin que nadie de la clínica tenga que acordarse. Contestar tú a las 22:30, cargar a Marta con más tareas, renovar la web o subir los anuncios no arregla nada: el paciente se pierde en las horas que pasan sin respuesta y en el presupuesto al que nadie llama, y eso es justo lo que cubre este sistema.",
   "pitch_30s": "Trabajo solo con clínicas dentales de dos o tres sillones. Casi todas pierden pacientes por lo mismo: alguien pregunta el precio de un implante a las once de la noche, se le contesta al día siguiente y ya ha pedido cita en otra clínica. Pongo en tu WhatsApp un asistente que contesta en menos de un minuto, da cita y vuelve a escribir a los presupuestos que se quedan pensándolo. ¿Te enseño cómo quedaría con tus números?",
   "objeciones": [
    {
     "objecion": "No quiero que un robot hable con mis pacientes, aquí el trato es cercano y por eso vienen.",
     "respuesta": "El asistente escribe con el tono de tu clínica y no se hace pasar por nadie. Si el paciente pregunta algo clínico o pide hablar con una persona, la conversación pasa a Marta al momento. Hoy ese paciente de las 23:00 no recibe trato cercano: no recibe nada hasta el día siguiente. ¿Qué crees que prefiere, una respuesta al momento o esperar 15 horas?"
    },
    {
     "objecion": "Para eso ya tengo a Marta en recepción.",
     "respuesta": "Marta no puede cobrar, coger el teléfono y contestar WhatsApp a la vez, y a las 20:30 se va a casa. El asistente no le quita el puesto: le quita las preguntas repetidas de precio y horario y le deja las citas listas para confirmar. ¿Cuántos WhatsApp sin contestar te encuentras de media cuando cierras?"
    },
    {
     "objecion": "Está bien, pero ahora mismo no me lo puedo permitir, con la franquicia de al lado ofreciendo limpiezas a 19 euros.",
     "respuesta": "Contra la franquicia no vas a ganar por precio. Ganas contestando antes que ellos y llamando a cada presupuesto. Con tu ticket medio de 700 €, la cuota de 490 € se cubre con un solo paciente nuevo al mes, y si en 60 días no llegan 6 más, no pagas el mes siguiente. ¿Cuántos presupuestos de implantes tienes ahora mismo sin respuesta?"
    },
    {
     "objecion": "No te conozco y no has trabajado con ninguna clínica que yo pueda llamar.",
     "respuesta": "Es cierto, estoy empezando y por eso el riesgo lo asumo yo. Te propongo un piloto de 21 días por 390 € con el asistente y el seguimiento de tus presupuestos pendientes. Si no ves citas en tu agenda, lo desconecto y no me debes nada más. ¿Lo probamos con tus consultas de esta semana?"
    },
    {
     "objecion": "¿Y la protección de datos? ¿Y si el asistente le da a un paciente un precio o un consejo que no toca?",
     "respuesta": "Firmamos un contrato de encargado del tratamiento y solo se escribe a pacientes que han dado su móvil a la clínica, con opción de baja en cada mensaje. El asistente solo da los precios orientativos que tú apruebas por escrito, siempre con «a confirmar en la primera visita», y nunca diagnostica: cualquier duda clínica pasa a tu equipo. ¿Qué precios orientativos das hoy por teléfono para implantes y ortodoncia invisible?"
    }
   ],
   "para_quien": "Para el odontólogo propietario de una clínica independiente de 2 o 3 sillones que recibe unas 200 consultas al mes y pierde pacientes de implantes y ortodoncia porque nadie contesta a tiempo ni llama a los presupuestos entregados."
  },
  "escalera": [
   {
    "nivel": "Entrada",
    "nombre": "Recepción 24",
    "precio": "690 € de puesta en marcha + 230 €/mes",
    "incluye": "Asistente de WhatsApp 24/7 con precios orientativos y petición de cita, más recordatorios de cita con confirmación 48 y 24 horas antes.",
    "para_quien": "Clínicas que de momento solo quieren dejar de perder las consultas de mediodía, noche y fin de semana, y reducir los huecos por no confirmar."
   },
   {
    "nivel": "Principal",
    "nombre": "Sillón Lleno 60",
    "precio": "1.290 € de puesta en marcha + 490 €/mes (precio de lanzamiento para las 5 primeras clínicas; después, 1.990 € + 590 €/mes)",
    "incluye": "Asistente de WhatsApp 24/7, seguimiento de presupuestos de implantes y ortodoncia, recordatorios con relleno de huecos, reactivación de pacientes sin revisión en 18 meses, landing para móvil e informe mensual, con garantía de 6 pacientes nuevos más al mes en 60 días.",
    "para_quien": "El odontólogo propietario de 2-3 sillones que recibe unas 200 consultas al mes y quiere cerrar más implantes y ortodoncias sin perseguir a nadie él mismo."
   },
   {
    "nivel": "Premium",
    "nombre": "Sillón Lleno + Captación",
    "precio": "3.490 € de puesta en marcha + 990 €/mes (la inversión en anuncios la paga la clínica aparte)",
    "incluye": "Todo lo de Sillón Lleno 60, más gestión de campañas de Meta y Google para implantes y ortodoncia invisible, con anuncios y textos generados y probados con IA cada semana, y secretaria virtual por teléfono que coge las llamadas que recepción no puede atender y deja la cita pedida.",
    "para_quien": "Clínicas que ya han visto resultados con el sistema y quieren atraer más pacientes de ticket alto cada semana, sabiendo cuánto les cuesta cada uno."
   }
  ],
  "oferta_piloto": {
   "nombre": "Piloto Ningún WhatsApp Sin Contestar: 21 días",
   "precio": "390 € pago único, sin cuota mensual durante el piloto",
   "duracion": "21 días desde la conexión del asistente al WhatsApp de la clínica",
   "que_incluye": "Asistente de WhatsApp 24/7 configurado con tus precios orientativos, tratamientos y horario, más seguimiento automático de los presupuestos de implantes y ortodoncia no aceptados de los últimos 90 días. Al terminar, un informe con las consultas atendidas fuera de horario, las citas pedidas y los presupuestos que han respondido.",
   "como_proponerla": "Laura, como estoy empezando con clínicas y no tengo casos que enseñarte, te propongo esto: durante 21 días pongo el asistente en tu WhatsApp y escribo a los presupuestos de implantes y ortodoncia de los últimos tres meses, por 390 € en total. Si al final no tienes al menos 4 citas o presupuestos aceptados que hoy no tendrías, lo quito y no me debes nada más. ¿Te parece bien que lo conectemos el lunes?",
   "paso_a_principal": "Si en los 21 días el sistema ha generado al menos 4 citas de primera visita o presupuestos aceptados, pasas a Sillón Lleno con los 390 € descontados de la puesta en marcha: 900 € + 490 €/mes, con la garantía de 60 días incluida. Si no llega a 4, desconecto el asistente y no pagas nada más. A cambio del precio de piloto, si se cumple el objetivo, me autorizas a usar los resultados (sin datos de pacientes) como caso de éxito."
  },
  "numeros_agencia": {
   "margen_por_cliente": "Sillón Lleno 60: 380 €/mes de margen (78 %), unos 127 € por hora dedicada, más unos 1.200 € de margen en la puesta en marcha. Recepción 24: 155 €/mes. Premium: 800 €/mes. Piloto: unos 330 € de margen por 10 horas de trabajo, y su valor real está en el caso de éxito y en el paso a Sillón Lleno.",
   "coste_entrega_mensual": "Sillón Lleno 60: unos 110 €/mes en herramientas por clínica (API de WhatsApp unos 65 € con conversaciones incluidas, modelo de IA unos 20 €, plataforma de automatización unos 15 € y alojamiento de la landing unos 10 €) más 3 horas al mes para revisar conversaciones, ajustar respuestas y preparar el informe. Recepción 24: unos 75 €/mes y 1,5 horas. Premium: unos 190 €/mes (suma unos 80 € de telefonía y voz) y 8 horas al mes con la gestión de anuncios. La puesta en marcha de Sillón Lleno lleva unas 15 horas.",
   "clientes_para_5000_mes": "10 clínicas: 8 en Sillón Lleno 60 (3.920 €), 1 en Premium (990 €) y 1 en Recepción 24 (230 €), que suman 5.140 €/mes recurrentes. Para los 3.000 € bastan 6 clínicas en Sillón Lleno 60 (2.940 €) más 1 en Recepción 24 (230 €). Ritmo realista: 2 o 3 pilotos en los primeros 14 días, 2 de ellos pasan a Sillón Lleno en la semana 4, y 2 clínicas nuevas al mes en los meses 2 y 3 usando esos resultados. Si las clínicas 6 a 8 ya entran a 590 €, los 5.000 € se alcanzan con 9."
  }
 },
 "agency_site": {
  "faq": [
   {
    "pregunta": "No quiero que un robot hable con mis pacientes. Aquí el trato es cercano.",
    "respuesta": "El asistente escribe con el tono de tu clínica y no se hace pasar por nadie. Si el paciente pregunta algo clínico o pide hablar con una persona, la conversación pasa a Marta al momento. Hoy el paciente que escribe a las 23:00 no recibe trato cercano: no recibe nada hasta el día siguiente."
   },
   {
    "pregunta": "Para eso ya tengo a Marta en recepción.",
    "respuesta": "Marta no puede cobrar, coger el teléfono y contestar WhatsApp a la vez, y a las 20:30 se va a casa. El asistente no le quita el puesto: le quita las preguntas repetidas de precio y horario y le deja las citas listas para confirmar."
   },
   {
    "pregunta": "Ahora no me lo puedo permitir, con la franquicia de al lado haciendo limpiezas a 19 €.",
    "respuesta": "Contra la franquicia no vas a ganar por precio. Ganas contestando antes que ellos y escribiendo a cada presupuesto. Con un ticket medio de 700 €, un solo paciente nuevo al mes paga la cuota de 490 €, y si a los 60 días no llegas a 6 citas, no pagas la cuota siguiente."
   },
   {
    "pregunta": "Mi recepcionista no tiene tiempo de aprender nada nuevo. ¿Funciona con Gesden?",
    "respuesta": "Marta recibe una formación de 30 minutos y una hoja de una página. Su único trabajo nuevo es confirmar en Gesden, Clinic Cloud, Dentalink u Ortoplus las citas que deja pedidas el asistente, igual que hace hoy con una llamada."
   },
   {
    "pregunta": "Ya pago a un freelance por los anuncios. ¿Tengo que cambiarlo?",
    "respuesta": "No. Puedes seguir con él. Te revisamos sus campañas y tu ficha de Google en una sesión de 45 minutos y, con el informe mensual, sabrás por fin cuántos pacientes te trae cada euro que inviertes."
   }
  ],
  "hero": {
   "cta": "Quiero ver mi demo",
   "nota": "Demo de 20 minutos con tus tratamientos y tus números. Si prefieres, escríbenos por WhatsApp.",
   "titulo": "Cada consulta contestada en 60 segundos, también a las 23:00",
   "eyebrow": "Para clínicas de 2-3 sillones",
   "pruebas": [
    "En marcha en 14 días",
    "Sin permanencia",
    "Garantía de 6 citas"
   ],
   "subtitulo": "Un asistente en tu WhatsApp que da cita y escribe a los presupuestos de implantes y ortodoncia. Para clínicas de 2-3 sillones. Funcionando en 14 días."
  },
  "meta": {
   "title": "Dentia | Más pacientes para clínicas dentales de 2-3 sillones",
   "description": "Asistente de WhatsApp que contesta en menos de 60 segundos, da cita y escribe a cada presupuesto de implantes. Para clínicas dentales independientes."
  },
  "footer": "Dentia pone asistentes de WhatsApp y seguimiento automático solo en clínicas dentales independientes de 2 y 3 sillones.",
  "oferta": {
   "cta": "Quiero mi plaza de lanzamiento",
   "bonos": [
    "Rescate de presupuestos del último trimestre: en la primera semana cargamos los presupuestos de implantes y ortodoncia no aceptados de los últimos 90 días y les lanzamos el seguimiento.",
    "Revisión de tus anuncios y de tu ficha de Google: una sesión de 45 minutos en la que revisamos lo que lleva tu freelance en Meta o Google y tu ficha de Google Business, y te decimos qué cambiar.",
    "Formación de 30 minutos para Marta, con una hoja de una página que explica qué hace el asistente, cuándo le pasa una conversación y cómo confirma las citas en vuestro software."
   ],
   "nombre": "Sillón Lleno para Clínicas Dentales en 60 días",
   "precio": "1.290 € de puesta en marcha + 490 €/mes",
   "titulo": "Todo lo que necesitas para llenar los sillones, en un solo plan",
   "escasez": "Solo 2 clínicas nuevas por semana",
   "incluye": [
    "Asistente de WhatsApp 24/7 con tus precios orientativos, tus tratamientos y tu horario",
    "Seguimiento automático de presupuestos de implantes y ortodoncia: 4 mensajes en 30 días",
    "Recordatorios de cita a 48 y 24 horas con confirmación y relleno de huecos",
    "Campaña de reactivación de pacientes sin revisión en los últimos 18 meses",
    "Landing de implantes y ortodoncia preparada para móvil, con botón de WhatsApp visible",
    "Informe mensual de consultas, citas y origen de cada paciente"
   ],
   "garantia": "Si a los 60 días no hay al menos 6 citas de primera visita o presupuestos aceptados en un mes, no pagas la cuota siguiente y seguimos sin coste hasta 2 meses más.",
   "urgencia": "El precio de lanzamiento de 1.290 € + 490 €/mes es solo para las 5 primeras clínicas: a partir de la sexta pasa a 1.990 € + 590 €/mes. Además, solo trabajamos con una clínica por barrio.",
   "precio_anclaje": "9.000 €"
  },
  "nav_cta": "Quiero ver mi demo",
  "garantia": {
   "texto": "Si a los 60 días de la puesta en marcha el sistema no ha generado al menos 6 citas de primera visita o presupuestos aceptados en un mes, no pagas la cuota del mes siguiente y seguimos trabajando sin coste hasta 2 meses más hasta llegar a esa cifra. Si aun así no se consigue, cancelas sin permanencia y sin pagar nada más. Cuentan las citas que pide el asistente y los presupuestos aceptados tras un mensaje de seguimiento, todo registrado en el informe, siempre que el asistente esté conectado al WhatsApp de la clínica, nos pases la lista de presupuestos pendientes en la primera semana y recepción confirme en menos de 24 horas laborables las citas que propone el asistente.",
   "titulo": "6 citas en 60 días o no pagas la cuota"
  },
  "problema": {
   "intro": "Recibes unas 200 consultas al mes y das presupuestos todas las semanas. El problema no es atraer al paciente: es lo que pasa en las horas siguientes.",
   "puntos": [
    {
     "coste": "−4.200 €/mes",
     "texto": "En torno al 30 % de las consultas llega a mediodía, después de las 20:30 o en fin de semana. Las ves al día siguiente a las dos y ya han pedido cita en otra clínica. Si pierdes solo 6 de esas 60 personas, con un ticket medio de 700 € son 4.200 € al mes.",
     "titulo": "El implante que preguntan a las 23:00"
    },
    {
     "coste": "Hasta −2.100 €/mes",
     "texto": "Explicas el plan de implantes o de ortodoncia, el paciente dice que se lo piensa y nadie le vuelve a llamar. Marta no tiene tiempo y tú tampoco. Si de cada 10 presupuestos pendientes al mes recuperases 3, serían hasta 2.100 € más (estimación).",
     "titulo": "El presupuesto que se queda en el cajón"
    },
    {
     "coste": "Hasta −10 citas/mes",
     "texto": "Los del viernes no confirmaron, anulan a última hora y a nadie le da tiempo a llamar para rellenar el hueco. De media en el sector, una clínica de 3 sillones pierde entre 6 y 10 citas al mes por anulaciones que no se recolocan.",
     "titulo": "El lunes que abre con sillones vacíos"
    }
   ],
   "titulo": "Los pacientes no se te van por precio. Se van mientras nadie contesta."
  },
  "solucion": {
   "texto": "Un asistente entrenado con tus precios orientativos, tus tratamientos y tus huecos contesta cada WhatsApp en menos de 60 segundos, pregunta si viene por privado o por mutua y le ofrece cita. Si no reserva o se lleva el presupuesto a casa, el sistema le vuelve a escribir los días 2, 7, 15 y 30 sin que nadie de la clínica tenga que acordarse.",
   "titulo": "Sistema Respuesta 60: contestar al momento y no soltar a nadie",
   "beneficios": [
    {
     "texto": "A las 23:00, el sábado o mientras Marta cobra. El paciente deja pedida su primera visita y recepción solo la confirma en Gesden o en tu software al día siguiente.",
     "titulo": "Respuesta en menos de 60 segundos"
    },
    {
     "texto": "Cada paciente que dice «me lo pienso» recibe 4 mensajes en 30 días, con la opción de financiación y un enlace para resolver dudas.",
     "titulo": "Presupuestos con seguimiento"
    },
    {
     "texto": "El paciente confirma o anula con un toque 48 y 24 horas antes. Si alguien anula, el hueco se ofrece a pacientes en espera.",
     "titulo": "Agenda confirmada y huecos rellenados"
    },
    {
     "texto": "Cada mes ves cuántas consultas entraron, cuántas acabaron en cita, cuántas llegaron por anuncios y cuánto te cuesta cada paciente nuevo.",
     "titulo": "Sabes qué te trae cada euro de anuncios"
    }
   ]
  },
  "cta_final": {
   "cta": "Quiero ver mi demo",
   "texto": "Te enseñamos en 20 minutos cómo le contestaría tu asistente y cuántos pacientes estás dejando ir con tus números. Quedan plazas de lanzamiento para 5 clínicas, una por barrio.",
   "titulo": "Esta noche alguien preguntará por un implante en tu clínica"
  },
  "para_quien": {
   "no": [
    "Tu clínica es de una cadena o franquicia y las decisiones las toma una central.",
    "Vives casi solo de pacientes de mutua a precio de baremo y no trabajas tratamientos de ticket alto.",
    "Tienes más de un mes de lista de espera para primera visita y no necesitas más pacientes."
   ],
   "si": [
    "Eres odontólogo titular de una clínica independiente de 2 o 3 sillones.",
    "Recibes consultas por WhatsApp, teléfono e Instagram y muchas se contestan tarde.",
    "Das presupuestos de implantes u ortodoncia que se quedan sin respuesta.",
    "Inviertes en anuncios o en Doctoralia y no sabes cuántos pacientes te traen."
   ],
   "titulo": "Para quién es y para quién no"
  },
  "resultados": {
   "nota": "Cifras estimadas a partir de la media del sector: 200 consultas al mes, 20 % de conversión y ticket medio de 700 €. No son resultados de clientes concretos.",
   "cifras": [
    {
     "cifra": "60 consultas",
     "texto": "al mes llegan de media a mediodía, después de las 20:30 o en fin de semana"
    },
    {
     "cifra": "4.200 €",
     "texto": "al mes se pierden si solo 6 de esas personas piden cita en otra clínica"
    },
    {
     "cifra": "1 paciente",
     "texto": "nuevo al mes basta para cubrir la cuota de 490 €"
    }
   ],
   "titulo": "Lo que hay en juego en una clínica de 2-3 sillones"
  },
  "comparativa": {
   "filas": [
    {
     "aspecto": "Coste al mes",
     "valores": [
      "0 € de cuota, pero hasta 4.200 € en pacientes que se van",
      "Unos 2.100 € de coste empresa por una segunda recepcionista",
      "490 €/mes tras 1.290 € de puesta en marcha"
     ]
    },
    {
     "aspecto": "Horario de atención",
     "valores": [
      "Lo que pueda recepción, hasta las 20:30",
      "Su jornada, con trato en persona y teléfono. Sin noches ni sábados",
      "24 horas, 7 días, en WhatsApp. Lo clínico pasa a Marta"
     ]
    },
    {
     "aspecto": "Tiempo de respuesta",
     "valores": [
      "De horas a días",
      "Minutos, si no está cobrando o al teléfono",
      "Menos de 60 segundos"
     ]
    },
    {
     "aspecto": "Seguimiento a los que no compran",
     "valores": [
      "Nadie llama",
      "Si le queda tiempo entre paciente y paciente",
      "4 mensajes en 30 días a cada presupuesto"
     ]
    },
    {
     "aspecto": "Qué pasa en temporada alta",
     "valores": [
      "Más WhatsApp sin contestar al cerrar",
      "Se satura igual o tienes que contratar a otra persona",
      "Contesta igual a 10 consultas que a 100"
     ]
    }
   ],
   "titulo": "Tres formas de atender a las 200 consultas de cada mes",
   "columnas": [
    "Sin sistema",
    "Contratar a alguien",
    "Con Dentia"
   ]
  },
  "como_funciona": {
   "pasos": [
    {
     "plazo": "Día 1",
     "texto": "En una llamada de 45 minutos vemos tus tratamientos, precios orientativos, horario, software de gestión y cómo trabaja recepción. Nos pasas la lista de presupuestos pendientes de los últimos 90 días.",
     "titulo": "Revisamos tu clínica"
    },
    {
     "plazo": "Días 2 a 13",
     "texto": "Entrenamos al asistente con tus precios y tu agenda, montamos el seguimiento, los recordatorios y la landing, y lo probamos con conversaciones reales antes de conectarlo. Formamos a Marta en 30 minutos.",
     "titulo": "Configuramos y probamos a mano"
    },
    {
     "plazo": "Día 14",
     "texto": "El asistente empieza a contestar en tu WhatsApp, lanzamos el rescate de presupuestos y recibes el primer informe a final de mes. La garantía cuenta desde este día.",
     "titulo": "Se activa y mides resultados"
    }
   ],
   "titulo": "De la primera llamada al primer paciente en 14 días"
  },
  "nota_fundador": {
   "firma": "El equipo de Dentia",
   "texto": "Trabajamos solo con clínicas dentales de 2 y 3 sillones porque es donde mejor sabemos qué se pierde: la consulta de implantes que llega a las 23:00, el presupuesto que nadie llama y el lunes con huecos. Conocer un solo tipo de clínica nos permite configurar cada asistente a mano con tus precios y tu agenda. No vamos a pedirte permanencia, no vamos a esconder condiciones en letra pequeña y no vamos a trabajar con la clínica de tu misma calle.",
   "titulo": "Por qué solo trabajamos con clínicas dentales"
  }
 },
 "agent": {
  "business_name": "Clínica Dental Sonrisas del Mediterráneo",
  "config": {
   "faq": [
    {
     "pregunta": "¿Cuánto cuesta un implante?",
     "respuesta": "Un implante completo (implante + abutment + corona) es 1.200 €. La mayoría de nuestros pacientes lo financian sin interés en 12 o 24 cuotas. En la primera cita revisamos tu caso y vemos la opción que mejor se adapta a ti."
    },
    {
     "pregunta": "¿Cuánto tiempo lleva un tratamiento de ortodoncia invisible?",
     "respuesta": "El tiempo medio es entre 12 y 18 meses dependiendo de la complejidad. El presupuesto es 3.500 € e incluye todos los alineadores, revisiones mensuales y retenedores finales. Financiamos sin interés."
    },
    {
     "pregunta": "¿Aceptáis pacientes con mutua?",
     "respuesta": "Sí, trabajamos con todas las mutuas (Sanitas, Adeslas, Caja Salud, etc.). La mutua cubre ciertos tratamientos como limpiezas, revisiones y algún tratamiento. Los implantes y la ortodoncia suelen ir por tu cuenta, pero te explicamos todas las opciones en la primera visita."
    },
    {
     "pregunta": "¿Puedo pedir cita el fin de semana?",
     "respuesta": "Abrimos los sábados de 10:00 a 14:00. Tienes hueco disponible ese día o podemos buscar entre semana en tu horario. ¿Qué día te va mejor?"
    },
    {
     "pregunta": "¿Cuál es el precio de la primera visita?",
     "respuesta": "La primera visita es gratis: revisión completa, radiografía y plan de tratamiento sin coste ni compromiso. Así sabes exactamente qué necesitas antes de decidir."
    },
    {
     "pregunta": "¿Hacéis injertos de encía o estética dental?",
     "respuesta": "Sí, hacemos injertos de encía y tratamientos estéticos. El Dr. Fernández se especializa en eso. Lo mejor es que vengas a una cita para que valore tu caso y te diga el precio exacto."
    }
   ],
   "negocio": {
    "web": "sonrisasmediterraneo.es",
    "rubro": "clínica dental",
    "nombre": "Clínica Dental Sonrisas del Mediterráneo",
    "horario": "L-V 9:00-20:30, S 10:00-14:00",
    "telefono": "652 847 392",
    "ubicacion": "Calle Princesa Sofía 47, Torremolinos (Málaga)",
    "descripcion": "Clínica dental con 3 sillones en Torremolinos especializada en implantes, ortodoncia y tratamientos estéticos. Equipo de odontólogos, higienistas y auxiliares dedicados a la salud bucodental de calidad.",
    "zona_horaria": "Europe/Madrid"
   },
   "politicas": [
    "Cancelaciones: se aceptan hasta 24 horas antes sin coste. Cancelaciones en menos de 24 horas se cobra el 50% de la cita.",
    "Formas de pago: efectivo, tarjeta (débito y crédito) y financiación de Cofidis sin interés en tratamientos mayores de 600 €.",
    "Urgencias: atendemos urgencias de lunes a viernes entre las 9:00 y las 13:00. Llamar al teléfono, no escribir.",
    "Primera visita: completamente gratis con diagnóstico y radiografía. Sin compromiso de contratar ningún tratamiento."
   ],
   "servicios": [
    {
     "nombre": "Primera visita y diagnóstico",
     "precio": "0 €",
     "duracion": "30 min",
     "descripcion": "Revisión completa con radiografía intraoral y plan de tratamiento personalizado."
    },
    {
     "nombre": "Limpieza dental (profilaxis)",
     "precio": "60 €",
     "duracion": "45 min",
     "descripcion": "Higiene dental profesional con eliminación de sarro y pulido."
    },
    {
     "nombre": "Tratamiento de caries",
     "precio": "85 €",
     "duracion": "30 min",
     "descripcion": "Obturación dental con composite de última generación."
    },
    {
     "nombre": "Endodoncia",
     "precio": "280 €",
     "duracion": "60 min",
     "descripcion": "Tratamiento de conducto radicular en una o varias sesiones."
    },
    {
     "nombre": "Implante dental",
     "precio": "1.200 €",
     "duracion": "90 min",
     "descripcion": "Colocación de implante de titanio con abutment y corona (financiación disponible)."
    },
    {
     "nombre": "Ortodoncia invisible (Invisalign)",
     "precio": "3.500 €",
     "duracion": "consulta inicial 30 min",
     "descripcion": "Tratamiento completo con alineadores transparentes personalizados (financiación disponible)."
    },
    {
     "nombre": "Blanqueamiento dental",
     "precio": "150 €",
     "duracion": "45 min",
     "descripcion": "Blanqueamiento profesional con luz LED de última generación."
    },
    {
     "nombre": "Extracción dental",
     "precio": "90 €",
     "duracion": "30 min",
     "descripcion": "Extracción simple o quirúrgica según complejidad."
    }
   ],
   "datos_cita": [
    "Nombre completo",
    "Teléfono de contacto",
    "Motivo de la consulta (revisión, implantes, ortodoncia, urge",
    "Día y hora preferida",
    "¿Primera vez con nosotros o ya eres paciente?"
   ],
   "secretaria": {
    "tono": "cercana, profesional, tranquilizadora",
    "nombre": "Marta",
    "saludo": "Hola, soy Marta de Sonrisas del Mediterráneo. ¿En qué puedo ayudarte hoy? 😊"
   }
  }
 }
}
