// Pedaços de validação (zod) reaproveitados por mais de um módulo.
import { z } from "zod";

// Senha: 8 a 72 caracteres (72 é o limite do bcrypt)
export const senhaForte = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.");

// Id vindo da URL (/:id): chega como texto e é convertido para número inteiro
export const idParam = z.object({ id: z.coerce.number().int().positive("Id inválido.") });

// Data no formato AAAA-MM-DD
export const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD.");
