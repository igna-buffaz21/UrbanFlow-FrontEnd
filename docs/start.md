# Iniciar servidor del frontend

## 1. Clonar repositorio

git clone https://github.com/igna-buffaz21/UrbanFlow-FrontEnd.git

## 2. Instalar dependencias

npm i

## 3. Configuracion de .env

cp .env.example .env

## 4. Configuracion de variables de entorno

- Extraer APIKEY de clerk y pegarla en el .env

- Completar la url del backend en el .env(asegurarse que termine en /api)

## 5. Iniciar servidor en desarrollo

npm run dev

 - La aplicacion estara disponible en:

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/