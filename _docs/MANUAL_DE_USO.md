# Manual de uso — Sistema LF-ITSE

Paso a paso de cada perfil. Las reglas que el sistema aplica (plazos, resultados del acta, denegatorias) están en
`_docs/FLUJO_DEL_TRAMITE.md` del backend; aquí se explica cómo hacer cada tarea en pantalla.

> Las direcciones son relativas al dominio del sistema (en local, `http://localhost:5173`).

## Antes de empezar

- **Personal e inspectores** entran por `/login` con el usuario y la contraseña que les da el administrador de TI.
- **Ciudadanos** entran por `/ciudadano/ingresar` y crean su propia cuenta.
- Cada persona ve en el menú solo lo que le corresponde. Si escribe a mano una dirección ajena, el sistema la
  devuelve a su inicio.
- El botón del sol o la luna, arriba a la derecha, cambia entre modo claro y oscuro.
- Los formularios largos guardan un **borrador** mientras se escribe: si se cierra el modal o se sale de la
  pantalla, al volver aparece "Borrador recuperado". El botón *Limpiar borrador* lo descarta.

## Mesa de partes

**Registrar a una persona** (`/admin/personas` → *Nuevo Registro*)

1. Elegir persona natural o jurídica.
2. Agregar su documento (DNI, RUC o carné de extranjería). Con la PIDE configurada, los datos se completan solos
   desde RENIEC o SUNAT.
3. Completar dirección y, si hay, teléfono y correo. Guardar.

**Registrar un expediente** (`/admin/expedientes` → *Nuevo Registro*)

1. **N° de expediente**: dejarlo vacío para que el sistema asigne el siguiente.
2. **Fecha de recepción**: la del día, salvo que se registre uno atrasado.
3. **Procedimiento TUPA**: buscarlo por código o nombre. Define si el trámite lleva licencia, ITSE o ambos, y el
   plazo.
4. **Solicitante**: buscarlo por DNI, RUC o nombre. Si no aparece, registrarlo primero en *Personas*.
5. **Representante legal**: solo si actúa en nombre del solicitante (por ejemplo, el gerente de una empresa).
6. *Generar Expediente*. Entregar al ciudadano el **número de expediente**: lo necesita para consultar su trámite y
   crear su cuenta.

**Después**: desde la fila del expediente se puede ampliar el plazo (una vez), anular con motivo y adjuntar
archivos.

## Jefatura de ITSE

**Asignar una inspección** (`/admin/itse/asignaciones`)

1. En *Expedientes por inspeccionar*, elegir el expediente → *Asignar inspector*.
2. Elegir al **responsable** (quien registra el acta) y, si van más, hasta 3 **acompañantes**.
3. Poner la **fecha de visita** o dejarla vacía para que el inspector la coordine con el administrado.

**Seguimiento**: en la misma pantalla se reprograma, se cambia el equipo, se reasigna, se revisan las actas y se
ve el historial. Si un acta se registró con un error, se anula con motivo y el inspector registra una nueva.

**Reinspección Desaprobada**: no corresponde emitir el certificado sino registrar la **denegatoria de la ITSE**
desde esa misma pantalla.

## Inspector de campo

Pensado para usarse desde el celular.

1. En `/inspector` aparecen las inspecciones a cargo (como responsable) y las que acompaña.
2. En el local, abrir la inspección → *Registrar acta* (solo el responsable).
3. **Datos de la visita**: número de acta, fecha, área en m² y aforo.
4. **Checklist de seguridad**: extintores, señalización, luces de emergencia y tableros eléctricos; cada uno
   *Cumple*, *No cumple* o *No aplica*. Si algo no cumple, escribir las observaciones y elegir el plazo para
   subsanar.
5. **Fotos de sustento**: la fachada siempre; extintores y tableros si aplican.
6. Guardar. El resultado (Aprobado, Observado o Desaprobado) lo calcula el sistema según el checklist.

## Oficina de ITSE

**Emitir un certificado** (`/admin/itse` → *Nuevo Registro*)

1. Elegir el expediente. El sistema propone como titular al solicitante.
2. Completar titular, conductor (vacío = el titular conduce), nivel de riesgo, número de certificado, recibo de
   pago y fechas.
3. Guardar. Si el expediente no tiene un acta **Aprobada**, el sistema no permite emitirlo.

**Además**: registrar la notificación, inactivar con motivo, adjuntar archivos y revisar `/admin/itse/por-renovar`
(certificados próximos a vencer). Desde *Expedientes* se registra la **denegatoria de ITSE** cuando corresponde.

## Oficina de licencias

**Emitir una licencia** (`/admin/licencias-funcionamiento` → *Emitir Licencia*)

1. Elegir el expediente. El sistema propone como titular al solicitante.
2. Completar tipo de licencia, titular, conductor (vacío = el titular conduce), nivel de riesgo, zonificación,
   giros, número de licencia y recibo de pago.
3. Guardar.

**Además**: notificación, inactivación con motivo y adjuntos. Desde *Expedientes* se registra la **denegatoria de
licencia** cuando corresponde.

## Subgerente, auditor u OCI

`/admin/reportes`: padrón de licencias, ITSE por vencer, expedientes en riesgo de plazo, bajas y denegadas. Solo
lectura; cada reporte se exporta a Excel y el padrón de licencias también a PDF.

## Administrador de TI

- **Usuarios y permisos** (`/admin/usuarios`): crear cuentas, marcar las casillas de acceso de cada puesto y
  desactivar a quien deja la municipalidad. Las casillas por puesto están en `_docs/PERFILES_Y_ACCESOS.md` del
  backend.
- **Catálogos**: giros, zonificaciones, niveles de riesgo, procedimientos TUPA, tipos de licencia, tipos de
  documento, unidades orgánicas y estados. Un registro en uso no se puede borrar.
- **Configuración** (`/admin/configuracion`): datos institucionales que salen en los informes.

## Ciudadano

**Crear la cuenta** (`/ciudadano/ingresar` → *Crear cuenta*)

1. Escribir el DNI o RUC.
2. Escribir el número de **uno de sus expedientes** (está en el cargo que le dio mesa de partes).
3. Elegir una contraseña de al menos 8 caracteres, con letras y números, y repetirla.

**Mis trámites** (`/ciudadano`): todos sus expedientes, licencias y certificados ITSE, con el estado de cada uno y
en qué va la inspección (pendiente, programada para tal fecha, observada con el plazo para corregir, aprobada o
desaprobada).

**Olvidé mi contraseña**: en la misma pantalla, con el documento y un número de expediente se elige una nueva.

**Sin cuenta**: en `/consulta` cualquiera consulta un trámite con su número y el DNI o RUC del titular.
