import crypto from "node:crypto";
import {
  FILE_PATH,
  HEADERS,
  SHEETS,
  mutateWorkbook,
  readSheet,
  readWorkbook,
  replaceRows,
} from "./store";
import type {
  AppConfig,
  Budget,
  Category,
  Movement,
  MovementType,
  Priority,
  Task,
  TaskColumn,
} from "@/lib/types";
import type {
  BudgetInput,
  CategoryInput,
  MovementInput,
  TaskInput,
} from "@/lib/schemas";

function movementType(value: string): MovementType {
  return value.trim().toLowerCase() === "ingreso" ? "Ingreso" : "Egreso";
}

function priority(value: string): Priority {
  const normalized = value.trim().toLowerCase();
  if (normalized === "alta") return "Alta";
  if (normalized === "baja") return "Baja";
  return "Media";
}

function taskColumn(value: string): TaskColumn {
  const normalized = value.trim().toLowerCase();
  if (normalized === "progreso" || normalized === "en progreso") return "progreso";
  if (normalized === "revision" || normalized === "en revisión" || normalized === "revisión") {
    return "revision";
  }
  if (normalized === "hecho") return "hecho";
  return "pendiente";
}

function truthy(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "true" || v === "sí" || v === "si" || v === "1";
}

function mapCategory(row: Record<string, string>): Category {
  return {
    id: row.id,
    nombre: row.nombre ?? "",
    tipo: movementType(row.tipo ?? ""),
    color: /^#[0-9a-fA-F]{6}$/.test(row.color ?? "") ? row.color : "#64748b",
    activa: truthy(row.activa ?? "true"),
  };
}

function mapMovement(row: Record<string, string>): Movement {
  return {
    id: row.id,
    fecha: row.fecha ?? "",
    tipo: movementType(row.tipo ?? ""),
    categoria: row["categoría"] ?? row.categoria ?? "",
    descripcion: row["descripción"] ?? row.descripcion ?? "",
    monto: Number(row.monto) || 0,
    metodoPago: row["método de pago"] ?? "",
    contraparte: row.contraparte ?? "",
    notas: row.notas ?? "",
    creado: row.creado ?? "",
  };
}

function mapBudget(row: Record<string, string>): Budget {
  return {
    id: row.id,
    mes: row.mes ?? "",
    categoria: row["categoría"] ?? row.categoria ?? "",
    monto: Number(row.monto) || 0,
  };
}

function mapTask(row: Record<string, string>): Task {
  return {
    id: row.id,
    titulo: row["título"] ?? row.titulo ?? "",
    descripcion: row["descripción"] ?? row.descripcion ?? "",
    columna: taskColumn(row.columna ?? ""),
    prioridad: priority(row.prioridad ?? ""),
    fechaLimite: row["fecha límite"] ?? "",
    orden: Number(row.orden) || 0,
    creado: row.creado ?? "",
    actualizado: row.actualizado ?? "",
  };
}

/* ------------------------------------------------------------------ */
/* Lecturas                                                            */
/* ------------------------------------------------------------------ */

export async function getCategories(): Promise<Category[]> {
  const wb = await readWorkbook();
  const ws = wb.getWorksheet(SHEETS.categorias);
  if (!ws) return [];
  return readSheet(ws).map(mapCategory).filter((category) => category.id && category.nombre);
}

export async function getMovements(): Promise<Movement[]> {
  const wb = await readWorkbook();
  const ws = wb.getWorksheet(SHEETS.movimientos);
  if (!ws) return [];
  return readSheet(ws)
    .map(mapMovement)
    .filter((movement) => movement.id && movement.fecha)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
}

export async function getBudgets(): Promise<Budget[]> {
  const wb = await readWorkbook();
  const ws = wb.getWorksheet(SHEETS.presupuestos);
  if (!ws) return [];
  return readSheet(ws)
    .map(mapBudget)
    .filter((budget) => budget.id && budget.mes && budget.categoria);
}

