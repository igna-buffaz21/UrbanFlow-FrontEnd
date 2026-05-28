# Estructura del Frontend

El frontend está organizado por módulos que representan entidades del modelo de datos y por componentes
reutilizables.

La idea principal es separar el código en dos grandes grupos:

1. Código reutilizable en toda la aplicación, como por ejemplo un sidebar.
2. Código específico de cada modulo, por ejemplo en el modulo users, reutilizas componentes
como button, pero tiene su logica especifica si se presiona.

---

## Estructura general

src/
  components/
    layout/
    ui/
  config/
  lib/
  modules/
    auth/
      pages/
      auth.service.ts
      auth.type.ts
    districts/
      pages/
      districts.service.ts
      districts.type.ts
    home/
      pages/
    incidents/
      pages/
      incidents.service.ts
      incidents.type.ts
    munipalities/
      pages/
      munipalities.service.ts
      munipalities.type.ts
    users/
      pages/
      users.service.ts
      users.type.ts
  App.tsx
  main.tsx
  index.css


### UI
  /components
    /layout
  - Aca van a ir los layouts, que seria como un "esqueleto", un ejemplo seria un sidebar.
  - Es basicamente un componente reutilizable que se va a usar en varias pantallas.

    /components
      /layout
        /ui
  - Aca van a ir componentes simples de ui, como un button.

  /components
  - Aca van a ir todos los componentes reutilizables que contienen dentro mas componentes, por ejemplo un dialog.

### CONFIG
  /config
    api.routes.ts
  - Aca se definen las rutas de la api, para no hardcodear en los services.

    app.routes.ts
  - Aca se definen las rutas propias de app para la navegacion.

    const.globs.ts
  - Aca se definen constantes globales, como los roles del usuario.

### LIB

  - Aca hay configuraciones inciales de axios, interceptor, protectedRoutes, utils, no se deberia tocar a no ser que se requiera.

### MODULES

  /modules
    /users
      /pages
        showUsers.tsx
    user.service.ts
    user.type.ts

  - En el modulo usuarios tenemos pages, que aca se agrupan las distintas paginas de un modulo, una pagina basicamente contiene la logica del componente y agrupa distintos componentes de ui. Por ejemplo showUsers.tsx es un componente que agrupa varios componentes ui de shadcn y tiene su logica para traer los usuarios de la api y mostrar usuarios segun el rol, si es un SUPERADMIN, trae a los admins, y si es un ADMIN, trae a los operator.

  - El servicio de usuarios, sirve para traer los datos de la api, es muy util tiparle la respuesta que vas a recibir del backend. 

  - En type, guardas los tipados de la entidad, aca irias guardando todas las interface, pueden ser posibles responses de la api, etc.

### APP.TSX

  - Aca se definen las rutas, quienes pueden entrar a cierta ruta, a que pagina se dirije si entra a tal url.
  
