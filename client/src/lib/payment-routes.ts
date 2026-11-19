export const paymentsPath = "/payments";
export const invoicesPath = "/payments/invoices";
export const suppliersPath = "/payments/suppliers";
export const supplierWizardPath = "/payments/suppliers/new";

export function supplierDetailsPath(reference: string) {
  return `${suppliersPath}/${encodeURIComponent(reference)}`;
}
