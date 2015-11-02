/**
 * Created by vkondratyuk on 02.11.15.
 */

var app = require('express')();
app.use(express.static('public'));
app.listen(process.env.PORT);