export async function getTasks(): Promise<Task[]> {
  const wb = await readWorkbook();
  const ws = wb.getWorksheet(SHEETS.tareas);
  if (!ws) return [];
  return readSheet(ws)
    .map(mapTask)
    .filter((task) => task.id && task.titulo)
    .sort((a, b) => a.orden - b.orden);
}

export async function getConfig(): Promise<AppConfig> {
  const wb = await readWorkbook();
  const ws = wb.getWorksheet(SHEETS.config);
  const rows = ws ? readSheet(ws) : [];
  const config: AppConfig = {
    moneda: "COP",
    metodosPago: ["Efectivo", "Transferencia", "Tarjeta", "Otro"],
    version: "1",
  };
  rows.forEach((row) => {
    const key = row.clave;
    if (key === "moneda" && row.valor) config.moneda = row.valor;
    if (key === "metodosPago" && row.valor) {
      config.metodosPago = row.valor
        .split(",")
        .map((method) => method.trim())
        .filter(Boolean);
    }
    if (key === "version" && row.valor) config.version = row.valor;
  });
  return config;
}

export async function getDataInfo() {
  return { path: FILE_PATH };
}

/* ------------------------------------------------------------------ */
/* Movimientos                                                         */
/* ------------------------------------------------------------------ */

function movementRow(movement: Movement): (string | number)[] {
  return [
    movement.id,
    movement.fecha,
    movement.tipo,
    movement.categoria,
    movement.descripcion,
    movement.monto,
    movement.metodoPago,
    movement.contraparte,
    movement.notas,
    movement.creado,
  ];
}

export async function saveMovement(input: MovementInput): Promise<string> {
  return mutateWorkbook((wb) => {
    const ws = wb.getWorksheet(SHEETS.movimientos)!;
    const movements = readSheet(ws).map(mapMovement).filter((m) => m.id);
    const existingIndex = movements.findIndex((m) => m.id === input.id);
    const id = input.id || crypto.randomUUID();

    const record: Movement = {
      id,
      fecha: input.fecha,
      tipo: input.tipo,
      categoria: input.categoria,
      descripcion: input.descripcion,
      monto: Number(input.monto),
      metodoPago: input.metodoPago ?? "",
      contraparte: input.contraparte ?? "",
      notas: input.notas ?? "",
      creado:
        existingIndex >= 0
          ? movements[existingIndex].creado || new Date().toISOString()
          : new Date().toISOString(),
    };

    if (existingIndex >= 0) movements[existingIndex] = record;
    else movements.push(record);

    movements.sort((a, b) => (a.fecha > b.fecha ? 1 : a.fecha < b.fecha ? -1 : 0));
    replaceRows(ws, movements.map(movementRow));
    return id;
  });
}

export async function deleteMovement(id: string): Promise<void> {
  await mutateWorkbook((wb) => {
    const ws = wb.getWorksheet(SHEETS.movimientos)!;
    const movements = readSheet(ws)
      .map(mapMovement)
      .filter((movement) => movement.id && movement.id !== id);
    replaceRows(ws, movements.map(movementRow));
  });
}

/* ------------------------------------------------------------------ */
/* Presupuestos                                                        */
/* ------------------------------------------------------------------ */

function budgetRow(budget: Budget): (string | number)[] {
  return [budget.id, budget.mes, budget.categoria, budget.monto];
}

export async function saveBudget(input: BudgetInput): Promise<string> {
  return mutateWorkbook((wb) => {
    const ws = wb.getWorksheet(SHEETS.presupuestos)!;
    const budgets = readSheet(ws).map(mapBudget).filter((budget) => budget.id);

    const existingIndex = budgets.findIndex(
      (budget) =>
        (input.id && budget.id === input.id) ||
        (!input.id &&
          budget.mes === input.mes &&
          budget.categoria === input.categoria),
    );

    const id = input.id || (existingIndex >= 0 ? budgets[existingIndex].id : crypto.randomUUID());
    const record: Budget = {
      id,
      mes: input.mes,
      categoria: input.categoria,
      monto: Number(input.monto),
    };

    if (existingIndex >= 0) budgets[existingIndex] = record;
    else budgets.push(record);

    replaceRows(ws, budgets.map(budgetRow));
    return id;
  });
}

