# Checklist por CU + ejecucion real

Fecha de ejecucion: 2026-02-17T14:53:48.621Z

| CU | Exito | Alternativo | Fracaso | Listo |
|---|---|---|---|---|
| CUD01 | OK | OK | OK | SI |
| CUD02 | OK | OK | OK | SI |
| CUD03 | OK | OK | OK | SI |
| CUD04 | OK | OK | OK | SI |
| CUD05 | OK | OK | OK | SI |
| CUD06 | OK | OK | OK | SI |
| CUD07 | OK | OK | OK | SI |
| CUD08 | OK | OK | OK | SI |
| CUD09 | OK | OK | OK | SI |
| CUD10 | OK | OK | OK | SI |
| CUD11 | OK | OK | OK | SI |
| CUD12 | OK | OK | OK | SI |
| CUD13 | OK | OK | OK | SI |
| CUD14 | OK | OK | OK | SI |
| CUD15 | OK | OK | OK | SI |
| CUD16 | OK | OK | OK | SI |
| CUD17 | OK | OK | OK | SI |
| CUD18 | OK | OK | OK | SI |
| CUD19 | OK | OK | OK | SI |
| CUD20 | OK | OK | OK | SI |
| CUD21 | OK | OK | OK | SI |

---

## CUD01 - LISTO

### Caso de exito
- Autenticar como administrador.
- Consultar listado de profesionales.
- Verificar respuesta exitosa y estructura de datos.
- Resultado ejecucion: OK
- Evidencia: Admin pudo listar profesionales.

### Camino alternativo
- Autenticar como administrador.
- Consultar detalle de un profesional existente.
- Verificar respuesta exitosa del detalle.
- Resultado ejecucion: OK
- Evidencia: Admin pudo ver detalle de profesional existente.

### Camino de fracaso
- Autenticar como socio.
- Intentar listar profesionales del modulo admin.
- Verificar bloqueo por autorizacion.
- Resultado ejecucion: OK
- Evidencia: Socio bloqueado correctamente en modulo admin.

## CUD02 - LISTO

### Caso de exito
- Autenticar admin.
- Crear profesional valido.
- Verificar alta exitosa.
- Resultado ejecucion: OK
- Evidencia: Profesional A creado con id 21.

### Camino alternativo
- Crear segundo profesional valido.
- Verificar alta.
- Persistencia correcta.
- Resultado ejecucion: OK
- Evidencia: Profesional B creado con id 22.

### Camino de fracaso
- Intentar alta con email duplicado.
- Enviar request.
- Verificar error de duplicado.
- Resultado ejecucion: OK
- Evidencia: Duplicado de email rechazado correctamente.

## CUD03 - LISTO

### Caso de exito
- Actualizar telefono de profesional.
- Guardar cambios.
- Verificar actualizacion.
- Resultado ejecucion: OK
- Evidencia: Actualizacion de telefono realizada.

### Camino alternativo
- Actualizar provincia.
- Guardar cambios.
- Verificar datos editados.
- Resultado ejecucion: OK
- Evidencia: Actualizacion alternativa aplicada.

### Camino de fracaso
- Editar profesional inexistente.
- Enviar update.
- Verificar not found.
- Resultado ejecucion: OK
- Evidencia: Update de inexistente rechazado.

## CUD04 - LISTO

### Caso de exito
- Suspender profesional sin bloqueos.
- Consultar detalle.
- Verificar fecha de baja.
- Resultado ejecucion: OK
- Evidencia: Baja de profesional aplicada.

### Camino alternativo
- Reactivar profesional suspendido.
- Consultar detalle.
- Verificar activo.
- Resultado ejecucion: OK
- Evidencia: Reactivacion validada.

### Camino de fracaso
- Generar turno futuro del profesional.
- Intentar suspender.
- Verificar bloqueo esperado.
- Resultado ejecucion: OK
- Evidencia: Suspension con turnos futuros bloqueada.

## CUD05 - LISTO

### Caso de exito
- Listar profesionales como admin.
- Obtener resultados.
- Verificar respuesta 200.
- Resultado ejecucion: OK
- Evidencia: Listado admin disponible.

### Camino alternativo
- Listar profesionales publicos para socio.
- Aplicar filtro de nombre.
- Verificar filtrado.
- Resultado ejecucion: OK
- Evidencia: Listado publico filtrado operativo.

### Camino de fracaso
- Consultar profesional inexistente.
- Enviar request detalle.
- Verificar 404.
- Resultado ejecucion: OK
- Evidencia: Detalle inexistente rechazado.

## CUD06 - LISTO

### Caso de exito
- Profesional consulta su agenda.
- Recibe datos.
- Verificar acceso permitido.
- Resultado ejecucion: OK
- Evidencia: Profesional accedio a su agenda.

### Camino alternativo
- Profesional consulta sus turnos del dia.
- Recibe listado.
- Verificar acceso correcto.
- Resultado ejecucion: OK
- Evidencia: Profesional accedio a turnos del dia.

