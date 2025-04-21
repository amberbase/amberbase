<p align="center">
  <img src="https://avatars.githubusercontent.com/u/208375923?s=64" alt="Amberbase logo showing an amber gemstone" />
  <h1 align="center">Amberbase</h1>
</p>

An Open Source Node.js backend for realtime applications. This entails a server-side library (Node.js) and a browser-side client library (JS).

## Get Started

This project is currently in development mode and not yet ready for sustainable maintenance of a released library. That means, that it is more focused on maintaining an example application where we incubate the library features.

### Project Setup

We have currently three folders (inside `src`) that depend on each other: `client`, `ui` and `backend`. Each has a `package.json` that needs an initial `npm install`.
The build order is the following:

```sh
cd src/client && npm run build
cd ../ui && npm run build
cd ../backend && npm run build
npm run start
```

Now you can check the app at `localhost:3000`.

### Database Setup

To run the backend, you need to install mariadb and add the credentials as environment variables as `Mariadb_password` and `Mariadb_user`. It uses the default endpoint `localhost` on port `3306`.