export async function deleteBudget(id: string): Promise<void> {
  await mutateWorkbook((wb) => {
    const ws = wb.getWorksheet(SHEETS.presupuestos)!;
    const budgets = readSheet(ws)
      .map(mapBudget)
      .filter((budget) => budget.id && budget.id !== id);
    replaceRows(ws, budgets.map(budgetRow));
  });
}

export async function copyBudgets(fromMonth: string, toMonth: string): Promise<number> {
  return mutateWorkbook((wb) => {
    const ws = wb.getWorksheet(SHEETS.presupuestos)!;
    const budgets = readSheet(ws).map(mapBudget).filter((budget) => budget.id);
    const source = budgets.filter((budget) => budget.mes === fromMonth);
    let copied = 0;

    source.forEach((budget) => {
      const existing = budgets.find(
        (item) => item.mes === toMonth && item.categoria === budget.categoria,
      );
      if (existing) {
        existing.monto = budget.monto;
      } else {
        budgets.push({
          id: crypto.randomUUID(),
          mes: toMonth,
          categoria: budget.categoria,
          monto: budget.monto,
        });
      }
      copied += 1;
    });

    replaceRows(ws, budgets.map(budgetRow));
    return copied;
  });
}

/* ------------------------------------------------------------------ */
/* Categorías                                                          */
/* ------------------------------------------------------------------ */

function categoryRow(category: Category): (string | boolean)[] {
  return [category.id, category.nombre, category.tipo, category.color, category.activa];
}

export async function saveCategory(input: CategoryInput): Promise<string> {
  return mutateWorkbook((wb) => {
    const ws = wb.getWorksheet(SHEETS.categorias)!;
    const categories = readSheet(ws).map(mapCategory).filter((category) => category.id);
    const existingIndex = categories.findIndex((category) => category.id === input.id);

    if (existingIndex >= 0) {
      const previous = categories[existingIndex];
      const updated: Category = {
        id: previous.id,
        nombre: input.nombre,
        tipo: input.tipo,
        color: input.color,
        activa: input.activa ?? previous.activa,
      };
      categories[existingIndex] = updated;

      if (previous.nombre !== updated.nombre) {
        const movementWs = wb.getWorksheet(SHEETS.movimientos)!;
        const movements = readSheet(movementWs).map(mapMovement).filter((m) => m.id);
        movements.forEach((movement) => {
          if (movement.categoria === previous.nombre) movement.categoria = updated.nombre;
        });
        replaceRows(movementWs, movements.map(movementRow));

        const budgetWs = wb.getWorksheet(SHEETS.presupuestos)!;
        const budgets = readSheet(budgetWs).map(mapBudget).filter((budget) => budget.id);
        budgets.forEach((budget) => {
          if (budget.categoria === previous.nombre) budget.categoria = updated.nombre;
        });
        replaceRows(budgetWs, budgets.map(budgetRow));
      }
      replaceRows(ws, categories.map(categoryRow));
      return updated.id;
    }

    const record: Category = {
      id: crypto.randomUUID(),
      nombre: input.nombre,
      tipo: input.tipo,
      color: input.color,
      activa: input.activa ?? true,
    };
    categories.push(record);
    replaceRows(ws, categories.map(categoryRow));
    return record.id;
  });
}

export async function setCategoryActive(id: string, activa: boolean): Promise<void> {
  await mutateWorkbook((wb) => {
    const ws = wb.getWorksheet(SHEETS.categorias)!;
    const categories = readSheet(ws).map(mapCategory).filter((category) => category.id);
    const category = categories.find((item) => item.id === id);
    if (category) category.activa = activa;
    replaceRows(ws, categories.map(categoryRow));
  });
}