### Camino de fracaso
- Profesional consulta agenda de otro profesional.
- Enviar request.
- Verificar bloqueo ownership.
- Resultado ejecucion: OK
- Evidencia: Ownership bloquea acceso a agenda ajena.

## CUD07 - LISTO

### Caso de exito
- Crear turno de hoy.
- Consultar /hoy.
- Verificar turno en respuesta.
- Resultado ejecucion: OK
- Evidencia: Turno 40 visible en agenda del dia.

### Camino alternativo
- Consultar /hoy con filtro socio.
- Verificar respuesta filtrada.
- Mantener estado OK.
- Resultado ejecucion: OK
- Evidencia: Filtro por socio aplicado sin errores.

### Camino de fracaso
- Consultar /hoy con rango horario invalido.
- Enviar filtro horaDesde>horaHasta.
- Verificar 400.
- Resultado ejecucion: OK
- Evidencia: Rango horario invalido rechazado.

## CUD08 - LISTO

### Caso de exito
- Consultar pacientes vinculados.
- Recibir listado.
- Verificar socio esperado.
- Resultado ejecucion: OK
- Evidencia: Listado de pacientes vinculado correcto.

### Camino alternativo
- Consultar pacientes con filtro objetivo.
- Recibir listado.
- Verificar filtrado.
- Resultado ejecucion: OK
- Evidencia: Filtro por objetivo aplicado correctamente.

### Camino de fracaso
- Consultar pacientes de otro profesional.
- Enviar request.
- Verificar 403 por ownership.
- Resultado ejecucion: OK
- Evidencia: Ownership bloquea pacientes de otro profesional.

## CUD09 - LISTO

### Caso de exito
- Consultar ficha de socio vinculado.
- Recibir ficha.
- Verificar campos clave.
- Resultado ejecucion: OK
- Evidencia: Ficha de salud visible para socio vinculado.

### Camino alternativo
- Consultar nuevamente ficha actualizada.
- Recibir datos.
- Verificar persistencia.
- Resultado ejecucion: OK
- Evidencia: Reconsulta de ficha mantiene consistencia.

### Camino de fracaso
- Consultar ficha de socio no vinculado.
- Enviar request.
- Verificar 403.
- Resultado ejecucion: OK
- Evidencia: Ficha no vinculada bloqueada correctamente.

## CUD10 - LISTO

### Caso de exito
- Crear turno historico realizado.
- Consultar historial.
- Verificar item presente.
- Resultado ejecucion: OK
- Evidencia: Historial incluye turno 41.

### Camino alternativo
- Crear turno historico ausente.
- Consultar historial.
- Verificar estado AUSENTE.
- Resultado ejecucion: OK
- Evidencia: Historial incluye turno AUSENTE 42.

### Camino de fracaso
- Consultar historial de socio no vinculado.
- Enviar request.
- Verificar 403.
- Resultado ejecucion: OK
- Evidencia: Historial no vinculado bloqueado.

## CUD11 - LISTO

### Caso de exito
- Configurar agenda valida semanal.
- Guardar.
- Verificar bloques creados.
- Resultado ejecucion: OK
- Evidencia: Agenda semanal configurada.

### Camino alternativo
- Reconfigurar agenda valida.
- Guardar.
- Verificar persistencia.
- Resultado ejecucion: OK
- Evidencia: Reconfiguracion valida aplicada.

### Camino de fracaso
- Configurar bloques superpuestos.
- Guardar.
- Verificar error de validacion.
- Resultado ejecucion: OK
- Evidencia: Superposicion rechazada correctamente.

## CUD12 - LISTO

### Caso de exito
- Asignar turno manual valido.
- Guardar turno.
- Verificar estado pendiente.
- Resultado ejecucion: OK
- Evidencia: Turno manual 43 creado.

### Camino alternativo
- Asignar otro turno en slot libre.
- Guardar.
- Verificar alta exitosa.
- Resultado ejecucion: OK
- Evidencia: Turno manual alternativo 44 creado.

### Camino de fracaso
- Asignar turno en slot ocupado.
- Enviar request.
- Verificar conflicto/disponibilidad.
- Resultado ejecucion: OK
- Evidencia: Asignacion en slot ocupado rechazada.

## CUD13 - LISTO

### Caso de exito
- Socio lista profesionales activos.
- Recibe listado.
- Verificar status 200.
- Resultado ejecucion: OK
- Evidencia: Socio puede ver profesionales activos.

### Camino alternativo
- Aplicar filtro por nombre.
- Recibir lista filtrada.
- Verificar coincidencias.
- Resultado ejecucion: OK
- Evidencia: Filtro de profesionales publicos sin errores.

### Camino de fracaso
- Consultar listado sin token.
- Enviar request.
- Verificar 401.
- Resultado ejecucion: OK
- Evidencia: Sin token queda correctamente bloqueado.

## CUD14 - LISTO

### Caso de exito
- Socio reserva turno valido.
- Registrar turno.
- Verificar estado pendiente.
- Resultado ejecucion: OK
- Evidencia: Reserva creada con id 45.

