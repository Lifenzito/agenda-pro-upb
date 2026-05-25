<script setup>
/**
 * Vista de Política de Privacidad.
 */
</script>

<template>
  <section class="legal-view app-container">
    <article class="panel-card legal-card">
      <h1>Política de Privacidad</h1>
      <p class="last-updated">Última actualización: mayo 2025</p>

      <p>
        En <strong>AgendaPro</strong> nos comprometemos a proteger la privacidad de nuestros
        usuarios. Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos tu
        información personal cuando utilizas nuestra plataforma de agendamiento de citas.
      </p>

      <h2>1. Información que recopilamos</h2>
      <p>Recopilamos la siguiente información cuando te registras o utilizas nuestros servicios:</p>
      <ul>
        <li><strong>Datos de cuenta:</strong> nombre, dirección de correo electrónico y foto de perfil (cuando inicias sesión con Google).</li>
        <li><strong>Datos de citas:</strong> información relacionada con las citas que agendes, incluyendo fecha, hora, servicio solicitado y especialista asignado.</li>
        <li><strong>Datos de uso:</strong> información sobre cómo interactúas con la plataforma, como páginas visitadas y negocios consultados (almacenados localmente en tu navegador).</li>
      </ul>

      <h2>2. Cómo usamos tu información</h2>
      <p>Utilizamos la información recopilada para:</p>
      <ul>
        <li>Crear y gestionar tu cuenta de usuario.</li>
        <li>Procesar y administrar tus reservas de citas.</li>
        <li>Facilitar la comunicación entre clientes y negocios.</li>
        <li>Mejorar la experiencia de usuario y la funcionalidad de la plataforma.</li>
        <li>Garantizar la seguridad de la plataforma y prevenir fraudes.</li>
      </ul>

      <h2>3. Autenticación con Google</h2>
      <p>
        Cuando inicias sesión con Google, accedemos a tu nombre, correo electrónico y foto de perfil
        proporcionados por tu cuenta de Google. No accedemos a tu contraseña de Google ni a otros
        datos de tu cuenta que no sean los mencionados. Esta información se utiliza exclusivamente
        para crear y mantener tu perfil en AgendaPro.
      </p>

      <h2>4. Almacenamiento y seguridad</h2>
      <p>
        Tu información se almacena de forma segura en servidores de <strong>Firebase (Google Cloud
        Platform)</strong>. Implementamos medidas de seguridad técnicas y organizativas para proteger
        tus datos contra acceso no autorizado, pérdida o alteración, incluyendo:
      </p>
      <ul>
        <li>Autenticación segura mediante Firebase Authentication.</li>
        <li>Reglas de seguridad en la base de datos Firestore.</li>
        <li>Conexiones cifradas mediante HTTPS/TLS.</li>
      </ul>

      <h2>5. Compartir información</h2>
      <p>
        <strong>No vendemos, alquilamos ni compartimos</strong> tu información personal con terceros
        con fines comerciales. Tu información de citas es visible únicamente para:
      </p>
      <ul>
        <li>El negocio donde agendaste la cita (nombre, correo, fecha/hora de la reserva).</li>
        <li>Tú como usuario para gestionar tus propias citas.</li>
      </ul>

      <h2>6. Tus derechos</h2>
      <p>Como usuario de AgendaPro, tienes derecho a:</p>
      <ul>
        <li>Acceder a tu información personal almacenada en la plataforma.</li>
        <li>Solicitar la corrección de datos inexactos.</li>
        <li>Solicitar la eliminación de tu cuenta y datos asociados.</li>
        <li>Revocar tu consentimiento para el tratamiento de datos en cualquier momento.</li>
      </ul>

      <h2>7. Cookies y almacenamiento local</h2>
      <p>
        Utilizamos almacenamiento local del navegador (localStorage) para guardar preferencias como
        el historial de negocios visitados recientemente. Esta información permanece en tu dispositivo
        y no se envía a nuestros servidores. Puedes eliminarla en cualquier momento desde la
        configuración de tu navegador o desde la sección "Tiendas recientes" de la plataforma.
      </p>

      <h2>8. Menores de edad</h2>
      <p>
        AgendaPro no está dirigido a menores de 14 años. No recopilamos intencionalmente
        información de menores de esa edad. Si descubrimos que hemos recopilado información de un
        menor sin el consentimiento adecuado, procederemos a eliminarla.
      </p>

      <h2>9. Cambios en esta política</h2>
      <p>
        Nos reservamos el derecho de actualizar esta Política de Privacidad. Cualquier cambio será
        publicado en esta página con la fecha de última actualización. Te recomendamos revisarla
        periódicamente.
      </p>

      <h2>10. Contacto</h2>
      <p>
        Si tienes preguntas o inquietudes sobre esta Política de Privacidad o sobre el tratamiento
        de tus datos, puedes contactarnos a través de la plataforma o escribirnos al correo del
        administrador del negocio correspondiente.
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
