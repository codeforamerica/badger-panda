This project is a voting site for Badgers versus Panda

## Basics

Using node.js, the server sets up the following:

  * Socket connect to communicate with client.
  * Client webpage

## Installing

This is currently deployable for dotcloud, but could be run
in any environment that runs node.js.

### Set up Web Application

1. Install node
2. Install npm
3. Run: `npm install`
4. Copy example settings and update appropriate values: cp lib/settings.example.js lib/settings.js`
5. Run once: `node lib/db-setup.js`
   * If you want to remove all the old votes, run: `node lib/db-setup.js --delete-votes`
6. Start server: `node lib/server.js`

## Technologies Used

This would not be possible without all these great, open source projects:

  * [Node.js](http://nodejs.org/)
  * [Socket.io](http://socket.io/)
  * Cradle
  * [Express](http://expressjs.com/)
  * [HTML5 Boilerplate](http://html5boilerplate.com/)
  * [CSS3](http://www.w3.org/TR/CSS/#css3)
  * [jQuery](http://jquery.com/)
  * [Modernizr](http://www.modernizr.com/)