### Camino alternativo
- Reservar segundo turno en otro dia.
- Registrar.
- Verificar alta.
- Resultado ejecucion: OK
- Evidencia: Reserva alternativa creada con id 46.

### Camino de fracaso
- Reservar mismo profesional mismo dia.
- Enviar request.
- Verificar bloqueo de regla.
- Resultado ejecucion: OK
- Evidencia: Bloqueo por mas de un turno mismo dia validado.

## CUD15 - LISTO

### Caso de exito
- Socio consulta perfil publico.
- Recibir perfil.
- Verificar campos y horarios.
- Resultado ejecucion: OK
- Evidencia: Perfil publico consultado con exito.

### Camino alternativo
- Consultar perfil con agenda.
- Recibir horarios.
- Verificar no vacio.
- Resultado ejecucion: OK
- Evidencia: Perfil incluye horarios publicos.

### Camino de fracaso
- Consultar perfil inexistente.
- Enviar request.
- Verificar 404.
- Resultado ejecucion: OK
- Evidencia: Perfil inexistente responde not found.

## CUD16 - LISTO

### Caso de exito
- Socio guarda ficha de salud.
- Persistir datos.
- Verificar respuesta.
- Resultado ejecucion: OK
- Evidencia: Ficha de salud guardada correctamente.

### Camino alternativo
- Socio actualiza ficha existente.
- Persistir.
- Verificar cambios.
- Resultado ejecucion: OK
- Evidencia: Actualizacion de ficha de salud aplicada.

### Camino de fracaso
- Enviar ficha invalida.
- Guardar.
- Verificar error 400.
- Resultado ejecucion: OK
- Evidencia: Validacion de ficha invalida funcionando.

## CUD17 - LISTO

### Caso de exito
- Socio consulta mis turnos.
- Recibe listado.
- Verificar datos.
- Resultado ejecucion: OK
- Evidencia: Listado de mis turnos disponible.

### Camino alternativo
- Filtrar mis turnos por estado.
- Recibe resultado.
- Verificar filtro.
- Resultado ejecucion: OK
- Evidencia: Filtro por estado aplicado en mis turnos.

### Camino de fracaso
- Consultar mis turnos sin token.
- Enviar request.
- Verificar 401.
- Resultado ejecucion: OK
- Evidencia: Mis turnos protegido por autenticacion.

## CUD18 - LISTO

### Caso de exito
- Reprogramar turno pendiente >24h.
- Guardar nueva fecha/hora.
- Verificar estado REPROGRAMADO.
- Resultado ejecucion: OK
- Evidencia: Turno 45 reprogramado.

### Camino alternativo
- Reprogramar otro turno elegible.
- Persistir.
- Verificar response.
- Resultado ejecucion: OK
- Evidencia: Turno 47 reprogramado en camino alternativo.

### Camino de fracaso
- Reprogramar turno con <24h.
- Enviar request.
- Verificar bloqueo regla 24h.
- Resultado ejecucion: OK
- Evidencia: Reprogramacion con menos de 24h correctamente bloqueada.

## CUD19 - LISTO

### Caso de exito
- Cancelar turno pendiente >24h.
- Persistir estado.
- Verificar CANCELADO.
- Resultado ejecucion: OK
- Evidencia: Turno 49 cancelado correctamente.

### Camino alternativo
- Cancelar otro turno elegible.
- Persistir.
- Verificar respuesta.
- Resultado ejecucion: OK
- Evidencia: Cancelacion alternativa sobre turno 50 exitosa.

### Camino de fracaso
- Cancelar turno con <24h.
- Enviar request.
- Verificar bloqueo regla 24h.
- Resultado ejecucion: OK
- Evidencia: Cancelacion con menos de 24h correctamente rechazada.

## CUD20 - LISTO

### Caso de exito
- Confirmar turno del dia antes de hora.
- Persistir confirmacion.
- Verificar CONFIRMADO.
- Resultado ejecucion: OK
- Evidencia: Turno 52 confirmado exitosamente.

### Camino alternativo
- Confirmar turno REPROGRAMADO del dia.
- Persistir.
- Verificar CONFIRMADO.
- Resultado ejecucion: OK
- Evidencia: Turno reprogramado 53 confirmado.

### Camino de fracaso
- Confirmar turno fuera del dia.
- Enviar request.
- Verificar rechazo.
- Resultado ejecucion: OK
- Evidencia: Confirmacion fuera del dia rechazada.

## CUD21 - LISTO

### Caso de exito
- Registrar asistencia asistio=true en confirmado pasado.
- Persistir.
- Verificar REALIZADO.
- Resultado ejecucion: OK
- Evidencia: Asistencia REALIZADO registrada para turno 55.

### Camino alternativo
- Registrar asistencia asistio=false.
- Persistir.
- Verificar AUSENTE.
- Resultado ejecucion: OK
- Evidencia: Asistencia AUSENTE registrada para turno 56.

### Camino de fracaso
- Registrar asistencia en turno no confirmado.
- Enviar request.
- Verificar bloqueo.
- Resultado ejecucion: OK
- Evidencia: Asistencia en estado invalido correctamente bloqueada.
