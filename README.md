# Amber Base

An open source Node.js backend for realtime applications. This entails a server side library (node.js) and a browser side client library (js).

## Project setup
This project is right now in development mode, not yet setup for sustainable maintenance of a released library. That means, that it is more focused on maintaining an example application where we incubate the library features.

We have right now three folders (inside `src`) that depend on each other: `client`, `ui` and `backend`. Each has a `package.json` that needs an initial `npm install`.  
The build order is the following:
* in `src/client` execute `npm run build`
* in `src/ui` execute `npm run build`
* in `src/backend` execute `npm run build` now start the backend with `npm start` and open `localhost:3000`

## Database Setup
To run the backend, you need to install mariadb and add the credentials as environment variables as `Mariadb_password` and `Mariadb_user`. It uses the default endpoint `localhost` with port `3306`.