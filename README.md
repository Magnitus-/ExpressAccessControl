Express-Access-Control
======================

Module to implement access control based on a user's membership to groups.

It is intended as a dependency for express-user and express-user-local, but could be used on it's own by making use of the customization facilities.

Requirements
============

- A recent version of Node.js (version 0.10.25 is installed on my machine, later versions should work also, let me know if that is not the case)

- The AuthenticateRoute function is meant to be used with an Express router, although it could feasibly work with frameworks that support a similar API.

Installation
============

npm install express-access-control

Running Tests
=============

In the directory where the module is located, run the following 2 commands on the prompt:

- npm install
- npm test

Usage
=====

The library has 2 main methods:

Authenticate(Req, Res, Groups, And)
-----------------------------------

This function, returns true if the request's user matches the expected authentication credentials, else false.

&lt;Req&gt; and &lt;Res&gt; and the usual arguments passed to every Express route handler.

&lt;Groups&gt; is an array of strings correspond to groups that you want to verify that the request's user belongs to. It can be set to null, in which case the call will just verify that the request's user is logged in.

&lt;And&gt; can be set to true or false. If set to true, the function will only match the user if he belongs to all the groups specified in &lt;Groups&gt;.

Ex:

```javascript
var AccessControl = require('express-access-control');

//Some code

App.put('/Homeworks/Math202/Week2', function(Req, Res, Next) {
    if(Authenticate(Req, Res, ['Teacher', 'Math'], true))
    {
        Next();
    }
    {
        Res.status(401).end();
    }
});

//More code
```

AuthenticateRoute(Options)
--------------------------

This call is a shortcut to generate a route that authentifies the user (like in the above example).

If the user doesn't pass authentication, then Next(Err) is called, where Err is an error with Err.Source set to "ExpressAccessControl" and Err.Type set to "NoAccess". If the user passes authentication, then Next() is called to go to the next route handler.

&lt;Options&gt; can take 2 formats:

- An array of groups the user should belong to

In this case, 'Authenticate' is used to authenticate the user with &lt;Groups&gt; set to &lt;Options&gt; and &lt;And&gt; set to false.

- An object of options:

-The 'Group' property specifies the group to check that the user belongs to. If null, the route route only verifies that the user is logged in. Defaults to null.
-The 'And' proporty specifies whether the user should belong to all the groups. Defaults to false.
-The 'Not' property specifies whether the user should not belong to the groups instead. Defaults to false.

Ex:

```javascript
var AccessControl = require('express-access-control');

//Some code

App.posts('/Forums/French', AccessControl.AuthenticateRoute({'Groups': ['Banned'], 'Not': true}));

//More code
```

Customization
=============

The library is, by default, dependent on req.session (set by the express-session library) and req.session.User.Memberships (set by the user-store and express-user libraries) being present for each request.

You can alter these expectations with the following calls:

SetGetMemberships(NewGetter)
----------------------------

Changes the internal function that fetches a user's memberships.

&lt;NewGetter&gt; needs to have the following signature: function(Req, Res)

The arguments are those that Express passes to route handlers. The return value should be an array containing the user's memberships as strings.

AccessControl.SetLoggedIn

SetLoggedIn(NewChecker)
-----------------------

Changes the internal function that determines if a user is logged in.

&lt;NewChecker&gt; needs to have the following signature: function(Req, Res)

The arguments are those that Express passes to route handlers. The return value should be true if the user is logged in, else false.

Example
-------

ex:

```javascript
//Assume our User info is stored in Res.locals.User.Groups instead

var AccessControl = require('express-access-control');

AccessControl.SetGetMemberships(function(Req, Res) {
    return(Res.locals.User.Groups);
});

AccessControl.SetLoggedIn(function(Req, Res) {
    var ToReturn = Res.locals.User ? true : false;
    return(ToReturn);
});
```

Future
======

This library will probably be augmented with custom response handling and custom memberships testing (via a function argument).

Other potential modifications, would be to change the customization API to allow customization fonctions to be asynchronous (if they need to make a trip to the database for example).

These change will be made as needs arises.

Versions History
================

1.0.0
-----

Initial release.

2.0.0
-----

The library's 'AuthenticateRoute' method will now deleguate the response to an error handler if the user doesn't pass authentication.




