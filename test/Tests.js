//Copyright (c) 2015 Eric Vallee <eric_vallee2003@yahoo.ca>
//MIT License: https://raw.githubusercontent.com/Magnitus-/ExpressAccessControl/master/License.txt

var Express = require('express');
var Http = require('http');
var AccessControl = require('../lib/ExpressAccessControl');

var Context = {};

function Setup(Routes, Callback)
{
    var App = Context['App'] = Express();
    Routes.forEach(function(Item, Index, List) {
        App[Item['Method']](Item['Path'], Item['Call']);
    });
    App.use('/', function(Err, Req, Res, Next) {
        if(Err.Source && Err.Source === 'ExpressAccessControl')
        {
            Res.status(401).end();
        }
        else
        {
            Next(Err);
        }
    });
    Context['Server'] = Http.createServer(Context['App']);
    Context['Server'].listen(8080, function() {
        Callback();
    });
}

function TearDown(Callback)
{
    Context['Server'].close(function() {
        Callback();
    });
}

function Request(Method, Path, Callback) {
    var Self = this;
    var RequestObject = {'hostname': 'localhost', 'port': 8080, 'method': Method, 'path': Path};
    var Req = Http.request(RequestObject, function(Res) {
        Res.on('end', function() {
            Callback(Res.statusCode);
        });
        Res.setEncoding('utf8');
        Res.resume();
    });
    Req.end();
};

function GetRoutes(SetUser, SetMembership)
{
    var Routes = [];
    Routes.push({'Method': 'use',
                'Path': '/:LoggedIn/:Groups',
                'Call': function(Req, Res, Next) {
                    if(Req.params.LoggedIn=='Yes')
                    {
                        SetUser(Req, Res);
                        var Groups = Req.params.Groups;
                        if(Groups!='None')
                        {
                            Groups = Groups.split(',');
                            SetMembership(Req, Res, Groups);
                        }
                    }
                    Next();
                }});
    Routes.push({'Method': 'get',
                 'Path': '/:LoggedIn/:Groups',
                 'Call': AccessControl.AuthenticateRoute()});
    Routes.push({'Method': 'get',
                 'Path': '/:LoggedIn/:Groups/Admin',
                 'Call': AccessControl.AuthenticateRoute(['Admin'])});
    Routes.push({'Method': 'get',
                 'Path': '/:LoggedIn/:Groups/President,Admin',
                 'Call': AccessControl.AuthenticateRoute(['President', 'Admin'])});
    Routes.push({'Method': 'get',
                 'Path': '/:LoggedIn/:Groups/President,Admin/And',
                 'Call': AccessControl.AuthenticateRoute({'Groups': ['President', 'Admin'], 'And': true})});
    Routes.push({'Method': 'get',
                 'Path': '/:LoggedIn/:Groups/Banned/Not',
                 'Call': AccessControl.AuthenticateRoute({'Groups': ['Banned'], 'Not': true})});
    Routes.push({'Method': 'use', 
                 'Path': '/',
                 'Call': function(Req, Res) {
                     Res.status(204).end();
                 }});
    return(Routes);
}

function Main(Test) 
{
    Test.expect(10);
    Request('get', '/No/None', function(Status) {
        Test.ok(Status==401, 'Confirming loggin check works when not logged in.');
        Request('get', '/No/None/Admin', function(Status) {
            Test.ok(Status==401, 'Confirming loggin check works with args when not logged in.');
            Request('get', '/Yes/None', function(Status) {
                Test.ok(Status==204, 'Confirming loggin check works when logged in.');
                Request('get', '/Yes/None/Admin', function(Status) {
                    Test.ok(Status==401, 'Confirming that basic membership check works when user is not a member.');
                    Request('get', '/Yes/Admin/Admin', function(Status) {
                        Test.ok(Status==204, 'Confirming that basic membership check works when user is a member.');
                        Request('get', '/Yes/Admin/President,Admin', function(Status) {
                            Test.ok(Status==204, 'Confirming that basic multi-group check works.');
                            Request('get', '/Yes/Admin/President,Admin/And', function(Status) {
                                Test.ok(Status==401, 'Confirming that negative check with And works.');
                                Request('get', '/Yes/Admin,President/President,Admin/And', function(Status) {
                                    Test.ok(Status==204, 'Confirming that positive check with And works.');
                                    Request('get', '/Yes/None/Banned/Not', function(Status) {
                                        Test.ok(Status==204, 'Confirming that positive check with Not works.');
                                        Request('get', '/Yes/Banned/Banned/Not', function(Status) {
                                            Test.ok(Status==401, 'Confirming that negative check with Not works.');
                                            Test.done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}
    

exports.RouteDefault = {
    'setUp': function(Callback) {
        var Routes = GetRoutes(function(Req, Res) {Req.session  = {'User': {}};}, function(Req, Res, Groups) {Req.session.User.Memberships = Groups;});
        Setup(Routes, Callback);
    },
    'tearDown': function(Callback) {
        TearDown(Callback);
    },
    'Main': Main
};

exports.RouteCustomization = {
    'setUp': function(Callback) {
        AccessControl.SetLoggedIn(function(Req, Res) {
            var ToReturn = Res.locals.User ? true : false;
            return ToReturn;
        });
        AccessControl.SetGetMemberships(function(Req, Res) {
            var ToReturn = Res.locals.User && Res.locals.User.Memberships ? Res.locals.User.Memberships : [];
            return ToReturn;
        });
        var Routes = GetRoutes(function(Req, Res) {
                                   Res.locals.User = {};
                               }, 
                               function(Req, Res, Groups) {
                                   Res.locals.User.Memberships = Groups;
                               });
        Setup(Routes, Callback);
    },
    'tearDown': function(Callback) {
        TearDown(Callback);
    },
    'Main': Main
};
