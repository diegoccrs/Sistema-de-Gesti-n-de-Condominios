import { CondoRules } from '../models/condo-rules.model';

export const CONDO_RULES: CondoRules[] = [
  {
    id: 'rule-001',
    title: 'Uso de Áreas Comunes',
    content_html: `
      <h2>Artículo 1: Horarios de Uso</h2>
      <p>Las áreas comunes (piscina, gimnasio, salón de fiestas) podrán ser utilizadas de <strong>8:00 AM a 10:00 PM</strong>. Cualquier excepción deberá ser autorizada por la administración.</p>
      <h2>Artículo 2: Reservaciones</h2>
      <p>El salón de fiestas requiere reservación con al menos <strong>48 horas de anticipación</strong> a través del sistema de administración o con la oficina de condominio. Se aplicará una tarifa de limpieza.</p>
      <h2>Artículo 3: Residuos</h2>
      <p>Se prohíbe dejar basura en las áreas comunes. Todos los residuos generados deberán ser retirados al finalizar el uso.</p>
      <h2>Artículo 4: Mascotas</h2>
      <p>Las mascotas no están permitidas en el área de la piscina ni dentro del gimnasio. En el salón de fiestas, solo se permiten mascotas de apoyo con previa notificación.</p>
    `,
    version: 1.0,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2023-01-15T10:00:00Z',
  },
  {
    id: 'rule-002',
    title: 'Normas de Convivencia y Ruido',
    content_html: `
      <h2>Artículo 1: Horas de Silencio</h2>
      <p>Se consideran horas de silencio de <strong>10:00 PM a 7:00 AM</strong> de lunes a viernes, y de <strong>11:00 PM a 8:00 AM</strong> los fines de semana y feriados. Durante estas horas, se deberá mantener un nivel de ruido mínimo.</p>
      <h2>Artículo 2: Obras y Reformas</h2>
      <p>Las obras y reformas que generen ruido significativo solo podrán realizarse de <strong>9:00 AM a 5:00 PM</strong> de lunes a viernes. Se debe notificar a la administración con 48 horas de anticipación.</p>
      <h2>Artículo 3: Fiestas y Eventos</h2>
      <p>Para la realización de fiestas en los apartamentos, se recomienda informar a los vecinos cercanos. Durante las horas de silencio, se deberá moderar el volumen de la música y las conversaciones.</p>
    `,
    version: 1.1,
    created_at: '2023-03-20T09:30:00Z',
    updated_at: '2023-04-01T11:00:00Z',
  },
  {
    id: 'rule-003',
    title: 'Disposiciones sobre Mascotas',
    content_html: `
      <h2>Artículo 1: Registro de Mascotas</h2>
      <p>Todas las mascotas deben ser registradas en la administración del condominio. Es obligatorio presentar el carnet de vacunación y desparasitación.</p>
      <h2>Artículo 2: Tránsito en Áreas Comunes</h2>
      <p>Las mascotas deben transitar por las áreas comunes siempre con correa y bajo la supervisión de un adulto. Se prohíbe el uso de ascensores sociales para el tránsito de mascotas, utilizando preferentemente el ascensor de servicio.</p>
      <h2>Artículo 3: Recogida de Excrementos</h2>
      <p>Es obligación del propietario recoger los excrementos de sus mascotas en todas las áreas del condominio, tanto comunes como exteriores.</p>
    `,
    version: 1.0,
    created_at: '2023-05-01T14:00:00Z',
    updated_at: '2023-05-01T14:00:00Z',
  }
];