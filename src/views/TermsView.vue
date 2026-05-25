<script setup>
/**
 * Vista de Términos y Condiciones.
 */
</script>

<template>
  <section class="legal-view app-container">
    <article class="panel-card legal-card">
      <h1>Términos y Condiciones</h1>
      <p class="last-updated">Última actualización: mayo 2025</p>

      <p>
        Bienvenido a <strong>AgendaPro</strong>. Al registrarte y utilizar nuestra plataforma,
        aceptas los siguientes Términos y Condiciones. Te recomendamos leerlos detenidamente.
      </p>

      <h2>1. Descripción del servicio</h2>
      <p>
        AgendaPro es una plataforma web de agendamiento de citas que permite a negocios
        (peluquerías, salones de belleza, barberías y similares) gestionar sus reservas y a los
        clientes agendar citas de manera rápida y sencilla.
      </p>

      <h2>2. Tipos de cuenta</h2>
      <ul>
        <li>
          <strong>Cliente:</strong> Puede agendar, reagendar y cancelar citas en los negocios
          registrados. Las cuentas creadas mediante Google Sign-In se registran automáticamente como
          clientes.
        </li>
        <li>
          <strong>Dueño de negocio:</strong> Puede administrar su negocio, servicios, trabajadores
          y ver las citas agendadas. Este tipo de cuenta requiere registro manual.
        </li>
      </ul>

      <h2>3. Registro y cuenta</h2>
      <ul>
        <li>Debes proporcionar información veraz y actualizada al crear tu cuenta.</li>
        <li>Eres responsable de mantener la confidencialidad de tus credenciales de acceso.</li>
        <li>Cada persona debe tener una sola cuenta. No se permite la creación de cuentas duplicadas.</li>
        <li>Nos reservamos el derecho de suspender o eliminar cuentas que incumplan estos términos.</li>
      </ul>

      <h2>4. Uso aceptable</h2>
      <p>Al usar AgendaPro te comprometes a:</p>
      <ul>
        <li>Utilizar la plataforma únicamente para agendar y gestionar citas legítimas.</li>
        <li>No agendar citas falsas o sin intención de asistir.</li>
        <li>No utilizar la plataforma para actividades ilegales, fraudulentas o que perjudiquen a otros usuarios.</li>
        <li>No intentar acceder a cuentas o datos de otros usuarios sin autorización.</li>
        <li>No interferir con el funcionamiento normal de la plataforma.</li>
      </ul>

      <h2>5. Citas y reservas</h2>
      <ul>
        <li>Las citas están sujetas a la disponibilidad del negocio y sus especialistas.</li>
        <li>Puedes reagendar o cancelar citas desde tu panel de cliente.</li>
        <li>Los negocios pueden establecer sus propios horarios, servicios y políticas de cancelación.</li>
        <li>AgendaPro no es responsable de la calidad de los servicios prestados por los negocios registrados.</li>
      </ul>

      <h2>6. Responsabilidades del negocio</h2>
      <p>Los dueños de negocio que utilicen AgendaPro se comprometen a:</p>
      <ul>
        <li>Mantener actualizada la información de su negocio, servicios y horarios.</li>
        <li>Atender las citas agendadas a través de la plataforma.</li>
        <li>Tratar los datos de los clientes de acuerdo con la legislación vigente de protección de datos.</li>
        <li>No utilizar la información de los clientes para fines distintos a la prestación del servicio agendado.</li>
      </ul>

      <h2>7. Propiedad intelectual</h2>
      <p>
        Todo el contenido de AgendaPro (diseño, código, logotipo, textos e interfaz) es propiedad
        de sus creadores y está protegido por las leyes de propiedad intelectual. No se permite la
        reproducción, distribución o modificación sin autorización expresa.
      </p>

      <h2>8. Limitación de responsabilidad</h2>
      <ul>
        <li>AgendaPro se proporciona "tal cual" sin garantías de disponibilidad ininterrumpida.</li>
        <li>No somos responsables de pérdidas derivadas del uso o imposibilidad de uso de la plataforma.</li>
        <li>No somos responsables de los servicios prestados por los negocios registrados.</li>
        <li>No garantizamos que la plataforma esté libre de errores técnicos, aunque nos esforzamos por mantenerla estable.</li>
      </ul>

      <h2>9. Protección de datos</h2>
      <p>
        El tratamiento de tus datos personales se rige por nuestra
        <RouterLink to="/privacidad">Política de Privacidad</RouterLink>, que forma parte integral
        de estos Términos y Condiciones.
      </p>

      <h2>10. Modificaciones</h2>
      <p>
        Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento.
        Los cambios entrarán en vigor desde su publicación en esta página. El uso continuado de la
        plataforma después de cualquier modificación constituye la aceptación de los nuevos términos.
      </p>

      <h2>11. Legislación aplicable</h2>
      <p>
        Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier
        controversia será resuelta ante los tribunales competentes de Colombia.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Para preguntas sobre estos Términos y Condiciones, puedes contactarnos a través de la
        plataforma o escribirnos al correo del administrador del negocio correspondiente.
      </p>
    </article>
  </section>
</template>

<style scoped>
.legal-view {
  padding-top: 1rem;
  padding-bottom: 2rem;
}

.legal-card {
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.7;
}

.legal-card h1 {
  margin: 0;
  color: var(--primary);
}

.last-updated {
  margin: 0.3rem 0 1.2rem;
  color: #6a8a5f;
  font-size: 0.88rem;
  font-weight: 600;
}

.legal-card h2 {
  margin: 1.5rem 0 0.5rem;
  color: var(--primary);
  font-size: 1.15rem;
}

.legal-card p {
  margin: 0.5rem 0;
  color: #3f5f37;
}

.legal-card ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
  color: #3f5f37;
}

.legal-card li {
  margin-bottom: 0.35rem;
}
</style>
