# Amberbase

An open source Node.js backend for realtime applications. This entails a server side library (node.js) and a browser side client library (js).

## Project setup

This project is currently in development mode and not yet ready for sustainable maintenance of a released library. That means, that it is more focused on maintaining an example application where we incubate the library features.

We have currently three folders (inside `src`) that depend on each other: `client`, `ui` and `backend`. Each has a `package.json` that needs an initial `npm install`.
The build order is the following:

```sh
cd src/client && npm run build
cd ../ui && npm run build
cd ../backend && npm run build
npm run start
```

Now you can check the app at `localhost:3000`.

## Database Setup

To run the backend, you need to install mariadb and add the credentials as environment variables as `Mariadb_password` and `Mariadb_user`. It uses the default endpoint `localhost` on port `3306`.
