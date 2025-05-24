import { PS_REGISTERS } from '@/sentinel/registers/ps';

import type { Register } from '@/sentinel/types';

function namespacedRegisters(registers: Register[], prefix: string): Register[] {
	return registers.map(register => ({ ...register, label: `${prefix}-${register.label}` }));
}

export const registers: { list: Register[] } = {
	list: [...namespacedRegisters(PS_REGISTERS, 'ps')],
};
