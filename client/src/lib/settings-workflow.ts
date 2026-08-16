import type { Address } from "./domain";

export function markDefaultAddress(addresses: Address[], id: string): Address[] {
  return addresses.map(address => ({ ...address, default: address.id === id }));
}

export function removeSavedAddress(addresses: Address[], id: string): Address[] {
  const remaining = addresses.filter(address => address.id !== id);
  if (remaining.length > 0 && !remaining.some(address => address.default)) {
    remaining[0] = { ...remaining[0], default: true };
  }
  return remaining;
}

export function signInActivityRoute(): string {
  return "/settings/security/activity";
}
