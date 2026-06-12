# Usar TOAST para mostrar alertas/responses

## 1. Importar 

- import { notify } from "@/lib/notify";

## 2. Usar

- notify.error("El incidente fue rechazado por la IA."); //EJEMPLO DE ERROR

- notify.success("El incidente fue creado por la IA."); //EJEMPLO DE EXITO

- notify.info("Posible incidente duplicado"); //EJEMPLO DE INFORMACION

- en notify.ts se encuentran todos los tipos


