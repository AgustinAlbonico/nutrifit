export function agregarValorAFormData(
  formData: FormData,
  clave: string,
  valor: unknown,
): void {
  if (valor === undefined) {
    return;
  }

  if (valor === null) {
    formData.append(clave, '');
    return;
  }

  if (Array.isArray(valor) || typeof valor === 'object') {
    formData.append(clave, JSON.stringify(valor));
    return;
  }

  formData.append(clave, String(valor));
}
