# Discrepancia: Bug del Sidebar

## Contexto
El bundle original (frontend/) tenía un commit:
"fix: sidebar nunca desaparece al navegar"

## Estado en el golden source
El golden source (reconstructed-frontend/) NO tiene este fix. El sidebar
es un <aside> estático sin estado de toggle ni cierre al navegar.

## Consecuencia
Ni la versión React ni la versión Vue del proyecto reconstruido tienen
el fix del sidebar.

## Opciones de resolución
1. Aceptar la discrepancia (migración fiel al golden source).
2. Implementar el fix manualmente (mejora sobre el golden).
3. Investigar el bundle original para recuperar el código del fix
   (reverse engineering real, costoso).

## Decisión del Stakeholder
Opción A: Aceptar la discrepancia (migración fiel al golden source). El fix se abordará en una etapa posterior.