/* ------------------------------------------------------------------ */
/* Tareas                                                              */
/* ------------------------------------------------------------------ */

function taskRow(task: Task): (string | number)[] {
  return [
    task.id,
    task.titulo,
    task.descripcion,
    task.columna,
    task.prioridad,
    task.fechaLimite,
    task.orden,
    task.creado,
    task.actualizado,
  ];
}

export async function saveTask(input: TaskInput): Promise<string> {
  return mutateWorkbook((wb) => {
    const ws = wb.getWorksheet(SHEETS.tareas)!;
    const tasks = readSheet(ws).map(mapTask).filter((task) => task.id);
    const existingIndex = tasks.findIndex((task) => task.id === input.id);
    const now = new Date().toISOString();
    const id = input.id || crypto.randomUUID();

    let orden = 0;
    if (existingIndex >= 0) {
      orden = tasks[existingIndex].orden;
    } else {
      const sameColumn = tasks.filter((task) => task.columna === input.columna);
      orden = sameColumn.length
        ? Math.max(...sameColumn.map((task) => task.orden)) + 1
        : 0;
    }

    const record: Task = {
      id,
      titulo: input.titulo,
      descripcion: input.descripcion ?? "",
      columna: input.columna as TaskColumn,
      prioridad: input.prioridad as Priority,
      fechaLimite: input.fechaLimite ?? "",
      orden,
      creado: existingIndex >= 0 ? tasks[existingIndex].creado || now : now,
      actualizado: now,
    };

    if (existingIndex >= 0) tasks[existingIndex] = record;
    else tasks.push(record);

    replaceRows(ws, tasks.map(taskRow));
    return id;
  });
}

export async function deleteTask(id: string): Promise<void> {
  await mutateWorkbook((wb) => {
    const ws = wb.getWorksheet(SHEETS.tareas)!;
    const tasks = readSheet(ws)
      .map(mapTask)
      .filter((task) => task.id && task.id !== id);
    replaceRows(ws, tasks.map(taskRow));
  });
}

export async function updateTaskOrder(
  ordering: Record<string, string[]>,
): Promise<void> {
  await mutateWorkbook((wb) => {
    const ws = wb.getWorksheet(SHEETS.tareas)!;
    const tasks = readSheet(ws).map(mapTask).filter((task) => task.id);
    const now = new Date().toISOString();

    Object.entries(ordering).forEach(([column, ids]) => {
      const col = taskColumn(column);
      ids.forEach((id, index) => {
        const task = tasks.find((item) => item.id === id);
        if (task) {
          task.columna = col;
          task.orden = index;
          task.actualizado = now;
        }
      });
    });

    replaceRows(ws, tasks.map(taskRow));
  });
}

/* ------------------------------------------------------------------ */
/* Configuración                                                       */
/* ------------------------------------------------------------------ */

export async function savePaymentMethods(metodos: string[]): Promise<void> {
  await mutateWorkbook((wb) => {
    const ws = wb.getWorksheet(SHEETS.config)!;
    const rows = readSheet(ws);
    const clean = metodos.map((method) => method.trim()).filter(Boolean);
    const existing = rows.find((row) => row.clave === "metodosPago");
    if (existing) {
      existing.valor = clean.join(",");
    } else {
      rows.push({ clave: "metodosPago", valor: clean.join(",") });
    }
    if (!rows.some((row) => row.clave === "moneda")) {
      rows.push({ clave: "moneda", valor: "COP" });
    }
    if (!rows.some((row) => row.clave === "version")) {
      rows.push({ clave: "version", valor: "1" });
    }
    replaceRows(
      ws,
      rows.map((row) => [row.clave, row.valor]),
    );
  });
}

export { HEADERS };
